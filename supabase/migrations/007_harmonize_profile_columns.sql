-- ============================================================
-- Migration 007 — Harmonise les colonnes avatar et corrige le trigger
-- ============================================================

-- 1. S'assurer que avatar_url existe (ajoutée par migration 002)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_url TEXT CHECK (char_length(avatar_url) <= 512);

-- 2. S'assurer que avatar_seed a une valeur par défaut correcte
-- Si des lignes ont NULL, les mettre à jour avant de changer la contrainte
UPDATE public.profiles SET avatar_seed = 'default' WHERE avatar_seed IS NULL;

-- 3. Augmenter la taille de avatar_seed pour accepter les URLs d'avatar (Discord, etc.)
-- La contrainte était trop stricte (16 chars), on passe à 512
ALTER TABLE public.profiles 
  DROP CONSTRAINT IF EXISTS profiles_avatar_seed_check;

ALTER TABLE public.profiles 
  ADD CONSTRAINT profiles_avatar_seed_check 
  CHECK (char_length(avatar_seed) <= 512);

-- Mettre à jour les valeurs existantes qui dépassent 512 chars (juste au cas où)
UPDATE public.profiles 
  SET avatar_seed = substring(avatar_seed, 1, 512) 
  WHERE char_length(avatar_seed) > 512;

ALTER TABLE public.profiles 
  ALTER COLUMN avatar_seed SET DEFAULT md5(random()::text);

-- 4. Recréer le trigger avec gestion d'erreur et insertion dans les deux colonnes
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_name TEXT;
  v_avatar_url TEXT;
BEGIN
  BEGIN
    -- Récupérer le nom depuis les metadata OAuth
    v_name := COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      NEW.raw_user_meta_data->>'user_name',
      split_part(NEW.email, '@', 1),
      'Anonyme'
    );
    
    -- Récupérer l'avatar depuis les metadata OAuth
    v_avatar_url := COALESCE(
      NEW.raw_user_meta_data->>'avatar_url',
      NEW.raw_user_meta_data->>'picture',
      NEW.raw_user_meta_data->>'avatar',
      NULL
    );

    -- Insérer le profil avec les deux colonnes avatar
    INSERT INTO public.profiles (
      id, 
      name, 
      avatar_seed,  -- seed aléatoire pour les avatars générés
      avatar_url    -- URL Discord/Google pour affichage direct
    )
    VALUES (
      NEW.id, 
      v_name, 
      md5(random()::text),  -- seed aléatoire court
      v_avatar_url
    )
    ON CONFLICT (id) DO UPDATE
      SET name       = EXCLUDED.name,
          avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url);
          
  EXCEPTION WHEN OTHERS THEN
    -- En cas d'erreur, essayer une insertion minimale
    BEGIN
      INSERT INTO public.profiles (id, name)
      VALUES (NEW.id, COALESCE(v_name, 'Anonyme'))
      ON CONFLICT (id) DO NOTHING;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'handle_new_user completely failed: %', SQLERRM;
    END;
  END;

  RETURN NEW;
END;
$$;

-- 5. S'assurer que le trigger est bien défini
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 6. Permissions
GRANT ALL ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;

-- 7. S'assurer que RLS est activé mais avec des policies permissives pour le trigger
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies pour permettre l'insertion
DROP POLICY IF EXISTS "profiles: own read" ON public.profiles;
DROP POLICY IF EXISTS "profiles: own update" ON public.profiles;
DROP POLICY IF EXISTS "profiles: own insert" ON public.profiles;
DROP POLICY IF EXISTS "profiles: trigger insert" ON public.profiles;
DROP POLICY IF EXISTS "profiles: allow all" ON public.profiles;

CREATE POLICY "profiles: own read"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles: own update"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "profiles: own insert"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Policy spéciale pour permettre au trigger (SECURITY DEFINER) d'insérer
CREATE POLICY "profiles: trigger insert"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (true);


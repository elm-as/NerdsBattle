-- ============================================================-- Migration 006 — Fix RLS policies pour l'authentification-- ============================================================

-- Permettre au trigger handle_new_user() d'insérer des profils
-- La fonction utilise SECURITY DEFINER, donc elle s'exécute avec les droits du propriétaire
-- Mais nous devons aussi permettre l'insertion pour que le trigger fonctionne correctement

-- Supprimer les anciennes policies sur profiles si elles existent
DROP POLICY IF EXISTS "profiles: own read" ON public.profiles;
DROP POLICY IF EXISTS "profiles: own update" ON public.profiles;
DROP POLICY IF EXISTS "profiles: own insert" ON public.profiles;
DROP POLICY IF EXISTS "profiles: trigger insert" ON public.profiles;

-- Recréer les policies correctement
-- 1. Lecture : tout utilisateur authentifié peut lire son propre profil
CREATE POLICY "profiles: own read"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- 2. Mise à jour : tout utilisateur authentifié peut modifier son propre profil
CREATE POLICY "profiles: own update"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- 3. Insertion : tout utilisateur authentifié peut créer son propre profil
-- (nécessaire car le trigger peut parfois échouer silencieusement)
CREATE POLICY "profiles: own insert"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- S'assurer que RLS est activé
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Donner les permissions nécessaires au rôle authenticator
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;

-- ============================================================
-- Correction du trigger handle_new_user pour Discord
-- ============================================================

-- Recréer la fonction pour être sûr qu'elle est correcte
-- Avec gestion d'erreur pour ne jamais bloquer la création de l'utilisateur
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_name TEXT;
  v_avatar_url TEXT;
  v_avatar_seed TEXT;
BEGIN
  -- Discord envoie : full_name, custom_claims.global_name, avatar_url
  -- Email/password : name (passé en options.data)
  BEGIN
    v_name := COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1),
      'Anonyme'
    );
    
    -- Extraire l'avatar Discord si disponible
    v_avatar_url := COALESCE(
      NEW.raw_user_meta_data->>'avatar_url',
      NEW.raw_user_meta_data->>'picture',
      NULL
    );
    
    -- Utiliser l'URL de l'avatar comme seed (ou un seed aléatoire)
    v_avatar_seed := COALESCE(v_avatar_url, md5(random()::text));

    INSERT INTO public.profiles (id, name, avatar_seed)
    VALUES (NEW.id, v_name, v_avatar_seed)
    ON CONFLICT (id) DO UPDATE
      SET name = EXCLUDED.name,
          avatar_seed = COALESCE(EXCLUDED.avatar_seed, public.profiles.avatar_seed);
          
  EXCEPTION WHEN OTHERS THEN
    -- Log l'erreur mais ne bloque pas la création de l'utilisateur
    RAISE WARNING 'handle_new_user failed: %', SQLERRM;
  END;

  RETURN NEW;
END;
$$;

-- S'assurer que le trigger existe
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

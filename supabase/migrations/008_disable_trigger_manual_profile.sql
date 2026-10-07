-- ============================================================
-- Migration 008 — Désactive le trigger, crée le profil manuellement
-- ============================================================

-- 1. Supprimer le trigger qui pose problème
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. S'assurer que les colonnes sont correctes
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_url TEXT CHECK (char_length(avatar_url) <= 512);

-- 3. Corriger la contrainte sur avatar_seed
ALTER TABLE public.profiles 
  DROP CONSTRAINT IF EXISTS profiles_avatar_seed_check;

ALTER TABLE public.profiles 
  ADD CONSTRAINT profiles_avatar_seed_check 
  CHECK (char_length(avatar_seed) <= 512);

-- 4. Simplifier les policies RLS pour permettre l'insertion manuelle
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Supprimer toutes les policies existantes
DROP POLICY IF EXISTS "profiles: own read" ON public.profiles;
DROP POLICY IF EXISTS "profiles: own update" ON public.profiles;
DROP POLICY IF EXISTS "profiles: own insert" ON public.profiles;
DROP POLICY IF EXISTS "profiles: trigger insert" ON public.profiles;
DROP POLICY IF EXISTS "profiles: allow all" ON public.profiles;
DROP POLICY IF EXISTS "profiles: insert own" ON public.profiles;
DROP POLICY IF EXISTS "profiles: auth insert" ON public.profiles;

-- Policy simple : tout utilisateur authentifié peut lire/insérer/modifier son propre profil
-- ET peut aussi insérer un profil pour son propre ID (pour l'onboarding)
CREATE POLICY "profiles: read own"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles: insert own"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles: update own"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- 5. Permissions
GRANT ALL ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;

-- 6. Fonction utilitaire pour créer un profil (optionnel, pour debug)
CREATE OR REPLACE FUNCTION public.create_profile_manually(
  user_id UUID,
  user_name TEXT,
  user_avatar_url TEXT DEFAULT NULL
)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, avatar_seed, avatar_url)
  VALUES (
    user_id, 
    COALESCE(user_name, 'Anonyme'),
    md5(random()::text),
    user_avatar_url
  )
  ON CONFLICT (id) DO NOTHING;
END;
$$;


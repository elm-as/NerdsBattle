-- ============================================================
-- Migration 002 — Récupère pseudo + avatar Discord
-- À exécuter dans : Supabase Dashboard → SQL Editor
-- ============================================================

-- Ajoute la colonne avatar_url si elle n'existe pas encore
alter table public.profiles
  add column if not exists avatar_url text check (char_length(avatar_url) <= 512);

-- Corrige le trigger pour lire les metadata OAuth (Discord, Google, etc.)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
declare
  v_name text;
  v_avatar text;
begin
  -- Discord envoie : full_name, custom_claims.global_name, avatar_url
  -- Email/password : name (passé en options.data)
  v_name := coalesce(
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'custom_claims'->>'global_name',
    new.raw_user_meta_data->>'name',
    split_part(new.email, '@', 1),
    'Anonyme'
  );
  v_avatar := coalesce(
    new.raw_user_meta_data->>'avatar_url',
    new.raw_user_meta_data->>'picture',
    null
  );

  insert into public.profiles (id, name, avatar_url)
  values (new.id, v_name, v_avatar)
  on conflict (id) do update
    set name       = excluded.name,
        avatar_url = excluded.avatar_url;

  return new;
end;
$$;

-- Met à jour les profils existants qui ont des metadata OAuth
update public.profiles p
set
  name = coalesce(
    u.raw_user_meta_data->>'full_name',
    u.raw_user_meta_data->>'name',
    p.name
  ),
  avatar_url = coalesce(
    u.raw_user_meta_data->>'avatar_url',
    u.raw_user_meta_data->>'picture',
    p.avatar_url
  )
from auth.users u
where p.id = u.id
  and (u.raw_user_meta_data->>'avatar_url' is not null
    or u.raw_user_meta_data->>'full_name' is not null);

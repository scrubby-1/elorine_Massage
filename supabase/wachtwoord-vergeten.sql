-- Alleen deze tabellen toevoegen (als schema.sql al eerder is uitgevoerd).
-- Plak in Supabase → SQL Editor → New query en klik op "Run".

-- Beheerderswachtwoord en "wachtwoord vergeten"
-- ==========================================

-- Het (gehashte) beheerderswachtwoord. Zolang deze tabel leeg is,
-- geldt het wachtwoord uit de Vercel-variabele ADMIN_PASSWORD.
create table if not exists public.admin_settings (
  id             int primary key default 1 check (id = 1),
  password_hash  text not null,
  updated_at     timestamptz not null default now()
);

-- Eenmalige herstellinks (alleen een hash van de link wordt bewaard).
create table if not exists public.admin_reset_tokens (
  id          uuid primary key default gen_random_uuid(),
  token_hash  text not null unique,
  expires_at  timestamptz not null,
  used_at     timestamptz,
  created_at  timestamptz not null default now()
);

create index if not exists admin_reset_tokens_created_idx on public.admin_reset_tokens (created_at desc);

alter table public.admin_settings enable row level security;
alter table public.admin_reset_tokens enable row level security;

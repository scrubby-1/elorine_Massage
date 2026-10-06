-- Database voor Elorine Massage
-- Plak dit in Supabase → SQL Editor → New query en klik op "Run".
-- Veilig om opnieuw uit te voeren: bestaande tabellen blijven behouden.

create extension if not exists "pgcrypto";

-- Tijdsloten die Elorine openzet in /admin
create table if not exists public.availability (
  id          uuid primary key default gen_random_uuid(),
  date        date not null,
  start_time  time not null,
  end_time    time not null,
  status      text not null default 'available'
              check (status in ('available', 'pending', 'booked')),
  created_at  timestamptz not null default now()
);

create index if not exists availability_date_idx on public.availability (date, start_time);

-- Boekingsaanvragen van klanten
create table if not exists public.bookings (
  id               uuid primary key default gen_random_uuid(),
  naam_klant       text not null,
  email_klant      text not null,
  telefoon_klant   text not null,
  datum            date not null,
  starttijd        time not null,
  eindtijd         time not null,
  availability_id  uuid references public.availability (id) on delete set null,
  status           text not null default 'pending'
                   check (status in ('pending', 'approved', 'rejected')),
  created_at       timestamptz not null default now()
);

create index if not exists bookings_status_idx on public.bookings (status, created_at desc);

-- Row Level Security aan, zonder openbare regels:
-- alleen de website (met de service-role-sleutel) kan de tabellen lezen en aanpassen.
alter table public.availability enable row level security;
alter table public.bookings enable row level security;

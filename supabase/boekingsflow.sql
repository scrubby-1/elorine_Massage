-- Uitbreiding voor de verbeterde boekingsflow.
-- Plak in Supabase → SQL Editor → New query en klik op "Run".
-- Veilig om meerdere keren uit te voeren.

-- Nieuwe kolommen bij boekingen
alter table public.bookings add column if not exists opmerking text;
alter table public.bookings add column if not exists privacy_akkoord_op timestamptz;
alter table public.bookings add column if not exists ip_hash text;
alter table public.bookings add column if not exists calendar_event_id text;

-- Nieuwe statussen: 'cancelled' (geannuleerd) en 'expired' (verlopen zonder antwoord)
alter table public.bookings drop constraint if exists bookings_status_check;
alter table public.bookings add constraint bookings_status_check
  check (status in ('pending', 'approved', 'rejected', 'cancelled', 'expired'));

-- Snellere opzoekingen voor de spamfilter en het beheer
create index if not exists bookings_email_status_idx on public.bookings (email_klant, status);
create index if not exists bookings_ip_created_idx on public.bookings (ip_hash, created_at);
create index if not exists bookings_datum_idx on public.bookings (datum, starttijd);
create index if not exists availability_status_date_idx on public.availability (status, date);

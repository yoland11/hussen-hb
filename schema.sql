create extension if not exists pgcrypto;

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  phone text not null,
  booking_date date not null,
  service_type text not null default '',
  session_size text not null default '',
  location_type text not null default '',
  staff_gender text not null default '',
  extra_details text not null default '',
  total_amount numeric(12, 2) not null default 0 check (total_amount >= 0),
  paid_amount numeric(12, 2) not null default 0 check (paid_amount >= 0),
  payment_status text not null default 'unpaid'
    check (payment_status in ('paid', 'partial', 'unpaid')),
  notes text not null default '',
  invoice_pdf_path text,
  invoice_pdf_updated_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.bookings add column if not exists invoice_pdf_path text;
alter table public.bookings add column if not exists invoice_pdf_updated_at timestamptz;

create table if not exists public.notification_subscriptions (
  id uuid primary key default gen_random_uuid(),
  endpoint text not null unique,
  keys_p256dh text not null,
  keys_auth text not null,
  user_agent text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.admin_security_settings (
  key text primary key,
  pin_hash text,
  consecutive_failed_attempts integer not null default 0,
  failed_attempts_total integer not null default 0,
  last_failed_at timestamptz,
  last_login_at timestamptz,
  locked_until timestamptz,
  retry_after_until timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create or replace function public.set_timestamp_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists bookings_set_updated_at on public.bookings;

create trigger bookings_set_updated_at
before update on public.bookings
for each row
execute function public.set_timestamp_updated_at();

drop trigger if exists notification_subscriptions_set_updated_at on public.notification_subscriptions;

create trigger notification_subscriptions_set_updated_at
before update on public.notification_subscriptions
for each row
execute function public.set_timestamp_updated_at();

drop trigger if exists admin_security_settings_set_updated_at on public.admin_security_settings;

create trigger admin_security_settings_set_updated_at
before update on public.admin_security_settings
for each row
execute function public.set_timestamp_updated_at();

create index if not exists bookings_booking_date_idx on public.bookings (booking_date);
create index if not exists bookings_created_at_idx on public.bookings (created_at desc);
create index if not exists bookings_phone_idx on public.bookings (phone);
create index if not exists notification_subscriptions_endpoint_idx
  on public.notification_subscriptions (endpoint);
create index if not exists admin_security_settings_locked_until_idx
  on public.admin_security_settings (locked_until);

insert into storage.buckets (id, name, public)
values ('booking-files', 'booking-files', false)
on conflict (id) do nothing;

insert into public.admin_security_settings (key, pin_hash)
values ('primary', null)
on conflict (key) do nothing;

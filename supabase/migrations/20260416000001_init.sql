-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- User profiles table
create table if not exists public.user_profiles (
  uid uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text not null default '',
  full_name text,
  role text not null default 'user' check (role in ('admin', 'user')),
  citizen_id text,
  business_name text,
  business_tax_id text,
  business_branch_name text default 'สำนักงานใหญ่',
  address text,
  signature_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Accounting entries table
create table if not exists public.accounting_entries (
  id uuid primary key default uuid_generate_v4(),
  uid uuid not null references auth.users(id) on delete cascade,
  transaction_date date not null,
  type text not null check (type in ('income', 'expense')),
  amount numeric(15,2) not null,
  payment_method text not null check (payment_method in ('cash', 'transfer', 'card', 'other')),
  description text not null default '',
  category text not null default '',
  counterparty_name text,
  counterparty_tax_id text,
  reference_no text,
  note text,
  document_status text not null default 'receipt' check (document_status in ('receipt', 'replacement_receipt', 'other_evidence')),
  reason_no_receipt text,
  proof_urls text[] default '{}',
  created_by_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Storage bucket for proof images
insert into storage.buckets (id, name, public)
values ('proofs', 'proofs', false)
on conflict do nothing;

-- RLS policies
alter table public.user_profiles enable row level security;
alter table public.accounting_entries enable row level security;

-- user_profiles: users can only see and edit their own profile
create policy "Users can view own profile"
  on public.user_profiles for select
  using (auth.uid() = uid);

create policy "Users can insert own profile"
  on public.user_profiles for insert
  with check (auth.uid() = uid);

create policy "Users can update own profile"
  on public.user_profiles for update
  using (auth.uid() = uid);

-- accounting_entries: users can only manage their own entries
create policy "Users can view own entries"
  on public.accounting_entries for select
  using (auth.uid() = uid);

create policy "Users can insert own entries"
  on public.accounting_entries for insert
  with check (auth.uid() = uid);

create policy "Users can update own entries"
  on public.accounting_entries for update
  using (auth.uid() = uid);

create policy "Users can delete own entries"
  on public.accounting_entries for delete
  using (auth.uid() = uid);

-- Storage policies for proofs bucket
create policy "Users can upload own proofs"
  on storage.objects for insert
  with check (bucket_id = 'proofs' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can view own proofs"
  on storage.objects for select
  using (bucket_id = 'proofs' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can delete own proofs"
  on storage.objects for delete
  using (bucket_id = 'proofs' and auth.uid()::text = (storage.foldername(name))[1]);

-- Auto-update updated_at
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $func$
begin
  new.updated_at = now();
  return new;
end;
$func$;

create trigger on_user_profiles_updated
  before update on public.user_profiles
  for each row execute procedure public.handle_updated_at();

create trigger on_accounting_entries_updated
  before update on public.accounting_entries
  for each row execute procedure public.handle_updated_at();

-- Auto-create user profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $func$
begin
  insert into public.user_profiles (uid, email, display_name, signature_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$func$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

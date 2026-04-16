-- Add status column to user_profiles
alter table public.user_profiles
  add column if not exists status text not null default 'pending'
  check (status in ('pending', 'approved', 'rejected'));

-- Back-fill: all existing rows become approved
update public.user_profiles set status = 'approved';

-- Admins can read ALL profiles (needed for approval tab)
create policy "Admins can view all profiles"
  on public.user_profiles for select
  using (
    exists (
      select 1 from public.user_profiles p2
      where p2.uid = auth.uid() and p2.role = 'admin'
    )
  );

-- Admins can update status/role of any profile
create policy "Admins can update any profile"
  on public.user_profiles for update
  using (
    exists (
      select 1 from public.user_profiles p2
      where p2.uid = auth.uid() and p2.role = 'admin'
    )
  );

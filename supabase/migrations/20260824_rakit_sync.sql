-- Jalankan sekali di Supabase SQL Editor.
-- Setiap perangkat menyimpan salinan SQLite lokal dan menyinkronkan record JSON
-- berdasarkan akun Supabase yang sedang masuk.

create table if not exists public.rakit_records (
  owner_id uuid not null references auth.users(id) on delete cascade,
  domain text not null check (domain in ('projects', 'transactions', 'invoices', 'ideas', 'daily_tasks', 'reference_items', 'settings', 'monitor_snapshot')),
  record_id text not null,
  payload jsonb not null,
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  primary key (owner_id, domain, record_id)
);

create index if not exists rakit_records_owner_updated_at_idx
  on public.rakit_records (owner_id, updated_at desc);

alter table public.rakit_records enable row level security;

create policy "Users can read their Rakit records"
  on public.rakit_records for select
  to authenticated
  using (owner_id = auth.uid());

create policy "Users can insert their Rakit records"
  on public.rakit_records for insert
  to authenticated
  with check (owner_id = auth.uid());

create policy "Users can update their Rakit records"
  on public.rakit_records for update
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "Users can delete their Rakit records"
  on public.rakit_records for delete
  to authenticated
  using (owner_id = auth.uid());

-- Untuk project yang tabelnya sudah pernah dibuat, jalankan juga bagian ini.
alter table public.rakit_records drop constraint if exists rakit_records_domain_check;
alter table public.rakit_records add constraint rakit_records_domain_check
  check (domain in ('projects', 'transactions', 'invoices', 'ideas', 'daily_tasks', 'reference_items', 'settings', 'monitor_snapshot'));

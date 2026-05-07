create table if not exists public.anden_operators (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid references auth.users(id) on delete set null,
  email text not null unique,
  name text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint anden_operators_email_lowercase check (email = lower(email))
);

alter table public.anden_operators enable row level security;

create policy "active operators can read their own allowlist row"
  on public.anden_operators
  for select
  to authenticated
  using (
    active = true
    and lower(email) = lower(auth.email())
  );

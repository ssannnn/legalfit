alter table public.lead_cases
  add column if not exists retention_delete_after timestamptz;

alter table public.lead_cases
  add column if not exists completed_at timestamptz;

alter table public.lead_cases
  add column if not exists dossier_generated_at timestamptz;

alter table public.lead_cases
  add column if not exists cuit text;

alter table public.dossiers
  add column if not exists retention_delete_after timestamptz;

create index if not exists lead_cases_expiration_idx
  on public.lead_cases (lifecycle_state, expires_at, last_activity_at);

create index if not exists lead_cases_retention_delete_after_idx
  on public.lead_cases (retention_delete_after);

create index if not exists dossiers_retention_delete_after_idx
  on public.dossiers (retention_delete_after);

create index if not exists lead_cases_duplicate_email_idx
  on public.lead_cases (lower(contact_email))
  where contact_email is not null;

create index if not exists lead_cases_duplicate_telegram_user_idx
  on public.lead_cases (telegram_user_id)
  where telegram_user_id is not null;

create index if not exists lead_cases_duplicate_cuit_idx
  on public.lead_cases (regexp_replace(cuit, '\D', '', 'g'))
  where cuit is not null;

create index if not exists lead_cases_duplicate_company_idx
  on public.lead_cases (lower(company_name))
  where company_name is not null;

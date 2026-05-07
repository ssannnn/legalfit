create unique index if not exists company_profiles_lead_case_unique_idx
  on public.company_profiles (lead_case_id);

create unique index if not exists dossiers_lead_case_rulebook_unique_idx
  on public.dossiers (lead_case_id, rulebook_version);

alter table public.jobs
  add column if not exists idempotency_key text;

create unique index if not exists jobs_idempotency_key_idx
  on public.jobs (idempotency_key)
  where idempotency_key is not null;

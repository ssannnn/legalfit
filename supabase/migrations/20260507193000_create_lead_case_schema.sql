create table if not exists public.lead_cases (
  id uuid primary key default gen_random_uuid(),
  lifecycle_state text not null default 'intake_started',
  commercial_state text,
  next_action text,
  overall_fit text,
  exporter_classification text,
  export_type text,
  company_name text,
  contact_name text,
  contact_email text,
  telegram_user_id bigint,
  telegram_username text,
  assigned_operator_id uuid references public.anden_operators(id) on delete set null,
  handoff_consent boolean not null default false,
  processing_consent boolean not null default false,
  contact_consent boolean not null default false,
  possible_duplicate boolean not null default false,
  duplicate_signals jsonb not null default '{}'::jsonb,
  last_activity_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint lead_cases_lifecycle_state_check check (
    lifecycle_state in (
      'intake_started',
      'collecting_info',
      'awaiting_confirmation',
      'awaiting_consent',
      'generating_dossier',
      'ready_for_anden',
      'closed_no_handoff',
      'out_of_scope',
      'expired'
    )
  ),
  constraint lead_cases_commercial_state_check check (
    commercial_state is null
    or commercial_state in ('new', 'contacted', 'qualified', 'lost', 'not_now')
  ),
  constraint lead_cases_next_action_check check (
    next_action is null
    or next_action in (
      'request_missing_info',
      'schedule_discovery',
      'specialist_review',
      'high_priority_case',
      'not_now',
      'out_of_scope'
    )
  ),
  constraint lead_cases_overall_fit_check check (
    overall_fit is null
    or overall_fit in ('high', 'medium', 'low', 'unknown')
  ),
  constraint lead_cases_exporter_classification_check check (
    exporter_classification is null
    or exporter_classification in ('current_exporter', 'future_exporter', 'exploratory')
  ),
  constraint lead_cases_export_type_check check (
    export_type is null
    or export_type in ('services_software', 'goods', 'mixed', 'none', 'unknown')
  )
);

create table if not exists public.intake_sessions (
  id uuid primary key default gen_random_uuid(),
  lead_case_id uuid not null references public.lead_cases(id) on delete cascade,
  telegram_chat_id bigint,
  telegram_user_id bigint,
  state text not null default 'started',
  current_step text,
  extracted_fields jsonb not null default '{}'::jsonb,
  missing_critical_fields jsonb not null default '[]'::jsonb,
  confirmation_snapshot jsonb not null default '{}'::jsonb,
  last_user_message_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.intake_messages (
  id uuid primary key default gen_random_uuid(),
  intake_session_id uuid not null references public.intake_sessions(id) on delete cascade,
  lead_case_id uuid not null references public.lead_cases(id) on delete cascade,
  telegram_message_id bigint,
  direction text not null,
  message_type text not null,
  text text,
  transcript text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint intake_messages_direction_check check (direction in ('inbound', 'outbound')),
  constraint intake_messages_message_type_check check (
    message_type in ('text', 'voice', 'button', 'system', 'file', 'unknown')
  )
);

create table if not exists public.company_profiles (
  id uuid primary key default gen_random_uuid(),
  lead_case_id uuid not null references public.lead_cases(id) on delete cascade,
  profile_data jsonb not null default '{}'::jsonb,
  confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.dossiers (
  id uuid primary key default gen_random_uuid(),
  lead_case_id uuid not null references public.lead_cases(id) on delete cascade,
  rulebook_version text,
  user_summary jsonb not null default '{}'::jsonb,
  anden_dossier jsonb not null default '{}'::jsonb,
  generated_from_profile_id uuid references public.company_profiles(id) on delete set null,
  generated_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.rulebook_versions (
  id uuid primary key default gen_random_uuid(),
  version text not null unique,
  module text not null,
  status text not null default 'draft',
  approved_by text,
  approved_at timestamptz,
  source_pack jsonb not null default '{}'::jsonb,
  notes text,
  created_at timestamptz not null default now(),
  constraint rulebook_versions_status_check check (
    status in ('draft', 'approved', 'active', 'retired')
  )
);

create table if not exists public.rule_results (
  id uuid primary key default gen_random_uuid(),
  lead_case_id uuid not null references public.lead_cases(id) on delete cascade,
  dossier_id uuid references public.dossiers(id) on delete cascade,
  rulebook_version text not null,
  rule_id text not null,
  result text not null,
  effect jsonb not null default '{}'::jsonb,
  severity text,
  evidence_snapshot jsonb not null default '{}'::jsonb,
  missing_data jsonb not null default '[]'::jsonb,
  source_label text,
  source_url text,
  created_at timestamptz not null default now(),
  constraint rule_results_result_check check (
    result in ('matched', 'not_matched', 'unknown', 'skipped')
  ),
  constraint rule_results_severity_check check (
    severity is null or severity in ('info', 'low', 'medium', 'high', 'critical')
  )
);

create table if not exists public.lead_notes (
  id uuid primary key default gen_random_uuid(),
  lead_case_id uuid not null references public.lead_cases(id) on delete cascade,
  operator_id uuid references public.anden_operators(id) on delete set null,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  job_type text not null,
  status text not null default 'queued',
  payload jsonb not null default '{}'::jsonb,
  attempts integer not null default 0,
  max_attempts integer not null default 3,
  run_after timestamptz not null default now(),
  locked_at timestamptz,
  locked_by text,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint jobs_status_check check (
    status in ('queued', 'processing', 'succeeded', 'failed', 'retrying', 'dead')
  ),
  constraint jobs_job_type_check check (
    job_type in (
      'transcription',
      'extraction',
      'dossier_generation',
      'notification',
      'retention_cleanup'
    )
  )
);

alter table public.lead_cases enable row level security;
alter table public.intake_sessions enable row level security;
alter table public.intake_messages enable row level security;
alter table public.company_profiles enable row level security;
alter table public.dossiers enable row level security;
alter table public.rulebook_versions enable row level security;
alter table public.rule_results enable row level security;
alter table public.lead_notes enable row level security;
alter table public.jobs enable row level security;

create policy "active operators can read lead cases"
  on public.lead_cases
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.anden_operators
      where active = true
        and lower(email) = lower(auth.email())
    )
  );

create policy "active operators can read intake sessions"
  on public.intake_sessions
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.anden_operators
      where active = true
        and lower(email) = lower(auth.email())
    )
  );

create policy "active operators can read intake messages"
  on public.intake_messages
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.anden_operators
      where active = true
        and lower(email) = lower(auth.email())
    )
  );

create policy "active operators can read company profiles"
  on public.company_profiles
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.anden_operators
      where active = true
        and lower(email) = lower(auth.email())
    )
  );

create policy "active operators can read dossiers"
  on public.dossiers
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.anden_operators
      where active = true
        and lower(email) = lower(auth.email())
    )
  );

create policy "active operators can read rulebook versions"
  on public.rulebook_versions
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.anden_operators
      where active = true
        and lower(email) = lower(auth.email())
    )
  );

create policy "active operators can read rule results"
  on public.rule_results
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.anden_operators
      where active = true
        and lower(email) = lower(auth.email())
    )
  );

create policy "active operators can read lead notes"
  on public.lead_notes
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.anden_operators
      where active = true
        and lower(email) = lower(auth.email())
    )
  );

create policy "active operators can read jobs"
  on public.jobs
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.anden_operators
      where active = true
        and lower(email) = lower(auth.email())
    )
  );

create index if not exists lead_cases_inbox_idx
  on public.lead_cases (created_at desc, lifecycle_state, commercial_state);

create index if not exists lead_cases_assigned_operator_id_idx
  on public.lead_cases (assigned_operator_id);

create index if not exists intake_sessions_lead_case_id_idx
  on public.intake_sessions (lead_case_id);

create index if not exists intake_messages_lead_case_id_idx
  on public.intake_messages (lead_case_id);

create index if not exists company_profiles_lead_case_id_idx
  on public.company_profiles (lead_case_id);

create index if not exists dossiers_lead_case_id_idx
  on public.dossiers (lead_case_id);

create index if not exists rule_results_lead_case_id_idx
  on public.rule_results (lead_case_id);

create index if not exists lead_notes_lead_case_id_idx
  on public.lead_notes (lead_case_id);

create index if not exists jobs_status_run_after_idx
  on public.jobs (status, run_after);

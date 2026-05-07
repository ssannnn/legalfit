grant usage on schema public to authenticated, service_role;

grant select on
  public.anden_operators,
  public.lead_cases,
  public.intake_sessions,
  public.intake_messages,
  public.company_profiles,
  public.dossiers,
  public.rulebook_versions,
  public.rule_results,
  public.lead_notes,
  public.jobs
to authenticated;

grant select, insert, update, delete on
  public.anden_operators,
  public.lead_cases,
  public.intake_sessions,
  public.intake_messages,
  public.company_profiles,
  public.dossiers,
  public.rulebook_versions,
  public.rule_results,
  public.lead_notes,
  public.jobs
to service_role;

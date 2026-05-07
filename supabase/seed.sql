insert into public.anden_operators (id, email, name, active)
values (
  '11111111-1111-1111-1111-111111111111',
  'operator@anden.example',
  'Operador Demo',
  true
)
on conflict (email) do update
set name = excluded.name,
    active = excluded.active;

insert into public.rulebook_versions (
  id,
  version,
  module,
  status,
  source_pack,
  notes
)
values (
  '22222222-2222-2222-2222-222222222222',
  'zf_services_ar_v0.1.0',
  'zonas_francas_services_ar',
  'draft',
  '{"sources":["Ley 24.331","Codigo Aduanero Ley 22.415","ARCA exportacion de servicios"]}'::jsonb,
  'Demo rulebook shell pending Anden validation.'
)
on conflict (version) do update
set module = excluded.module,
    status = excluded.status,
    source_pack = excluded.source_pack,
    notes = excluded.notes;

insert into public.lead_cases (
  id,
  lifecycle_state,
  commercial_state,
  next_action,
  overall_fit,
  exporter_classification,
  export_type,
  company_name,
  contact_name,
  contact_email,
  telegram_user_id,
  telegram_username,
  handoff_consent,
  processing_consent,
  contact_consent,
  last_activity_at,
  expires_at
)
values (
  '33333333-3333-3333-3333-333333333333',
  'ready_for_anden',
  'new',
  'schedule_discovery',
  'medium',
  'current_exporter',
  'services_software',
  'Demo SaaS Exportadora',
  'Lucia Demo',
  'lucia.demo@example.com',
  123456789,
  'lucia_demo',
  true,
  true,
  true,
  now(),
  now() + interval '180 days'
)
on conflict (id) do update
set lifecycle_state = excluded.lifecycle_state,
    commercial_state = excluded.commercial_state,
    next_action = excluded.next_action,
    overall_fit = excluded.overall_fit,
    exporter_classification = excluded.exporter_classification,
    export_type = excluded.export_type,
    company_name = excluded.company_name,
    contact_name = excluded.contact_name,
    contact_email = excluded.contact_email,
    handoff_consent = excluded.handoff_consent,
    processing_consent = excluded.processing_consent,
    contact_consent = excluded.contact_consent,
    last_activity_at = excluded.last_activity_at,
    expires_at = excluded.expires_at;

insert into public.company_profiles (
  id,
  lead_case_id,
  profile_data,
  confirmed_at
)
values (
  '44444444-4444-4444-4444-444444444444',
  '33333333-3333-3333-3333-333333333333',
  '{
    "activity":"SaaS B2B para clientes internacionales",
    "export_revenue_range":"USD 50k - 250k",
    "countries":["United States","Chile"],
    "billing":"Factura E / exportacion",
    "collection":"Banco en Argentina",
    "team_size":"12 personas",
    "consultation_motive":"Evaluar zona franca"
  }'::jsonb,
  now()
)
on conflict (id) do update
set profile_data = excluded.profile_data,
    confirmed_at = excluded.confirmed_at;

insert into public.dossiers (
  id,
  lead_case_id,
  rulebook_version,
  user_summary,
  anden_dossier,
  generated_from_profile_id,
  generated_at
)
values (
  '55555555-5555-5555-5555-555555555555',
  '33333333-3333-3333-3333-333333333333',
  'zf_services_ar_v0.1.0',
  '{
    "summary":"Declaraste una empresa SaaS con ventas internacionales recurrentes.",
    "checklist":["Facturas de exportacion","Resumen de cobros","Contratos o SOW principales"]
  }'::jsonb,
  '{
    "next_action":"schedule_discovery",
    "overall_fit":"medium",
    "fit_dimensions":{
      "operational_fit":{"level":"high","reason":"Servicios/software con clientes internacionales declarados."},
      "commercial_fit":{"level":"medium","reason":"Rango exportador intermedio para discovery."},
      "documentation_readiness":{"level":"unknown","reason":"Disponibilidad documental pendiente de validar."},
      "risk_review_needed":{"level":"medium","reason":"Cobro/facturacion requiere revision profesional."}
    },
    "missing_data":["Detalle de contratos principales","Resumen de cobros"]
  }'::jsonb,
  '44444444-4444-4444-4444-444444444444',
  now()
)
on conflict (id) do update
set rulebook_version = excluded.rulebook_version,
    user_summary = excluded.user_summary,
    anden_dossier = excluded.anden_dossier,
    generated_from_profile_id = excluded.generated_from_profile_id,
    generated_at = excluded.generated_at;

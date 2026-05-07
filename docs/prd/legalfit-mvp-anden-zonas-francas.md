# PRD: legalfit MVP Anden-first para Zonas Francas

Estado: Draft validado por discovery conversacional  
Fecha: 2026-05-06  
Documento de origen: `PROJECT.md` se mantiene como vision original del producto.

## Problem Statement

Anden necesita una forma simple, consistente y operable de recibir empresas potencialmente relevantes para evaluar una conversacion profesional sobre zonas francas.

Hoy, una startup o empresa tech puede tener exportaciones, clientes internacionales, cobros en moneda extranjera o una operatoria cross-border desordenada, pero no sabe que informacion preparar ni si vale la pena iniciar una revision profesional. A la vez, Anden necesita distinguir rapidamente entre casos accionables, casos que requieren mas datos, casos complejos para revision especializada y casos fuera del alcance inicial.

legalfit no debe asesorar legal, fiscal ni contablemente. Debe precalificar, ordenar informacion declarada, detectar faltantes, generar un dossier interno y derivar a Anden cuando exista consentimiento.

## Solution

El MVP sera un flujo Anden-first, Telegram-first y orientado a Zonas Francas para empresas argentinas de servicios/software.

El usuario completa un intake conversacional por Telegram, usando texto o voz. El sistema extrae datos estructurados, repregunta solo lo necesario, confirma los campos clave, solicita consentimientos y genera:

- Un resumen/checklist simple para el usuario.
- Un lead dossier completo para Anden.
- Un lead en un Lead Inbox interno con `next_action`, `fit_status`, estado comercial, responsable y notas.

La preclasificacion se basa en un rulebook normativo versionado y validado por Anden. El LLM ayuda con transcripcion, extraccion, normalizacion, repreguntas y redaccion, pero no decide solo el routing final.

## User Stories

1. As a founder, I want to tell legalfit what my company does in natural language, so that I do not need to fill a long form.
2. As a founder, I want to send a Telegram voice note, so that I can complete the intake quickly.
3. As a founder, I want legalfit to ask only the missing critical questions, so that the process feels short and relevant.
4. As a founder, I want to answer structured questions with buttons or ranges, so that sensitive data is easier to provide.
5. As a founder, I want to provide export revenue as broad USD ranges, so that I do not need to disclose exact amounts.
6. As a founder, I want to provide optional local revenue context in ARS, so that local operations can be understood without overcomplicating the intake.
7. As a founder, I want the system to distinguish whether I currently export, plan to export, or am just exploring, so that Anden receives the right context.
8. As a founder, I want to review the extracted company data before submission, so that I can correct misunderstandings from text or voice.
9. As a founder, I want to correct company/contact, activity, export type, export status, revenue range, countries, billing, collections, team size, reason for inquiry and declared document availability, so that the dossier reflects my answers accurately.
10. As a founder, I want a short disclaimer at the start, so that I understand legalfit is not giving legal, fiscal or accounting advice.
11. As a founder, I want an explicit disclaimer before handoff, so that I understand a professional review is still required.
12. As a founder, I want to choose whether my dossier is shared with Anden, so that I control the handoff.
13. As a founder, I want to receive a basic summary/checklist even if I do not consent to the handoff, so that the interaction still has value.
14. As a founder, I want to declare whether I have key evidence available, so that I can prepare before a professional conversation.
15. As a founder, I want not to upload documents in the MVP, so that the flow remains lightweight.
16. As a founder, I want goods-only cases to be handled politely, so that I understand the MVP scope.
17. As a goods-only prospect, I want to optionally leave minimal contact and description with consent, so that Anden can decide whether to follow up manually.
18. As an Anden operator, I want to receive a lead dossier with structured company, export and operational data, so that I can decide the next commercial or professional step.
19. As an Anden operator, I want the dossier to show `next_action`, so that I can operate the lead without interpreting raw chat logs.
20. As an Anden operator, I want the dossier to show `overall_fit` and fit dimensions, so that I can understand the case quality.
21. As an Anden operator, I want fit dimensions to include level, reason, evidence used and missing data, so that the output is auditable enough for MVP operations.
22. As an Anden operator, I want to see inconsistencies, so that ambiguous cases are not treated as clean fits.
23. As an Anden operator, I want to see source references for applied rulebook signals, so that the dossier can be reviewed against official criteria.
24. As an Anden operator, I want to receive a notification when a new lead arrives, so that I can respond quickly.
25. As an Anden operator, I want a Lead Inbox listing company, contact, date, `next_action`, `fit_status` and commercial state, so that I can manage the first pipeline.
26. As an Anden operator, I want to open the full dossier from the Lead Inbox, so that I can prepare a discovery call.
27. As an Anden operator, I want to change commercial state, so that the team can track follow-up.
28. As an Anden operator, I want to assign a responsible person, so that ownership is clear.
29. As an Anden operator, I want to add internal notes, so that context from calls is preserved.
30. As an Anden operator, I want the original dossier to remain immutable, so that it stays a snapshot of what the user declared and legalfit interpreted at handoff time.
31. As an Anden operator, I want only authorized users to access the Lead Inbox through email OTP or magic link, so that lead data is not exposed.
32. As a product owner, I want a single `operator` role in MVP, so that internal permissions stay simple.
33. As a product owner, I want a rulebook validated by Anden before production, so that legalfit does not independently interpret legal applicability.
34. As a product owner, I want rulebook changes to be manually versioned and approved by Anden, so that rules do not change silently.
35. As a product owner, I want the LLM to assist but not decide final routing alone, so that sensitive outputs remain controlled.
36. As a product owner, I want to measure actionable leads for Anden, so that MVP success is tied to business value rather than raw conversations.
37. As a product owner, I want to measure intake completion rate, so that we know whether the flow is simple enough.
38. As a product owner, I want to measure time to completed dossier, so that we can reduce friction.

## Implementation Decisions

### Product Positioning

- The MVP is hybrid in surface area but Anden-first in business workflow.
- Anden is the anchor partner and primary economic buyer.
- The startup/founder/CFO is the intake user.
- The primary conversion is not self-serve payment. It is an actionable lead/dossier for Anden.
- `PROJECT.md` remains the broader product vision. This PRD defines the focused MVP.

### MVP Module Scope

- The only full MVP module is Zonas Francas readiness for Argentine services/software companies.
- Exportacion de Servicios, MiPyME and Economia del Conocimiento are signals inside the Zonas Francas dossier, not standalone MVP modules.
- Tax Readiness and Cross-border / FX Readiness remain post-MVP.
- Goods-only readiness is out of MVP.
- Goods-only prospects may optionally leave minimal contact, description and consent, but no fit dossier is generated.

### Channel and Intake Experience

- Telegram is the primary MVP channel.
- The experience is mixed:
  - Open conversational intake for the initial case description.
  - Voice support from MVP for open answers.
  - Guided structured questions for critical missing data.
  - Buttons/ranges where precision and data quality matter.
  - Confirmation summary before handoff.
- Telegram session is enough for the user in MVP.
- User email is declared, not verified, in MVP.
- The bot requests short processing consent at the start before collecting the case description. Handoff/contact consent is requested separately at the end before sharing the dossier with Anden.
- After initial processing consent, the bot asks one open question instead of starting with a form: the user should describe what the company does, whether it already sells abroad and what they want to evaluate with Anden.
- From the first open response, the system should try to extract main activity, services/software vs goods, current export status, future export signals, mentioned countries/clients, billing/collection details, consultation motive, urgency/pain, complexity/risk signals and any contact data volunteered by the user.
- Follow-up questions should be grouped in blocks of at most three questions, prioritized by routing blockers. If many fields are missing, the bot should ask the highest-impact questions first and continue in later blocks only as needed.
- Contact details should be requested after the system determines the case is not clearly out of scope, but before the final summary. The bot should not ask for contact at the start, and should not wait until after final handoff consent because Anden needs contact data for an actionable lead.
- Required contact fields for handoff are name, role, company and email. Optional fields are phone, CUIT and website. Telegram user id is stored technically but not requested from the user.
- The bot should use Spanish as the MVP language. English support is deferred.

### Bot Flow Detail

The MVP bot flow is:

1. Start with a short disclaimer and processing consent.
2. Ask one open case-description question that accepts text or voice.
3. Transcribe voice if needed and extract initial structured fields.
4. Classify obvious out-of-scope cases before asking for full contact details.
5. Ask missing critical questions in blocks of at most three.
6. Ask contact fields once the case is not clearly out of scope.
7. Ask lightweight MiPyME and Economia del Conocimiento signal questions.
8. Ask declared documentation readiness questions.
9. Show a structured confirmation summary with edit-by-section controls.
10. Request final handoff/contact consent.
11. Generate the user summary/checklist and Anden dossier.
12. Notify Anden and create the Lead Inbox record if the lead is actionable.

The confirmation summary should be section-based and correctable before handoff. Sections include company/contact, activity, export status, export revenue range, countries/client jurisdictions, billing/collection, team size, consultation motive, declared documentation readiness and consent. Corrections can be collected through buttons for enum fields and free text for narrative fields.

If a user sends a document or file, the bot should explain that MVP does not accept document uploads and should ask only whether the relevant evidence is available.

If processing fails, the bot should give a short retry-safe message and retry the underlying job. If retries are exhausted, the case should remain non-actionable and the user should be asked to retry later or continue with structured text.

### Out-of-Scope Flow

Clearly out-of-scope cases should not be pushed through the full intake. The bot should explain the current MVP scope in plain language and, where useful, offer minimal optional capture with consent.

Out-of-scope handling:

- Goods-only: explain that the MVP is focused on services/software, optionally capture contact and a short description for manual Anden review.
- Direct legal/fiscal/accounting advice request: explain that legalfit cannot advise and suggest professional review.
- No company or commercial operation: close as not applicable for MVP.
- Non-Argentina case: mark out of scope unless Anden explicitly expands scope later.

### User-Facing Boundaries

- The bot tone is founder-friendly: clear, fast, close and low-jargon.
- A short disclaimer appears at the start.
- A fuller disclaimer appears before report/handoff.
- legalfit must not tell the user that they qualify, should apply or will obtain a benefit.
- The user sees a summary/checklist, not Anden's full fit/routing dossier.
- The user summary should include a recap of declared data, missing data and checklist items, but should not include `fit_status`, `overall_fit` or `next_action`.
- If the user refuses handoff consent, they receive a basic summary/checklist but no active lead is created for Anden.

### Consent

The handoff requires explicit consent for:

- Processing the user's responses to generate the diagnostic summary/dossier.
- Sharing the dossier with Anden.
- Allowing Anden to contact the user through the provided contact data.

No broad marketing consent is included in MVP.

Final handoff consent should be explicit and separated into sharing the dossier with Anden and allowing Anden contact. If either is refused, no active lead is created for Anden.

### Critical Intake Data

The system should not generate a definitive `next_action` unless the critical data needed for routing is complete.

Minimum critical data:

- Company identification and contact.
- Main activity.
- Whether the company exports today.
- Export type: services, software, goods or mixed.
- Export/facturacion range.
- Main countries or client jurisdictions.
- How international billing and collections work, at a descriptive level.
- Team/operational size.
- Reason for consulting Anden.
- Consent to share the dossier with Anden.

For `current_exporter`, the following export signals are mandatory:

- Whether it issues export invoices.
- Whether it collects abroad or in Argentina.
- Main client countries/jurisdictions.
- Recurrence of international revenue.

Facturacion/exportacion should be requested as broad ranges:

- Export revenue in USD for the last 12 months.
- Local revenue in ARS as optional context.

Export revenue range options for the last 12 months:

- `No exportamos aun`
- `< USD 10k`
- `USD 10k - 50k`
- `USD 50k - 250k`
- `USD 250k - 1M`
- `USD 1M+`
- `Prefiero no responder`

Billing options:

- `Factura E / exportacion`
- `Factura local`
- `Invoice del exterior`
- `Mixto`
- `No se / lo maneja contador`
- `Prefiero no responder`

Collection options:

- `Banco en Argentina`
- `Cuenta/banco del exterior`
- `Fintech/procesador internacional`
- `Mixto`
- `No se / lo maneja contador`
- `Prefiero no responder`

Countries/client jurisdictions should be collected as free text and normalized into countries or regions where possible. The bot should not require client names; client names can be stored only if volunteered.

Consultation motive should be captured through extracted free text plus optional structured options:

- `Evaluar zona franca`
- `Ordenar exportaciones`
- `Revisar estructura cross-border`
- `Conversar con Anden`
- `Preparar documentacion`
- `No estoy seguro`

### Exporter Classification

The MVP distinguishes:

- `current_exporter`: already exports services/software and has international clients, billing or collections.
- `future_exporter`: has concrete signals such as international pipeline, negotiations, exportable product/service already sold locally, an operating plan with tentative date or a specific Anden/zona franca opportunity.
- `exploratory`: no current exports and no concrete export plan.

### Documentation Readiness

- No document upload in MVP.
- Documentation readiness is based on declared availability, not verification.
- The company declares availability during intake.
- Anden may validate later outside the original dossier, but the MVP Lead Inbox does not require document validation workflows.

Document states:

- `declared_available`
- `declared_unavailable`
- `declared_unknown`
- `not_applicable`
- `verified_available`
- `verified_missing`
- `verification_needed`

In MVP, user-entered states will usually be declared states. Verified states are reserved for later professional validation.

The MVP documentation checklist should cover declared availability of:

- Export invoices or equivalent invoices.
- Summary of export revenue by country/client type.
- Main contracts, SOWs or commercial agreements.
- Collection/payment records or bank/processor summaries.
- Team or operating structure summary.
- MiPyME certificate if it exists.
- Economia del Conocimiento status evidence if it exists.

For each item, the user should answer with `Lo tengo`, `No lo tengo`, `No se` or `No aplica`. These map to declared document states.

### Fit Status

Fit is a composite status, not a legal eligibility conclusion.

Dimensions:

- `operational_fit`: activity type, export/cross-border operation and apparent operational relevance to a zona franca conversation.
- `commercial_fit`: volume, urgency, upside and priority for Anden.
- `documentation_readiness`: declared availability of evidence for a serious review.
- `risk_review_needed`: signals that require professional review before advancing.

Each dimension uses:

- `level`: `high`, `medium`, `low` or `unknown`.
- `reason`: brief structured explanation.
- `evidence_used`: relevant declared facts.
- `missing_data`: data needed to improve confidence.

`overall_fit` is derived by conservative rules, not by numeric average:

- `high`: operational and commercial signals are strong enough, documentation is not blocking and no critical risk dominates.
- `medium`: there is potential but missing data, medium volume or need for discovery.
- `low`: weak signals, exploratory status, low volume or poor operational fit.
- `unknown`: critical data is missing.

### Next Action

`next_action` is the primary routing output. `fit_status` explains case quality but does not override `next_action`.

Allowed MVP values:

- `request_missing_info`
- `schedule_discovery`
- `specialist_review`
- `high_priority_case`
- `not_now`
- `out_of_scope`

Definitions:

- `request_missing_info`: critical data is missing and blocks routing.
- `schedule_discovery`: enough fit exists for a normal Anden discovery conversation.
- `specialist_review`: there is potential fit but complexity, inconsistency or risk requires specialist review.
- `high_priority_case`: conservative category for strong current exporter cases with services/software, recurring exports, high USD range, explicit urgency/pain, reasonable declared documentation and full consent.
- `not_now`: maybe relevant later, but not enough current commercial/operational signal for Anden to advance now.
- `out_of_scope`: the flow does not apply, such as goods-only MVP cases, non-Argentina company if MVP remains Argentina-specific, person without company/operation, direct legal/fiscal advice requests or unsupported verticals.

Contradictions are marked as `inconsistency_detected`. The system asks for clarification when the contradiction blocks routing. If the contradiction persists, the lead becomes `specialist_review` or `request_missing_info`.

### Rulebook and Official Sources

Preclassification is based on a manually curated and versioned rulebook, validated by Anden before production.

The rulebook is derived from official sources and specialist interpretation. The system does not auto-update rules from the internet and the LLM does not reinterpret sources periodically.

Initial source pack should include:

- Ley 24.331 de Zonas Francas, texto actualizado.
- Codigo Aduanero Ley 22.415, including export/service concepts relevant to intake.
- ARCA official guidance on exportacion de servicios and related billing signals.
- Official MiPyME guidance for certificate signal.
- Official Economia del Conocimiento guidance for signal only.
- Any specific rules or public operating requirements for the zona franca context Anden wants to prioritize.

Each rule should include:

- `id`
- `version`
- `module`
- `condition`
- `effect`
- `severity`
- `source_url`
- `source_label`
- `internal_explanation`
- `user_safe_copy`
- `requires_specialist_review`

Source visibility:

- User sees general references and safe language.
- Anden sees sources by rule/signal in the internal dossier.

### LLM Boundaries

The LLM may:

- Transcribe voice.
- Extract structured fields from free text.
- Normalize answers.
- Detect missing or ambiguous data.
- Draft user-safe summaries.
- Draft internal dossier explanations.
- Suggest reprompting language.

The LLM must not:

- Decide final routing alone.
- Issue legal/fiscal/accounting conclusions.
- Tell the user they qualify or should apply.
- Override explicit rulebook outputs without human-approved rules.

### Lead Dossier

The Anden dossier should include:

- Company and contact details.
- Consent state.
- Declared business activity.
- Exporter classification.
- Export type and scope.
- Export revenue range in USD for the last 12 months.
- Optional local revenue context in ARS.
- Countries/client jurisdictions.
- Billing and collection description.
- Team/operational size.
- Reason for consulting Anden.
- MiPyME signal.
- Economia del Conocimiento signal.
- Declared documentation readiness.
- `next_action`.
- `overall_fit`.
- Fit dimensions.
- Missing critical data.
- Inconsistencies.
- Risk/specialist review signals.
- Source references for rulebook-derived signals.
- Original intake text or transcript in MVP trace, where useful.
- Dossier generation timestamp and rulebook version.

The original dossier is immutable after generation. Anden can add state, assignment and notes separately.

### Lead Inbox

The MVP internal dashboard is a lightweight Lead Inbox, not a CRM.

Minimum capabilities:

- List leads with company, contact, date, `next_action`, `fit_status` and commercial state.
- Open full dossier.
- Change commercial state.
- Assign responsible operator.
- Add internal note.
- Receive notifications for new leads.
- Filter by `next_action`, `overall_fit`, commercial state, assignee and possible duplicate status.
- Sort by newest first by default.

Commercial states:

- `new`
- `contacted`
- `qualified`
- `lost`
- `not_now`

Anden authentication:

- Authorized Anden users sign in with email OTP or magic link.
- MVP has a single `operator` role.
- Dashboard access is restricted through an `anden_operators` allowlist of active emails. Supabase Auth handles authentication, but the application authorizes only active allowlisted operators.
- No field-level masking is required inside the Lead Inbox for allowlisted operators in MVP, because contact and review are the core workflow. More granular access controls can be introduced later if operational needs change.

The lead detail view should present:

- Header with company, contact, `next_action`, `overall_fit`, lifecycle and commercial state.
- Fit dimensions and key reasons.
- Missing data and inconsistencies.
- Company/export profile.
- Declared documentation readiness.
- Rule/source references for Anden.
- Collapsible transcript/messages.
- Internal notes and assignee.

Commercial state transitions are intentionally loose in MVP. Any active operator can move a ready lead between allowed states and add notes. Full audit trail and strict workflow enforcement are deferred.

### Notifications

- A notification is sent when a new actionable lead is created.
- The dashboard remains the source of truth.
- MVP notification channel is email with a link to the Lead Inbox detail. Additional channels are deferred.

### Data Retention and Privacy

- Store only data required for contact and operation:
  - Name.
  - Role.
  - Email.
  - Phone or Telegram handle.
  - Company.
  - Optional CUIT.
  - Consent records.
  - Intake responses.
  - Generated dossier.
- Do not ask for DNI.
- Do not upload or store documents in MVP.
- Retain leads/dossiers for 180 days by default.
- Support manual deletion.

### Metrics

Primary MVP metric:

- Actionable leads for Anden.

A lead is actionable if:

- Handoff/contact consent is complete.
- Critical data is complete.
- It is services/software or otherwise permitted by MVP scope.
- `next_action` is not `out_of_scope` and not `request_missing_info`.
- Dossier is visible in the Lead Inbox.
- Contact data exists.

Secondary metrics:

- Intake completion rate.
- Time to completed dossier.

Metrics should be computed from application tables and timestamps in MVP. No external analytics vendor is required initially.

### Proposed Implementation Modules

The implementation should favor deep, testable modules with narrow interfaces:

- Telegram intake adapter: receives messages, voice notes and callback interactions.
- Conversation state machine: controls flow, missing data prompts, confirmation and consent.
- Speech transcription service: converts Telegram voice notes into text.
- Extraction/normalization service: maps free text into structured company profile fields.
- Company profile schema: canonical structured data model for intake and dossier generation.
- Critical data validator: determines missing data and whether routing can proceed.
- Rulebook engine: applies versioned rules to structured data.
- Fit classifier: derives dimensions and `overall_fit` from rule outputs.
- Next action router: determines final `next_action`.
- Dossier builder: creates user summary/checklist and internal Anden dossier.
- Lead Inbox backend: stores leads, states, assignments and notes.
- Notification service: sends new lead alerts.
- Anden auth: email OTP or magic-link access for authorized operators.
- Retention/deletion job: enforces 180-day retention and manual deletion.

### Data Model Direction

The central aggregate is `lead_case`. Each intake/handoff is modeled as an operational case for Anden rather than treating the company, conversation or dossier as the root object. This supports repeat cases from the same company over time and keeps the MVP aligned with the Lead Inbox workflow.

Core related records:

- `company_profile`: structured declared snapshot for the case.
- `intake_session`: Telegram conversation/session that produced the case.
- `dossier`: immutable generated snapshot for user summary and Anden internal dossier.
- Lead operation records: commercial state, assignment and notes.

Use a hybrid relational/JSONB model:

- Keep operational/filter fields as columns, such as company name, contact email, Telegram user id, exporter classification, export type, `next_action`, `overall_fit`, commercial state, assignee, consent state and timestamps.
- Keep flexible intake/profile/dossier data in JSONB, such as full declared profile, extracted fields, transcript, declared documentation state, fit reasons, missing data, rule results and generated dossier snapshots.

This keeps the Lead Inbox queryable while allowing the intake schema and dossier shape to evolve during MVP learning.

During intake, extracted data is mutable and tentative. The system should separate:

- `intake_session.extracted_fields`: mutable working draft from text/voice extraction and follow-up answers.
- `company_profile.profile_data`: user-confirmed structured profile for the lead case.
- `dossier`: immutable snapshot generated after confirmation and handoff consent.

This prevents tentative LLM extraction from being confused with confirmed user-provided data.

For conversation traceability, store minimal raw Telegram message records and structured transcripts during the 180-day retention window:

- Store message text, timestamp, Telegram message id and message type.
- Store voice transcription output.
- Do not retain original audio files after successful transcription, except temporarily for error handling.
- Use the transcript and message records for debugging extraction, consent and dossier generation.

Minimum MVP tables:

- `lead_cases`: central operational case for Anden, including denormalized inbox/filter fields.
- `intake_sessions`: Telegram session state and flow progress for a lead case.
- `intake_messages`: minimal raw message records and transcript references.
- `company_profiles`: confirmed structured profile snapshot for a lead case.
- `dossiers`: immutable user summary and Anden internal dossier snapshots.
- `rulebook_versions`: approved rulebook metadata and active version.
- `rule_results`: rule outputs applied to a case/dossier.
- `anden_operators`: authorized Lead Inbox users.
- `lead_notes`: internal notes on a lead case.
- `jobs`: Postgres/Supabase-backed queue records for slow tasks.

Do not add separate company, contact, document or module tables in MVP unless implementation pressure proves they are needed.

Rule definitions should live in versioned code/config reviewed through normal change control, not as freely editable database records. The database stores rulebook version metadata, active version information and rule results applied to each lead case. This keeps sensitive rule changes explicit and reviewable while preserving dossier reproducibility.

`rule_results` should store one row per matched, unknown, skipped or otherwise relevant rule, not every rule in the rulebook. Each result should include the lead case, optional dossier, rulebook version, rule id, result, effect, severity, evidence snapshot, missing data, source label and source URL.

The `jobs` table should support the states `queued`, `processing`, `succeeded`, `failed`, `retrying` and `dead`. Job records should include job type, payload, attempts, max attempts, run-after timestamp, lock timestamp, lock owner and last error. MVP job types include transcription, extraction, dossier generation, notification and retention cleanup.

`lead_case` should separate intake lifecycle from Anden commercial state.

Lifecycle states:

- `intake_started`
- `collecting_info`
- `awaiting_confirmation`
- `awaiting_consent`
- `generating_dossier`
- `ready_for_anden`
- `closed_no_handoff`
- `out_of_scope`
- `expired`

Commercial state applies only after a case is `ready_for_anden`.

Incomplete intake cases should expire after 14 days without activity. Expired cases do not enter the Lead Inbox as actionable leads, but they remain available for completion-rate and abandonment metrics during the retention window.

Duplicate intakes should not be blocked in MVP. The system should mark possible duplicates in the Lead Inbox using signals such as email, Telegram user id, optional CUIT or similar company name. Automatic merge is out of scope.

Do not introduce a `companies` master table in MVP. Company identity remains part of the `lead_case`/`company_profile` snapshot until there is enough real usage to justify company-level normalization and merge workflows.

### Conceptual Schema

This is the MVP table shape. It is not final SQL, but it should guide Supabase migrations.

`lead_cases`

- `id`
- `lifecycle_state`
- `commercial_state`
- `next_action`
- `overall_fit`
- `exporter_classification`
- `export_type`
- `company_name`
- `contact_name`
- `contact_email`
- `telegram_user_id`
- `telegram_username`
- `assigned_operator_id`
- `handoff_consent`
- `processing_consent`
- `contact_consent`
- `possible_duplicate`
- `duplicate_signals`
- `last_activity_at`
- `expires_at`
- `created_at`
- `updated_at`

`intake_sessions`

- `id`
- `lead_case_id`
- `telegram_chat_id`
- `telegram_user_id`
- `state`
- `current_step`
- `extracted_fields`
- `missing_critical_fields`
- `confirmation_snapshot`
- `last_user_message_at`
- `created_at`
- `updated_at`

`intake_messages`

- `id`
- `intake_session_id`
- `lead_case_id`
- `telegram_message_id`
- `direction`
- `message_type`
- `text`
- `transcript`
- `metadata`
- `created_at`

`company_profiles`

- `id`
- `lead_case_id`
- `profile_data`
- `confirmed_at`
- `created_at`
- `updated_at`

`dossiers`

- `id`
- `lead_case_id`
- `rulebook_version`
- `user_summary`
- `anden_dossier`
- `generated_from_profile_id`
- `generated_at`
- `created_at`

`rulebook_versions`

- `id`
- `version`
- `module`
- `status`
- `approved_by`
- `approved_at`
- `source_pack`
- `notes`
- `created_at`

`rule_results`

- `id`
- `lead_case_id`
- `dossier_id`
- `rulebook_version`
- `rule_id`
- `result`
- `effect`
- `severity`
- `evidence_snapshot`
- `missing_data`
- `source_label`
- `source_url`
- `created_at`

`anden_operators`

- `id`
- `auth_user_id`
- `email`
- `name`
- `active`
- `created_at`
- `updated_at`

`lead_notes`

- `id`
- `lead_case_id`
- `operator_id`
- `body`
- `created_at`
- `updated_at`

`jobs`

- `id`
- `job_type`
- `status`
- `payload`
- `attempts`
- `max_attempts`
- `run_after`
- `locked_at`
- `locked_by`
- `last_error`
- `created_at`
- `updated_at`

### Stack

The MVP stack is:

- Next.js for the web app and Lead Inbox.
- Supabase/Postgres for relational storage and authorized Anden access.
- Telegram Bot API for the primary intake channel.
- OpenAI for voice transcription, extraction, normalization and drafting.

This stack is selected to keep the MVP small while covering the dashboard, auth, database, Telegram bot workflow, background processing and LLM-assisted intake.

Telegram bot updates should enter through a Next.js webhook/API route in MVP. The webhook should acknowledge quickly, persist the event/conversation state and avoid long blocking work where possible. A dedicated worker can be introduced later if latency, timeouts or processing volume require it.

Slow tasks such as voice transcription, LLM extraction and dossier generation should run through a simple Postgres/Supabase-backed job queue in MVP. The webhook creates the job and responds quickly; server-side job execution updates conversation state and sends follow-up Telegram messages when processing completes. External queue infrastructure can be added later if needed.

Telegram webhook handling must be idempotent by Telegram update/message id. Job handlers should also be idempotent where practical, especially dossier generation and notifications.

Deployment target for MVP is Vercel for the Next.js app and Supabase for Postgres/Auth. Use separate development and production Supabase projects. Secrets must live in environment variables and must not be committed.

Default job retry policy:

- Transcription: 3 attempts.
- Extraction/normalization: 3 attempts.
- Dossier generation: 3 attempts.
- Notifications: 5 attempts.
- Retention cleanup: 3 attempts.

Failed jobs move to `dead` after max attempts and should be visible to operators/developers through internal logs or database inspection.

### Supabase Security

RLS should be enabled on sensitive tables from MVP. Lead Inbox access is limited to authenticated users whose email is active in `anden_operators`. Telegram webhooks, server-side jobs and privileged backend tasks may use the Supabase service role only on the server side. The final user does not access Supabase directly; they interact through Telegram and application APIs.

### Launch Criteria

The MVP should not be used with real leads until:

- Anden has approved rulebook version `v0.1`.
- RLS policies for sensitive tables are smoke-tested.
- The Telegram flow completes end-to-end with text and voice.
- No document upload path is required or exposed.
- The Lead Inbox supports list, detail, state change, assignment and notes.
- New lead email notifications work.
- No active lead is created without handoff/contact consent.
- Dossier generation records the rulebook version.

Initial pilot should be limited to 10-20 real leads, with Anden reviewing every generated dossier. `high_priority_case` leads should be treated as operational priority but still require human review.

### Implementation Sequence

Recommended build order:

1. Supabase schema, RLS policies and seed allowlisted operator.
2. Pure domain modules for profile validation, exporter classification, rulebook evaluation, fit classification and next-action routing.
3. Dossier builder with fixture-based tests.
4. Telegram webhook, conversation state machine and job queue.
5. Voice transcription and extraction integration.
6. Lead Inbox list/detail/notes/assignment.
7. Email notifications.
8. Retention/expiration jobs and duplicate detection.
9. End-to-end pilot hardening.

## Testing Decisions

Tests should verify external behavior, not implementation details. The most important tests are deterministic checks around classification, routing and consent boundaries.

Modules that should have focused tests:

- Conversation state machine:
  - starts with disclaimer
  - accepts voice/text path
  - asks only critical missing data
  - requires confirmation before handoff
  - handles no-consent path correctly
- Critical data validator:
  - identifies missing routing blockers
  - does not block on non-critical unknowns
- Exporter classifier:
  - distinguishes `current_exporter`, `future_exporter` and `exploratory`
  - excludes goods-only from MVP dossier generation
- Rulebook engine:
  - applies versioned rules deterministically
  - records rulebook version
  - exposes Anden source references without showing detailed legal interpretation to the user
- Fit classifier:
  - outputs `high`, `medium`, `low`, `unknown`
  - includes reason, evidence and missing data
  - derives `overall_fit` without numeric averaging
- Next action router:
  - returns `request_missing_info` for missing critical data
  - returns `high_priority_case` only under conservative strong-signal conditions
  - returns `specialist_review` for complexity/inconsistency
  - returns `not_now` for weak/exploratory cases
  - returns `out_of_scope` for unsupported MVP cases
- Consent and privacy:
  - no active lead is created without handoff consent
  - no document upload path is required
  - retention metadata is set
- Dossier builder:
  - user summary excludes internal fit/routing details
  - Anden dossier includes fit/routing/source references
  - dossier is immutable after generation
- Lead Inbox:
  - authorized operator can see leads
  - operator can change state, assign responsible and add notes
  - operator cannot edit the original dossier

Where possible, rulebook, classifier and router tests should use table-driven fixtures rather than live LLM calls. LLM extraction should be tested through contract tests and fixture-based mocks.

## Out of Scope

- Legal, fiscal or accounting advice.
- Legal eligibility determination.
- User-facing recommendation to apply for a regime.
- Document upload.
- Document verification.
- Goods-only readiness.
- Full MiPyME module.
- Full Economia del Conocimiento module.
- Full Exportacion de Servicios module.
- Tax Readiness.
- Cross-border / FX Readiness.
- CRM replacement.
- CRM integration.
- Accounting, AFIP or ARCA integrations.
- Payments or self-serve monetization.
- Multi-partner white-label product.
- Advanced roles or permissions.
- Numeric 0-100 scoring.
- Automatic rulebook updates from official sources.
- LLM-only legal/routing decisions.

## Further Notes

- The MVP should optimize for fewer questions, high completion and useful Anden handoff.
- The main product promise is: "No te hacemos llenar un formulario largo; te entendemos, te preguntamos solo lo que falta y te dejamos confirmar antes de enviar a Anden."
- The rulebook must be validated by Anden before production use.
- If disagreement emerges between legalfit output and Anden review, the likely next improvement is stronger traceability by rule and by extracted evidence.
- If low-quality leads become a problem, email verification can be added before handoff.
- If Telegram UX becomes too constrained for checklist review, a Telegram Web App can be introduced for summary correction and consent.

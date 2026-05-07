# legalfit Context

## Product Summary

legalfit is a conversational regulatory readiness product for startups and technology companies. Its purpose is to collect declared company information, structure it, detect gaps and prepare a professional handoff. It does not provide legal, fiscal or accounting advice.

The focused MVP is Anden-first, Telegram-first and centered on Zonas Francas readiness for Argentine services/software companies. `PROJECT.md` remains the broader product vision; `docs/prd/legalfit-mvp-anden-zonas-francas.md` is the MVP specification.

## Current MVP

The MVP converts a Telegram intake into:

- A user-facing summary/checklist.
- An internal Anden lead dossier.
- A Lead Inbox record with operational routing fields.

The business conversion is an actionable lead for Anden, not a self-serve paid report.

## Core Actors

- User: founder, CFO, COO or operator from a startup/company completing the intake.
- Anden operator: authorized internal user who reviews leads in the Lead Inbox.
- Anden/specialist: professional reviewer who validates the case after legalfit handoff.
- legalfit system: conversational intake, extraction, rule evaluation, dossier generation and routing.

## Product Boundaries

legalfit must not:

- Provide legal, fiscal or accounting advice.
- Determine legal eligibility.
- Recommend that a user apply for a regime.
- Verify documents in MVP.
- Store uploaded documents in MVP.
- Let an LLM decide final routing alone.

legalfit may:

- Ask structured and open questions.
- Transcribe voice notes.
- Extract and normalize declared information.
- Compare declared information against an Anden-approved rulebook.
- Mark missing data, inconsistencies and review needs.
- Generate user-safe summaries and internal dossiers.

## MVP Scope

In scope:

- Telegram intake in Spanish.
- Text and voice input.
- Zonas Francas readiness for Argentine services/software companies.
- Exportacion de Servicios, MiPyME and Economia del Conocimiento as lightweight signals.
- Rulebook validated by Anden.
- Lead Inbox for Anden.
- Email notification for new actionable leads.
- 180-day retention and manual deletion.

Out of scope:

- Goods-only readiness.
- Full MiPyME, Economia del Conocimiento or Exportacion de Servicios modules.
- Tax Readiness.
- Cross-border / FX Readiness as a full module.
- CRM integration or replacement.
- Payments.
- Multi-partner white-label.
- Advanced role permissions.
- Numeric 0-100 scoring.

## Core Domain Terms

- Lead case: the central operational case created by an intake/handoff. A company may have multiple lead cases over time.
- Intake session: the Telegram conversation that collects data for a lead case.
- Company profile: user-confirmed structured snapshot for a lead case.
- Dossier: immutable generated snapshot containing user summary and Anden internal dossier.
- Rulebook: versioned code/config rules derived from official sources and approved by Anden.
- Rule result: stored output of a relevant rule applied to a lead case.
- Next action: primary routing recommendation for Anden.
- Fit status: explanatory quality assessment, not legal eligibility.
- Actionable lead: a ready-for-Anden lead with consent, critical data, valid contact and actionable `next_action`.

## Routing Values

`next_action` values:

- `request_missing_info`
- `schedule_discovery`
- `specialist_review`
- `high_priority_case`
- `not_now`
- `out_of_scope`

Fit dimensions:

- `operational_fit`
- `commercial_fit`
- `documentation_readiness`
- `risk_review_needed`

Fit levels:

- `high`
- `medium`
- `low`
- `unknown`

Exporter classifications:

- `current_exporter`
- `future_exporter`
- `exploratory`

## Data Model Direction

The central aggregate is `lead_case`.

The MVP uses a hybrid Postgres model:

- Relational columns for operational/filter fields.
- JSONB for flexible intake, profile, rule and dossier snapshots.

Minimum tables:

- `lead_cases`
- `intake_sessions`
- `intake_messages`
- `company_profiles`
- `dossiers`
- `rulebook_versions`
- `rule_results`
- `anden_operators`
- `lead_notes`
- `jobs`

Do not introduce a master `companies` table in MVP.

## Architecture Direction

MVP stack:

- Next.js for the app and Lead Inbox.
- Supabase/Postgres for storage, auth and RLS.
- Telegram Bot API for intake.
- OpenAI for transcription, extraction, normalization and drafting.

Telegram updates enter through a Next.js webhook/API route. Slow work runs through a simple Postgres/Supabase-backed jobs table. RLS is enabled on sensitive tables. Server-side webhooks/jobs may use the Supabase service role; final users do not access Supabase directly.

## Implementation Priorities

Prioritize deterministic domain modules before infrastructure:

- Critical data validator.
- Exporter classifier.
- Rulebook engine.
- Fit classifier.
- Next action router.
- Dossier builder.

Then integrate:

- Supabase schema/RLS.
- Telegram webhook and conversation state machine.
- Voice transcription/extraction.
- Lead Inbox.
- Notifications.
- Retention/expiration.

## Canonical Docs

- Product vision: `PROJECT.md`
- MVP PRD: `docs/prd/legalfit-mvp-anden-zonas-francas.md`
- Decision log: `docs/prd/legalfit-mvp-decision-log.md`
- Agent setup: `AGENTS.md` and `docs/agents/`
- ADRs: `docs/adr/`

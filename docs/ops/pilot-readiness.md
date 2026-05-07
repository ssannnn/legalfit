# Controlled Pilot Readiness

Issue: https://github.com/ssannnn/legalfit/issues/12  
Status: prepared for human validation, not approved for real leads yet.

## Purpose

This runbook prepares legalfit for a controlled 10-20 lead pilot with Anden. The pilot is not a production launch: every generated dossier must be reviewed by Anden before any commercial or professional follow-up.

## Launch Gate

The pilot can start only when all gates below are marked `passed` or explicitly waived by Anden legal/ops.

| Gate | Owner | Evidence | Status |
| --- | --- | --- | --- |
| Anden approves rulebook `zf_services_ar_v0.1.0` | Anden legal/ops | Approval comment or signed checklist | pending |
| Anden approves disclaimer, consent and user-safe copy | Anden legal/ops | Approval comment or signed checklist | pending |
| RLS policies are smoke-tested on production Supabase | legalfit operator | Test evidence in issue #12 | pending |
| Telegram text intake completes end-to-end | legalfit operator | Test lead id and transcript | pending |
| Telegram voice intake completes end-to-end | legalfit operator | Test lead id, transcript and job id | pending |
| No document upload path is exposed | legalfit operator | UI/API inspection notes | pending |
| Lead Inbox operations work | Anden operator | list/detail/assign/state/note evidence | pending |
| New lead notification works | legalfit operator | notification job id and received email | pending |
| No active lead is created without handoff/contact consent | legalfit operator | negative test lead id | pending |
| Dossier records rulebook version | legalfit operator | dossier row with rulebook version | pending |
| `high_priority_case` is only operational priority | Anden legal/ops | human-review confirmation | pending |
| First 10-20 leads all receive Anden review | Anden legal/ops | pilot review tracker | pending |

## Human Approval Package

### Rulebook `v0.1`

Anden should review:

- rulebook version: `zf_services_ar_v0.1.0`
- source pack metadata in `supabase/seed.sql`
- rule definitions in `src/lib/rulebook/rulebook.ts`
- generated rule results and source references in dossier fixtures/tests
- `high_priority_case` threshold as a commercial priority signal, not eligibility

Approval means Anden accepts this rulebook for the first controlled pilot only. Any material change to sources, thresholds or copy requires a new version.

### User-Safe Copy

Anden should approve the following copy categories before real users:

- initial disclaimer and processing consent
- open intake question
- goods-only/out-of-scope explanation
- direct legal/fiscal/accounting advice boundary
- no-document-upload documentation prompt
- confirmation summary wording
- final handoff/contact consent
- no-handoff refusal response
- voice transcription failure response

Current implementation references:

- `src/lib/telegram/intake.ts`
- `src/lib/telegram/voice.ts`

## Smoke Tests

Run these tests in the production-like environment with production Supabase, Telegram webhook and notification secrets configured.

## Test Levels

Use these levels to separate local/semi-real validation from the final HITL pilot gate.

### Level 1: Automated Local Verification

Purpose: verify deterministic product logic without external services.

Required commands:

```bash
npm test
npm run typecheck
npm run build
```

Coverage:

- routing and fit classification
- consent boundaries
- dossier generation
- voice job planning
- retention/duplicate logic
- Lead Inbox data mapping

This level does not validate real Supabase RLS, Telegram delivery, email delivery or deployed URLs.

### Level 2: Semi-Real Supabase + Curl Webhook

Purpose: validate the app against a real Supabase dev project while simulating Telegram with `curl`.

Required configuration:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SITE_URL=http://localhost:3000`
- all migrations applied, including explicit API grants
- `supabase/seed.sql` applied
- real operator email inserted into `anden_operators`
- Supabase Auth local redirect configured for `http://localhost:3000/auth/callback`

Not required for Level 2:

- `TELEGRAM_BOT_TOKEN`
- `LEGALFIT_NOTIFICATION_WEBHOOK_URL`
- `LEGALFIT_TRANSCRIPTION_WEBHOOK_URL`
- public HTTPS tunnel
- real email notification delivery
- real voice transcription provider

Level 2 completed in the current dev project:

- [x] Magic-link login reaches `/lead-inbox` for allowlisted operator.
- [x] Active operator can read Lead Inbox data after explicit grants.
- [x] Telegram text happy path via `curl` reaches final handoff consent and creates a lead.
- [x] No-handoff negative path via `chat.id=556` ends as `closed_no_handoff`.
- [x] No-handoff case does not become `ready_for_anden`.
- [x] Missing API grants were fixed in migration `20260507215000_grant_api_table_privileges.sql`.
- [x] Contact-name extraction issue observed and tracked in issue #13.

Level 2 still to run:

- [ ] Replay an existing `update_id`/`message_id` and confirm `{ "duplicate": true }`.
- [ ] Query the consented happy-path lead and confirm `lifecycle_state = 'ready_for_anden'`.
- [ ] Confirm happy-path `company_profiles` row exists.
- [ ] Confirm happy-path `dossiers.rulebook_version = 'zf_services_ar_v0.1.0'`.
- [ ] Confirm happy-path notification job exists with idempotency key.
- [ ] Confirm the consented lead appears in `/lead-inbox`.
- [ ] Confirm the `closed_no_handoff` lead does not appear in `/lead-inbox`.
- [ ] Run goods-only out-of-scope curl case.
- [ ] Run direct legal/fiscal/accounting advice out-of-scope curl case.
- [ ] Run no-company/no-commercial-operation out-of-scope curl case.
- [ ] Run non-Argentina company out-of-scope curl case.
- [ ] Run semi-real voice queue smoke test by posting a `voice.file_id` payload and confirming `jobs.job_type = 'transcription'`.

### Level 3: Real Integration / Pilot-Ready

Purpose: validate the actual pilot path with real external integrations and Anden HITL approval.

Required configuration:

- production-like Supabase project with all migrations and seed data
- production-like Supabase Auth URL configuration
- server-side `SUPABASE_SERVICE_ROLE_KEY`
- deployed app URL or public tunnel
- `TELEGRAM_BOT_TOKEN`
- Telegram webhook configured to `/api/telegram/webhook`
- `LEGALFIT_NOTIFICATION_WEBHOOK_URL`
- notification recipient configured or confirmed by the webhook provider
- `LEGALFIT_TRANSCRIPTION_WEBHOOK_URL` or approved transcription integration
- job runner/cron/manual invocation for `/api/jobs/transcription` and `/api/jobs/retention`
- optional `LEGALFIT_JOB_SECRET` with matching `Authorization: Bearer ...` for job routes

Level 3 still to run:

- [ ] Anden approves rulebook `zf_services_ar_v0.1.0`.
- [ ] Anden approves disclaimer, consent and user-safe copy.
- [ ] Authenticated allowlisted operator can access Lead Inbox in the target environment.
- [ ] Authenticated non-allowlisted user is denied.
- [ ] Real Telegram text intake completes end-to-end.
- [ ] Real Telegram voice intake completes end-to-end with transcript stored.
- [ ] Successful voice transcription clears original audio retention.
- [ ] Exhausted voice transcription failure sends safe retry/continue-with-text message.
- [ ] Email/webhook notification is received and includes Lead Inbox detail link.
- [ ] Replayed Telegram update/message does not create duplicate dossier or notification.
- [ ] No document upload path is visible or accepted.
- [ ] Lead Inbox operator can list, filter, open detail, assign, change commercial state and add notes.
- [ ] Every dossier from the first 10-20 real leads is reviewed by Anden.
- [ ] `high_priority_case` is treated as queue priority only, with human review required.

### RLS

1. Log in as an active email in `anden_operators`.
2. Open `/lead-inbox`.
3. Confirm list/detail can read lead data.
4. Log in as a non-allowlisted authenticated user.
5. Confirm `/lead-inbox` denies access.
6. Confirm service role is used only server-side for webhook/job routes.

### Telegram Text Intake

1. Send `/start`.
2. Accept processing consent.
3. Describe an Argentine services/software exporter.
4. Answer missing questions.
5. Provide company, contact name, role and email only after the case is in scope.
6. Answer MiPyME and Economia del Conocimiento signals.
7. Declare documentation readiness without uploading files.
8. Confirm the summary.
9. Accept final handoff/contact consent.
10. Confirm the lead reaches `ready_for_anden`.

### Telegram Voice Intake

1. Reach an open-answer step.
2. Send a voice note.
3. Confirm a `transcription` job is queued.
4. Run/process the transcription job.
5. Confirm transcript is stored.
6. Confirm original audio retention is cleared after success.
7. Confirm transcript feeds the same intake flow as text.
8. Force a failed transcription path in a test lead and confirm exhausted retries do not create an actionable lead.

### Consent Boundary

1. Complete a valid profile.
2. Refuse final handoff/contact consent.
3. Confirm user receives basic summary/checklist.
4. Confirm lead case is `closed_no_handoff`.
5. Confirm it does not appear as an active Lead Inbox item.

### Out Of Scope

Run one case for each:

- goods-only exporter
- direct legal/fiscal/accounting advice request
- no company/commercial operation
- non-Argentina company

Expected result: case is closed or marked `out_of_scope`, no active Anden lead is created.

### Lead Inbox

1. Confirm newest-first list.
2. Filter by `next_action`, `overall_fit`, commercial state, assignee and duplicate status.
3. Open detail.
4. Review company/contact/header fields.
5. Review fit dimensions, missing data, inconsistencies, profile, declared documentation and sources.
6. Expand transcript/messages.
7. Assign responsible operator.
8. Change commercial state.
9. Add internal note.
10. Confirm original dossier snapshot cannot be edited.

### Notification

1. Complete a consented actionable lead.
2. Confirm a notification job is created with idempotency key.
3. Confirm the email/webhook notification includes a Lead Inbox detail link.
4. Replay the same Telegram update/message id.
5. Confirm no duplicate notification or dossier is created.

## Pilot Operating Model

For the first 10-20 real leads:

- Every dossier is reviewed by Anden before action.
- `high_priority_case` leads are reviewed first, but still require human judgment.
- Operators use Lead Inbox notes for review findings and commercial follow-up.
- Any uncertain rulebook interpretation is captured as a pilot finding, not patched silently.
- Any user-facing copy issue is captured before additional leads are processed.
- Duplicates are marked but not auto-merged.
- Users must not upload documents through legalfit during this pilot.

## Go / No-Go

Go when:

- all launch gates are passed;
- Anden has approved rulebook and copy;
- text and voice happy paths have produced real dossiers in the pilot environment;
- negative consent/out-of-scope paths produce no active lead;
- at least one Anden operator has completed list/detail/assignment/state/note workflow.

No-go when:

- rulebook or copy is not approved;
- RLS cannot be demonstrated;
- service-role secrets are exposed client-side;
- real leads can become active without final handoff/contact consent;
- document uploads appear in any user path;
- dossier generation lacks rulebook version;
- notifications create duplicates on replay.

## Evidence Log

Use this table in issue #12 comments while executing the pilot readiness check.

| Date | Gate | Environment | Evidence | Result | Reviewer |
| --- | --- | --- | --- | --- | --- |
| TBD | TBD | TBD | TBD | pending | TBD |

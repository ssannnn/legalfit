# Smoke Test: Telegram Text Intake To Lead Inbox

## Preconditions

- `NEXT_PUBLIC_SITE_URL` points to the deployed app.
- `SUPABASE_SERVICE_ROLE_KEY` is configured only server-side.
- `TELEGRAM_BOT_TOKEN` is configured for the webhook.
- `LEGALFIT_NOTIFICATION_WEBHOOK_URL` is configured if email delivery is being exercised.
- At least one active Anden operator exists in `anden_operators`.

## Path

1. Send `/start` to the Telegram bot.
2. Accept processing consent.
3. Describe an Argentina services/software exporter with current foreign customers.
4. Answer missing critical questions in blocks of at most three.
5. Provide contact name, role, company and email when requested.
6. Answer MiPyME and Economia del Conocimiento signals.
7. Declare documentation readiness without uploading files.
8. Confirm the sectioned summary.
9. Accept final consent to share the dossier with Anden and allow Anden contact.
10. Open `/lead-inbox` as an allowlisted operator.

## Expected Result

- The lead case reaches `ready_for_anden`.
- A company profile and immutable dossier exist for the lead.
- The Lead Inbox list shows the lead as active.
- The Lead Inbox detail shows the generated user summary and Anden dossier.
- A notification job exists with idempotency key `notification:new_actionable_lead:<lead_case_id>`.
- Replaying the same Telegram update or message id does not generate another dossier or notification.

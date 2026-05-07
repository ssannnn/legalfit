# Manual Deletion Process

This MVP keeps lead and dossier records for 180 days using `retention_delete_after`.
Manual deletion is intentionally admin-only and should not be exposed in the Lead Inbox.

## When To Use

- A user requests deletion of their intake data.
- Anden/legalfit decides a pilot record should be removed before the retention date.
- A test lead was created with real contact data.

## Process

1. Confirm the requester and the target `lead_case_id`.
2. Export the row ids needed for audit notes if required by Anden legal/ops.
3. Run deletion from a service-role Supabase SQL console or controlled admin script:

```sql
delete from public.lead_cases
where id = '<lead_case_id>';
```

Related intake sessions, messages, profiles, dossiers, rule results and notes cascade through foreign keys where configured. If a future table does not cascade, delete that table first and then the lead case.

## Guardrails

- Do not delete by email alone; resolve the exact lead id first.
- Do not merge duplicates automatically.
- Do not expose service-role deletion from the operator dashboard during the MVP.
- Record the deletion request and operator outside the app until a formal audit log exists.

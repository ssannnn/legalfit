import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const schemaMigrationPath = join(
  process.cwd(),
  "supabase/migrations/20260507193000_create_lead_case_schema.sql"
);

describe("lead case schema migration", () => {
  const sql = readFileSync(schemaMigrationPath, "utf8");

  it("creates the minimum MVP tables", () => {
    for (const table of [
      "lead_cases",
      "intake_sessions",
      "intake_messages",
      "company_profiles",
      "dossiers",
      "rulebook_versions",
      "rule_results",
      "lead_notes",
      "jobs"
    ]) {
      expect(sql).toContain(`create table if not exists public.${table}`);
    }
  });

  it("enables RLS on all lead data tables", () => {
    for (const table of [
      "lead_cases",
      "intake_sessions",
      "intake_messages",
      "company_profiles",
      "dossiers",
      "rulebook_versions",
      "rule_results",
      "lead_notes",
      "jobs"
    ]) {
      expect(sql).toContain(`alter table public.${table} enable row level security`);
    }
  });

  it("allows active Anden operators to read lead inbox tables", () => {
    expect(sql).toContain("active operators can read lead cases");
    expect(sql).toContain("lower(email) = lower(auth.email())");
  });

  it("constrains lifecycle and commercial state separately", () => {
    expect(sql).toContain("lead_cases_lifecycle_state_check");
    expect(sql).toContain("lead_cases_commercial_state_check");
  });
});

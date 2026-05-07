import { describe, expect, it } from "vitest";

import { filterLeadInboxItems, mapLeadCaseRow } from "./data";

describe("mapLeadCaseRow", () => {
  it("maps operational lead case fields for the Lead Inbox", () => {
    expect(
      mapLeadCaseRow({
        id: "lead-1",
        company_name: "Demo SaaS Exportadora",
        contact_name: "Lucia Demo",
        contact_email: "lucia@example.com",
        lifecycle_state: "ready_for_anden",
        commercial_state: "new",
        next_action: "schedule_discovery",
        overall_fit: "medium",
        exporter_classification: "current_exporter",
        export_type: "services_software",
        assigned_operator_id: "operator-1",
        possible_duplicate: false,
        duplicate_signals: {},
        created_at: "2026-05-07T18:00:00Z"
      })
    ).toEqual({
      id: "lead-1",
      companyName: "Demo SaaS Exportadora",
      contactName: "Lucia Demo",
      contactEmail: "lucia@example.com",
      lifecycleState: "ready_for_anden",
      commercialState: "new",
      nextAction: "schedule_discovery",
      overallFit: "medium",
      exporterClassification: "current_exporter",
      exportType: "services_software",
      assignedOperatorId: "operator-1",
      possibleDuplicate: false,
      duplicateSignals: {},
      createdAt: "2026-05-07T18:00:00Z"
    });
  });

  it("uses a stable fallback when company name is missing", () => {
    const item = mapLeadCaseRow({
      id: "lead-1",
      company_name: null,
      contact_name: null,
      contact_email: null,
      lifecycle_state: "collecting_info",
      commercial_state: null,
      next_action: null,
      overall_fit: null,
      exporter_classification: null,
      export_type: null,
      assigned_operator_id: null,
      possible_duplicate: false,
      duplicate_signals: {},
      created_at: "2026-05-07T18:00:00Z"
    });

    expect(item.companyName).toBe("Empresa sin nombre");
  });

  it("filters active inbox items by operational facets", () => {
    const items = [
      mapLeadCaseRow({
        id: "lead-1",
        company_name: "Demo SaaS",
        contact_name: "Lucia",
        contact_email: "lucia@example.com",
        lifecycle_state: "ready_for_anden",
        commercial_state: "new",
        next_action: "schedule_discovery",
        overall_fit: "medium",
        exporter_classification: "current_exporter",
        export_type: "services_software",
        assigned_operator_id: "operator-1",
        possible_duplicate: true,
        duplicate_signals: { email: true },
        created_at: "2026-05-07T18:00:00Z"
      }),
      mapLeadCaseRow({
        id: "lead-2",
        company_name: "Other SaaS",
        contact_name: "Ana",
        contact_email: "ana@example.com",
        lifecycle_state: "ready_for_anden",
        commercial_state: "contacted",
        next_action: "specialist_review",
        overall_fit: "high",
        exporter_classification: "current_exporter",
        export_type: "services_software",
        assigned_operator_id: null,
        possible_duplicate: false,
        duplicate_signals: {},
        created_at: "2026-05-07T19:00:00Z"
      })
    ];

    expect(
      filterLeadInboxItems(items, {
        nextAction: "schedule_discovery",
        overallFit: "medium",
        commercialState: "new",
        assignee: "operator-1",
        possibleDuplicate: "true"
      }).map((item) => item.id)
    ).toEqual(["lead-1"]);
  });
});

import { describe, expect, it } from "vitest";

import { mapLeadCaseRow } from "./data";

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
      created_at: "2026-05-07T18:00:00Z"
    });

    expect(item.companyName).toBe("Empresa sin nombre");
  });
});

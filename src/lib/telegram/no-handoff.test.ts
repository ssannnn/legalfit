import { describe, expect, it } from "vitest";

import { isActiveLeadInboxItem } from "../lead-inbox/data";
import { handleTextIntake, type IntakeSessionSnapshot } from "./intake";

const confirmed: IntakeSessionSnapshot = {
  state: "awaiting_confirmation",
  currentStep: "profile_confirmation",
  extractedFields: {
    companyName: "Demo SaaS",
    contactName: "Lucia Demo",
    contactRole: "Founder",
    contactEmail: "lucia@example.com",
    activityType: "services_software",
    exportType: "services_software",
    exportsToday: true,
    exportRevenueRange: "usd_50k_250k",
    countries: ["United States"],
    billing: "factura_e_exportacion",
    collection: "banco_argentina",
    recurringRevenue: true,
    teamSize: "12",
    consultationMotive: "Evaluar zona franca",
    consents: { processing: true },
    declaredDocumentation: {
      exportInvoices: "declared_available",
      revenueSummary: "declared_available",
      contracts: "declared_available"
    }
  }
};

describe("no-handoff and out-of-scope paths", () => {
  it("asks final handoff consent separately after profile confirmation", () => {
    const result = handleTextIntake({
      session: confirmed,
      text: "confirmar"
    });

    expect(result.sessionPatch.state).toBe("awaiting_handoff_consent");
    expect(result.replies[0]).toContain("compartir este dossier con Anden");
    expect(result.replies[0]).toContain("Anden te contacte");
  });

  it("closes without an active inbox lead when final consent is refused", () => {
    const result = handleTextIntake({
      session: {
        ...confirmed,
        state: "awaiting_handoff_consent",
        currentStep: "handoff_consent"
      },
      text: "no"
    });

    expect(result.sessionPatch.state).toBe("closed_no_handoff");
    expect(result.leadCasePatch?.lifecycleState).toBe("closed_no_handoff");
    expect(result.replies[0]).toContain("No voy a compartir tus datos");
    expect(
      isActiveLeadInboxItem({
        lifecycleState: "closed_no_handoff",
        nextAction: "schedule_discovery"
      })
    ).toBe(false);
  });

  it("keeps goods-only cases out of the active inbox with optional minimal capture", () => {
    const result = handleTextIntake({
      session: {
        state: "collecting_case_description",
        currentStep: "case_description",
        extractedFields: { consents: { processing: true } }
      },
      text: "Somos una empresa argentina que exporta bienes fisicos y mercaderia a Uruguay."
    });

    expect(result.sessionPatch.state).toBe("awaiting_minimal_capture_consent");
    expect(result.leadCasePatch?.lifecycleState).toBe("out_of_scope");
    expect(result.replies[0]).toContain("enfocado en servicios/software");
    expect(
      isActiveLeadInboxItem({
        lifecycleState: "out_of_scope",
        nextAction: "out_of_scope"
      })
    ).toBe(false);
  });

  it("stores only a minimal goods-case note when the user accepts optional capture", () => {
    const result = handleTextIntake({
      session: {
        state: "awaiting_minimal_capture_consent",
        currentStep: "out_of_scope_goods",
        extractedFields: {
          consents: { processing: true },
          activityType: "goods",
          exportType: "goods"
        }
      },
      text: "si"
    });

    expect(result.sessionPatch.state).toBe("out_of_scope");
    expect(result.sessionPatch.extractedFields.minimalCaptureConsent).toBe(true);
    expect(result.leadCasePatch?.lifecycleState).toBe("out_of_scope");
  });

  it("returns a boundary-safe response for direct legal, fiscal or accounting advice", () => {
    const result = handleTextIntake({
      session: {
        state: "collecting_case_description",
        currentStep: "case_description",
        extractedFields: { consents: { processing: true } }
      },
      text: "Necesito asesoramiento fiscal para saber que impuesto pago por exportar software."
    });

    expect(result.sessionPatch.state).toBe("out_of_scope");
    expect(result.replies[0]).toContain("no doy asesoramiento legal, fiscal ni contable");
  });

  it("marks cases without company operation or outside Argentina as out of scope", () => {
    const noCompany = handleTextIntake({
      session: {
        state: "collecting_case_description",
        currentStep: "case_description",
        extractedFields: { consents: { processing: true } }
      },
      text: "Soy persona fisica y no tengo empresa ni operacion comercial todavia."
    });
    const nonArgentina = handleTextIntake({
      session: {
        state: "collecting_case_description",
        currentStep: "case_description",
        extractedFields: { consents: { processing: true } }
      },
      text: "Somos una empresa chilena de software con clientes en Peru."
    });

    expect(noCompany.sessionPatch.currentStep).toBe(
      "no_company_or_commercial_operation"
    );
    expect(nonArgentina.sessionPatch.currentStep).toBe("non_argentina_company");
    expect(noCompany.leadCasePatch?.lifecycleState).toBe("out_of_scope");
    expect(nonArgentina.leadCasePatch?.lifecycleState).toBe("out_of_scope");
  });
});

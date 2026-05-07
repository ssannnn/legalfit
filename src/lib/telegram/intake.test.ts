import { describe, expect, it } from "vitest";

import { handleTextIntake, type IntakeSessionSnapshot } from "./intake";

const started: IntakeSessionSnapshot = {
  state: "intake_started",
  currentStep: "start",
  extractedFields: {}
};

describe("handleTextIntake", () => {
  it("starts with disclaimer and processing consent", () => {
    const result = handleTextIntake({
      session: null,
      text: "/start"
    });

    expect(result.sessionPatch).toEqual(
      expect.objectContaining({
        state: "awaiting_processing_consent",
        currentStep: "processing_consent"
      })
    );
    expect(result.replies[0]).toContain("no doy asesoramiento");
    expect(result.replies[0]).toContain("procesar tus respuestas");
  });

  it("asks one open question after processing consent", () => {
    const result = handleTextIntake({
      session: {
        ...started,
        state: "awaiting_processing_consent",
        currentStep: "processing_consent"
      },
      text: "si"
    });

    expect(result.sessionPatch.state).toBe("collecting_case_description");
    expect(result.sessionPatch.extractedFields).toEqual({
      consents: { processing: true }
    });
    expect(result.replies).toHaveLength(1);
    expect(result.replies[0]).toContain("Contame en un mensaje");
  });

  it("extracts initial fields and asks at most three missing critical questions", () => {
    const result = handleTextIntake({
      session: {
        ...started,
        state: "collecting_case_description",
        currentStep: "case_description",
        extractedFields: {
          consents: { processing: true }
        }
      },
      text: "Somos una SaaS argentina. Exportamos software a Estados Unidos y Chile. Queremos evaluar zona franca con Anden."
    });

    expect(result.sessionPatch.state).toBe("collecting_missing_info");
    expect(result.sessionPatch.extractedFields).toEqual(
      expect.objectContaining({
        activityType: "services_software",
        exportType: "services_software",
        exportsToday: true,
        countries: ["United States", "Chile"],
        consultationMotive: "Evaluar zona franca"
      })
    );
    expect(result.replies.length).toBeLessThanOrEqual(3);
    expect(result.replies[0]).toContain("rango exportaron");
  });

  it("requests contact only after the case is not clearly out of scope", () => {
    const result = handleTextIntake({
      session: {
        ...started,
        state: "collecting_missing_info",
        currentStep: "missing_info",
        extractedFields: {
          companyName: "Demo SaaS",
          contactName: "Lucia",
          contactRole: "Founder",
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
          consents: { processing: true }
        }
      },
      text: "Mi email es lucia@example.com"
    });

    expect(result.sessionPatch.state).toBe("collecting_signals");
    expect(result.replies[0]).toContain("Certificado MiPyME");
  });
});

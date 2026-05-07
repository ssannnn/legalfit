import type {
  BillingOption,
  CollectionOption,
  DocumentState,
  ExportRevenueRange,
  ExportType,
  NextAction
} from "../routing/readiness";

export type RuleResultStatus = "matched" | "not_matched" | "unknown" | "skipped";
export type RuleSeverity = "info" | "low" | "medium" | "high" | "critical";

export type RulebookProfile = {
  activityType?: string | null;
  exportType?: ExportType | null;
  exportsToday?: boolean | null;
  exportRevenueRange?: ExportRevenueRange | null;
  urgency?: boolean | null;
  countries?: string[];
  billing?: BillingOption | null;
  collection?: CollectionOption | null;
  recurringRevenue?: boolean | null;
  declaredDocumentation?: Record<string, DocumentState>;
  riskSignals?: string[];
  inconsistencies?: string[];
};

export type RuleEffect = {
  operationalFitSignal?: "positive" | "negative" | "unknown";
  commercialFitSignal?: "positive" | "priority" | "weak" | "unknown";
  documentationSignal?: "positive" | "partial" | "missing" | "unknown";
  nextActionSignal?: NextAction;
  checklistItems?: string[];
};

export type RuleEvaluation = {
  result: RuleResultStatus;
  evidenceSnapshot?: Record<string, unknown>;
  missingData?: string[];
};

export type RuleDefinition = {
  id: string;
  version: string;
  module: "zonas_francas_services_ar";
  condition: string;
  effect: RuleEffect;
  severity: RuleSeverity;
  sourceUrl: string;
  sourceLabel: string;
  internalExplanation: string;
  userSafeCopy: string;
  requiresSpecialistReview: boolean;
  evaluate: (profile: RulebookProfile) => RuleEvaluation;
};

export type SourcePackSource = {
  label: string;
  url: string;
  notes: string;
};

export type Rulebook = {
  version: string;
  module: "zonas_francas_services_ar";
  validation: {
    owner: "Anden legal/ops";
    status: "pending_final_copy_review";
    notes: string;
  };
  sourcePack: {
    sources: SourcePackSource[];
    futureAndenSourcesNote: string;
  };
  rules: RuleDefinition[];
};

export type AppliedRuleResult = {
  rulebookVersion: string;
  ruleId: string;
  result: RuleResultStatus;
  effect: RuleEffect;
  severity: RuleSeverity;
  evidenceSnapshot: Record<string, unknown>;
  missingData: string[];
  sourceLabel: string;
  sourceUrl: string;
  internalExplanation: string;
  userSafeCopy: string;
  requiresSpecialistReview: boolean;
};

const VERSION = "zf_services_ar_v0.1.0";
const MODULE = "zonas_francas_services_ar" as const;

const sources = {
  zonasFrancas: {
    label: "Ley 24.331 de Zonas Francas",
    url: "https://www.argentina.gob.ar/normativa/nacional/ley-24331-725/actualizacion"
  },
  codigoAduanero: {
    label: "Codigo Aduanero Ley 22.415",
    url: "https://www.argentina.gob.ar/normativa/nacional/ley-22415-16536/actualizacion"
  },
  arcaServicios: {
    label: "ARCA exportacion de servicios",
    url: "https://www.arca.gob.ar/monotributo/exportacion-servicios/"
  },
  mipyme: {
    label: "Certificado MiPyME",
    url: "https://www.argentina.gob.ar/servicio/obtener-el-certificado-mipyme"
  },
  economiaConocimiento: {
    label: "Economia del Conocimiento",
    url: "https://www.argentina.gob.ar/produccion/economia-del-conocimiento"
  }
};

function missing(...fields: string[]): RuleEvaluation {
  return {
    result: "unknown",
    evidenceSnapshot: {},
    missingData: fields
  };
}

function isHighExportRange(range: ExportRevenueRange | null | undefined) {
  return range === "usd_250k_1m" || range === "usd_1m_plus";
}

function hasMainDeclaredDocs(profile: RulebookProfile) {
  const docs = profile.declaredDocumentation ?? {};
  return (
    docs.exportInvoices === "declared_available" &&
    docs.revenueSummary === "declared_available" &&
    docs.contracts === "declared_available"
  );
}

function defineRule(
  rule: Omit<RuleDefinition, "version" | "module">
): RuleDefinition {
  return {
    ...rule,
    version: VERSION,
    module: MODULE
  };
}

export const zfServicesArV010Rulebook: Rulebook = {
  version: VERSION,
  module: MODULE,
  validation: {
    owner: "Anden legal/ops",
    status: "pending_final_copy_review",
    notes:
      "El source pack y los umbrales iniciales fueron confirmados para el shell. El copy final y cualquier fuente propia de Anden quedan abiertos para revision posterior."
  },
  sourcePack: {
    sources: [
      {
        ...sources.zonasFrancas,
        notes:
          "Fuente oficial base para estructurar senales internas sobre actividad y encuadre de zonas francas."
      },
      {
        ...sources.codigoAduanero,
        notes:
          "Fuente oficial base para senales de exportacion y necesidad de revision profesional."
      },
      {
        ...sources.arcaServicios,
        notes:
          "Fuente oficial de soporte para senales declaradas de facturacion/exportacion de servicios."
      },
      {
        ...sources.mipyme,
        notes: "Senal accesoria; no constituye modulo MiPyME en MVP."
      },
      {
        ...sources.economiaConocimiento,
        notes:
          "Senal accesoria; no constituye modulo Economia del Conocimiento en MVP."
      }
    ],
    futureAndenSourcesNote:
      "El equipo de Anden puede incorporar fuentes, guias internas o documentacion especifica de zona franca en futuras versiones del rulebook."
  },
  rules: [
    defineRule({
      id: "zf-services-current-exporter",
      condition:
        "Empresa declara actividad de servicios/software y exportacion actual.",
      effect: {
        operationalFitSignal: "positive"
      },
      severity: "medium",
      sourceLabel: sources.zonasFrancas.label,
      sourceUrl: sources.zonasFrancas.url,
      internalExplanation:
        "La actividad declarada y la exportacion actual son senales operativas positivas para una conversacion de zona franca con Anden. No determina elegibilidad.",
      userSafeCopy:
        "Tu actividad y ventas al exterior ayudan a ordenar una revision profesional posterior.",
      requiresSpecialistReview: false,
      evaluate(profile) {
        if (profile.exportsToday === null || profile.exportsToday === undefined) {
          return missing("exportsToday");
        }

        const matched =
          profile.activityType === "services_software" &&
          profile.exportType === "services_software" &&
          profile.exportsToday === true;

        return {
          result: matched ? "matched" : "not_matched",
          evidenceSnapshot: {
            activityType: profile.activityType,
            exportType: profile.exportType,
            exportsToday: profile.exportsToday
          }
        };
      }
    }),
    defineRule({
      id: "zf-services-export-billing-signal",
      condition:
        "Empresa declara como factura y cobra servicios/exportaciones internacionales.",
      effect: {
        operationalFitSignal: "positive",
        checklistItems: [
          "Facturas o invoices de exportacion",
          "Resumen de cobros por pais/canal"
        ]
      },
      severity: "medium",
      sourceLabel: sources.arcaServicios.label,
      sourceUrl: sources.arcaServicios.url,
      internalExplanation:
        "La facturacion y cobranza declaradas ayudan a preparar el discovery. Si falta o es inconsistente, requiere aclaracion o revision.",
      userSafeCopy:
        "Conviene tener a mano informacion de facturacion y cobros para que un especialista pueda revisar tu caso.",
      requiresSpecialistReview: false,
      evaluate(profile) {
        const missingFields: string[] = [];
        if (!profile.billing) missingFields.push("billing");
        if (!profile.collection) missingFields.push("collection");

        if (missingFields.length > 0) {
          return missing(...missingFields);
        }

        return {
          result:
            profile.billing === "factura_e_exportacion" ||
            profile.billing === "invoice_exterior" ||
            profile.billing === "mixto"
              ? "matched"
              : "not_matched",
          evidenceSnapshot: {
            billing: profile.billing,
            collection: profile.collection
          }
        };
      }
    }),
    defineRule({
      id: "zf-services-high-priority-threshold",
      condition:
        "Empresa exportadora actual supera USD 250k en los ultimos 12 meses, declara urgencia y documentacion principal disponible.",
      effect: {
        commercialFitSignal: "priority",
        nextActionSignal: "high_priority_case"
      },
      severity: "high",
      sourceLabel: sources.zonasFrancas.label,
      sourceUrl: sources.zonasFrancas.url,
      internalExplanation:
        "Umbral comercial confirmado para priorizar casos, no para determinar elegibilidad legal.",
      userSafeCopy:
        "Con la informacion declarada, tu caso puede ser preparado para una conversacion profesional priorizada.",
      requiresSpecialistReview: false,
      evaluate(profile) {
        const missingFields: string[] = [];
        if (!profile.exportRevenueRange) missingFields.push("exportRevenueRange");
        if (profile.urgency === null || profile.urgency === undefined) {
          missingFields.push("urgency");
        }
        if (!profile.declaredDocumentation) {
          missingFields.push("declaredDocumentation");
        }

        if (missingFields.length > 0) {
          return missing(...missingFields);
        }

        const matched =
          profile.exportsToday === true &&
          isHighExportRange(profile.exportRevenueRange) &&
          profile.urgency === true &&
          hasMainDeclaredDocs(profile);

        return {
          result: matched ? "matched" : "not_matched",
          evidenceSnapshot: {
            exportsToday: profile.exportsToday,
            exportRevenueRange: profile.exportRevenueRange,
            urgency: profile.urgency,
            declaredDocumentation: profile.declaredDocumentation
          }
        };
      }
    }),
    defineRule({
      id: "zf-services-specialist-review-signals",
      condition:
        "Caso presenta multiples jurisdicciones, cobros complejos, mezcla servicios/bienes, inconsistencias u otras senales sensibles.",
      effect: {
        nextActionSignal: "specialist_review"
      },
      severity: "high",
      sourceLabel: sources.codigoAduanero.label,
      sourceUrl: sources.codigoAduanero.url,
      internalExplanation:
        "Senales de complejidad que deben ser revisadas por Anden/especialista antes de avanzar comercialmente.",
      userSafeCopy:
        "Hay aspectos de la operatoria que conviene revisar con un especialista antes de avanzar.",
      requiresSpecialistReview: true,
      evaluate(profile) {
        const riskSignals = profile.riskSignals ?? [];
        const inconsistencies = profile.inconsistencies ?? [];
        const mixedGoodsSignal = profile.exportType === "mixed";
        const matched =
          riskSignals.length > 0 || inconsistencies.length > 0 || mixedGoodsSignal;

        return {
          result: matched ? "matched" : "not_matched",
          evidenceSnapshot: {
            riskSignals,
            inconsistencies,
            exportType: profile.exportType
          }
        };
      }
    }),
    defineRule({
      id: "zf-services-documentation-readiness",
      condition:
        "Empresa declara disponibilidad de facturas, resumen de ingresos y contratos/SOW principales.",
      effect: {
        documentationSignal: "positive",
        checklistItems: [
          "Facturas de exportacion",
          "Resumen de ingresos por pais/canal",
          "Contratos o SOW principales"
        ]
      },
      severity: "medium",
      sourceLabel: sources.mipyme.label,
      sourceUrl: sources.mipyme.url,
      internalExplanation:
        "La disponibilidad documental declarada mejora la preparacion del caso, pero no verifica documentos.",
      userSafeCopy:
        "Tener documentacion ordenada ayuda a preparar mejor la revision profesional.",
      requiresSpecialistReview: false,
      evaluate(profile) {
        if (!profile.declaredDocumentation) {
          return missing("declaredDocumentation");
        }

        return {
          result: hasMainDeclaredDocs(profile) ? "matched" : "not_matched",
          evidenceSnapshot: {
            declaredDocumentation: profile.declaredDocumentation
          }
        };
      }
    })
  ]
};

export function applyRulebook(
  rulebook: Rulebook,
  profile: RulebookProfile
): AppliedRuleResult[] {
  return rulebook.rules.map((rule) => {
    const evaluation = rule.evaluate(profile);

    return {
      rulebookVersion: rulebook.version,
      ruleId: rule.id,
      result: evaluation.result,
      effect: rule.effect,
      severity: rule.severity,
      evidenceSnapshot: evaluation.evidenceSnapshot ?? {},
      missingData: evaluation.missingData ?? [],
      sourceLabel: rule.sourceLabel,
      sourceUrl: rule.sourceUrl,
      internalExplanation: rule.internalExplanation,
      userSafeCopy: rule.userSafeCopy,
      requiresSpecialistReview: rule.requiresSpecialistReview
    };
  });
}

export type ActivityType = "services_software" | "goods" | "mixed" | "unknown";
export type ExportType = "services_software" | "goods" | "mixed" | "none" | "unknown";
export type ExportRevenueRange =
  | "no_exports"
  | "lt_usd_10k"
  | "usd_10k_50k"
  | "usd_50k_250k"
  | "usd_250k_1m"
  | "usd_1m_plus"
  | "prefer_not_to_answer";
export type BillingOption =
  | "factura_e_exportacion"
  | "factura_local"
  | "invoice_exterior"
  | "mixto"
  | "no_se_contador"
  | "prefer_not_to_answer";
export type CollectionOption =
  | "banco_argentina"
  | "cuenta_banco_exterior"
  | "fintech_procesador_internacional"
  | "mixto"
  | "no_se_contador"
  | "prefer_not_to_answer";
export type DocumentState =
  | "declared_available"
  | "declared_unavailable"
  | "declared_unknown"
  | "not_applicable"
  | "verified_available"
  | "verified_missing"
  | "verification_needed";
export type ExporterClassification =
  | "current_exporter"
  | "future_exporter"
  | "exploratory";
export type FitLevel = "high" | "medium" | "low" | "unknown";
export type NextAction =
  | "request_missing_info"
  | "schedule_discovery"
  | "specialist_review"
  | "high_priority_case"
  | "not_now"
  | "out_of_scope";

export type ReadinessInput = {
  companyName?: string | null;
  contactName?: string | null;
  contactRole?: string | null;
  contactEmail?: string | null;
  activityType?: ActivityType | null;
  exportType?: ExportType | null;
  exportsToday?: boolean | null;
  exportRevenueRange?: ExportRevenueRange | null;
  countries?: string[];
  billing?: BillingOption | null;
  collection?: CollectionOption | null;
  recurringRevenue?: boolean | null;
  futureExportSignals?: string[];
  teamSize?: string | null;
  consultationMotive?: string | null;
  urgency?: boolean;
  declaredDocumentation?: Record<string, DocumentState>;
  consents?: {
    processing?: boolean;
    handoff?: boolean;
    contact?: boolean;
  };
  riskSignals?: string[];
  inconsistencies?: string[];
};

export type CriticalDataValidation = {
  canRoute: boolean;
  missingCriticalFields: string[];
  nonBlockingUnknownFields: string[];
};

export type ExporterClassificationResult = {
  classification: ExporterClassification;
  outOfScopeReason?: "goods_only";
};

export type FitDimension = {
  level: FitLevel;
  reason: string;
  evidenceUsed: string[];
  missingData: string[];
};

export type ReadinessClassification = {
  nextAction: NextAction;
  overallFit: FitLevel;
  exporterClassification: ExporterClassification;
  fitDimensions: {
    operationalFit: FitDimension;
    commercialFit: FitDimension;
    documentationReadiness: FitDimension;
    riskReviewNeeded: FitDimension;
  };
  missingCriticalFields: string[];
  nonBlockingUnknownFields: string[];
  outOfScopeReason?: "goods_only";
};

function isBlank(value: string | null | undefined) {
  return !value || value.trim().length === 0;
}

function hasDeclaredDocument(
  input: ReadinessInput,
  documentKey: string
): boolean {
  const state = input.declaredDocumentation?.[documentKey];
  return state === "declared_available" || state === "verified_available";
}

function isHighExportRange(range: ExportRevenueRange | null | undefined) {
  return range === "usd_250k_1m" || range === "usd_1m_plus";
}

function isMediumOrHighExportRange(range: ExportRevenueRange | null | undefined) {
  return (
    range === "usd_50k_250k" ||
    range === "usd_250k_1m" ||
    range === "usd_1m_plus"
  );
}

function hasConcreteFutureExportSignal(input: ReadinessInput) {
  return (input.futureExportSignals ?? []).length > 0;
}

export function validateCriticalData(
  input: ReadinessInput
): CriticalDataValidation {
  const missingCriticalFields: string[] = [];
  const nonBlockingUnknownFields: string[] = [];

  if (isBlank(input.companyName)) missingCriticalFields.push("companyName");
  if (isBlank(input.contactName)) missingCriticalFields.push("contactName");
  if (isBlank(input.contactRole)) missingCriticalFields.push("contactRole");
  if (isBlank(input.contactEmail)) missingCriticalFields.push("contactEmail");
  if (!input.activityType) missingCriticalFields.push("activityType");
  if (!input.exportType) missingCriticalFields.push("exportType");
  if (input.exportsToday === null || input.exportsToday === undefined) {
    missingCriticalFields.push("exportsToday");
  }
  if (isBlank(input.teamSize)) missingCriticalFields.push("teamSize");
  if (isBlank(input.consultationMotive)) {
    missingCriticalFields.push("consultationMotive");
  }
  if (!input.consents?.processing) missingCriticalFields.push("processingConsent");
  if (!input.consents?.handoff) missingCriticalFields.push("handoffConsent");
  if (!input.consents?.contact) missingCriticalFields.push("contactConsent");

  if (input.exportsToday) {
    if (!input.exportRevenueRange) {
      missingCriticalFields.push("exportRevenueRange");
    } else if (input.exportRevenueRange === "prefer_not_to_answer") {
      nonBlockingUnknownFields.push("exportRevenueRange");
    }

    if (!input.countries || input.countries.length === 0) {
      missingCriticalFields.push("countries");
    }
    if (!input.billing) missingCriticalFields.push("billing");
    if (!input.collection) missingCriticalFields.push("collection");
    if (input.recurringRevenue === null || input.recurringRevenue === undefined) {
      missingCriticalFields.push("recurringRevenue");
    }
  }

  for (const [key, value] of Object.entries(input.declaredDocumentation ?? {})) {
    if (value === "declared_unknown" || value === "verification_needed") {
      nonBlockingUnknownFields.push(`declaredDocumentation.${key}`);
    }
  }

  return {
    canRoute: missingCriticalFields.length === 0,
    missingCriticalFields,
    nonBlockingUnknownFields
  };
}

export function classifyExporter(
  input: ReadinessInput
): ExporterClassificationResult {
  if (input.exportType === "goods" || input.activityType === "goods") {
    return {
      classification: "exploratory",
      outOfScopeReason: "goods_only"
    };
  }

  if (input.exportsToday) {
    return { classification: "current_exporter" };
  }

  if (hasConcreteFutureExportSignal(input)) {
    return { classification: "future_exporter" };
  }

  return { classification: "exploratory" };
}

function classifyOperationalFit(
  input: ReadinessInput,
  exporter: ExporterClassificationResult,
  missingCriticalFields: string[]
): FitDimension {
  if (missingCriticalFields.length > 0) {
    return {
      level: "unknown",
      reason: "Faltan datos criticos para entender el encaje operativo.",
      evidenceUsed: [],
      missingData: missingCriticalFields
    };
  }

  if (exporter.outOfScopeReason === "goods_only") {
    return {
      level: "low",
      reason: "El MVP no cubre readiness para bienes.",
      evidenceUsed: ["exportType=goods"],
      missingData: []
    };
  }

  if (
    exporter.classification === "current_exporter" &&
    input.exportType === "services_software"
  ) {
    return {
      level: "high",
      reason: "Empresa de servicios/software con exportacion actual declarada.",
      evidenceUsed: ["exportsToday=true", "exportType=services_software"],
      missingData: []
    };
  }

  if (exporter.classification === "future_exporter") {
    return {
      level: "medium",
      reason: "Tiene senales concretas de exportacion futura.",
      evidenceUsed: input.futureExportSignals ?? [],
      missingData: []
    };
  }

  return {
    level: "low",
    reason: "No hay exportacion actual ni plan concreto suficiente.",
    evidenceUsed: ["classification=exploratory"],
    missingData: []
  };
}

function classifyCommercialFit(
  input: ReadinessInput,
  exporter: ExporterClassificationResult,
  missingCriticalFields: string[]
): FitDimension {
  if (missingCriticalFields.length > 0) {
    return {
      level: "unknown",
      reason: "Faltan datos criticos para priorizar comercialmente.",
      evidenceUsed: ["missing_critical_fields"],
      missingData: missingCriticalFields
    };
  }

  if (exporter.outOfScopeReason) {
    return {
      level: "low",
      reason: "El caso no corresponde al alcance comercial del MVP.",
      evidenceUsed: [exporter.outOfScopeReason],
      missingData: []
    };
  }

  if (
    exporter.classification === "current_exporter" &&
    isHighExportRange(input.exportRevenueRange) &&
    input.urgency
  ) {
    return {
      level: "high",
      reason: "Exportacion actual, volumen alto y urgencia explicita.",
      evidenceUsed: [
        `exportRevenueRange=${input.exportRevenueRange}`,
        "urgency=true"
      ],
      missingData: []
    };
  }

  if (
    exporter.classification === "current_exporter" &&
    isMediumOrHighExportRange(input.exportRevenueRange)
  ) {
    return {
      level: "medium",
      reason: "Exportacion actual con volumen suficiente para discovery.",
      evidenceUsed: [`exportRevenueRange=${input.exportRevenueRange}`],
      missingData: []
    };
  }

  if (exporter.classification === "future_exporter") {
    return {
      level: "medium",
      reason: "Hay oportunidad futura, pero todavia no exporta.",
      evidenceUsed: input.futureExportSignals ?? [],
      missingData: []
    };
  }

  return {
    level: "low",
    reason: "Senal comercial insuficiente para avanzar ahora.",
    evidenceUsed: ["classification=exploratory"],
    missingData: []
  };
}

function classifyDocumentationReadiness(input: ReadinessInput): FitDimension {
  const documentation = input.declaredDocumentation ?? {};
  const entries = Object.entries(documentation);

  if (entries.length === 0) {
    return {
      level: "unknown",
      reason: "No hay disponibilidad documental declarada.",
      evidenceUsed: [],
      missingData: ["declaredDocumentation"]
    };
  }

  const availableCount = entries.filter(
    ([, state]) => state === "declared_available" || state === "verified_available"
  ).length;

  if (
    hasDeclaredDocument(input, "exportInvoices") &&
    hasDeclaredDocument(input, "revenueSummary") &&
    hasDeclaredDocument(input, "contracts")
  ) {
    return {
      level: "high",
      reason: "Declara tener las evidencias principales disponibles.",
      evidenceUsed: ["exportInvoices", "revenueSummary", "contracts"],
      missingData: []
    };
  }

  if (availableCount > 0) {
    return {
      level: "medium",
      reason: "Declara tener parte de la evidencia necesaria.",
      evidenceUsed: entries
        .filter(([, state]) => state === "declared_available")
        .map(([key]) => key),
      missingData: entries
        .filter(([, state]) => state === "declared_unavailable")
        .map(([key]) => key)
    };
  }

  return {
    level: "low",
    reason: "No declara evidencia disponible para una revision seria.",
    evidenceUsed: [],
    missingData: entries.map(([key]) => key)
  };
}

function classifyRiskReviewNeeded(input: ReadinessInput): FitDimension {
  const riskSignals = [...(input.riskSignals ?? []), ...(input.inconsistencies ?? [])];

  if (riskSignals.length > 0) {
    return {
      level: "high",
      reason: "Hay complejidad, riesgo o inconsistencias que requieren revision.",
      evidenceUsed: riskSignals,
      missingData: []
    };
  }

  return {
    level: "low",
    reason: "No se detectaron senales de riesgo o inconsistencia.",
    evidenceUsed: ["no_risk_signals"],
    missingData: []
  };
}

function deriveOverallFit({
  missingCriticalFields,
  outOfScopeReason,
  operationalFit,
  commercialFit,
  documentationReadiness,
  riskReviewNeeded
}: {
  missingCriticalFields: string[];
  outOfScopeReason?: "goods_only";
  operationalFit: FitDimension;
  commercialFit: FitDimension;
  documentationReadiness: FitDimension;
  riskReviewNeeded: FitDimension;
}): FitLevel {
  if (missingCriticalFields.length > 0) return "unknown";
  if (outOfScopeReason) return "low";
  if (riskReviewNeeded.level === "high") return "medium";
  if (
    operationalFit.level === "high" &&
    commercialFit.level === "high" &&
    documentationReadiness.level === "high"
  ) {
    return "high";
  }
  if (operationalFit.level === "low" || commercialFit.level === "low") {
    return "low";
  }
  return "medium";
}

function routeNextAction({
  validation,
  exporter,
  input,
  overallFit,
  documentationReadiness,
  riskReviewNeeded
}: {
  validation: CriticalDataValidation;
  exporter: ExporterClassificationResult;
  input: ReadinessInput;
  overallFit: FitLevel;
  documentationReadiness: FitDimension;
  riskReviewNeeded: FitDimension;
}): NextAction {
  if (exporter.outOfScopeReason) return "out_of_scope";
  if (!validation.canRoute) return "request_missing_info";
  if (riskReviewNeeded.level === "high") return "specialist_review";
  if (
    exporter.classification === "current_exporter" &&
    overallFit === "high" &&
    documentationReadiness.level === "high" &&
    input.urgency
  ) {
    return "high_priority_case";
  }
  if (
    exporter.classification === "current_exporter" ||
    exporter.classification === "future_exporter"
  ) {
    return "schedule_discovery";
  }
  return "not_now";
}

export function classifyReadiness(
  input: ReadinessInput
): ReadinessClassification {
  const validation = validateCriticalData(input);
  const exporter = classifyExporter(input);
  const operationalFit = classifyOperationalFit(
    input,
    exporter,
    validation.missingCriticalFields
  );
  const commercialFit = classifyCommercialFit(
    input,
    exporter,
    validation.missingCriticalFields
  );
  const documentationReadiness = classifyDocumentationReadiness(input);
  const riskReviewNeeded = classifyRiskReviewNeeded(input);
  const overallFit = deriveOverallFit({
    missingCriticalFields: validation.missingCriticalFields,
    outOfScopeReason: exporter.outOfScopeReason,
    operationalFit,
    commercialFit,
    documentationReadiness,
    riskReviewNeeded
  });
  const nextAction = routeNextAction({
    validation,
    exporter,
    input,
    overallFit,
    documentationReadiness,
    riskReviewNeeded
  });

  return {
    nextAction,
    overallFit,
    exporterClassification: exporter.classification,
    fitDimensions: {
      operationalFit,
      commercialFit,
      documentationReadiness,
      riskReviewNeeded
    },
    missingCriticalFields: validation.missingCriticalFields,
    nonBlockingUnknownFields: validation.nonBlockingUnknownFields,
    outOfScopeReason: exporter.outOfScopeReason
  };
}

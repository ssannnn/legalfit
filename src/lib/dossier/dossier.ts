import { classifyReadiness, type ReadinessInput } from "../routing/readiness";
import {
  applyRulebook,
  zfServicesArV010Rulebook,
  type AppliedRuleResult
} from "../rulebook/rulebook";

type DossierChecklistItem = {
  label: string;
  sourceRuleId?: string;
};

export type UserSummary = {
  companyName: string | null;
  contactName: string | null;
  contactEmail: string | null;
  declaredActivityType: string | null;
  declaredExportType: string | null;
  exportRevenueRange: string | null;
  countries: string[];
  missingData: string[];
  checklist: string[];
  disclaimer: string;
};

export type AndenDossier = {
  company: {
    name: string | null;
    contactName: string | null;
    contactRole: string | null;
    contactEmail: string | null;
  };
  exportProfile: {
    activityType: string | null;
    exportType: string | null;
    exporterClassification: string;
    exportRevenueRange: string | null;
    countries: string[];
    billing: string | null;
    collection: string | null;
    recurringRevenue: boolean | null;
  };
  consentState: {
    processing: boolean;
    handoff: boolean;
    contact: boolean;
  };
  nextAction: string;
  overallFit: string;
  fitDimensions: ReturnType<typeof classifyReadiness>["fitDimensions"];
  missingCriticalFields: string[];
  nonBlockingUnknownFields: string[];
  inconsistencies: string[];
  riskSignals: string[];
  declaredDocumentation: ReadinessInput["declaredDocumentation"];
  ruleResults: AppliedRuleResult[];
  sourceReferences: Array<{
    ruleId: string;
    sourceLabel: string;
    sourceUrl: string;
  }>;
};

export type DossierBuildResult = {
  userSummary: UserSummary;
  andenDossier: AndenDossier;
  record: {
    rulebookVersion: string;
    generatedAt: string;
    userSummary: UserSummary;
    andenDossier: AndenDossier;
  };
};

function unique(values: string[]) {
  return Array.from(new Set(values));
}

function checklistFromRuleResults(ruleResults: AppliedRuleResult[]) {
  const items: DossierChecklistItem[] = [];

  for (const result of ruleResults) {
    for (const label of result.effect.checklistItems ?? []) {
      items.push({ label, sourceRuleId: result.ruleId });
    }
  }

  return unique(items.map((item) => item.label));
}

export function buildDossier(
  confirmedProfile: ReadinessInput,
  generatedAt = new Date().toISOString()
): DossierBuildResult {
  const readiness = classifyReadiness(confirmedProfile);
  const ruleResults = applyRulebook(zfServicesArV010Rulebook, confirmedProfile);
  const checklist = checklistFromRuleResults(ruleResults);
  const missingData = unique([
    ...readiness.missingCriticalFields,
    ...readiness.nonBlockingUnknownFields,
    ...ruleResults.flatMap((result) => result.missingData)
  ]);

  const userSummary: UserSummary = {
    companyName: confirmedProfile.companyName ?? null,
    contactName: confirmedProfile.contactName ?? null,
    contactEmail: confirmedProfile.contactEmail ?? null,
    declaredActivityType: confirmedProfile.activityType ?? null,
    declaredExportType: confirmedProfile.exportType ?? null,
    exportRevenueRange: confirmedProfile.exportRevenueRange ?? null,
    countries: confirmedProfile.countries ?? [],
    missingData,
    checklist,
    disclaimer:
      "Este resumen ordena informacion declarada y no constituye asesoramiento legal, fiscal ni contable."
  };

  const andenDossier: AndenDossier = {
    company: {
      name: confirmedProfile.companyName ?? null,
      contactName: confirmedProfile.contactName ?? null,
      contactRole: confirmedProfile.contactRole ?? null,
      contactEmail: confirmedProfile.contactEmail ?? null
    },
    exportProfile: {
      activityType: confirmedProfile.activityType ?? null,
      exportType: confirmedProfile.exportType ?? null,
      exporterClassification: readiness.exporterClassification,
      exportRevenueRange: confirmedProfile.exportRevenueRange ?? null,
      countries: confirmedProfile.countries ?? [],
      billing: confirmedProfile.billing ?? null,
      collection: confirmedProfile.collection ?? null,
      recurringRevenue: confirmedProfile.recurringRevenue ?? null
    },
    consentState: {
      processing: Boolean(confirmedProfile.consents?.processing),
      handoff: Boolean(confirmedProfile.consents?.handoff),
      contact: Boolean(confirmedProfile.consents?.contact)
    },
    nextAction: readiness.nextAction,
    overallFit: readiness.overallFit,
    fitDimensions: readiness.fitDimensions,
    missingCriticalFields: readiness.missingCriticalFields,
    nonBlockingUnknownFields: readiness.nonBlockingUnknownFields,
    inconsistencies: confirmedProfile.inconsistencies ?? [],
    riskSignals: confirmedProfile.riskSignals ?? [],
    declaredDocumentation: confirmedProfile.declaredDocumentation ?? {},
    ruleResults,
    sourceReferences: ruleResults.map((result) => ({
      ruleId: result.ruleId,
      sourceLabel: result.sourceLabel,
      sourceUrl: result.sourceUrl
    }))
  };

  return {
    userSummary,
    andenDossier,
    record: {
      rulebookVersion: zfServicesArV010Rulebook.version,
      generatedAt,
      userSummary,
      andenDossier
    }
  };
}

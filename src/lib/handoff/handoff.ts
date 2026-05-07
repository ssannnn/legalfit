import {
  buildDossier,
  type DossierBuildResult
} from "../dossier/dossier";
import { classifyReadiness, type ReadinessInput } from "../routing/readiness";

type LeadCasePatch = {
  lifecycleState: string;
  commercialState: string | null;
  nextAction: string | null;
  overallFit: string | null;
  exporterClassification: string | null;
  exportType: string | null;
  companyName: string | null;
  contactName: string | null;
  contactEmail: string | null;
  handoffConsent: boolean;
  contactConsent: boolean;
};

export type NewLeadNotification = {
  leadCaseId: string;
  companyName: string;
  contactEmail: string;
  nextAction: string;
  overallFit: string;
  leadInboxUrl: string;
};

export type HandoffPlan = {
  status: "ready_for_anden" | "not_actionable";
  leadCaseId: string;
  profile: ReadinessInput;
  leadCasePatch: LeadCasePatch;
  dossier: DossierBuildResult | null;
  notification: NewLeadNotification | null;
  idempotencyKeys: {
    dossier: string;
    notification: string;
  };
};

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

function isActionableNextAction(nextAction: string) {
  return !["request_missing_info", "out_of_scope"].includes(nextAction);
}

function hasHandoffConsent(profile: ReadinessInput) {
  return Boolean(
    profile.consents?.processing &&
      profile.consents?.handoff &&
      profile.consents?.contact
  );
}

function baseLeadCasePatch(profile: ReadinessInput): Omit<
  LeadCasePatch,
  | "lifecycleState"
  | "commercialState"
  | "nextAction"
  | "overallFit"
  | "exporterClassification"
> {
  return {
    exportType: profile.exportType ?? null,
    companyName: profile.companyName ?? null,
    contactName: profile.contactName ?? null,
    contactEmail: profile.contactEmail ?? null,
    handoffConsent: Boolean(profile.consents?.handoff),
    contactConsent: Boolean(profile.consents?.contact)
  };
}

export function createHandoffPlan({
  leadCaseId,
  profile,
  siteUrl,
  generatedAt = new Date().toISOString()
}: {
  leadCaseId: string;
  profile: ReadinessInput;
  siteUrl: string;
  generatedAt?: string;
}): HandoffPlan {
  const readiness = classifyReadiness(profile);
  const actionable =
    hasHandoffConsent(profile) &&
    readiness.missingCriticalFields.length === 0 &&
    isActionableNextAction(readiness.nextAction);
  const leadInboxUrl = `${trimTrailingSlash(siteUrl)}/lead-inbox/${leadCaseId}`;
  const commonPatch = baseLeadCasePatch(profile);

  if (!actionable) {
    return {
      status: "not_actionable",
      leadCaseId,
      profile,
      leadCasePatch: {
        ...commonPatch,
        lifecycleState:
          readiness.nextAction === "out_of_scope"
            ? "out_of_scope"
            : "collecting_info",
        commercialState: null,
        nextAction: readiness.nextAction,
        overallFit: readiness.overallFit,
        exporterClassification: readiness.exporterClassification
      },
      dossier: null,
      notification: null,
      idempotencyKeys: {
        dossier: `dossier:${leadCaseId}:${readiness.nextAction}`,
        notification: `notification:new_actionable_lead:${leadCaseId}`
      }
    };
  }

  const dossier = buildDossier(profile, generatedAt);

  return {
    status: "ready_for_anden",
    leadCaseId,
    profile,
    leadCasePatch: {
      ...commonPatch,
      lifecycleState: "ready_for_anden",
      commercialState: "new",
      nextAction: dossier.andenDossier.nextAction,
      overallFit: dossier.andenDossier.overallFit,
      exporterClassification: dossier.andenDossier.exportProfile.exporterClassification
    },
    dossier,
    notification: {
      leadCaseId,
      companyName: profile.companyName ?? "Empresa sin nombre",
      contactEmail: profile.contactEmail ?? "",
      nextAction: dossier.andenDossier.nextAction,
      overallFit: dossier.andenDossier.overallFit,
      leadInboxUrl
    },
    idempotencyKeys: {
      dossier: `dossier:${leadCaseId}:${dossier.record.rulebookVersion}`,
      notification: `notification:new_actionable_lead:${leadCaseId}`
    }
  };
}

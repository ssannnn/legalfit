export type ExpirableLeadCase = {
  id: string;
  lifecycleState: string;
  lastActivityAt: string | null;
  expiresAt: string | null;
};

export type DuplicateCandidate = {
  id: string;
  companyName: string | null;
  contactEmail: string | null;
  telegramUserId: number | null;
  cuit?: string | null;
};

export type DuplicateDetectionResult = {
  possibleDuplicate: boolean;
  blocked: false;
  signals: {
    contactEmail?: string[];
    telegramUserId?: string[];
    cuit?: string[];
    similarCompanyName?: string[];
  };
};

const incompleteLifecycleStates = new Set([
  "intake_started",
  "collecting_info",
  "awaiting_confirmation",
  "awaiting_consent"
]);

function addDays(isoDate: string, days: number) {
  const date = new Date(isoDate);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString();
}

function normalizeEmail(value: string | null | undefined) {
  return value?.trim().toLowerCase() || null;
}

function normalizeCuit(value: string | null | undefined) {
  const digits = value?.replace(/\D/g, "") ?? "";
  return digits.length > 0 ? digits : null;
}

function normalizeCompanyName(value: string | null | undefined) {
  return (
    value
      ?.toLowerCase()
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .replace(/\b(srl|sa|sas|llc|inc)\b/g, "")
      .replace(/[^a-z0-9]+/g, " ")
      .trim() || null
  );
}

function tokenSimilarity(a: string, b: string) {
  const aTokens = new Set(a.split(/\s+/).filter(Boolean));
  const bTokens = new Set(b.split(/\s+/).filter(Boolean));
  const intersection = [...aTokens].filter((token) => bTokens.has(token)).length;
  const union = new Set([...aTokens, ...bTokens]).size;

  return union === 0 ? 0 : intersection / union;
}

export function computeIntakeExpiresAt(lastActivityAt: string, days = 14) {
  return addDays(lastActivityAt, days);
}

export function computeRetentionDeleteAfter(createdAt: string, days = 180) {
  return addDays(createdAt, days);
}

export function expireIncompleteCase({
  leadCase,
  now
}: {
  leadCase: ExpirableLeadCase;
  now: string;
}) {
  if (!incompleteLifecycleStates.has(leadCase.lifecycleState)) {
    return null;
  }

  const expiresAt =
    leadCase.expiresAt ??
    (leadCase.lastActivityAt
      ? computeIntakeExpiresAt(leadCase.lastActivityAt)
      : null);

  if (!expiresAt || new Date(expiresAt) > new Date(now)) {
    return null;
  }

  return {
    lifecycleState: "expired",
    nextAction: "request_missing_info"
  };
}

export function detectDuplicateSignals(
  candidate: DuplicateCandidate,
  existingCases: DuplicateCandidate[]
): DuplicateDetectionResult {
  const signals: DuplicateDetectionResult["signals"] = {};
  const candidateEmail = normalizeEmail(candidate.contactEmail);
  const candidateCuit = normalizeCuit(candidate.cuit);
  const candidateCompany = normalizeCompanyName(candidate.companyName);

  for (const existing of existingCases) {
    if (existing.id === candidate.id) continue;

    if (
      candidateEmail &&
      candidateEmail === normalizeEmail(existing.contactEmail)
    ) {
      signals.contactEmail = [...(signals.contactEmail ?? []), existing.id];
    }

    if (
      candidate.telegramUserId &&
      candidate.telegramUserId === existing.telegramUserId
    ) {
      signals.telegramUserId = [
        ...(signals.telegramUserId ?? []),
        existing.id
      ];
    }

    if (candidateCuit && candidateCuit === normalizeCuit(existing.cuit)) {
      signals.cuit = [...(signals.cuit ?? []), existing.id];
    }

    const existingCompany = normalizeCompanyName(existing.companyName);
    if (
      candidateCompany &&
      existingCompany &&
      (candidateCompany.includes(existingCompany) ||
        existingCompany.includes(candidateCompany) ||
        tokenSimilarity(candidateCompany, existingCompany) >= 0.75)
    ) {
      signals.similarCompanyName = [
        ...(signals.similarCompanyName ?? []),
        existing.id
      ];
    }
  }

  return {
    possibleDuplicate: Object.keys(signals).length > 0,
    blocked: false,
    signals
  };
}

export function completionMetrics({
  createdAt,
  completedAt,
  dossierGeneratedAt
}: {
  createdAt: string;
  completedAt: string | null;
  dossierGeneratedAt: string | null;
}) {
  const createdTime = new Date(createdAt).getTime();
  const completedTime = completedAt ? new Date(completedAt).getTime() : null;
  const dossierTime = dossierGeneratedAt
    ? new Date(dossierGeneratedAt).getTime()
    : null;

  return {
    completed: Boolean(completedAt),
    timeToCompletionMinutes:
      completedTime === null
        ? null
        : Math.round((completedTime - createdTime) / 60000),
    timeToDossierMinutes:
      dossierTime === null ? null : Math.round((dossierTime - createdTime) / 60000)
  };
}

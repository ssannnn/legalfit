export type LeadInboxAccessReason = "allowed" | "no_session" | "not_operator";

export type LeadInboxAccess =
  | {
      allowed: true;
      reason: "allowed";
      email: string;
    }
  | {
      allowed: false;
      reason: "no_session";
    }
  | {
      allowed: false;
      reason: "not_operator";
      email: string;
    };

export type LeadInboxAccessDependencies = {
  getCurrentUserEmail: () => Promise<string | null>;
  isActiveOperator: (email: string) => Promise<boolean>;
};

export async function getLeadInboxAccess({
  getCurrentUserEmail,
  isActiveOperator
}: LeadInboxAccessDependencies): Promise<LeadInboxAccess> {
  const email = await getCurrentUserEmail();

  if (!email) {
    return { allowed: false, reason: "no_session" };
  }

  const activeOperator = await isActiveOperator(email);

  if (!activeOperator) {
    return { allowed: false, reason: "not_operator", email };
  }

  return { allowed: true, reason: "allowed", email };
}

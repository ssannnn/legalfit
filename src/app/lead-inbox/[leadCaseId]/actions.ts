"use server";

import { revalidatePath } from "next/cache";

import { getLeadInboxAccess } from "../../../lib/auth/access";
import {
  createServerSupabaseClient,
  createServiceSupabaseClient,
  getCurrentUserEmail,
  isActiveOperator
} from "../../../lib/supabase/server";

const commercialStates = new Set([
  "new",
  "contacted",
  "qualified",
  "lost",
  "not_now"
]);

async function requireOperator() {
  const authSupabase = await createServerSupabaseClient();
  const access = await getLeadInboxAccess({
    getCurrentUserEmail: () => getCurrentUserEmail(authSupabase),
    isActiveOperator: (email) => isActiveOperator(authSupabase, email)
  });

  if (!access.allowed) {
    throw new Error("Operator access required");
  }

  const serviceSupabase = createServiceSupabaseClient();
  const { data: operator, error } = await serviceSupabase
    .from("anden_operators")
    .select("id")
    .eq("email", access.email)
    .eq("active", true)
    .maybeSingle();

  if (error) throw error;
  if (!operator) throw new Error("Active operator not found");

  return {
    supabase: serviceSupabase,
    operatorId: operator.id as string
  };
}

function requireLeadCaseId(formData: FormData) {
  const leadCaseId = String(formData.get("leadCaseId") ?? "");
  if (!leadCaseId) throw new Error("Missing lead case id");
  return leadCaseId;
}

export async function assignLeadCase(formData: FormData) {
  const leadCaseId = requireLeadCaseId(formData);
  const assignedOperatorId = String(formData.get("operatorId") ?? "") || null;
  const { supabase } = await requireOperator();

  const { error } = await supabase
    .from("lead_cases")
    .update({ assigned_operator_id: assignedOperatorId })
    .eq("id", leadCaseId);

  if (error) throw error;

  revalidatePath("/lead-inbox");
  revalidatePath(`/lead-inbox/${leadCaseId}`);
}

export async function updateCommercialState(formData: FormData) {
  const leadCaseId = requireLeadCaseId(formData);
  const commercialState = String(formData.get("commercialState") ?? "");

  if (!commercialStates.has(commercialState)) {
    throw new Error("Invalid commercial state");
  }

  const { supabase } = await requireOperator();
  const { error } = await supabase
    .from("lead_cases")
    .update({ commercial_state: commercialState })
    .eq("id", leadCaseId);

  if (error) throw error;

  revalidatePath("/lead-inbox");
  revalidatePath(`/lead-inbox/${leadCaseId}`);
}

export async function addLeadNote(formData: FormData) {
  const leadCaseId = requireLeadCaseId(formData);
  const body = String(formData.get("body") ?? "").trim();

  if (!body) return;

  const { supabase, operatorId } = await requireOperator();
  const { error } = await supabase.from("lead_notes").insert({
    lead_case_id: leadCaseId,
    operator_id: operatorId,
    body
  });

  if (error) throw error;

  revalidatePath(`/lead-inbox/${leadCaseId}`);
}

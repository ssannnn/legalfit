import type { SupabaseClient } from "@supabase/supabase-js";

export type LeadInboxItem = {
  id: string;
  companyName: string;
  contactName: string | null;
  contactEmail: string | null;
  lifecycleState: string;
  commercialState: string | null;
  nextAction: string | null;
  overallFit: string | null;
  exporterClassification: string | null;
  exportType: string | null;
  createdAt: string;
};

export type LeadCaseDetail = LeadInboxItem & {
  profileData: Record<string, unknown> | null;
  userSummary: Record<string, unknown> | null;
  andenDossier: Record<string, unknown> | null;
};

type LeadCaseRow = {
  id: string;
  company_name: string | null;
  contact_name: string | null;
  contact_email: string | null;
  lifecycle_state: string;
  commercial_state: string | null;
  next_action: string | null;
  overall_fit: string | null;
  exporter_classification: string | null;
  export_type: string | null;
  created_at: string;
};

type JsonRecord = Record<string, unknown>;

export function mapLeadCaseRow(row: LeadCaseRow): LeadInboxItem {
  return {
    id: row.id,
    companyName: row.company_name ?? "Empresa sin nombre",
    contactName: row.contact_name,
    contactEmail: row.contact_email,
    lifecycleState: row.lifecycle_state,
    commercialState: row.commercial_state,
    nextAction: row.next_action,
    overallFit: row.overall_fit,
    exporterClassification: row.exporter_classification,
    exportType: row.export_type,
    createdAt: row.created_at
  };
}

export async function listLeadInboxItems(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("lead_cases")
    .select(
      [
        "id",
        "company_name",
        "contact_name",
        "contact_email",
        "lifecycle_state",
        "commercial_state",
        "next_action",
        "overall_fit",
        "exporter_classification",
        "export_type",
        "created_at"
      ].join(",")
    )
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return ((data ?? []) as unknown as LeadCaseRow[]).map((row) =>
    mapLeadCaseRow(row)
  );
}

export async function getLeadCaseDetail(
  supabase: SupabaseClient,
  leadCaseId: string
): Promise<LeadCaseDetail | null> {
  const { data: leadCase, error: leadCaseError } = await supabase
    .from("lead_cases")
    .select(
      [
        "id",
        "company_name",
        "contact_name",
        "contact_email",
        "lifecycle_state",
        "commercial_state",
        "next_action",
        "overall_fit",
        "exporter_classification",
        "export_type",
        "created_at"
      ].join(",")
    )
    .eq("id", leadCaseId)
    .maybeSingle();

  if (leadCaseError) {
    throw leadCaseError;
  }

  if (!leadCase) {
    return null;
  }

  const [{ data: profile }, { data: dossier }] = await Promise.all([
    supabase
      .from("company_profiles")
      .select("profile_data")
      .eq("lead_case_id", leadCaseId)
      .maybeSingle(),
    supabase
      .from("dossiers")
      .select("user_summary, anden_dossier")
      .eq("lead_case_id", leadCaseId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
  ]);

  return {
    ...mapLeadCaseRow(leadCase as unknown as LeadCaseRow),
    profileData: (profile?.profile_data as JsonRecord | undefined) ?? null,
    userSummary: (dossier?.user_summary as JsonRecord | undefined) ?? null,
    andenDossier: (dossier?.anden_dossier as JsonRecord | undefined) ?? null
  };
}

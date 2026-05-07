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
  assignedOperatorId: string | null;
  possibleDuplicate: boolean;
  duplicateSignals: Record<string, unknown>;
  createdAt: string;
};

export type LeadCaseDetail = LeadInboxItem & {
  profileData: Record<string, unknown> | null;
  userSummary: Record<string, unknown> | null;
  andenDossier: Record<string, unknown> | null;
  messages: IntakeMessage[];
  notes: LeadNote[];
};

export type LeadInboxFilters = {
  nextAction?: string | null;
  overallFit?: string | null;
  commercialState?: string | null;
  assignee?: string | null;
  possibleDuplicate?: "true" | "false" | null;
};

export type AndenOperator = {
  id: string;
  email: string;
  name: string;
};

export type IntakeMessage = {
  id: string;
  direction: string;
  messageType: string;
  text: string | null;
  transcript: string | null;
  createdAt: string;
};

export type LeadNote = {
  id: string;
  operatorId: string | null;
  body: string;
  createdAt: string;
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
  assigned_operator_id: string | null;
  possible_duplicate: boolean;
  duplicate_signals: Record<string, unknown>;
  created_at: string;
};

type JsonRecord = Record<string, unknown>;

export function isActiveLeadInboxItem({
  lifecycleState,
  nextAction
}: {
  lifecycleState: string;
  nextAction: string | null;
}) {
  return (
    lifecycleState === "ready_for_anden" &&
    nextAction !== "request_missing_info" &&
    nextAction !== "out_of_scope"
  );
}

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
    assignedOperatorId: row.assigned_operator_id,
    possibleDuplicate: row.possible_duplicate,
    duplicateSignals: row.duplicate_signals,
    createdAt: row.created_at
  };
}

export function filterLeadInboxItems(
  items: LeadInboxItem[],
  filters: LeadInboxFilters
) {
  return items.filter((item) => {
    if (filters.nextAction && item.nextAction !== filters.nextAction) return false;
    if (filters.overallFit && item.overallFit !== filters.overallFit) return false;
    if (
      filters.commercialState &&
      item.commercialState !== filters.commercialState
    ) {
      return false;
    }
    if (filters.assignee === "unassigned" && item.assignedOperatorId) {
      return false;
    }
    if (
      filters.assignee &&
      filters.assignee !== "unassigned" &&
      item.assignedOperatorId !== filters.assignee
    ) {
      return false;
    }
    if (
      filters.possibleDuplicate === "true" &&
      item.possibleDuplicate !== true
    ) {
      return false;
    }
    if (
      filters.possibleDuplicate === "false" &&
      item.possibleDuplicate !== false
    ) {
      return false;
    }
    return true;
  });
}

function mapIntakeMessage(row: {
  id: string;
  direction: string;
  message_type: string;
  text: string | null;
  transcript: string | null;
  created_at: string;
}): IntakeMessage {
  return {
    id: row.id,
    direction: row.direction,
    messageType: row.message_type,
    text: row.text,
    transcript: row.transcript,
    createdAt: row.created_at
  };
}

function mapLeadNote(row: {
  id: string;
  operator_id: string | null;
  body: string;
  created_at: string;
}): LeadNote {
  return {
    id: row.id,
    operatorId: row.operator_id,
    body: row.body,
    createdAt: row.created_at
  };
}

export async function listLeadInboxItems(
  supabase: SupabaseClient,
  filters: LeadInboxFilters = {}
) {
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
        "assigned_operator_id",
        "possible_duplicate",
        "duplicate_signals",
        "created_at"
      ].join(",")
    )
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  const items = ((data ?? []) as unknown as LeadCaseRow[])
    .map((row) => mapLeadCaseRow(row))
    .filter((lead) => isActiveLeadInboxItem(lead));

  return filterLeadInboxItems(items, filters);
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
        "assigned_operator_id",
        "possible_duplicate",
        "duplicate_signals",
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

  const [{ data: profile }, { data: dossier }, { data: messages }, { data: notes }] =
    await Promise.all([
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
      .maybeSingle(),
    supabase
      .from("intake_messages")
      .select("id, direction, message_type, text, transcript, created_at")
      .eq("lead_case_id", leadCaseId)
      .order("created_at", { ascending: true }),
    supabase
      .from("lead_notes")
      .select("id, operator_id, body, created_at")
      .eq("lead_case_id", leadCaseId)
      .order("created_at", { ascending: false })
  ]);

  return {
    ...mapLeadCaseRow(leadCase as unknown as LeadCaseRow),
    profileData: (profile?.profile_data as JsonRecord | undefined) ?? null,
    userSummary: (dossier?.user_summary as JsonRecord | undefined) ?? null,
    andenDossier: (dossier?.anden_dossier as JsonRecord | undefined) ?? null,
    messages: ((messages ?? []) as Array<Parameters<typeof mapIntakeMessage>[0]>).map(
      mapIntakeMessage
    ),
    notes: ((notes ?? []) as Array<Parameters<typeof mapLeadNote>[0]>).map(
      mapLeadNote
    )
  };
}

export async function listAndenOperators(
  supabase: SupabaseClient
): Promise<AndenOperator[]> {
  const { data, error } = await supabase
    .from("anden_operators")
    .select("id, email, name")
    .eq("active", true)
    .order("name", { ascending: true });

  if (error) throw error;

  return ((data ?? []) as AndenOperator[]).map((operator) => ({
    id: operator.id,
    email: operator.email,
    name: operator.name
  }));
}

import { NextResponse, type NextRequest } from "next/server";

import { createHandoffPlan, type HandoffPlan } from "../../../../lib/handoff/handoff";
import { sendNewLeadNotification } from "../../../../lib/notifications/email";
import type { ReadinessInput } from "../../../../lib/routing/readiness";
import { handleTextIntake, type IntakeSessionSnapshot } from "../../../../lib/telegram/intake";
import { createServiceSupabaseClient } from "../../../../lib/supabase/server";

type TelegramUpdate = {
  update_id: number;
  message?: {
    message_id: number;
    chat: { id: number };
    from?: { id: number; username?: string };
    text?: string;
  };
};

async function sendTelegramMessage(chatId: number, text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return;

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text })
  });
}

function lifecycleForState(state: IntakeSessionSnapshot["state"]) {
  if (state === "awaiting_processing_consent" || state === "intake_started") {
    return "intake_started";
  }
  if (
    state === "collecting_case_description" ||
    state === "collecting_missing_info" ||
    state === "collecting_contact" ||
    state === "collecting_signals" ||
    state === "collecting_documentation"
  ) {
    return "collecting_info";
  }
  if (state === "awaiting_confirmation") return "awaiting_confirmation";
  if (state === "awaiting_handoff_consent") return "awaiting_consent";
  if (state === "confirmed_profile") return "generating_dossier";
  if (state === "closed_no_handoff") return "closed_no_handoff";
  if (state === "out_of_scope" || state === "awaiting_minimal_capture_consent") {
    return "out_of_scope";
  }
  return "collecting_info";
}

function leadCaseUpdateFromResult(
  result: ReturnType<typeof handleTextIntake>
): Record<string, unknown> {
  const patch = result.leadCasePatch ?? {};
  const update: Record<string, unknown> = {
    lifecycle_state:
      patch.lifecycleState ?? lifecycleForState(result.sessionPatch.state),
    processing_consent: Boolean(patch.processingConsent),
    handoff_consent: Boolean(patch.handoffConsent),
    contact_consent: Boolean(patch.contactConsent),
    last_activity_at: new Date().toISOString()
  };

  if (patch.companyName !== undefined) update.company_name = patch.companyName;
  if (patch.contactName !== undefined) update.contact_name = patch.contactName;
  if (patch.contactEmail !== undefined) update.contact_email = patch.contactEmail;
  if (patch.nextAction !== undefined) update.next_action = patch.nextAction;
  if (patch.overallFit !== undefined) update.overall_fit = patch.overallFit;
  if (patch.exportType !== undefined) update.export_type = patch.exportType;

  return update;
}

function leadCaseUpdateFromHandoffPlan(plan: HandoffPlan) {
  return {
    lifecycle_state: plan.leadCasePatch.lifecycleState,
    commercial_state: plan.leadCasePatch.commercialState,
    next_action: plan.leadCasePatch.nextAction,
    overall_fit: plan.leadCasePatch.overallFit,
    exporter_classification: plan.leadCasePatch.exporterClassification,
    export_type: plan.leadCasePatch.exportType,
    company_name: plan.leadCasePatch.companyName,
    contact_name: plan.leadCasePatch.contactName,
    contact_email: plan.leadCasePatch.contactEmail,
    handoff_consent: plan.leadCasePatch.handoffConsent,
    contact_consent: plan.leadCasePatch.contactConsent,
    last_activity_at: new Date().toISOString()
  };
}

async function persistHandoffPlan({
  supabase,
  plan
}: {
  supabase: ReturnType<typeof createServiceSupabaseClient>;
  plan: HandoffPlan;
}) {
  await supabase
    .from("lead_cases")
    .update(leadCaseUpdateFromHandoffPlan(plan))
    .eq("id", plan.leadCaseId);

  if (plan.status !== "ready_for_anden" || !plan.dossier || !plan.notification) {
    return;
  }

  const { data: existingProfile } = await supabase
    .from("company_profiles")
    .select("id")
    .eq("lead_case_id", plan.leadCaseId)
    .maybeSingle();

  let profileId = existingProfile?.id as string | undefined;

  if (!profileId) {
    const { data: profile, error: profileError } = await supabase
      .from("company_profiles")
      .insert({
        lead_case_id: plan.leadCaseId,
        profile_data: plan.profile,
        confirmed_at: plan.dossier.record.generatedAt
      })
      .select("id")
      .single();

    if (profileError) throw profileError;
    profileId = profile.id as string;
  }

  const { data: existingDossier } = await supabase
    .from("dossiers")
    .select("id")
    .eq("lead_case_id", plan.leadCaseId)
    .eq("rulebook_version", plan.dossier.record.rulebookVersion)
    .maybeSingle();

  if (!existingDossier) {
    const { error: dossierError } = await supabase.from("dossiers").insert({
      lead_case_id: plan.leadCaseId,
      rulebook_version: plan.dossier.record.rulebookVersion,
      user_summary: plan.dossier.record.userSummary,
      anden_dossier: plan.dossier.record.andenDossier,
      generated_from_profile_id: profileId,
      generated_at: plan.dossier.record.generatedAt
    });

    if (dossierError) throw dossierError;
  }

  const { data: existingNotificationJob } = await supabase
    .from("jobs")
    .select("id")
    .eq("idempotency_key", plan.idempotencyKeys.notification)
    .maybeSingle();

  if (existingNotificationJob) return;

  const { data: notificationJob, error: notificationJobError } = await supabase
    .from("jobs")
    .insert({
      job_type: "notification",
      status: "processing",
      payload: plan.notification,
      idempotency_key: plan.idempotencyKeys.notification
    })
    .select("id")
    .single();

  if (notificationJobError) throw notificationJobError;

  const sendResult = await sendNewLeadNotification({
    payload: plan.notification
  });

  await supabase
    .from("jobs")
    .update({
      status: sendResult.status === "sent" ? "succeeded" : "queued",
      payload: {
        ...plan.notification,
        sendResult
      }
    })
    .eq("id", notificationJob.id);
}

export async function POST(request: NextRequest) {
  const update = (await request.json()) as TelegramUpdate;
  const message = update.message;

  if (!message?.text) {
    return NextResponse.json({ ok: true, skipped: "non_text" });
  }

  const supabase = createServiceSupabaseClient();
  const { data: existingByUpdate } = await supabase
    .from("intake_messages")
    .select("id")
    .eq("telegram_update_id", update.update_id)
    .maybeSingle();

  const { data: existingByMessage } = await supabase
    .from("intake_messages")
    .select("id")
    .eq("telegram_chat_id", message.chat.id)
    .eq("telegram_message_id", message.message_id)
    .maybeSingle();

  if (existingByUpdate || existingByMessage) {
    return NextResponse.json({ ok: true, duplicate: true });
  }

  const { data: sessionRow } = await supabase
    .from("intake_sessions")
    .select("id, lead_case_id, state, current_step, extracted_fields")
    .eq("telegram_chat_id", message.chat.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let leadCaseId = sessionRow?.lead_case_id as string | undefined;
  let intakeSessionId = sessionRow?.id as string | undefined;

  if (!leadCaseId || !intakeSessionId || message.text.trim() === "/start") {
    const { data: leadCase, error: leadCaseError } = await supabase
      .from("lead_cases")
      .insert({
        lifecycle_state: "intake_started",
        telegram_user_id: message.from?.id ?? null,
        telegram_username: message.from?.username ?? null,
        last_activity_at: new Date().toISOString()
      })
      .select("id")
      .single();

    if (leadCaseError) throw leadCaseError;
    leadCaseId = leadCase.id as string;

    const { data: intakeSession, error: sessionError } = await supabase
      .from("intake_sessions")
      .insert({
        lead_case_id: leadCaseId,
        telegram_chat_id: message.chat.id,
        telegram_user_id: message.from?.id ?? null,
        state: "intake_started",
        current_step: "start",
        extracted_fields: {}
      })
      .select("id, state, current_step, extracted_fields")
      .single();

    if (sessionError) throw sessionError;
    intakeSessionId = intakeSession.id as string;
  }

  const snapshot: IntakeSessionSnapshot | null = sessionRow
    ? {
        state: sessionRow.state as IntakeSessionSnapshot["state"],
        currentStep: (sessionRow.current_step as string | null) ?? "start",
        extractedFields:
          (sessionRow.extracted_fields as IntakeSessionSnapshot["extractedFields"]) ?? {}
      }
    : null;
  const result = handleTextIntake({ session: snapshot, text: message.text });

  await supabase.from("intake_messages").insert({
    intake_session_id: intakeSessionId,
    lead_case_id: leadCaseId,
    telegram_update_id: update.update_id,
    telegram_chat_id: message.chat.id,
    telegram_message_id: message.message_id,
    direction: "inbound",
    message_type: "text",
    text: message.text,
    metadata: { telegram_chat_id: message.chat.id }
  });

  await supabase
    .from("intake_sessions")
    .update({
      state: result.sessionPatch.state,
      current_step: result.sessionPatch.currentStep,
      extracted_fields: result.sessionPatch.extractedFields,
      missing_critical_fields: result.missingCriticalFields,
      last_user_message_at: new Date().toISOString()
    })
    .eq("id", intakeSessionId);

  await supabase
    .from("lead_cases")
    .update(leadCaseUpdateFromResult(result))
    .eq("id", leadCaseId);

  if (result.sessionPatch.state === "confirmed_profile") {
    const plan = createHandoffPlan({
      leadCaseId,
      profile: result.sessionPatch.extractedFields as ReadinessInput,
      siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin
    });

    await persistHandoffPlan({ supabase, plan });
  }

  if (result.replies.length > 0) {
    await supabase.from("intake_messages").insert(
      result.replies.map((reply) => ({
        intake_session_id: intakeSessionId,
        lead_case_id: leadCaseId,
        telegram_chat_id: message.chat.id,
        direction: "outbound",
        message_type: "text",
        text: reply,
        metadata: { telegram_chat_id: message.chat.id }
      }))
    );
  }

  await Promise.all(
    result.replies.map((reply) => sendTelegramMessage(message.chat.id, reply))
  );

  return NextResponse.json({ ok: true, replies: result.replies });
}

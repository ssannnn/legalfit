import { NextResponse, type NextRequest } from "next/server";

import { handleTextIntake, type IntakeSessionSnapshot } from "../../../../lib/telegram/intake";
import { createServerSupabaseClient } from "../../../../lib/supabase/server";

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

export async function POST(request: NextRequest) {
  const update = (await request.json()) as TelegramUpdate;
  const message = update.message;

  if (!message?.text) {
    return NextResponse.json({ ok: true, skipped: "non_text" });
  }

  const supabase = await createServerSupabaseClient();
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

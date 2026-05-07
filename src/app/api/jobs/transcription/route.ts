import { NextResponse, type NextRequest } from "next/server";

import { createServiceSupabaseClient } from "../../../../lib/supabase/server";
import {
  applyTranscriptionFailure,
  applyTranscriptionSuccess
} from "../../../../lib/telegram/voice";
import type { IntakeResult, IntakeSessionSnapshot } from "../../../../lib/telegram/intake";

type TranscriptionJobPayload = {
  leadCaseId: string;
  intakeSessionId: string;
  intakeMessageId: string;
  telegramChatId: number;
  telegramFileId: string;
  sessionSnapshot?: IntakeSessionSnapshot;
  transcript?: string;
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

function assertAuthorized(request: NextRequest) {
  const secret = process.env.LEGALFIT_JOB_SECRET;
  if (!secret) return;

  const authorization = request.headers.get("authorization");
  if (authorization !== `Bearer ${secret}`) {
    throw new Error("Unauthorized");
  }
}

async function transcribeVoice(payload: TranscriptionJobPayload) {
  if (payload.transcript) return payload.transcript;

  const webhookUrl = process.env.LEGALFIT_TRANSCRIPTION_WEBHOOK_URL;
  if (!webhookUrl) {
    throw new Error("Missing LEGALFIT_TRANSCRIPTION_WEBHOOK_URL");
  }

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      telegramFileId: payload.telegramFileId,
      telegramChatId: payload.telegramChatId
    })
  });

  if (!response.ok) {
    throw new Error(`Transcription provider failed with ${response.status}`);
  }

  const body = (await response.json()) as { transcript?: string };
  if (!body.transcript) {
    throw new Error("Transcription provider returned no transcript");
  }

  return body.transcript;
}

function leadCaseUpdateFromIntakeResult(
  result: IntakeResult
): Record<string, unknown> {
  const patch = result.leadCasePatch ?? {};

  return {
    lifecycle_state: patch.lifecycleState ?? "collecting_info",
    processing_consent: Boolean(patch.processingConsent),
    handoff_consent: Boolean(patch.handoffConsent),
    contact_consent: Boolean(patch.contactConsent),
    company_name: patch.companyName,
    contact_name: patch.contactName,
    contact_email: patch.contactEmail,
    next_action: patch.nextAction,
    overall_fit: patch.overallFit,
    export_type: patch.exportType,
    last_activity_at: new Date().toISOString()
  };
}

export async function POST(request: NextRequest) {
  try {
    assertAuthorized(request);
  } catch {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const supabase = createServiceSupabaseClient();
  const now = new Date().toISOString();
  const { data: jobs, error } = await supabase
    .from("jobs")
    .select("id, payload, attempts, max_attempts")
    .eq("job_type", "transcription")
    .in("status", ["queued", "retrying"])
    .lte("run_after", now)
    .limit(5);

  if (error) throw error;

  const processed: Array<{ id: string; status: string }> = [];

  for (const job of jobs ?? []) {
    const payload = job.payload as TranscriptionJobPayload;
    const attempts = Number(job.attempts ?? 0) + 1;
    const maxAttempts = Number(job.max_attempts ?? 3);

    try {
      await supabase
        .from("jobs")
        .update({ status: "processing", attempts })
        .eq("id", job.id);

      const [{ data: sessionRow }, transcript] = await Promise.all([
        supabase
          .from("intake_sessions")
          .select("state, current_step, extracted_fields")
          .eq("id", payload.intakeSessionId)
          .maybeSingle(),
        transcribeVoice(payload)
      ]);

      const session =
        payload.sessionSnapshot ??
        ({
          state: sessionRow?.state,
          currentStep: sessionRow?.current_step,
          extractedFields: sessionRow?.extracted_fields ?? {}
        } as IntakeSessionSnapshot);
      const result = applyTranscriptionSuccess({ session, transcript });

      await supabase
        .from("intake_messages")
        .update(result.messagePatch)
        .eq("id", payload.intakeMessageId);

      await supabase
        .from("intake_sessions")
        .update({
          state: result.intake.sessionPatch.state,
          current_step: result.intake.sessionPatch.currentStep,
          extracted_fields: result.intake.sessionPatch.extractedFields,
          missing_critical_fields: result.intake.missingCriticalFields,
          last_user_message_at: new Date().toISOString()
        })
        .eq("id", payload.intakeSessionId);

      await supabase
        .from("lead_cases")
        .update(leadCaseUpdateFromIntakeResult(result.intake))
        .eq("id", payload.leadCaseId);

      if (result.intake.replies.length > 0) {
        await supabase.from("intake_messages").insert(
          result.intake.replies.map((reply) => ({
            intake_session_id: payload.intakeSessionId,
            lead_case_id: payload.leadCaseId,
            telegram_chat_id: payload.telegramChatId,
            direction: "outbound",
            message_type: "text",
            text: reply,
            metadata: { from_transcription_job: job.id }
          }))
        );
        await Promise.all(
          result.intake.replies.map((reply) =>
            sendTelegramMessage(payload.telegramChatId, reply)
          )
        );
      }

      await supabase
        .from("jobs")
        .update({ status: "succeeded", last_error: null })
        .eq("id", job.id);
      processed.push({ id: job.id, status: "succeeded" });
    } catch (jobError) {
      const failure = applyTranscriptionFailure({
        attempts,
        maxAttempts,
        error: jobError instanceof Error ? jobError.message : "Unknown error",
        now
      });

      await supabase.from("jobs").update(failure.jobPatch).eq("id", job.id);
      await supabase
        .from("intake_messages")
        .update(failure.messagePatch)
        .eq("id", payload.intakeMessageId);

      if (failure.userReply) {
        await supabase.from("intake_messages").insert({
          intake_session_id: payload.intakeSessionId,
          lead_case_id: payload.leadCaseId,
          telegram_chat_id: payload.telegramChatId,
          direction: "outbound",
          message_type: "text",
          text: failure.userReply,
          metadata: { from_transcription_job: job.id }
        });
        await sendTelegramMessage(payload.telegramChatId, failure.userReply);
      }

      processed.push({ id: job.id, status: failure.jobPatch.status });
    }
  }

  return NextResponse.json({ ok: true, processed });
}

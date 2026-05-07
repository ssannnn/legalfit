import { handleTextIntake, type IntakeResult, type IntakeSessionSnapshot } from "./intake";

export type VoiceTranscriptionPlan = {
  message: {
    intake_session_id: string;
    lead_case_id: string;
    telegram_chat_id: number;
    telegram_message_id: number;
    telegram_file_id: string;
    direction: "inbound";
    message_type: "voice";
    transcription_status: "queued";
    original_audio_retained: true;
    metadata: Record<string, unknown>;
  };
  job: {
    job_type: "transcription";
    status: "queued";
    payload: Record<string, unknown>;
    idempotency_key: string;
  };
};

export type TranscriptionSuccessResult = {
  messagePatch: {
    transcript: string;
    transcription_status: "succeeded";
    transcription_error: null;
    original_audio_retained: false;
    audio_retained_until: null;
  };
  intake: IntakeResult;
};

export type TranscriptionFailureResult = {
  jobPatch: {
    status: "retrying" | "dead";
    attempts: number;
    last_error: string;
    run_after: string;
  };
  messagePatch: {
    transcription_status: "retrying" | "failed";
    transcription_error: string;
    original_audio_retained: true;
  };
  userReply: string | null;
  leadCasePatch: {
    lifecycleState: "collecting_info" | "closed_no_handoff";
  };
};

const openAnswerStates = new Set<IntakeSessionSnapshot["state"]>([
  "collecting_case_description",
  "collecting_missing_info",
  "collecting_contact",
  "collecting_signals",
  "collecting_documentation",
  "awaiting_confirmation"
]);

export function canAcceptVoiceInput(session: IntakeSessionSnapshot | null) {
  if (!session) return false;
  return openAnswerStates.has(session.state);
}

export function createVoiceTranscriptionPlan({
  leadCaseId,
  intakeSessionId,
  telegramChatId,
  telegramMessageId,
  telegramFileId
}: {
  leadCaseId: string;
  intakeSessionId: string;
  telegramChatId: number;
  telegramMessageId: number;
  telegramFileId: string;
}): VoiceTranscriptionPlan {
  const idempotencyKey = `transcription:telegram:${telegramChatId}:${telegramMessageId}`;

  return {
    message: {
      intake_session_id: intakeSessionId,
      lead_case_id: leadCaseId,
      telegram_chat_id: telegramChatId,
      telegram_message_id: telegramMessageId,
      telegram_file_id: telegramFileId,
      direction: "inbound",
      message_type: "voice",
      transcription_status: "queued",
      original_audio_retained: true,
      metadata: {
        telegram_chat_id: telegramChatId,
        telegram_file_id: telegramFileId
      }
    },
    job: {
      job_type: "transcription",
      status: "queued",
      payload: {
        leadCaseId,
        intakeSessionId,
        telegramChatId,
        telegramMessageId,
        telegramFileId
      },
      idempotency_key: idempotencyKey
    }
  };
}

export function applyTranscriptionSuccess({
  session,
  transcript
}: {
  session: IntakeSessionSnapshot;
  transcript: string;
}): TranscriptionSuccessResult {
  return {
    messagePatch: {
      transcript,
      transcription_status: "succeeded",
      transcription_error: null,
      original_audio_retained: false,
      audio_retained_until: null
    },
    intake: handleTextIntake({ session, text: transcript })
  };
}

export function applyTranscriptionFailure({
  attempts,
  maxAttempts,
  error,
  now
}: {
  attempts: number;
  maxAttempts: number;
  error: string;
  now: string;
}): TranscriptionFailureResult {
  const exhausted = attempts >= maxAttempts;
  const runAfter = new Date(now);
  runAfter.setMinutes(runAfter.getMinutes() + Math.min(30, attempts * 5));

  return {
    jobPatch: {
      status: exhausted ? "dead" : "retrying",
      attempts,
      last_error: error,
      run_after: runAfter.toISOString()
    },
    messagePatch: {
      transcription_status: exhausted ? "failed" : "retrying",
      transcription_error: error,
      original_audio_retained: true
    },
    userReply: exhausted
      ? "No pude transcribir ese audio. Podes reenviarlo o continuar con texto; no voy a crear un lead accionable solo con un audio fallido."
      : null,
    leadCasePatch: {
      lifecycleState: exhausted ? "collecting_info" : "collecting_info"
    }
  };
}

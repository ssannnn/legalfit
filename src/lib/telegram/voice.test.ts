import { describe, expect, it } from "vitest";

import {
  applyTranscriptionFailure,
  applyTranscriptionSuccess,
  canAcceptVoiceInput,
  createVoiceTranscriptionPlan
} from "./voice";
import type { IntakeSessionSnapshot } from "./intake";

const openSession: IntakeSessionSnapshot = {
  state: "collecting_case_description",
  currentStep: "case_description",
  extractedFields: { consents: { processing: true } }
};

describe("Telegram voice intake", () => {
  it("accepts voice only during open-answer steps", () => {
    expect(canAcceptVoiceInput(openSession)).toBe(true);
    expect(
      canAcceptVoiceInput({
        ...openSession,
        state: "awaiting_processing_consent",
        currentStep: "processing_consent"
      })
    ).toBe(false);
    expect(
      canAcceptVoiceInput({
        ...openSession,
        state: "awaiting_handoff_consent",
        currentStep: "handoff_consent"
      })
    ).toBe(false);
  });

  it("creates an idempotent background transcription job plan", () => {
    const plan = createVoiceTranscriptionPlan({
      leadCaseId: "lead-1",
      intakeSessionId: "session-1",
      telegramChatId: 100,
      telegramMessageId: 200,
      telegramFileId: "voice-file-1"
    });

    expect(plan.message).toEqual(
      expect.objectContaining({
        message_type: "voice",
        telegram_file_id: "voice-file-1",
        transcription_status: "queued",
        original_audio_retained: true
      })
    );
    expect(plan.job).toEqual(
      expect.objectContaining({
        job_type: "transcription",
        idempotency_key: "transcription:telegram:100:200"
      })
    );
  });

  it("stores transcript, drops original audio, and feeds the text intake flow", () => {
    const result = applyTranscriptionSuccess({
      session: openSession,
      transcript:
        "Somos una SaaS argentina. Exportamos software a Estados Unidos y Chile. Queremos evaluar zona franca con Anden."
    });

    expect(result.messagePatch).toEqual(
      expect.objectContaining({
        transcript: expect.stringContaining("Somos una SaaS"),
        transcription_status: "succeeded",
        original_audio_retained: false,
        audio_retained_until: null
      })
    );
    expect(result.intake.sessionPatch.state).toBe("collecting_missing_info");
    expect(result.intake.sessionPatch.extractedFields.exportType).toBe(
      "services_software"
    );
  });

  it("retries failed transcription and dead-letters exhausted jobs safely", () => {
    const retry = applyTranscriptionFailure({
      attempts: 1,
      maxAttempts: 3,
      error: "provider timeout",
      now: "2026-05-07T20:00:00Z"
    });
    const exhausted = applyTranscriptionFailure({
      attempts: 3,
      maxAttempts: 3,
      error: "provider timeout",
      now: "2026-05-07T20:00:00Z"
    });

    expect(retry.jobPatch.status).toBe("retrying");
    expect(retry.userReply).toBe(null);
    expect(exhausted.jobPatch.status).toBe("dead");
    expect(exhausted.userReply).toContain("No pude transcribir");
    expect(exhausted.leadCasePatch.lifecycleState).not.toBe("ready_for_anden");
  });
});

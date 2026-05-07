import { describe, expect, it } from "vitest";

import {
  completionMetrics,
  computeIntakeExpiresAt,
  computeRetentionDeleteAfter,
  detectDuplicateSignals,
  expireIncompleteCase
} from "./retention";

describe("retention and duplicate operations", () => {
  it("expires incomplete intakes after 14 days without activity", () => {
    const patch = expireIncompleteCase({
      now: "2026-05-21T12:00:00Z",
      leadCase: {
        id: "lead-1",
        lifecycleState: "collecting_info",
        lastActivityAt: "2026-05-07T11:59:59Z",
        expiresAt: null
      }
    });

    expect(computeIntakeExpiresAt("2026-05-07T12:00:00Z")).toBe(
      "2026-05-21T12:00:00.000Z"
    );
    expect(patch).toEqual({
      lifecycleState: "expired",
      nextAction: "request_missing_info"
    });
  });

  it("does not expire completed or actionable leads", () => {
    const patch = expireIncompleteCase({
      now: "2026-05-21T12:00:00Z",
      leadCase: {
        id: "lead-1",
        lifecycleState: "ready_for_anden",
        lastActivityAt: "2026-05-01T12:00:00Z",
        expiresAt: null
      }
    });

    expect(patch).toBe(null);
  });

  it("computes 180-day retention metadata", () => {
    expect(computeRetentionDeleteAfter("2026-05-07T12:00:00Z")).toBe(
      "2026-11-03T12:00:00.000Z"
    );
  });

  it("marks possible duplicates without blocking or merging", () => {
    const result = detectDuplicateSignals(
      {
        id: "lead-new",
        companyName: "Demo SaaS Exportadora SRL",
        contactEmail: "lucia@example.com",
        telegramUserId: 123,
        cuit: "30-71111111-1"
      },
      [
        {
          id: "lead-old",
          companyName: "Demo SaaS Exportadora",
          contactEmail: "lucia@example.com",
          telegramUserId: 123,
          cuit: "30711111111"
        }
      ]
    );

    expect(result.possibleDuplicate).toBe(true);
    expect(result.blocked).toBe(false);
    expect(result.signals).toEqual(
      expect.objectContaining({
        contactEmail: ["lead-old"],
        telegramUserId: ["lead-old"],
        cuit: ["lead-old"],
        similarCompanyName: ["lead-old"]
      })
    );
  });

  it("computes completion rate inputs and time to dossier", () => {
    expect(
      completionMetrics({
        createdAt: "2026-05-07T12:00:00Z",
        completedAt: "2026-05-07T12:30:00Z",
        dossierGeneratedAt: "2026-05-07T12:45:00Z"
      })
    ).toEqual({
      completed: true,
      timeToCompletionMinutes: 30,
      timeToDossierMinutes: 45
    });
  });
});

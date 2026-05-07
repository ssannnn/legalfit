import { describe, expect, it, vi } from "vitest";

import { sendNewLeadNotification } from "./email";

describe("sendNewLeadNotification", () => {
  it("posts a new actionable lead notification when a webhook URL is configured", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 202,
      text: async () => ""
    });

    const result = await sendNewLeadNotification({
      webhookUrl: "https://hooks.example/email",
      fetchFn: fetchMock,
      payload: {
        leadCaseId: "lead-1",
        companyName: "Demo SaaS",
        contactEmail: "lucia@example.com",
        nextAction: "schedule_discovery",
        overallFit: "medium",
        leadInboxUrl: "https://legalfit.example/lead-inbox/lead-1"
      }
    });

    expect(result).toEqual({ status: "sent" });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://hooks.example/email",
      expect.objectContaining({
        method: "POST",
        headers: { "content-type": "application/json" }
      })
    );
  });
});

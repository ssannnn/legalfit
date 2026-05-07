import type { NewLeadNotification } from "../handoff/handoff";

type FetchLike = typeof fetch;

export type SendNotificationResult =
  | { status: "sent" }
  | { status: "skipped"; reason: "missing_webhook_url" };

export async function sendNewLeadNotification({
  webhookUrl = process.env.LEGALFIT_NOTIFICATION_WEBHOOK_URL,
  fetchFn = fetch,
  payload
}: {
  webhookUrl?: string;
  fetchFn?: FetchLike;
  payload: NewLeadNotification;
}): Promise<SendNotificationResult> {
  if (!webhookUrl) {
    return { status: "skipped", reason: "missing_webhook_url" };
  }

  const response = await fetchFn(webhookUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      to: process.env.LEGALFIT_NOTIFICATION_EMAIL_TO ?? "anden-ops",
      subject: `Nuevo lead legalfit: ${payload.companyName}`,
      text: [
        `Empresa: ${payload.companyName}`,
        `Contacto: ${payload.contactEmail}`,
        `Accion: ${payload.nextAction}`,
        `Fit: ${payload.overallFit}`,
        `Inbox: ${payload.leadInboxUrl}`
      ].join("\n"),
      payload
    })
  });

  if (!response.ok) {
    throw new Error(`Notification webhook failed with ${response.status}`);
  }

  return { status: "sent" };
}

import { NextResponse, type NextRequest } from "next/server";

import {
  expireIncompleteCase,
  type ExpirableLeadCase
} from "../../../../lib/operations/retention";
import { createServiceSupabaseClient } from "../../../../lib/supabase/server";

function assertAuthorized(request: NextRequest) {
  const secret = process.env.LEGALFIT_JOB_SECRET;
  if (!secret) return;

  const authorization = request.headers.get("authorization");
  if (authorization !== `Bearer ${secret}`) {
    throw new Error("Unauthorized");
  }
}

export async function POST(request: NextRequest) {
  try {
    assertAuthorized(request);
  } catch {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const supabase = createServiceSupabaseClient();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("lead_cases")
    .select("id, lifecycle_state, last_activity_at, expires_at")
    .in("lifecycle_state", [
      "intake_started",
      "collecting_info",
      "awaiting_confirmation",
      "awaiting_consent"
    ]);

  if (error) throw error;

  const expiredIds: string[] = [];

  for (const row of data ?? []) {
    const patch = expireIncompleteCase({
      now,
      leadCase: {
        id: row.id as string,
        lifecycleState: row.lifecycle_state as string,
        lastActivityAt: row.last_activity_at as string | null,
        expiresAt: row.expires_at as string | null
      } satisfies ExpirableLeadCase
    });

    if (!patch) continue;

    const { error: updateError } = await supabase
      .from("lead_cases")
      .update({
        lifecycle_state: patch.lifecycleState,
        next_action: patch.nextAction,
        last_activity_at: now
      })
      .eq("id", row.id);

    if (updateError) throw updateError;
    expiredIds.push(row.id as string);
  }

  return NextResponse.json({ ok: true, expiredIds });
}

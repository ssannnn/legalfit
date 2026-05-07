"use server";

import { redirect } from "next/navigation";

import { createServerSupabaseClient } from "../../lib/supabase/server";

function getSiteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

export async function requestMagicLink(formData: FormData) {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();

  if (!email) {
    redirect("/login?error=missing-email");
  }

  const supabase = await createServerSupabaseClient();
  const redirectTo = `${getSiteUrl()}/auth/callback?next=/lead-inbox`;

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: redirectTo
    }
  });

  if (error) {
    redirect("/login?error=magic-link");
  }

  redirect("/login/check-email");
}

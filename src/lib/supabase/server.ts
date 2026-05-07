import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

type ServerSupabaseClient = Awaited<ReturnType<typeof createServerSupabaseClient>>;

function requireEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: "", ...options });
        }
      }
    }
  );
}

export function createServiceSupabaseClient() {
  return createClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    }
  );
}

export async function getCurrentUserEmail(supabase: ServerSupabaseClient) {
  const {
    data: { user }
  } = await supabase.auth.getUser();

  return user?.email?.toLowerCase() ?? null;
}

export async function isActiveOperator(
  supabase: ServerSupabaseClient,
  email: string
) {
  const { data, error } = await supabase
    .from("anden_operators")
    .select("id")
    .eq("email", email.toLowerCase())
    .eq("active", true)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return Boolean(data);
}

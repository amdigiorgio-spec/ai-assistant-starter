import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSupabaseAdmin } from "./supabase-admin";

const ACCESS_COOKIE = "assistant_access_token";
const REFRESH_COOKIE = "assistant_refresh_token";

export type AssistantUser = {
  authUserId: string;
  email: string | null;
};

export async function getSessionTokens() {
  const cookieStore = await cookies();
  return {
    accessToken: cookieStore.get(ACCESS_COOKIE)?.value ?? null,
    refreshToken: cookieStore.get(REFRESH_COOKIE)?.value ?? null
  };
}

export async function getCurrentUser(): Promise<AssistantUser | null> {
  const { accessToken } = await getSessionTokens();
  if (!accessToken) return null;

  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  const { data, error } = await supabase.auth.getUser(accessToken);
  if (error || !data.user) return null;

  return {
    authUserId: data.user.id,
    email: data.user.email ?? null
  };
}

export async function requireCurrentUser(): Promise<AssistantUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export function authCookieNames() {
  return {
    access: ACCESS_COOKIE,
    refresh: REFRESH_COOKIE
  };
}


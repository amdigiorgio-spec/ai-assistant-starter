import { NextResponse } from "next/server";
import { authCookieNames } from "@/lib/auth";

type SessionPayload = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
};

export async function POST(request: Request) {
  const payload = (await request.json()) as SessionPayload;
  const accessToken = payload.access_token;
  const refreshToken = payload.refresh_token;

  if (!accessToken || !refreshToken) {
    return NextResponse.json({ ok: false, error: "Missing session tokens" }, { status: 400 });
  }

  const response = NextResponse.json({ ok: true });
  const names = authCookieNames();
  const maxAge = Math.max(60, payload.expires_in ?? 60 * 60);

  response.cookies.set(names.access, accessToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge
  });

  response.cookies.set(names.refresh, refreshToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30
  });

  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  const names = authCookieNames();

  response.cookies.delete(names.access);
  response.cookies.delete(names.refresh);

  return response;
}


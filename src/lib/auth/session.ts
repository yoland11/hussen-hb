import { SignJWT, jwtVerify } from "jose";

import { getAuthSecret } from "@/lib/env";

export const SESSION_COOKIE_NAME = "hb_admin_session";
export const SESSION_IDLE_TIMEOUT_MS = 10 * 60 * 1000;

const REMEMBERED_SESSION_MAX_AGE = 60 * 60 * 24 * 30;

type AdminSessionPayload = {
  role: "admin";
  rememberDevice: boolean;
  loginAt: number;
};

function getSigningKey() {
  return new TextEncoder().encode(getAuthSecret());
}

export function getSessionCookieOptions(rememberDevice: boolean) {
  return {
    httpOnly: true,
    maxAge: rememberDevice ? REMEMBERED_SESSION_MAX_AGE : undefined,
    path: "/",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
  };
}

export function getExpiredSessionCookieOptions() {
  return {
    ...getSessionCookieOptions(true),
    expires: new Date(0),
    maxAge: 0,
  };
}

export async function createAdminSessionToken({
  rememberDevice,
}: {
  rememberDevice: boolean;
}) {
  return new SignJWT({
    role: "admin",
    rememberDevice,
    loginAt: Date.now(),
  } satisfies AdminSessionPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(
      rememberDevice ? `${REMEMBERED_SESSION_MAX_AGE}s` : "12h",
    )
    .sign(getSigningKey());
}

export async function verifyAdminSessionToken(token?: string | null) {
  if (!token) {
    return false;
  }

  try {
    const { payload } = await jwtVerify(token, getSigningKey());

    return payload.role === "admin";
  } catch {
    return false;
  }
}

export async function readAdminSession(token?: string | null) {
  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, getSigningKey());

    if (payload.role !== "admin") {
      return null;
    }

    return payload as unknown as AdminSessionPayload;
  } catch {
    return null;
  }
}

import { SignJWT, jwtVerify } from "jose";

import { getAuthSecret } from "@/lib/env";

export const SESSION_COOKIE_NAME = "hb_admin_session";

const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

export const sessionCookieOptions = {
  httpOnly: true,
  maxAge: SESSION_MAX_AGE,
  path: "/",
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
};

export async function createAdminSessionToken() {
  return new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(new TextEncoder().encode(getAuthSecret()));
}

export async function verifyAdminSessionToken(token?: string | null) {
  if (!token) {
    return false;
  }

  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(getAuthSecret()),
    );

    return payload.role === "admin";
  } catch {
    return false;
  }
}

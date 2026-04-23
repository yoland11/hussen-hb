import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { SESSION_COOKIE_NAME, sessionCookieOptions } from "@/lib/auth/session";

export async function POST() {
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE_NAME, "", {
    ...sessionCookieOptions,
    expires: new Date(0),
    maxAge: 0,
  });

  return NextResponse.json({ ok: true });
}

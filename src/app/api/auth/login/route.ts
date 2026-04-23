import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { attemptAdminLogin } from "@/lib/auth/security";
import {
  createAdminSessionToken,
  getSessionCookieOptions,
  SESSION_COOKIE_NAME,
} from "@/lib/auth/session";
import { hasAuthConfig } from "@/lib/env";

const loginSchema = z.object({
  pin: z
    .string()
    .trim()
    .regex(/^\d{4,12}$/, "يجب إدخال PIN من 4 إلى 12 رقماً"),
  rememberDevice: z.boolean().optional().default(true),
});

export async function POST(request: Request) {
  try {
    if (!hasAuthConfig()) {
      return NextResponse.json(
        { message: "إعدادات تسجيل الدخول غير مكتملة داخل env." },
        { status: 500 },
      );
    }

    const body = loginSchema.parse(await request.json());
    const loginResult = await attemptAdminLogin(body.pin);

    if (!loginResult.ok) {
      return NextResponse.json(
        {
          message: loginResult.message,
          retryAfterMs: loginResult.retryAfterMs,
          snapshot: loginResult.snapshot,
        },
        { status: loginResult.status },
      );
    }

    const sessionToken = await createAdminSessionToken({
      rememberDevice: body.rememberDevice,
    });
    const cookieStore = await cookies();

    cookieStore.set(
      SESSION_COOKIE_NAME,
      sessionToken,
      getSessionCookieOptions(body.rememberDevice),
    );

    return NextResponse.json({
      ok: true,
      message: "تم تسجيل الدخول بنجاح.",
      snapshot: loginResult.snapshot,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: error.issues[0]?.message ?? "بيانات الدخول غير صحيحة." },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { message: "تعذر تسجيل الدخول حالياً." },
      { status: 500 },
    );
  }
}

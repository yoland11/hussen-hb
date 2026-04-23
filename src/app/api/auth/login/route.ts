import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { verifyAdminPin } from "@/lib/auth/pin";
import {
  createAdminSessionToken,
  SESSION_COOKIE_NAME,
  sessionCookieOptions,
} from "@/lib/auth/session";
import { hasAuthConfig } from "@/lib/env";

const loginSchema = z.object({
  pin: z
    .string()
    .trim()
    .regex(/^\d{4,12}$/, "يجب إدخال PIN من 4 إلى 12 رقماً"),
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
    const isValidPin = await verifyAdminPin(body.pin);

    if (!isValidPin) {
      return NextResponse.json(
        { message: "PIN غير صحيح. حاول مرة أخرى." },
        { status: 401 },
      );
    }

    const sessionToken = await createAdminSessionToken();
    const cookieStore = await cookies();

    cookieStore.set(SESSION_COOKIE_NAME, sessionToken, sessionCookieOptions);

    return NextResponse.json({ ok: true });
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

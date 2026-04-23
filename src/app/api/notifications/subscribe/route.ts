import { NextResponse } from "next/server";
import { z } from "zod";

import { assertAdminSession, UnauthorizedError } from "@/lib/auth/guards";
import {
  removeNotificationSubscription,
  upsertNotificationSubscription,
} from "@/lib/notifications/service";
import { hasPushConfig } from "@/lib/env";

const subscriptionSchema = z.object({
  endpoint: z.string().url("Endpoint الإشعار غير صحيح."),
  expirationTime: z.number().nullable().optional(),
  keys: z.object({
    auth: z.string().min(1, "مفتاح auth مفقود."),
    p256dh: z.string().min(1, "مفتاح p256dh مفقود."),
  }),
});

function missingPushConfigResponse() {
  return NextResponse.json(
    { message: "إعدادات Web Push غير مكتملة داخل env." },
    { status: 500 },
  );
}

export async function POST(request: Request) {
  try {
    await assertAdminSession();

    console.log("hasPushConfig:", hasPushConfig());
    console.log(
      "NEXT_PUBLIC_VAPID_PUBLIC_KEY exists:",
      !!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    );
    console.log("VAPID_PRIVATE_KEY exists:", !!process.env.VAPID_PRIVATE_KEY);
    console.log("VAPID_SUBJECT exists:", !!process.env.VAPID_SUBJECT);

    if (!hasPushConfig()) {
      return missingPushConfigResponse();
    }

    const body = z
      .object({
        subscription: subscriptionSchema,
      })
      .parse(await request.json());

    await upsertNotificationSubscription(
      body.subscription,
      request.headers.get("user-agent") ?? "",
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("POST /api/notifications/subscribe error:", error);

    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ message: "غير مصرح" }, { status: 401 });
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: error.issues[0]?.message ?? "بيانات الاشتراك غير صحيحة." },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "تعذر تفعيل الإشعارات حالياً.",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    await assertAdminSession();

    const body = z
      .object({
        endpoint: z.string().url("Endpoint الإلغاء غير صحيح."),
      })
      .parse(await request.json());

    await removeNotificationSubscription(body.endpoint);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/notifications/subscribe error:", error);

    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ message: "غير مصرح" }, { status: 401 });
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: error.issues[0]?.message ?? "بيانات الإلغاء غير صحيحة." },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "تعذر إيقاف الإشعارات حالياً.",
      },
      { status: 500 },
    );
  }
}
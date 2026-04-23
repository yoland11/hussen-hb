import { NextResponse } from "next/server";
import { z } from "zod";

import { assertAdminSession, UnauthorizedError } from "@/lib/auth/guards";
import { changeAdminPin } from "@/lib/auth/security";

const changePinSchema = z
  .object({
    currentPin: z
      .string()
      .trim()
      .regex(/^\d{4,12}$/, "يجب إدخال PIN الحالي بشكل صحيح."),
    nextPin: z
      .string()
      .trim()
      .regex(/^\d{4,12}$/, "PIN الجديد يجب أن يكون من 4 إلى 12 رقماً."),
    confirmPin: z
      .string()
      .trim()
      .regex(/^\d{4,12}$/, "تأكيد PIN الجديد غير صحيح."),
  })
  .superRefine((value, context) => {
    if (value.nextPin !== value.confirmPin) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirmPin"],
        message: "تأكيد PIN الجديد غير مطابق.",
      });
    }

    if (value.currentPin === value.nextPin) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["nextPin"],
        message: "اختر PIN جديداً مختلفاً عن الحالي.",
      });
    }
  });

export async function PATCH(request: Request) {
  try {
    await assertAdminSession();

    const body = changePinSchema.parse(await request.json());
    const snapshot = await changeAdminPin(body.currentPin, body.nextPin);

    return NextResponse.json({
      ok: true,
      message: "تم تغيير PIN الإدارة بنجاح.",
      snapshot,
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ message: "غير مصرح" }, { status: 401 });
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: error.issues[0]?.message ?? "بيانات تغيير PIN غير صحيحة." },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "تعذر تغيير PIN حالياً.",
      },
      { status: 500 },
    );
  }
}

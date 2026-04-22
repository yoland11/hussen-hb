import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { assertAdminSession, UnauthorizedError } from "@/lib/auth/guards";
import { deleteBooking, updateBooking } from "@/lib/bookings/service";
import { hasSupabaseConfig } from "@/lib/env";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function missingConfigResponse() {
  return NextResponse.json(
    { message: "ربط Supabase غير مكتمل داخل env." },
    { status: 500 },
  );
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    await assertAdminSession();

    if (!hasSupabaseConfig()) {
      return missingConfigResponse();
    }

    const { id } = await context.params;
    const booking = await updateBooking(id, await request.json());

    return NextResponse.json({ booking });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ message: "غير مصرح" }, { status: 401 });
    }

    if (error instanceof ZodError) {
      return NextResponse.json(
        { message: error.issues[0]?.message ?? "بيانات الحجز غير صحيحة." },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "تعذر تحديث الحجز.",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    await assertAdminSession();

    if (!hasSupabaseConfig()) {
      return missingConfigResponse();
    }

    const { id } = await context.params;
    await deleteBooking(id);

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ message: "غير مصرح" }, { status: 401 });
    }

    return NextResponse.json(
      { message: "تعذر حذف الحجز حالياً." },
      { status: 500 },
    );
  }
}

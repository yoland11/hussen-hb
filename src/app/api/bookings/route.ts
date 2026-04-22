import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { assertAdminSession, UnauthorizedError } from "@/lib/auth/guards";
import { createBooking, listBookings } from "@/lib/bookings/service";
import { hasSupabaseConfig } from "@/lib/env";

function missingConfigResponse() {
  return NextResponse.json(
    { message: "ربط Supabase غير مكتمل داخل env." },
    { status: 500 },
  );
}

export async function GET() {
  try {
    await assertAdminSession();

    if (!hasSupabaseConfig()) {
      return missingConfigResponse();
    }

    const bookings = await listBookings();

    return NextResponse.json({ bookings });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ message: "غير مصرح" }, { status: 401 });
    }

    return NextResponse.json(
      { message: "تعذر جلب الحجوزات حالياً." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    await assertAdminSession();

    if (!hasSupabaseConfig()) {
      return missingConfigResponse();
    }

    const booking = await createBooking(await request.json());

    return NextResponse.json({ booking }, { status: 201 });
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
      { message: error instanceof Error ? error.message : "تعذر حفظ الحجز." },
      { status: 500 },
    );
  }
}

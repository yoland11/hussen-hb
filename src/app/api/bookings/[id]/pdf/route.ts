import { NextResponse } from "next/server";

import { assertAdminSession, UnauthorizedError } from "@/lib/auth/guards";
import {
  deleteBookingPdf,
  getBookingById,
  saveBookingPdfPath,
} from "@/lib/bookings/service";
import {
  buildBookingPdfFileName,
  buildBookingPdfPath,
} from "@/lib/bookings/pdf-path";
import { ensureBookingsBucket, getBookingsBucket } from "@/lib/bookings/pdf-storage";
import { hasSupabaseConfig } from "@/lib/env";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

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

export async function POST(request: Request, context: RouteContext) {
  try {
    await assertAdminSession();

    if (!hasSupabaseConfig()) {
      return missingConfigResponse();
    }

    const { id } = await context.params;
    const booking = await getBookingById(id);

    if (!booking) {
      return NextResponse.json({ message: "الحجز غير موجود." }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File) || file.type !== "application/pdf") {
      return NextResponse.json(
        { message: "ملف الـ PDF المرسل غير صحيح." },
        { status: 400 },
      );
    }

    await ensureBookingsBucket();

    const path = buildBookingPdfPath(booking);
    const supabase = getSupabaseAdmin();
    const previousPdfPath = booking.invoice_pdf_path;

    const arrayBuffer = await file.arrayBuffer();
    const { error } = await supabase.storage
      .from(getBookingsBucket())
      .upload(path, arrayBuffer, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (error) {
      throw new Error(error.message);
    }

    const updatedBooking = await saveBookingPdfPath(id, path);

    if (previousPdfPath && previousPdfPath !== path) {
      await deleteBookingPdf(previousPdfPath);
    }

    return NextResponse.json({ booking: updatedBooking });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ message: "غير مصرح" }, { status: 401 });
    }

    return NextResponse.json(
      { message: error instanceof Error ? error.message : "تعذر حفظ PDF الحجز." },
      { status: 500 },
    );
  }
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    await assertAdminSession();

    if (!hasSupabaseConfig()) {
      return missingConfigResponse();
    }

    const { id } = await context.params;
    const booking = await getBookingById(id);

    if (!booking?.invoice_pdf_path) {
      return NextResponse.json(
        { message: "لا يوجد PDF محفوظ لهذا الحجز حتى الآن." },
        { status: 404 },
      );
    }

    await ensureBookingsBucket();

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.storage
      .from(getBookingsBucket())
      .download(booking.invoice_pdf_path);

    if (error || !data) {
      throw new Error(error?.message ?? "تعذر قراءة ملف PDF.");
    }

    return new Response(await data.arrayBuffer(), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(
          buildBookingPdfFileName(booking),
        )}`,
      },
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ message: "غير مصرح" }, { status: 401 });
    }

    return NextResponse.json(
      { message: error instanceof Error ? error.message : "تعذر تحميل ملف PDF." },
      { status: 500 },
    );
  }
}

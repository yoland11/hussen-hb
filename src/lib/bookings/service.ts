import "server-only";

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { Booking } from "@/types/booking";
import { notifyAdminsAboutNewBooking } from "@/lib/notifications/service";

import { bookingPayloadSchema } from "./schema";
import { ensureBookingsBucket, getBookingsBucket } from "./pdf-storage";

export async function listBookings() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as Booking[];
}

export async function getBookingById(id: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? null) as Booking | null;
}

export async function createBooking(payload: unknown) {
  const supabase = getSupabaseAdmin();
  const booking = bookingPayloadSchema.parse(payload);

  const { data, error } = await supabase
    .from("bookings")
    .insert(booking)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const createdBooking = data as Booking;
  void notifyAdminsAboutNewBooking(createdBooking).catch(() => undefined);

  return createdBooking;
}

export async function updateBooking(id: string, payload: unknown) {
  const supabase = getSupabaseAdmin();
  const booking = bookingPayloadSchema.parse(payload);

  const { data, error } = await supabase
    .from("bookings")
    .update(booking)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as Booking;
}

export async function saveBookingPdfPath(id: string, path: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("bookings")
    .update({
      invoice_pdf_path: path,
      invoice_pdf_updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as Booking;
}

export async function deleteBookingPdf(path: string) {
  if (!path) {
    return;
  }

  await ensureBookingsBucket();

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.storage.from(getBookingsBucket()).remove([path]);

  if (error) {
    throw new Error(error.message);
  }
}

export async function deleteBooking(id: string) {
  const supabase = getSupabaseAdmin();
  const booking = await getBookingById(id);

  if (booking?.invoice_pdf_path) {
    await deleteBookingPdf(booking.invoice_pdf_path);
  }

  const { error } = await supabase.from("bookings").delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
}

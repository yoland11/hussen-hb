import "server-only";

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { Booking } from "@/types/booking";

import { bookingPayloadSchema } from "./schema";

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

  return data as Booking;
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

export async function deleteBooking(id: string) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("bookings").delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
}

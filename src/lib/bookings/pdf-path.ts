import type { Booking } from "@/types/booking";

export const BOOKINGS_FOLDER_NAME = "الحجوزات";

export function sanitizeBookingFileSegment(value: string) {
  const cleaned = value
    .normalize("NFKC")
    .replace(/[^\p{L}\p{N}\s_-]+/gu, "")
    .trim()
    .replace(/\s+/g, "-");

  return cleaned || "booking";
}

export function buildBookingPdfFileName(
  booking: Pick<Booking, "customer_name" | "id">,
) {
  const safeName = sanitizeBookingFileSegment(booking.customer_name);
  const suffix = booking.id.slice(0, 8);
  return `${safeName}-${suffix}.pdf`;
}

export function buildBookingPdfPath(
  booking: Pick<Booking, "customer_name" | "id">,
) {
  return `${BOOKINGS_FOLDER_NAME}/${buildBookingPdfFileName(booking)}`;
}

import type { Booking } from "@/types/booking";

export const BOOKINGS_FOLDER_NAME = "الحجوزات";
export const BOOKINGS_STORAGE_FOLDER_NAME = "bookings";

function compactHyphenatedValue(value: string) {
  return value
    .replace(/-+/g, "-")
    .replace(/^[-_.]+|[-_.]+$/g, "");
}

function hashSegment(value: string) {
  let hash = 0;

  for (const char of value) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }

  return hash.toString(36);
}

export function sanitizeBookingFileSegment(value: string | null | undefined) {
  const cleaned = (value ?? "")
    .normalize("NFKC")
    .replace(/[^\p{L}\p{N}\s_-]+/gu, "")
    .trim()
    .replace(/\s+/g, "-");

  return compactHyphenatedValue(cleaned) || "booking";
}

export function sanitizeBookingStorageSegment(value: string | null | undefined) {
  const cleaned = (value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9\s_-]+/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");

  const compact = compactHyphenatedValue(cleaned);

  if (compact) {
    return compact;
  }

  return `customer-${hashSegment((value ?? "").trim() || "booking")}`;
}

export function buildBookingPdfFileName(
  booking: Pick<Booking, "customer_name" | "id">,
) {
  const safeName = sanitizeBookingFileSegment(booking.customer_name);
  const suffix = booking.id.slice(0, 8);
  return `${safeName}-${suffix}.pdf`;
}

export function buildBookingPdfStorageFileName(
  booking: Pick<Booking, "customer_name" | "id">,
) {
  const safeName = sanitizeBookingStorageSegment(booking.customer_name);
  const suffix = booking.id.slice(0, 8);
  return `${safeName}-${suffix}.pdf`;
}

export function buildBookingPdfPath(
  booking: Pick<Booking, "customer_name" | "id">,
) {
  return `${BOOKINGS_STORAGE_FOLDER_NAME}/${buildBookingPdfStorageFileName(booking)}`;
}

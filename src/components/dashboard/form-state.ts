import { derivePaymentStatus } from "@/lib/bookings/schema";
import type { Booking, BookingPayload, PaymentStatus } from "@/types/booking";

export type BookingFormValues = {
  customer_name: string;
  phone: string;
  booking_date: string;
  service_type: string;
  session_size: string;
  location_type: string;
  staff_gender: string;
  extra_details: string;
  total_amount: string;
  paid_amount: string;
  payment_status: PaymentStatus;
  notes: string;
};

export function createEmptyBookingForm(): BookingFormValues {
  return {
    customer_name: "",
    phone: "",
    booking_date: "",
    service_type: "",
    session_size: "",
    location_type: "",
    staff_gender: "",
    extra_details: "",
    total_amount: "",
    paid_amount: "",
    payment_status: "unpaid",
    notes: "",
  };
}

export function bookingToFormValues(booking: Booking): BookingFormValues {
  return {
    customer_name: booking.customer_name,
    phone: booking.phone,
    booking_date: booking.booking_date,
    service_type: booking.service_type,
    session_size: booking.session_size,
    location_type: booking.location_type,
    staff_gender: booking.staff_gender,
    extra_details: booking.extra_details,
    total_amount: booking.total_amount ? String(booking.total_amount) : "",
    paid_amount: booking.paid_amount ? String(booking.paid_amount) : "",
    payment_status: booking.payment_status,
    notes: booking.notes,
  };
}

export function formToBookingPayload(form: BookingFormValues): BookingPayload {
  const totalAmount = Number(form.total_amount || 0);
  const paidAmount = Number(form.paid_amount || 0);
  const derivedPaymentStatus = derivePaymentStatus(totalAmount, paidAmount);

  return {
    customer_name: form.customer_name.trim(),
    phone: form.phone.trim(),
    booking_date: form.booking_date,
    service_type: form.service_type,
    session_size: form.session_size,
    location_type: form.location_type,
    staff_gender: form.staff_gender,
    extra_details: form.extra_details.trim(),
    total_amount: totalAmount,
    paid_amount: paidAmount,
    payment_status:
      derivedPaymentStatus === "partial"
        ? derivedPaymentStatus
        : form.payment_status,
    notes: form.notes.trim(),
  };
}

export function formToPreviewBooking(
  form: BookingFormValues,
  id = "preview-booking",
): Booking {
  const payload = formToBookingPayload(form);

  return {
    id,
    ...payload,
    payment_status:
      payload.payment_status ??
      derivePaymentStatus(payload.total_amount, payload.paid_amount),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

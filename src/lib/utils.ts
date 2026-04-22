import type { Booking, PaymentStatus } from "@/types/booking";

export function getCurrentSystemDateISO(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function formatCurrency(value: number) {
  return `${Math.round(value || 0).toLocaleString("en-US")} د.ع`;
}

export function formatDateLabel(value: string) {
  if (!value) {
    return "-";
  }

  const parts = value.split("-");
  return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : value;
}

export function buildInvoiceNumber(booking: Pick<Booking, "id">) {
  const seed = booking.id.replaceAll("-", "").slice(-6).toUpperCase();
  return `HB-${seed}`;
}

export function getRemainingAmount(booking: Pick<Booking, "total_amount" | "paid_amount">) {
  return booking.total_amount - booking.paid_amount;
}

export function getPaymentStatusLabel(status: PaymentStatus) {
  if (status === "paid") {
    return "واصل بالكامل";
  }

  if (status === "partial") {
    return "مدفوع جزئياً";
  }

  return "غير واصل";
}

export function isToday(date: string, todayDate = getCurrentSystemDateISO()) {
  return Boolean(todayDate) && date === todayDate;
}

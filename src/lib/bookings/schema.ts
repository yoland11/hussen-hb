import { z } from "zod";

import type { BookingPayload, PaymentStatus } from "@/types/booking";

const moneySchema = z.preprocess((value) => {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim();
    return normalized === "" ? 0 : Number(normalized);
  }

  return value;
}, z.number().finite().min(0, "يجب أن يكون المبلغ صفراً أو أكثر"));

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `الحد الأقصى ${max} حرفاً`)
    .optional()
    .transform((value) => value ?? "");

const requiredText = (max: number, label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} مطلوب`)
    .max(max, `الحد الأقصى لحقل ${label} هو ${max} حرفاً`);

export function derivePaymentStatus(
  totalAmount: number,
  paidAmount: number,
): PaymentStatus {
  if (totalAmount > 0 && paidAmount >= totalAmount) {
    return "paid";
  }

  if (paidAmount > 0) {
    return "partial";
  }

  return "unpaid";
}

export const paymentStatusSchema = z.enum(["paid", "partial", "unpaid"]);

export const bookingPayloadSchema = z
  .object({
    customer_name: requiredText(120, "اسم العميل"),
    phone: requiredText(40, "رقم الهاتف"),
    booking_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "صيغة تاريخ الحجز غير صحيحة"),
    service_type: optionalText(80),
    session_size: optionalText(80),
    location_type: optionalText(80),
    staff_gender: optionalText(80),
    extra_details: optionalText(500),
    total_amount: moneySchema,
    paid_amount: moneySchema,
    payment_status: paymentStatusSchema.optional(),
    notes: optionalText(1200),
  })
  .superRefine((data, ctx) => {
    if (data.paid_amount > data.total_amount) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "المبلغ الواصل لا يمكن أن يكون أكبر من إجمالي الحساب",
        path: ["paid_amount"],
      });
    }
  })
  .transform(
    (data) =>
      ({
        ...data,
        payment_status:
          data.payment_status ??
          derivePaymentStatus(data.total_amount, data.paid_amount),
      }) satisfies BookingPayload & { payment_status: PaymentStatus },
  );

export type PaymentStatus = "paid" | "partial" | "unpaid";

export interface Booking {
  id: string;
  customer_name: string;
  phone: string;
  booking_date: string;
  service_type: string;
  session_size: string;
  location_type: string;
  staff_gender: string;
  extra_details: string;
  total_amount: number;
  paid_amount: number;
  payment_status: PaymentStatus;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface BookingPayload {
  customer_name: string;
  phone: string;
  booking_date: string;
  service_type: string;
  session_size: string;
  location_type: string;
  staff_gender: string;
  extra_details: string;
  total_amount: number;
  paid_amount: number;
  payment_status?: PaymentStatus;
  notes: string;
}

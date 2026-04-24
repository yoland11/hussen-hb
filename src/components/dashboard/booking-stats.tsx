import type { Booking } from "@/types/booking";

import { ScrollReveal } from "@/components/shared/scroll-reveal";
import { formatCurrency, getRemainingAmount, isToday } from "@/lib/utils";

export function BookingStats({
  bookings,
  todayDate,
}: {
  bookings: Booking[];
  todayDate: string;
}) {
  if (!bookings.length) {
    return null;
  }

  const todayBookings = bookings.filter((booking) =>
    isToday(booking.booking_date, todayDate),
  );
  const totalPaid = bookings.reduce(
    (sum, booking) => sum + booking.paid_amount,
    0,
  );
  const totalRemaining = bookings.reduce(
    (sum, booking) => sum + getRemainingAmount(booking),
    0,
  );

  return (
    <ScrollReveal as="section" className="card" delay={120}>
      <div className="ctitle">
        <div className="cicon">📊</div>
        إحصائيات سريعة
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <span>كل الحجوزات</span>
          <strong>{bookings.length}</strong>
        </div>
        <div className="stat-card">
          <span>حجوزات اليوم</span>
          <strong>{todayBookings.length}</strong>
        </div>
        <div className="stat-card paid">
          <span>المبالغ الواصلة</span>
          <strong>{formatCurrency(totalPaid)}</strong>
        </div>
        <div className="stat-card rem">
          <span>المبالغ المتبقية</span>
          <strong>{formatCurrency(totalRemaining)}</strong>
        </div>
      </div>
    </ScrollReveal>
  );
}

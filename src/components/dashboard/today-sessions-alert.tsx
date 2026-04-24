import type { Booking } from "@/types/booking";

import { ScrollReveal } from "@/components/shared/scroll-reveal";
import { formatDateLabel } from "@/lib/utils";

type TodaySessionsAlertProps = {
  bookings: Booking[];
  todayDate: string;
};

export function TodaySessionsAlert({
  bookings,
  todayDate,
}: TodaySessionsAlertProps) {
  if (!bookings.length || !todayDate) {
    return null;
  }

  const hasMultipleSessions = bookings.length > 1;

  return (
    <ScrollReveal
      as="section"
      className="today-alert"
      aria-live="polite"
      delay={30}
      distance="sm"
    >
      <div className="today-alert-header">
        <div className="today-alert-icon" aria-hidden="true">
          📅
        </div>

        <div className="today-alert-copy">
          <h2 className="today-alert-title">
            {hasMultipleSessions ? "جلسات اليوم" : `جلسة اليوم: ${bookings[0]?.customer_name}`}
          </h2>
          <p className="today-alert-subtitle">
            {hasMultipleSessions
              ? `لديك ${bookings.length} جلسات بتاريخ ${formatDateLabel(todayDate)}`
              : `موعد اليوم بتاريخ ${formatDateLabel(todayDate)} جاهز للمتابعة`}
          </p>
        </div>

        <div className="today-alert-badge">
          {bookings.length} {bookings.length === 1 ? "جلسة" : "جلسات"}
        </div>
      </div>

      <div className="today-alert-list">
        {bookings.map((booking) => (
          <article className="today-alert-item" key={booking.id}>
            <div className="today-alert-item-title">
              <span className="today-alert-dot" aria-hidden="true" />
              <span>{`جلسة اليوم: ${booking.customer_name}`}</span>
            </div>

            <div className="today-alert-item-meta">
              <span>📞 {booking.phone}</span>
              {booking.service_type ? <span>{booking.service_type}</span> : null}
              {booking.session_size ? <span>{booking.session_size}</span> : null}
              {booking.location_type ? <span>{booking.location_type}</span> : null}
            </div>
          </article>
        ))}
      </div>
    </ScrollReveal>
  );
}

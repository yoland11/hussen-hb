import type { Booking } from "@/types/booking";

import {
  formatCurrency,
  getPaymentStatusLabel,
  getRemainingAmount,
  isToday,
} from "@/lib/utils";

type BookingListProps = {
  bookings: Booking[];
  todayDate: string;
  onEdit: (booking: Booking) => void;
  onDelete: (booking: Booking) => void;
  onPreview: (booking: Booking) => void;
  onPrint: (booking: Booking) => void;
  onShare: (booking: Booking) => void;
  onDownloadPdf: (booking: Booking) => void;
};

export function BookingList({
  bookings,
  todayDate,
  onEdit,
  onDelete,
  onPreview,
  onPrint,
  onShare,
  onDownloadPdf,
}: BookingListProps) {
  if (!bookings.length) {
    return (
      <div className="empty-state" style={{ display: "block" }}>
        لا توجد حجوزات مطابقة للبحث أو الفلترة
      </div>
    );
  }

  return (
    <>
      <div className="blist-title">📋 قائمة الحجوزات</div>
      <div id="blist">
        {bookings.map((booking) => {
          const remainingAmount = getRemainingAmount(booking);
          const todayBooking = isToday(booking.booking_date, todayDate);

          return (
            <article
              className={`bcard ${todayBooking ? "today" : ""}`.trim()}
              key={booking.id}
            >
              {todayBooking ? <div className="today-badge">📅 موعد اليوم!</div> : null}

              <div className="bname">{booking.customer_name}</div>
              <div className="bmeta">
                <span>📞 {booking.phone}</span>
                <span>📅 {booking.booking_date}</span>
              </div>

              <div className="btags">
                {booking.service_type ? (
                  <span className="tag to">{booking.service_type}</span>
                ) : null}
                {booking.session_size ? (
                  <span className="tag tb">{booking.session_size}</span>
                ) : null}
                {booking.location_type ? (
                  <span className="tag tp">{booking.location_type}</span>
                ) : null}
                {booking.staff_gender ? (
                  <span className="tag tz">{booking.staff_gender}</span>
                ) : null}
                <span
                  className={`tag ${
                    booking.payment_status === "paid"
                      ? "tg"
                      : booking.payment_status === "partial"
                        ? "to"
                        : "tr"
                  }`}
                >
                  {getPaymentStatusLabel(booking.payment_status)}
                </span>
              </div>

              <div className="bamount">
                💰 الإجمالي: {formatCurrency(booking.total_amount)} | الواصل:{" "}
                {formatCurrency(booking.paid_amount)} |{" "}
                <span style={{ color: "#cc0000" }}>
                  المتبقي: {formatCurrency(remainingAmount)}
                </span>
              </div>

              {booking.notes ? <div className="bnotes">📝 {booking.notes}</div> : null}

              <div className="bactions">
                <button
                  className="mini-btn edit"
                  type="button"
                  onClick={() => onEdit(booking)}
                >
                  تعديل الحجز
                </button>
                <button
                  className="mini-btn"
                  type="button"
                  onClick={() => onPreview(booking)}
                >
                  معاينة الفاتورة
                </button>
                <button
                  className="mini-btn share"
                  type="button"
                  onClick={() => onShare(booking)}
                >
                  مشاركة الفاتورة
                </button>
                <button
                  className="mini-btn pdf"
                  type="button"
                  onClick={() => onPrint(booking)}
                >
                  طباعة PDF
                </button>
                {booking.invoice_pdf_path ? (
                  <button
                    className="mini-btn preview"
                    type="button"
                    onClick={() => onDownloadPdf(booking)}
                  >
                    تحميل PDF
                  </button>
                ) : null}
              </div>

              <button
                className="delbtn"
                type="button"
                onClick={() => onDelete(booking)}
                aria-label={`حذف حجز ${booking.customer_name}`}
              >
                🗑️
              </button>
            </article>
          );
        })}
      </div>
    </>
  );
}

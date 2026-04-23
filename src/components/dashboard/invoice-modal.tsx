"use client";

import type { Booking } from "@/types/booking";

import {
  buildInvoiceNumber,
  formatCurrency,
  formatDateLabel,
  getPaymentStatusLabel,
  getRemainingAmount,
} from "@/lib/utils";

type InvoiceModalProps = {
  booking: Booking | null;
  onClose: () => void;
  onPrint: () => void;
  onShare: () => void;
  onDownloadPdf: () => void;
};

function InvoiceBody({ booking }: { booking: Booking }) {
  const tags = [
    booking.service_type,
    booking.session_size,
    booking.location_type,
    booking.staff_gender,
  ].filter(Boolean);

  return (
    <div className="invoice-shell">
      <div className="invoice-head">
        <div className="invoice-brand">
          <h2>حسين بيرام</h2>
          <p>فاتورة جلسة تصوير وحجز خدمة</p>
        </div>

        <div className={`invoice-badge ${booking.payment_status}`}>
          {getPaymentStatusLabel(booking.payment_status)}
        </div>
      </div>

      <div className="invoice-grid">
        <div className="invoice-panel">
          <div className="invoice-panel-title">بيانات الفاتورة</div>
          <div className="invoice-line">
            <span className="invoice-k">رقم الفاتورة</span>
            <span className="invoice-v">{buildInvoiceNumber(booking)}</span>
          </div>
          <div className="invoice-line">
            <span className="invoice-k">تاريخ الإصدار</span>
            <span className="invoice-v">
              {formatDateLabel(new Date().toISOString().slice(0, 10))}
            </span>
          </div>
          <div className="invoice-line">
            <span className="invoice-k">تاريخ الحجز</span>
            <span className="invoice-v">{formatDateLabel(booking.booking_date)}</span>
          </div>
        </div>

        <div className="invoice-panel">
          <div className="invoice-panel-title">بيانات العميل</div>
          <div className="invoice-line">
            <span className="invoice-k">الاسم</span>
            <span className="invoice-v">{booking.customer_name}</span>
          </div>
          <div className="invoice-line">
            <span className="invoice-k">الهاتف</span>
            <span className="invoice-v">{booking.phone}</span>
          </div>
          <div className="invoice-line">
            <span className="invoice-k">الحالة</span>
            <span className="invoice-v">
              {getPaymentStatusLabel(booking.payment_status)}
            </span>
          </div>
        </div>
      </div>

      <div className="invoice-panel invoice-stack">
        <div className="invoice-panel-title">تفاصيل الجلسة</div>
        <div className="invoice-tags">
          {tags.length ? (
            tags.map((tag) => (
              <span className="invoice-chip" key={tag}>
                {tag}
              </span>
            ))
          ) : (
            <span className="invoice-chip">جلسة بدون تفاصيل إضافية</span>
          )}
        </div>

        {booking.extra_details ? (
          <div className="invoice-extra">
            <strong>تفاصيل إضافية:</strong> {booking.extra_details}
          </div>
        ) : null}
      </div>

      <div className="invoice-summary">
        <div className="invoice-stat">
          <span>إجمالي الحساب</span>
          <strong>{formatCurrency(booking.total_amount)}</strong>
        </div>
        <div className="invoice-stat paid">
          <span>المبلغ الواصل</span>
          <strong>{formatCurrency(booking.paid_amount)}</strong>
        </div>
        <div className="invoice-stat rem">
          <span>المبلغ المتبقي</span>
          <strong>{formatCurrency(getRemainingAmount(booking))}</strong>
        </div>
      </div>

      {booking.notes ? (
        <div className="invoice-note">
          <strong>ملاحظات:</strong> {booking.notes}
        </div>
      ) : null}

      <div className="invoice-footer">جميع الحقوق محفوظة لـ Hussein Ali Hameed</div>
    </div>
  );
}

export function InvoiceModal({
  booking,
  onClose,
  onPrint,
  onShare,
  onDownloadPdf,
}: InvoiceModalProps) {
  if (!booking) {
    return null;
  }

  return (
    <div className="invoice-modal show">
      <button
        type="button"
        className="invoice-backdrop"
        onClick={onClose}
        aria-label="إغلاق المعاينة"
      />

      <div className="invoice-window">
        <div className="invoice-toolbar">
          <div className="invoice-toolbar-title">معاينة الفاتورة</div>
          <div className="invoice-toolbar-actions">
            <button className="ibtn share" type="button" onClick={onShare}>
              مشاركة
            </button>
            {booking.invoice_pdf_path ? (
              <button
                className="ibtn preview"
                type="button"
                onClick={onDownloadPdf}
              >
                تحميل المحفوظ
              </button>
            ) : null}
            <button className="ibtn print" type="button" onClick={onPrint}>
              طباعة PDF
            </button>
            <button className="ibtn close" type="button" onClick={onClose}>
              إغلاق
            </button>
          </div>
        </div>

        <div className="invoice-scroll">
          <InvoiceBody booking={booking} />
        </div>
      </div>
    </div>
  );
}

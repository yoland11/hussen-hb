import type { Booking } from "@/types/booking";

import {
  buildInvoiceNumber,
  formatCurrency,
  formatDateLabel,
  getPaymentStatusLabel,
  getRemainingAmount,
} from "@/lib/utils";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function renderInvoiceMarkup(booking: Booking) {
  const remainingAmount = getRemainingAmount(booking);
  const tags = [
    booking.service_type,
    booking.session_size,
    booking.location_type,
    booking.staff_gender,
  ]
    .filter(Boolean)
    .map((tag) => `<span class="invoice-chip">${escapeHtml(tag)}</span>`)
    .join("");

  return `
    <div class="invoice-shell">
      <div class="invoice-head">
        <div class="invoice-brand">
          <h2>حسين بيرام</h2>
          <p>فاتورة جلسة تصوير وحجز خدمة</p>
        </div>
        <div class="invoice-badge ${booking.payment_status}">
          ${escapeHtml(getPaymentStatusLabel(booking.payment_status))}
        </div>
      </div>
      <div class="invoice-grid">
        <div class="invoice-panel">
          <div class="invoice-panel-title">بيانات الفاتورة</div>
          <div class="invoice-line"><span class="invoice-k">رقم الفاتورة</span><span class="invoice-v">${escapeHtml(buildInvoiceNumber(booking))}</span></div>
          <div class="invoice-line"><span class="invoice-k">تاريخ الإصدار</span><span class="invoice-v">${escapeHtml(formatDateLabel(new Date().toISOString().slice(0, 10)))}</span></div>
          <div class="invoice-line"><span class="invoice-k">تاريخ الحجز</span><span class="invoice-v">${escapeHtml(formatDateLabel(booking.booking_date))}</span></div>
        </div>
        <div class="invoice-panel">
          <div class="invoice-panel-title">بيانات العميل</div>
          <div class="invoice-line"><span class="invoice-k">الاسم</span><span class="invoice-v">${escapeHtml(booking.customer_name)}</span></div>
          <div class="invoice-line"><span class="invoice-k">الهاتف</span><span class="invoice-v">${escapeHtml(booking.phone)}</span></div>
          <div class="invoice-line"><span class="invoice-k">الحالة</span><span class="invoice-v">${escapeHtml(getPaymentStatusLabel(booking.payment_status))}</span></div>
        </div>
      </div>
      <div class="invoice-panel" style="margin-top:14px">
        <div class="invoice-panel-title">تفاصيل الجلسة</div>
        <div class="invoice-tags">${tags || '<span class="invoice-chip">جلسة بدون تفاصيل إضافية</span>'}</div>
        ${
          booking.extra_details
            ? `<div class="invoice-extra"><strong>تفاصيل إضافية:</strong> ${escapeHtml(booking.extra_details)}</div>`
            : ""
        }
      </div>
      <div class="invoice-summary">
        <div class="invoice-stat"><span>إجمالي الحساب</span><strong>${escapeHtml(formatCurrency(booking.total_amount))}</strong></div>
        <div class="invoice-stat paid"><span>المبلغ الواصل</span><strong>${escapeHtml(formatCurrency(booking.paid_amount))}</strong></div>
        <div class="invoice-stat rem"><span>المبلغ المتبقي</span><strong>${escapeHtml(formatCurrency(remainingAmount))}</strong></div>
      </div>
      ${
        booking.notes
          ? `<div class="invoice-note"><strong>ملاحظات:</strong> ${escapeHtml(booking.notes)}</div>`
          : ""
      }
      <div class="invoice-footer">جميع الحقوق محفوظة لـ Hussein Ali Hameed</div>
    </div>
  `.trim();
}

export function renderInvoiceDocument(booking: Booking) {
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>فاتورة ${escapeHtml(buildInvoiceNumber(booking))}</title>
    <style>
      body{font-family:Tahoma,Arial,sans-serif;background:#fff7f0;margin:0;padding:24px;color:#3d2200;direction:rtl;}
      .invoice-shell{background:#fff;border:1px solid #ffd8b0;border-radius:24px;padding:22px;max-width:820px;margin:0 auto;}
      .invoice-head{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;padding-bottom:16px;border-bottom:1px dashed #ffd4a8;}
      .invoice-brand h2{font-size:24px;color:#e85500;margin:0 0 4px;}
      .invoice-brand p{color:#a55a14;font-size:13px;margin:0;}
      .invoice-badge{display:inline-flex;align-items:center;border-radius:999px;padding:8px 14px;font-size:12px;font-weight:700;}
      .invoice-badge.paid{background:#e9fbee;color:#166534;}
      .invoice-badge.partial{background:#fff6e6;color:#b45309;}
      .invoice-badge.unpaid{background:#fff0f0;color:#b91c1c;}
      .invoice-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:18px;}
      .invoice-panel{background:#fffaf5;border:1px solid #ffe1bf;border-radius:16px;padding:14px;}
      .invoice-panel-title{font-size:13px;font-weight:700;color:#e85500;margin-bottom:10px;}
      .invoice-line{display:flex;justify-content:space-between;gap:10px;padding:7px 0;border-bottom:1px solid #fff0e0;}
      .invoice-line:last-child{border-bottom:none;}
      .invoice-k{color:#8a4400;font-size:13px;}
      .invoice-v{color:#3d2200;font-size:13px;font-weight:700;}
      .invoice-tags{display:flex;flex-wrap:wrap;gap:8px;margin-top:4px;}
      .invoice-chip{display:inline-flex;padding:7px 12px;border-radius:999px;background:#fff5e6;border:1px solid #ffd4a8;color:#8a4400;font-size:12px;font-weight:700;}
      .invoice-extra,.invoice-note{margin-top:12px;background:#fffaf5;border:1px solid #ffe4c7;border-radius:14px;padding:12px 14px;font-size:13px;color:#8a4400;}
      .invoice-extra strong,.invoice-note strong{color:#e85500;}
      .invoice-summary{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:18px;}
      .invoice-stat{background:linear-gradient(135deg,#fffaf5,#fff);border:1px solid #ffe1bf;border-radius:16px;padding:14px;}
      .invoice-stat span{display:block;font-size:12px;color:#8a4400;margin-bottom:6px;}
      .invoice-stat strong{display:block;font-size:18px;color:#e85500;}
      .invoice-stat.paid strong{color:#16a34a;}
      .invoice-stat.rem strong{color:#dc2626;}
      .invoice-footer{margin-top:18px;padding-top:14px;border-top:1px solid rgba(255,212,168,.7);text-align:center;font-size:11px;color:rgba(138,68,0,.72);}
      @media print{body{padding:0;background:#fff;}.invoice-shell{border:none;border-radius:0;}}
      @media (max-width:640px){body{padding:12px;}.invoice-grid,.invoice-summary{grid-template-columns:1fr;}.invoice-head{flex-direction:column;}}
    </style>
  </head>
  <body>
    ${renderInvoiceMarkup(booking)}
  </body>
</html>`;
}

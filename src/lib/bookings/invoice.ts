import type { Booking } from "@/types/booking";

import {
  buildInvoiceNumber,
  formatCurrency,
  formatDateLabel,
  getPaymentStatusLabel,
  getRemainingAmount,
} from "@/lib/utils";

export const INVOICE_PAGE_WIDTH_PX = 794;
export const INVOICE_PAGE_HEIGHT_PX = 1123;

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderInvoiceContent(booking: Booking) {
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
          <div class="invoice-line">
            <span class="invoice-k">رقم الفاتورة</span>
            <span class="invoice-v">${escapeHtml(buildInvoiceNumber(booking))}</span>
          </div>
          <div class="invoice-line">
            <span class="invoice-k">تاريخ الإصدار</span>
            <span class="invoice-v">${escapeHtml(formatDateLabel(new Date().toISOString().slice(0, 10)))}</span>
          </div>
          <div class="invoice-line">
            <span class="invoice-k">تاريخ الحجز</span>
            <span class="invoice-v">${escapeHtml(formatDateLabel(booking.booking_date))}</span>
          </div>
        </div>

        <div class="invoice-panel">
          <div class="invoice-panel-title">بيانات العميل</div>
          <div class="invoice-line">
            <span class="invoice-k">الاسم</span>
            <span class="invoice-v">${escapeHtml(booking.customer_name)}</span>
          </div>
          <div class="invoice-line">
            <span class="invoice-k">الهاتف</span>
            <span class="invoice-v">${escapeHtml(booking.phone)}</span>
          </div>
          <div class="invoice-line">
            <span class="invoice-k">الحالة</span>
            <span class="invoice-v">${escapeHtml(getPaymentStatusLabel(booking.payment_status))}</span>
          </div>
        </div>
      </div>

      <div class="invoice-panel invoice-stack">
        <div class="invoice-panel-title">تفاصيل الجلسة</div>
        <div class="invoice-tags">
          ${tags || '<span class="invoice-chip">جلسة بدون تفاصيل إضافية</span>'}
        </div>
        ${
          booking.extra_details
            ? `<div class="invoice-extra"><strong>تفاصيل إضافية:</strong> ${escapeHtml(booking.extra_details)}</div>`
            : ""
        }
      </div>

      <div class="invoice-summary">
        <div class="invoice-stat">
          <span>إجمالي الحساب</span>
          <strong>${escapeHtml(formatCurrency(booking.total_amount))}</strong>
        </div>
        <div class="invoice-stat paid">
          <span>المبلغ الواصل</span>
          <strong>${escapeHtml(formatCurrency(booking.paid_amount))}</strong>
        </div>
        <div class="invoice-stat rem">
          <span>المبلغ المتبقي</span>
          <strong>${escapeHtml(formatCurrency(remainingAmount))}</strong>
        </div>
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

export function renderInvoiceMarkup(booking: Booking) {
  return `
    <div class="invoice-document">
      <section class="invoice-page">
        ${renderInvoiceContent(booking)}
      </section>
    </div>
  `.trim();
}

function renderInvoiceDocumentStyles() {
  return `
    :root {
      color-scheme: light;
      --invoice-paper: #fff7f0;
      --invoice-surface: #ffffff;
      --invoice-border: #ffd8b0;
      --invoice-border-soft: #ffe4c7;
      --invoice-border-dash: #ffd4a8;
      --invoice-panel-bg: #fffaf5;
      --invoice-chip-bg: #fff5e6;
      --invoice-text: #3d2200;
      --invoice-text-soft: #8a4400;
      --invoice-accent: #e85500;
      --invoice-shadow: 0 12px 32px rgba(61, 34, 0, 0.12);
    }

    * {
      box-sizing: border-box;
    }

    html,
    body {
      width: 210mm;
      min-height: 297mm;
      margin: 0;
      padding: 0;
      background: #fff;
      color: var(--invoice-text);
      font-family: Tahoma, Arial, sans-serif;
      direction: rtl;
      print-color-adjust: exact;
      -webkit-print-color-adjust: exact;
    }

    body {
      overflow: hidden;
    }

    .invoice-document {
      width: 210mm;
      min-height: 297mm;
      margin: 0 auto;
    }

    .invoice-page {
      width: 210mm;
      min-height: 297mm;
      padding: 10mm;
      background: #fff;
    }

    .invoice-shell {
      min-height: calc(297mm - 20mm);
      display: flex;
      flex-direction: column;
      gap: 3.4mm;
      background: var(--invoice-surface);
      border: 0.35mm solid var(--invoice-border);
      border-radius: 6mm;
      padding: 6.5mm;
      color: var(--invoice-text);
      box-shadow: none;
    }

    .invoice-head,
    .invoice-grid,
    .invoice-panel,
    .invoice-summary,
    .invoice-note {
      break-inside: avoid;
      page-break-inside: avoid;
    }

    .invoice-head {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 4mm;
      padding-bottom: 4mm;
      border-bottom: 0.35mm dashed var(--invoice-border-dash);
    }

    .invoice-brand h2 {
      margin: 0 0 1.2mm;
      font-size: 7.2mm;
      line-height: 1.15;
      color: var(--invoice-accent);
    }

    .invoice-brand p {
      margin: 0;
      font-size: 3.5mm;
      color: #a55a14;
    }

    .invoice-badge {
      display: inline-flex;
      align-items: center;
      border-radius: 999px;
      padding: 2.1mm 3.4mm;
      font-size: 3.2mm;
      font-weight: 700;
      white-space: nowrap;
    }

    .invoice-badge.paid {
      background: #e9fbee;
      color: #166534;
    }

    .invoice-badge.partial {
      background: #fff6e6;
      color: #b45309;
    }

    .invoice-badge.unpaid {
      background: #fff0f0;
      color: #b91c1c;
    }

    .invoice-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 3mm;
    }

    .invoice-panel {
      background: var(--invoice-panel-bg);
      border: 0.35mm solid #ffe1bf;
      border-radius: 4.5mm;
      padding: 3.6mm;
    }

    .invoice-stack {
      margin-top: 0;
    }

    .invoice-panel-title {
      margin-bottom: 2.4mm;
      font-size: 3.3mm;
      font-weight: 700;
      color: var(--invoice-accent);
    }

    .invoice-line {
      display: grid;
      grid-template-columns: minmax(28mm, 34mm) minmax(0, 1fr);
      gap: 2.4mm;
      align-items: start;
      padding: 1.9mm 0;
      border-bottom: 0.25mm solid #fff0e0;
    }

    .invoice-line:last-child {
      border-bottom: none;
    }

    .invoice-k,
    .invoice-v,
    .invoice-extra,
    .invoice-note,
    .invoice-chip {
      overflow-wrap: anywhere;
      word-break: break-word;
    }

    .invoice-k {
      color: var(--invoice-text-soft);
      font-size: 3.25mm;
    }

    .invoice-v {
      color: var(--invoice-text);
      font-size: 3.25mm;
      font-weight: 700;
      text-align: left;
    }

    .invoice-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 2mm;
    }

    .invoice-chip {
      display: inline-flex;
      align-items: center;
      padding: 1.9mm 3mm;
      border-radius: 999px;
      background: var(--invoice-chip-bg);
      border: 0.35mm solid var(--invoice-border-dash);
      color: var(--invoice-text-soft);
      font-size: 3mm;
      font-weight: 700;
      line-height: 1.35;
    }

    .invoice-extra,
    .invoice-note {
      margin-top: 2.6mm;
      background: var(--invoice-panel-bg);
      border: 0.35mm solid var(--invoice-border-soft);
      border-radius: 4mm;
      padding: 3mm 3.4mm;
      font-size: 3.15mm;
      line-height: 1.65;
      color: var(--invoice-text-soft);
      white-space: pre-line;
    }

    .invoice-extra strong,
    .invoice-note strong {
      color: var(--invoice-accent);
    }

    .invoice-summary {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 3mm;
    }

    .invoice-stat {
      background: linear-gradient(135deg, #fffaf5, #fff);
      border: 0.35mm solid #ffe1bf;
      border-radius: 4.5mm;
      padding: 3.6mm;
    }

    .invoice-stat span {
      display: block;
      margin-bottom: 1.6mm;
      font-size: 3mm;
      color: var(--invoice-text-soft);
    }

    .invoice-stat strong {
      display: block;
      font-size: 4.4mm;
      color: var(--invoice-accent);
      line-height: 1.25;
    }

    .invoice-stat.paid strong {
      color: #16a34a;
    }

    .invoice-stat.rem strong {
      color: #dc2626;
    }

    .invoice-footer {
      margin-top: auto;
      padding-top: 3mm;
      border-top: 0.25mm solid rgba(255, 212, 168, 0.7);
      text-align: center;
      font-size: 2.8mm;
      color: rgba(138, 68, 0, 0.72);
      line-height: 1.5;
    }

    @page {
      size: A4 portrait;
      margin: 0;
    }

    @media screen {
      html,
      body {
        background: var(--invoice-paper);
      }
    }
  `;
}

export function renderInvoiceDocument(booking: Booking) {
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>فاتورة ${escapeHtml(buildInvoiceNumber(booking))}</title>
    <style>
      ${renderInvoiceDocumentStyles()}
    </style>
  </head>
  <body>
    ${renderInvoiceMarkup(booking)}
  </body>
</html>`;
}

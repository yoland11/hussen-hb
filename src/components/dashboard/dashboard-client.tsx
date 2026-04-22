"use client";

import {
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  useTransition,
  type FormEvent,
} from "react";
import { useRouter } from "next/navigation";

import { BrandHero } from "@/components/shared/brand-hero";
import type { DateFilterValue } from "@/lib/bookings/options";
import { derivePaymentStatus } from "@/lib/bookings/schema";
import type { Booking } from "@/types/booking";
import {
  buildInvoiceNumber,
  formatCurrency,
  formatDateLabel,
  getCurrentSystemDateISO,
  getPaymentStatusLabel,
  getRemainingAmount,
  isToday,
} from "@/lib/utils";

import { BookingFilters } from "./booking-filters";
import { BookingForm } from "./booking-form";
import { BookingList } from "./booking-list";
import { BookingStats } from "./booking-stats";
import {
  bookingToFormValues,
  createEmptyBookingForm,
  formToBookingPayload,
  formToPreviewBooking,
  type BookingFormValues,
} from "./form-state";
import { InvoiceModal } from "./invoice-modal";
import { TodaySessionsAlert } from "./today-sessions-alert";

type DashboardClientProps = {
  initialBookings: Booking[];
  isSupabaseReady: boolean;
  missingSupabaseKeys: string[];
  loadError?: string | null;
};

function subscribeToTodayDate(callback: () => void) {
  window.addEventListener("focus", callback);
  document.addEventListener("visibilitychange", callback);

  const intervalId = window.setInterval(callback, 60_000);

  return () => {
    window.removeEventListener("focus", callback);
    document.removeEventListener("visibilitychange", callback);
    window.clearInterval(intervalId);
  };
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderInvoiceDocument(booking: Booking) {
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
  </body>
</html>`;
}

function matchesDateFilter(
  booking: Booking,
  dateFilter: DateFilterValue,
  todayDate: string,
) {
  if (!todayDate) {
    return dateFilter === "all";
  }

  if (dateFilter === "all") {
    return true;
  }

  if (dateFilter === "today") {
    return booking.booking_date === todayDate;
  }

  if (dateFilter === "upcoming") {
    return Boolean(booking.booking_date) && booking.booking_date >= todayDate;
  }

  if (dateFilter === "month") {
    return booking.booking_date.slice(0, 7) === todayDate.slice(0, 7);
  }

  return true;
}

export function DashboardClient({
  initialBookings,
  isSupabaseReady,
  missingSupabaseKeys,
  loadError,
}: DashboardClientProps) {
  const router = useRouter();
  const [bookings, setBookings] = useState(initialBookings);
  const [form, setForm] = useState<BookingFormValues>(createEmptyBookingForm);
  const [editingBookingId, setEditingBookingId] = useState<string | null>(null);
  const [invoiceBooking, setInvoiceBooking] = useState<Booking | null>(null);
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState<DateFilterValue>("all");
  const [formError, setFormError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<"save" | "delete" | "logout" | null>(
    null,
  );
  const [showExtraDetails, setShowExtraDetails] = useState(false);
  const [, startTransition] = useTransition();
  const deferredSearch = useDeferredValue(search);
  const todayDate = useSyncExternalStore(
    subscribeToTodayDate,
    getCurrentSystemDateISO,
    () => "",
  );

  useEffect(() => {
    if (!actionMessage) {
      return undefined;
    }

    const timeout = window.setTimeout(() => {
      setActionMessage(null);
    }, 4000);

    return () => window.clearTimeout(timeout);
  }, [actionMessage]);

  const todayBookings = useMemo(
    () =>
      todayDate
        ? bookings.filter((booking) => isToday(booking.booking_date, todayDate))
        : [],
    [bookings, todayDate],
  );

  const visibleBookings = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase();

    return bookings.filter((booking) => {
      const matchesSearch =
        !query ||
        [
          booking.customer_name,
          booking.phone,
          booking.service_type,
          booking.notes,
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);

      return matchesSearch && matchesDateFilter(booking, dateFilter, todayDate);
    });
  }, [bookings, dateFilter, deferredSearch, todayDate]);

  function updateFormField<K extends keyof BookingFormValues>(
    field: K,
    value: BookingFormValues[K],
  ) {
    setForm((current) => {
      const next = {
        ...current,
        [field]: value,
      };

      if (field === "total_amount" || field === "paid_amount") {
        next.payment_status = derivePaymentStatus(
          Number(next.total_amount || 0),
          Number(next.paid_amount || 0),
        );
      }

      return next;
    });
  }

  function resetForm() {
    setForm(createEmptyBookingForm());
    setEditingBookingId(null);
    setInvoiceBooking(null);
    setFormError(null);
    setShowExtraDetails(false);
  }

  function startEditing(booking: Booking) {
    setEditingBookingId(booking.id);
    setForm(bookingToFormValues(booking));
    setShowExtraDetails(Boolean(booking.extra_details));
    setFormError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function getPreviewCandidate(source?: Booking) {
    if (source) {
      return source;
    }

    if (
      !form.customer_name.trim() ||
      !form.phone.trim() ||
      !form.booking_date.trim()
    ) {
      setFormError("يرجى إدخال اسم العميل ورقم الهاتف وتاريخ الحجز أولاً.");
      return null;
    }

    setFormError(null);
    return formToPreviewBooking(form, editingBookingId ?? crypto.randomUUID());
  }

  function openInvoicePreview(source?: Booking) {
    const booking = getPreviewCandidate(source);

    if (!booking) {
      return;
    }

    setInvoiceBooking(booking);
  }

  function printInvoice(source?: Booking) {
    const booking = getPreviewCandidate(source);

    if (!booking) {
      return;
    }

    const printWindow = window.open("", "_blank", "noopener,noreferrer");

    if (!printWindow) {
      setFormError("تعذر فتح نافذة الطباعة. تأكد من السماح بالنوافذ المنبثقة.");
      return;
    }

    printWindow.document.open();
    printWindow.document.write(renderInvoiceDocument(booking));
    printWindow.document.close();
    printWindow.focus();
    window.setTimeout(() => printWindow.print(), 300);
  }

  async function shareInvoice(source?: Booking) {
    const booking = getPreviewCandidate(source);

    if (!booking) {
      return;
    }

    const shareText = [
      `فاتورة ${booking.customer_name}`,
      `رقم الفاتورة: ${buildInvoiceNumber(booking)}`,
      `إجمالي الحساب: ${formatCurrency(booking.total_amount)}`,
      `الواصل: ${formatCurrency(booking.paid_amount)}`,
      `المتبقي: ${formatCurrency(getRemainingAmount(booking))}`,
    ].join("\n");

    if (navigator.share) {
      await navigator.share({
        title: `فاتورة ${booking.customer_name}`,
        text: shareText,
      });
      return;
    }

    await navigator.clipboard.writeText(shareText);
    setActionMessage("تم نسخ ملخص الفاتورة إلى الحافظة.");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    try {
      const payload = formToBookingPayload(form);
      setBusyAction("save");

      const response = await fetch(
        editingBookingId ? `/api/bookings/${editingBookingId}` : "/api/bookings",
        {
          method: editingBookingId ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      const result = (await response.json()) as {
        booking?: Booking;
        message?: string;
      };

      if (!response.ok || !result.booking) {
        setFormError(result.message ?? "تعذر حفظ الحجز حالياً.");
        return;
      }

      startTransition(() => {
        setBookings((current) => {
          if (editingBookingId) {
            return current.map((booking) =>
              booking.id === result.booking?.id ? result.booking : booking,
            );
          }

          return [result.booking!, ...current];
        });
      });

      setActionMessage(
        editingBookingId ? "تم تحديث الحجز بنجاح." : "تم حفظ الحجز بنجاح.",
      );
      resetForm();
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "تعذر حفظ الحجز حالياً.",
      );
    } finally {
      setBusyAction(null);
    }
  }

  async function handleDelete(booking: Booking) {
    const confirmed = window.confirm(`هل تريد حذف حجز ${booking.customer_name}؟`);

    if (!confirmed) {
      return;
    }

    try {
      setBusyAction("delete");

      const response = await fetch(`/api/bookings/${booking.id}`, {
        method: "DELETE",
      });

      const result = (await response.json()) as { message?: string };

      if (!response.ok) {
        setFormError(result.message ?? "تعذر حذف الحجز حالياً.");
        return;
      }

      startTransition(() => {
        setBookings((current) =>
          current.filter((item) => item.id !== booking.id),
        );
      });

      if (editingBookingId === booking.id) {
        resetForm();
      }

      setActionMessage("تم حذف الحجز بنجاح.");
    } catch {
      setFormError("تعذر حذف الحجز حالياً.");
    } finally {
      setBusyAction(null);
    }
  }

  async function handleLogout() {
    try {
      setBusyAction("logout");
      await fetch("/api/auth/logout", { method: "POST" });
      router.replace("/login");
      router.refresh();
    } finally {
      setBusyAction(null);
    }
  }

  return (
    <>
      <BrandHero
        subtitle="نظام حجوزات الجلسات التصويرية"
        badge="لوحة التحكم"
        actions={
          <div className="header-actions">
            <span className="header-status">متصل أونلاين</span>
            <button
              className="header-logout"
              type="button"
              onClick={handleLogout}
              disabled={busyAction === "logout"}
            >
              {busyAction === "logout" ? "جارٍ الخروج..." : "تسجيل خروج"}
            </button>
          </div>
        }
      />

      <div className="wrap">
        <TodaySessionsAlert bookings={todayBookings} todayDate={todayDate} />

        {actionMessage ? (
          <div className="notif show success">
            <span>🔔</span>
            <span>{actionMessage}</span>
          </div>
        ) : null}

        {!isSupabaseReady ? (
          <div className="config-alert">
            ربط Supabase غير مكتمل. أضف القيم التالية داخل البيئة:
            <strong>{missingSupabaseKeys.join(" , ")}</strong>
          </div>
        ) : null}

        {loadError ? <div className="config-alert danger">{loadError}</div> : null}

        <BookingForm
          form={form}
          isEditing={Boolean(editingBookingId)}
          isBusy={busyAction === "save"}
          canSave={isSupabaseReady}
          showExtraDetails={showExtraDetails}
          error={formError}
          onFieldChange={updateFormField}
          onToggleExtraDetails={() => setShowExtraDetails((current) => !current)}
          onSubmit={handleSubmit}
          onReset={resetForm}
          onPreview={() => openInvoicePreview()}
          onPrint={() => printInvoice()}
          onShare={() => void shareInvoice()}
        />

        <BookingStats bookings={bookings} todayDate={todayDate} />

        {bookings.length ? (
          <BookingFilters
            search={search}
            dateFilter={dateFilter}
            onSearchChange={setSearch}
            onDateFilterChange={setDateFilter}
            onClear={() => {
              setSearch("");
              setDateFilter("all");
            }}
          />
        ) : null}

        {bookings.length ? (
          <div id="blist-wrap">
            <BookingList
              bookings={visibleBookings}
              todayDate={todayDate}
              onEdit={startEditing}
              onDelete={(booking) => void handleDelete(booking)}
              onPreview={openInvoicePreview}
              onPrint={printInvoice}
              onShare={(booking) => void shareInvoice(booking)}
            />
          </div>
        ) : null}

        <div className="owner-note-inline">
          جميع الحقوق محفوظة لـ Hussein Ali Hameed
        </div>
      </div>

      <InvoiceModal
        booking={invoiceBooking}
        onClose={() => setInvoiceBooking(null)}
        onPrint={() => printInvoice(invoiceBooking ?? undefined)}
        onShare={() => void shareInvoice(invoiceBooking ?? undefined)}
      />
    </>
  );
}

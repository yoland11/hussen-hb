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

import { AdminNotificationCard } from "@/components/dashboard/admin-notification-card";
import { BrandHero } from "@/components/shared/brand-hero";
import type { DateFilterValue } from "@/lib/bookings/options";
import { generateBookingPdfFile } from "@/lib/bookings/invoice-pdf.client";
import { printInvoiceDocument } from "@/lib/bookings/invoice-print.client";
import { derivePaymentStatus } from "@/lib/bookings/schema";
import type { Booking } from "@/types/booking";
import {
  buildInvoiceNumber,
  formatCurrency,
  getCurrentSystemDateISO,
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
  isPushReady: boolean;
  missingPushKeys: string[];
  publicVapidKey: string;
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
  isPushReady,
  missingPushKeys,
  publicVapidKey,
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

  function mergeBookingIntoState(nextBooking: Booking) {
    startTransition(() => {
      setBookings((current) => {
        const exists = current.some((booking) => booking.id === nextBooking.id);

        if (!exists) {
          return [nextBooking, ...current];
        }

        return current.map((booking) =>
          booking.id === nextBooking.id ? nextBooking : booking,
        );
      });
    });
  }

  async function persistBookingPdf(source: Booking) {
    const file = await generateBookingPdfFile(source);
    const formData = new FormData();

    formData.set("file", file, file.name);

    const response = await fetch(`/api/bookings/${source.id}/pdf`, {
      method: "POST",
      body: formData,
    });

    const result = (await response.json()) as {
      booking?: Booking;
      message?: string;
    };

    if (!response.ok || !result.booking) {
      throw new Error(result.message ?? "تعذر حفظ PDF الحجز.");
    }

    return result.booking;
  }

  function printInvoice(source?: Booking) {
    const booking = getPreviewCandidate(source);

    if (!booking) {
      return;
    }

    void printInvoiceDocument(booking).catch((error: unknown) => {
      setFormError(
        error instanceof Error
          ? error.message
          : "تعذر فتح نافذة الطباعة حالياً.",
      );
    });
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

  function downloadSavedPdf(source?: Booking) {
    const booking = source ?? invoiceBooking;

    if (!booking?.invoice_pdf_path) {
      setFormError("لا يوجد PDF محفوظ لهذا الحجز حتى الآن.");
      return;
    }

    window.open(`/api/bookings/${booking.id}/pdf`, "_blank", "noopener,noreferrer");
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

      let finalBooking = result.booking;
      let pdfSaved = false;

      mergeBookingIntoState(finalBooking);

      try {
        finalBooking = await persistBookingPdf(result.booking);
        pdfSaved = true;
        mergeBookingIntoState(finalBooking);
      } catch (pdfError) {
        setActionMessage(
          pdfError instanceof Error
            ? `تم حفظ الحجز لكن تعذر حفظ PDF: ${pdfError.message}`
            : "تم حفظ الحجز لكن تعذر حفظ PDF.",
        );
      }

      if (pdfSaved) {
        setActionMessage(
          editingBookingId
            ? "تم تحديث الحجز وحفظ ملف PDF داخل مجلد الحجوزات."
            : "تم حفظ الحجز وحفظ ملف PDF داخل مجلد الحجوزات.",
        );
      }

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

        <AdminNotificationCard
          isPushConfigured={isPushReady}
          missingPushKeys={missingPushKeys}
          publicVapidKey={publicVapidKey}
        />

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
              onDownloadPdf={downloadSavedPdf}
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
        onDownloadPdf={() => downloadSavedPdf(invoiceBooking ?? undefined)}
      />
    </>
  );
}

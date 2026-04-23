"use client";

import { useMemo, useState, type FormEvent } from "react";

import type { AdminSecuritySnapshot } from "@/types/auth";
import { formatDateTimeLabel } from "@/lib/utils";

type AdminSecurityCardProps = {
  initialSnapshot: AdminSecuritySnapshot;
};

type PinFormState = {
  currentPin: string;
  nextPin: string;
  confirmPin: string;
};

const EMPTY_FORM: PinFormState = {
  currentPin: "",
  nextPin: "",
  confirmPin: "",
};

export function AdminSecurityCard({
  initialSnapshot,
}: AdminSecurityCardProps) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [form, setForm] = useState<PinFormState>(EMPTY_FORM);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const lockMessage = useMemo(() => {
    if (!snapshot.lockedUntil) {
      return "الحماية مفعلة بشكل طبيعي";
    }

    return `مقفل حتى ${formatDateTimeLabel(snapshot.lockedUntil)}`;
  }, [snapshot.lockedUntil]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setIsPending(true);

    try {
      const response = await fetch("/api/auth/pin", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const result = (await response.json()) as {
        message?: string;
        snapshot?: AdminSecuritySnapshot;
      };

      if (!response.ok || !result.snapshot) {
        setError(result.message ?? "تعذر تغيير PIN حالياً.");
        return;
      }

      setSnapshot(result.snapshot);
      setSuccess(result.message ?? "تم تحديث PIN بنجاح.");
      setForm(EMPTY_FORM);
      setIsExpanded(false);
    } catch {
      setError("تعذر الاتصال بالخادم أثناء تغيير PIN.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <section className="card security-card">
      <div className="security-head">
        <div>
          <div className="ctitle security-title">
            <span className="cicon">🔐</span>
            <span>أمان تسجيل الدخول</span>
          </div>
          <p className="security-copy">
            إدارة محاولات الدخول، آخر جلسة ناجحة، وتغيير PIN من داخل النظام.
          </p>
        </div>

        <button
          className="secbtn preview"
          type="button"
          onClick={() => {
            setError(null);
            setSuccess(null);
            setIsExpanded((current) => !current);
          }}
        >
          {isExpanded ? "إغلاق النموذج" : "تغيير PIN"}
        </button>
      </div>

      <div className="security-stats">
        <div className="security-stat">
          <span>آخر تسجيل دخول</span>
          <strong>{formatDateTimeLabel(snapshot.lastLoginAt)}</strong>
        </div>
        <div className="security-stat">
          <span>المحاولات الفاشلة</span>
          <strong>{snapshot.failedAttemptsTotal}</strong>
        </div>
        <div className="security-stat">
          <span>الحالة الحالية</span>
          <strong>{lockMessage}</strong>
        </div>
      </div>

      {snapshot.storageMode === "env" ? (
        <div className="config-alert compact">
          تغيير PIN وتتبع المحاولات بشكل دائم يحتاج تشغيل آخر نسخة من{" "}
          <code>schema.sql</code> على Supabase.
        </div>
      ) : null}

      {error ? <div className="inline-error wide">{error}</div> : null}
      {success ? <div className="inline-success wide">{success}</div> : null}

      {isExpanded ? (
        <form className="security-form" onSubmit={handleSubmit}>
          <label>
            PIN الحالي
            <input
              type="password"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={form.currentPin}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  currentPin: event.target.value.replace(/\D/g, "").slice(0, 12),
                }))
              }
              disabled={isPending}
            />
          </label>

          <label>
            PIN الجديد
            <input
              type="password"
              inputMode="numeric"
              autoComplete="new-password"
              value={form.nextPin}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  nextPin: event.target.value.replace(/\D/g, "").slice(0, 12),
                }))
              }
              disabled={isPending}
            />
          </label>

          <label>
            تأكيد PIN الجديد
            <input
              type="password"
              inputMode="numeric"
              autoComplete="new-password"
              value={form.confirmPin}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  confirmPin: event.target.value.replace(/\D/g, "").slice(0, 12),
                }))
              }
              disabled={isPending}
            />
          </label>

          <div className="security-actions">
            <button
              className="savebtn"
              type="submit"
              disabled={
                isPending ||
                snapshot.storageMode !== "database" ||
                form.currentPin.length < 4 ||
                form.nextPin.length < 4 ||
                form.confirmPin.length < 4
              }
            >
              {isPending ? "جارٍ الحفظ..." : "حفظ PIN الجديد"}
            </button>
          </div>
        </form>
      ) : null}
    </section>
  );
}

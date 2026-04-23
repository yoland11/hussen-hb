"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";

import { PinSlotInput } from "@/components/auth/pin-slot-input";

function formatRemainingTime(ms: number) {
  const totalSeconds = Math.max(1, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (!minutes) {
    return `${totalSeconds} ثانية`;
  }

  if (!seconds) {
    return `${minutes} دقيقة`;
  }

  return `${minutes} دقيقة و${seconds} ثانية`;
}

export function LoginForm({ authReady }: { authReady: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const formRef = useRef<HTMLFormElement | null>(null);
  const [pin, setPin] = useState("");
  const [rememberDevice, setRememberDevice] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [shake, setShake] = useState(false);
  const [retryUntil, setRetryUntil] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const expiredMessage =
    searchParams.get("reason") === "expired"
      ? "انتهت الجلسة بسبب عدم النشاط. أدخل PIN من جديد للمتابعة."
      : null;

  const retryRemainingMs = useMemo(
    () => Math.max(0, (retryUntil ?? 0) - now),
    [now, retryUntil],
  );

  useEffect(() => {
    if (!retryUntil) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setNow(Date.now());
    }, 250);

    return () => window.clearInterval(intervalId);
  }, [retryUntil]);

  useEffect(() => {
    if (!shake) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setShake(false);
    }, 480);

    return () => window.clearTimeout(timeoutId);
  }, [shake]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isPending || retryRemainingMs > 0 || pin.length < 4) {
      return;
    }

    setError(null);
    setSuccess(null);
    setIsPending(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ pin, rememberDevice }),
      });

      const result = (await response.json()) as {
        message?: string;
        retryAfterMs?: number;
      };

      if (!response.ok) {
        setError(result.message ?? "تعذر تسجيل الدخول حالياً.");
        setSuccess(null);
        setShake(true);
        setPin("");

        if (result.retryAfterMs) {
          setRetryUntil(Date.now() + result.retryAfterMs);
        }

        return;
      }

      setSuccess(result.message ?? "تم تسجيل الدخول بنجاح.");
      window.setTimeout(() => {
        router.replace("/dashboard");
        router.refresh();
      }, 420);
    } catch {
      setError("تعذر الاتصال بالخادم حالياً.");
      setShake(true);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <section className="card login-card">
      <div className="login-badge">لوحة الإدارة</div>
      <h2 className="login-title">تسجيل الدخول عبر PIN</h2>
      <p className="login-subtitle">
        وصول الإدارة محمي عبر PIN آمن مع قفل تلقائي وتأخير تدريجي ضد التخمين.
      </p>

      {!authReady ? (
        <div className="config-alert compact">
          يجب ضبط <code>ADMIN_PIN_HASH</code> و<code>AUTH_SECRET</code> داخل ملف
          البيئة قبل استخدام صفحة الإدارة.
        </div>
      ) : null}

      <form className="login-form" onSubmit={handleSubmit} ref={formRef}>
        <div className="login-field-head">
          <label htmlFor="pin">PIN الإدارة</label>
          <span className="login-field-hint">من 4 إلى 12 رقماً</span>
        </div>

        <PinSlotInput
          id="pin"
          value={pin}
          onChange={(nextValue) => {
            setPin(nextValue);
            setError(null);
            setSuccess(null);
          }}
          disabled={isPending || retryRemainingMs > 0 || !authReady}
          autoFocus
          maxLength={12}
          minVisibleSlots={6}
          className="pin-input-shell"
          inputClassName="pin-input-native"
          shake={shake}
          ariaLabel="أدخل PIN الإدارة"
          onEnter={() => formRef.current?.requestSubmit()}
        />

        <div className="login-meta-row">
          <label className="login-trust-toggle">
            <input
              type="checkbox"
              checked={rememberDevice}
              onChange={(event) => setRememberDevice(event.target.checked)}
              disabled={isPending}
            />
            <span>تذكر هذا الجهاز الموثوق</span>
          </label>

          {retryRemainingMs > 0 ? (
            <span className="login-retry-note">
              المحاولة التالية بعد {formatRemainingTime(retryRemainingMs)}
            </span>
          ) : null}
        </div>

        {error ?? expiredMessage ? (
          <div className="inline-error">{error ?? expiredMessage}</div>
        ) : null}
        {success ? <div className="inline-success">{success}</div> : null}

        <button
          className="savebtn login-submit"
          type="submit"
          disabled={
            isPending || retryRemainingMs > 0 || pin.length < 4 || !authReady
          }
        >
          {isPending ? "جارٍ التحقق..." : "دخول لوحة التحكم"}
        </button>
      </form>
    </section>
  );
}

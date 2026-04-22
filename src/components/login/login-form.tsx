"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export function LoginForm({ authReady }: { authReady: boolean }) {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsPending(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ pin }),
      });

      const result = (await response.json()) as { message?: string };

      if (!response.ok) {
        setError(result.message ?? "تعذر تسجيل الدخول حالياً.");
        return;
      }

      router.replace("/dashboard");
      router.refresh();
    } catch {
      setError("تعذر الاتصال بالخادم حالياً.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <section className="card login-card">
      <div className="login-badge">لوحة الإدارة</div>
      <h2 className="login-title">تسجيل الدخول عبر PIN</h2>
      <p className="login-subtitle">
        الوصول إلى الحجوزات ولوحة التحكم متاح فقط عبر رمز PIN محفوظ بشكل آمن.
      </p>

      {!authReady && (
        <div className="config-alert compact">
          يجب ضبط <code>ADMIN_PIN_HASH</code> و<code>AUTH_SECRET</code> داخل ملف
          البيئة قبل استخدام صفحة الإدارة.
        </div>
      )}

      <form className="login-form" onSubmit={handleSubmit}>
        <label htmlFor="pin">PIN الإدارة</label>
        <input
          id="pin"
          type="password"
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder="أدخل PIN"
          value={pin}
          onChange={(event) => setPin(event.target.value)}
          disabled={isPending}
        />

        {error ? <div className="inline-error">{error}</div> : null}

        <button className="savebtn" type="submit" disabled={isPending}>
          {isPending ? "جارٍ التحقق..." : "دخول لوحة التحكم"}
        </button>
      </form>
    </section>
  );
}

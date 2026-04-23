"use client";

import { useEffect, useMemo, useState } from "react";

import { urlBase64ToUint8Array } from "@/lib/pwa/vapid";

type AdminNotificationCardProps = {
  isPushConfigured: boolean;
  missingPushKeys: string[];
  publicVapidKey: string;
};

type NotificationState =
  | "loading"
  | "unsupported"
  | "unavailable"
  | "blocked"
  | "disabled"
  | "enabled";

async function getPushSubscription() {
  const registration = await navigator.serviceWorker.ready;
  return registration.pushManager.getSubscription();
}

export function AdminNotificationCard({
  isPushConfigured,
  missingPushKeys,
  publicVapidKey,
}: AdminNotificationCardProps) {
  const [status, setStatus] = useState<NotificationState>("loading");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<"enable" | "disable" | null>(null);

  const isSupported = useMemo(
    () =>
      typeof window !== "undefined" &&
      "Notification" in window &&
      "serviceWorker" in navigator &&
      "PushManager" in window,
    [],
  );
  const effectiveStatus: NotificationState = !isSupported
    ? "unsupported"
    : !isPushConfigured || !publicVapidKey
      ? "unavailable"
      : status;

  useEffect(() => {
    if (!isSupported || !isPushConfigured || !publicVapidKey) {
      return;
    }

    let isMounted = true;

    void getPushSubscription()
      .then((subscription) => {
        if (!isMounted) {
          return;
        }

        if (Notification.permission === "denied") {
          setStatus("blocked");
          return;
        }

        setStatus(subscription ? "enabled" : "disabled");
      })
      .catch(() => {
        if (isMounted) {
          setStatus("disabled");
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isPushConfigured, isSupported, publicVapidKey]);

  async function enableNotifications() {
    try {
      setBusy("enable");
      setError(null);

      const permission = await Notification.requestPermission();

      if (permission !== "granted") {
        setStatus(permission === "denied" ? "blocked" : "disabled");
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const existingSubscription =
        await registration.pushManager.getSubscription();
      const subscription =
        existingSubscription ??
        (await registration.pushManager.subscribe({
          applicationServerKey: urlBase64ToUint8Array(publicVapidKey),
          userVisibleOnly: true,
        }));

      const response = await fetch("/api/notifications/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
        }),
      });

      const result = (await response.json()) as { message?: string };

      if (!response.ok) {
        throw new Error(result.message ?? "تعذر تفعيل الإشعارات.");
      }

      setStatus("enabled");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "تعذر تفعيل الإشعارات حالياً.",
      );
      setStatus("disabled");
    } finally {
      setBusy(null);
    }
  }

  async function disableNotifications() {
    try {
      setBusy("disable");
      setError(null);

      const subscription = await getPushSubscription();

      if (subscription) {
        await fetch("/api/notifications/subscribe", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            endpoint: subscription.endpoint,
          }),
        });

        await subscription.unsubscribe();
      }

      setStatus("disabled");
    } catch {
      setError("تعذر إيقاف الإشعارات حالياً.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="card notification-card">
      <div className="ctitle">
        <span className="cicon">🔔</span>
        <span>إشعارات الإدارة</span>
      </div>

      <p className="notification-copy">
        فعّل الإشعارات ليستقبل جهاز الإدارة تنبيهاً فور إضافة حجز جديد.
      </p>

      {!isPushConfigured ? (
        <div className="config-alert compact">
          إعدادات Web Push غير مكتملة. أضف القيم:
          <strong>{missingPushKeys.join(" , ")}</strong>
        </div>
      ) : null}

      {!isSupported ? (
        <div className="config-alert compact">
          هذا المتصفح لا يدعم Push Notifications أو Service Workers بشكل كامل.
        </div>
      ) : null}

      {effectiveStatus === "blocked" ? (
        <div className="config-alert compact danger">
          تم حظر الإشعارات من المتصفح. فعّلها من إعدادات الموقع ثم أعد المحاولة.
        </div>
      ) : null}

      {error ? <div className="inline-error wide">{error}</div> : null}

      <div className="notification-actions">
        <span
          className={`notification-status ${effectiveStatus === "enabled" ? "enabled" : ""}`.trim()}
        >
          {effectiveStatus === "enabled"
            ? "الإشعارات مفعلة"
            : effectiveStatus === "loading"
              ? "جارٍ فحص الحالة..."
              : effectiveStatus === "unsupported"
                ? "الإشعارات غير مدعومة"
                : effectiveStatus === "unavailable"
                  ? "إعدادات الإشعارات غير مكتملة"
              : "الإشعارات غير مفعلة"}
        </span>

        {effectiveStatus === "enabled" ? (
          <button
            className="secbtn clear"
            type="button"
            onClick={() => void disableNotifications()}
            disabled={busy === "disable"}
          >
            {busy === "disable" ? "جارٍ الإيقاف..." : "إيقاف الإشعارات"}
          </button>
        ) : (
          <button
            className="secbtn preview"
            type="button"
            onClick={() => void enableNotifications()}
            disabled={
              busy === "enable" ||
              !isPushConfigured ||
              !isSupported ||
              effectiveStatus === "blocked"
            }
          >
            {busy === "enable" ? "جارٍ التفعيل..." : "تفعيل الإشعارات"}
          </button>
        )}
      </div>
    </section>
  );
}

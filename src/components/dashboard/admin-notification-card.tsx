"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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

const CARD_HIDE_DURATION_MS = 280;

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
  const [hasResolvedSubscription, setHasResolvedSubscription] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const hideTimeoutRef = useRef<number | null>(null);

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

  const clearHideTimeout = useCallback(() => {
    if (hideTimeoutRef.current !== null) {
      window.clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  }, []);

  const revealCard = useCallback((nextStatus: NotificationState) => {
    clearHideTimeout();
    setIsLeaving(false);
    setIsVisible(true);
    setStatus(nextStatus);
  }, [clearHideTimeout]);

  const hideCard = useCallback((
    nextStatus: NotificationState,
    animate: boolean,
  ) => {
    clearHideTimeout();
    setStatus(nextStatus);

    if (!animate) {
      setIsLeaving(false);
      setIsVisible(false);
      return;
    }

    setIsLeaving(true);
    hideTimeoutRef.current = window.setTimeout(() => {
      setIsVisible(false);
      setIsLeaving(false);
      hideTimeoutRef.current = null;
    }, CARD_HIDE_DURATION_MS);
  }, [clearHideTimeout]);

  const applySubscriptionState = useCallback((
    subscription: PushSubscription | null,
    options?: { animateHide?: boolean },
  ) => {
    const hasSubscription = Boolean(subscription);

    setHasResolvedSubscription(true);
    setIsSubscribed(hasSubscription);

    if (Notification.permission === "denied") {
      revealCard("blocked");
      return;
    }

    if (hasSubscription) {
      hideCard("enabled", options?.animateHide ?? false);
      return;
    }

    revealCard("disabled");
  }, [hideCard, revealCard]);

  useEffect(() => {
    if (!isSupported || !isPushConfigured || !publicVapidKey) {
      return;
    }

    let isMounted = true;
    const syncSubscriptionState = () => {
      void getPushSubscription()
        .then((subscription) => {
          if (isMounted) {
            applySubscriptionState(subscription);
          }
        })
        .catch(() => {
          if (isMounted) {
            applySubscriptionState(null);
          }
        });
    };

    syncSubscriptionState();
    window.addEventListener("focus", syncSubscriptionState);
    document.addEventListener("visibilitychange", syncSubscriptionState);

    return () => {
      isMounted = false;
      clearHideTimeout();
      window.removeEventListener("focus", syncSubscriptionState);
      document.removeEventListener("visibilitychange", syncSubscriptionState);
    };
  }, [
    applySubscriptionState,
    clearHideTimeout,
    isPushConfigured,
    isSupported,
    publicVapidKey,
  ]);

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

      applySubscriptionState(subscription, { animateHide: true });
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "تعذر تفعيل الإشعارات حالياً.",
      );
      applySubscriptionState(null);
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

      applySubscriptionState(null);
    } catch {
      setError("تعذر إيقاف الإشعارات حالياً.");
    } finally {
      setBusy(null);
    }
  }

  const shouldRenderCard =
    !isSupported ||
    !isPushConfigured ||
    !publicVapidKey ||
    !hasResolvedSubscription ||
    isVisible ||
    isLeaving ||
    !isSubscribed;
  const showCompactManager =
    isSupported &&
    isPushConfigured &&
    Boolean(publicVapidKey) &&
    hasResolvedSubscription &&
    isSubscribed &&
    !isVisible &&
    !isLeaving;

  if (
    isSupported &&
    isPushConfigured &&
    publicVapidKey &&
    !hasResolvedSubscription
  ) {
    return null;
  }

  if (!shouldRenderCard) {
    return showCompactManager ? (
      <div className="notification-mini">
        <span className="notification-mini-status">الإشعارات مفعلة</span>
        <button
          className="notification-mini-btn"
          type="button"
          onClick={() => void disableNotifications()}
          disabled={busy === "disable"}
        >
          {busy === "disable" ? "جارٍ الإيقاف..." : "إلغاء التفعيل"}
        </button>
      </div>
    ) : null;
  }

  return (
    <section
      className={`card notification-card ${isLeaving ? "is-leaving" : "is-visible"}`.trim()}
      aria-hidden={isLeaving ? "true" : undefined}
    >
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

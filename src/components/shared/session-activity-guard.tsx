"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

type SessionActivityGuardProps = {
  timeoutMs: number;
};

const ACTIVITY_EVENTS = [
  "pointerdown",
  "keydown",
  "touchstart",
  "mousemove",
  "scroll",
] as const;

export function SessionActivityGuard({
  timeoutMs,
}: SessionActivityGuardProps) {
  const router = useRouter();
  const lastActivityRef = useRef(0);
  const hasExpiredRef = useRef(false);

  useEffect(() => {
    function markActivity() {
      lastActivityRef.current = Date.now();
    }

    async function expireSession() {
      if (hasExpiredRef.current) {
        return;
      }

      hasExpiredRef.current = true;

      try {
        await fetch("/api/auth/logout", { method: "POST" });
      } catch {
        // Ignore logout request failures and still redirect to login.
      }

      router.replace("/login?reason=expired");
      router.refresh();
    }

    function checkIdleState() {
      if (Date.now() - lastActivityRef.current >= timeoutMs) {
        void expireSession();
      }
    }

    function handleVisibilityChange() {
      if (!document.hidden) {
        markActivity();
      }
    }

    markActivity();

    for (const eventName of ACTIVITY_EVENTS) {
      window.addEventListener(eventName, markActivity, { passive: true });
    }

    window.addEventListener("focus", markActivity);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    const intervalId = window.setInterval(checkIdleState, 15_000);

    return () => {
      window.clearInterval(intervalId);

      for (const eventName of ACTIVITY_EVENTS) {
        window.removeEventListener(eventName, markActivity);
      }

      window.removeEventListener("focus", markActivity);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [router, timeoutMs]);

  return null;
}

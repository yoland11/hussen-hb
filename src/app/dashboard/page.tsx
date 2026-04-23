import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { getAdminSecuritySnapshot } from "@/lib/auth/security";
import { redirectIfUnauthenticated } from "@/lib/auth/guards";
import { listBookings } from "@/lib/bookings/service";
import {
  getServerEnvState,
  hasPushConfig,
  hasSupabaseConfig,
} from "@/lib/env";
import type { Booking } from "@/types/booking";
import type { AdminSecuritySnapshot } from "@/types/auth";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  await redirectIfUnauthenticated();

  const envState = getServerEnvState();
  const supabaseReady = hasSupabaseConfig();
  const pushReady = hasPushConfig();
  let securitySnapshot: AdminSecuritySnapshot = {
    consecutiveFailedAttempts: 0,
    failedAttemptsTotal: 0,
    lastFailedAt: null,
    lastLoginAt: null,
    lockedUntil: null,
    retryAfterUntil: null,
    storageMode: supabaseReady ? "database" : "env",
  };

  let initialBookings: Booking[] = [];
  let loadError: string | null = null;

  try {
    securitySnapshot = await getAdminSecuritySnapshot();
  } catch {
    // Ignore security snapshot errors and keep dashboard functional.
  }

  if (supabaseReady) {
    try {
      initialBookings = await listBookings();
    } catch (error) {
      loadError =
        error instanceof Error
          ? error.message
          : "تعذر قراءة الحجوزات من قاعدة البيانات.";
    }
  }

  return (
    <main className="app-shell">
      <DashboardClient
        initialBookings={initialBookings}
        isSupabaseReady={supabaseReady}
        missingSupabaseKeys={envState.missingSupabaseKeys}
        isPushReady={pushReady}
        missingPushKeys={envState.missingPushKeys}
        publicVapidKey={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ""}
        initialSecuritySnapshot={securitySnapshot}
        loadError={loadError}
      />
    </main>
  );
}

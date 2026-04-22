import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { redirectIfUnauthenticated } from "@/lib/auth/guards";
import { listBookings } from "@/lib/bookings/service";
import { getServerEnvState, hasSupabaseConfig } from "@/lib/env";
import type { Booking } from "@/types/booking";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  await redirectIfUnauthenticated();

  const envState = getServerEnvState();
  const supabaseReady = hasSupabaseConfig();

  let initialBookings: Booking[] = [];
  let loadError: string | null = null;

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
        loadError={loadError}
      />
    </main>
  );
}

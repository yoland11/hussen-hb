import "server-only";

import webPush, { type PushSubscription } from "web-push";

import type { Booking } from "@/types/booking";

import { getVapidConfig, hasPushConfig } from "@/lib/env";
import { formatDateLabel } from "@/lib/utils";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

type StoredSubscriptionRow = {
  endpoint: string;
  keys_p256dh: string;
  keys_auth: string;
};

let isWebPushConfigured = false;

function configureWebPush() {
  if (!isWebPushConfigured) {
    const vapid = getVapidConfig();

    webPush.setVapidDetails(vapid.subject, vapid.publicKey, vapid.privateKey);
    isWebPushConfigured = true;
  }

  return webPush;
}

export async function upsertNotificationSubscription(
  subscription: PushSubscription,
  userAgent = "",
) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("notification_subscriptions").upsert(
    {
      endpoint: subscription.endpoint,
      keys_p256dh: subscription.keys.p256dh,
      keys_auth: subscription.keys.auth,
      user_agent: userAgent,
    },
    {
      onConflict: "endpoint",
    },
  );

  if (error) {
    throw new Error(error.message);
  }
}

export async function removeNotificationSubscription(endpoint: string) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("notification_subscriptions")
    .delete()
    .eq("endpoint", endpoint);

  if (error) {
    throw new Error(error.message);
  }
}

function mapStoredSubscription(row: StoredSubscriptionRow): PushSubscription {
  return {
    endpoint: row.endpoint,
    expirationTime: null,
    keys: {
      auth: row.keys_auth,
      p256dh: row.keys_p256dh,
    },
  };
}

export async function notifyAdminsAboutNewBooking(booking: Booking) {
  if (!hasPushConfig()) {
    return;
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("notification_subscriptions")
    .select("endpoint, keys_p256dh, keys_auth");

  if (error) {
    throw new Error(error.message);
  }

  if (!data?.length) {
    return;
  }

  const pushClient = configureWebPush();
  const payload = JSON.stringify({
    title: "حجز جديد",
    body: `${booking.customer_name} - ${formatDateLabel(booking.booking_date)}`,
    url: "/dashboard",
  });

  await Promise.all(
    data.map(async (row) => {
      try {
        await pushClient.sendNotification(mapStoredSubscription(row), payload);
      } catch (error) {
        if (
          error &&
          typeof error === "object" &&
          "statusCode" in error &&
          (error.statusCode === 404 || error.statusCode === 410)
        ) {
          await removeNotificationSubscription(row.endpoint);
        }
      }
    }),
  );
}

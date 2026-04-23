const authKeys = ["ADMIN_PIN_HASH", "AUTH_SECRET"] as const;
const supabaseKeys = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
] as const;
const pushKeys = [
  "NEXT_PUBLIC_VAPID_PUBLIC_KEY",
  "VAPID_PRIVATE_KEY",
  "VAPID_SUBJECT",
] as const;

type EnvKey =
  | (typeof authKeys)[number]
  | (typeof supabaseKeys)[number]
  | (typeof pushKeys)[number]
  | "SUPABASE_BOOKINGS_BUCKET";

function getMissing(keys: readonly EnvKey[]) {
  return keys.filter((key) => !process.env[key]);
}

export function getServerEnvState() {
  return {
    missingAuthKeys: getMissing(authKeys),
    missingSupabaseKeys: getMissing(supabaseKeys),
    missingPushKeys: getMissing(pushKeys),
  };
}

export function hasAuthConfig() {
  return getMissing(authKeys).length === 0;
}

export function hasSupabaseConfig() {
  return getMissing(supabaseKeys).length === 0;
}

export function hasPushConfig() {
  return getMissing(pushKeys).length === 0;
}

function requireEnv(key: EnvKey) {
  const value = process.env[key];

  if (!value) {
    throw new Error(`Missing environment variable: ${key}`);
  }

  return value;
}

export function getAuthSecret() {
  return requireEnv("AUTH_SECRET");
}

export function getAdminPinHash() {
  return requireEnv("ADMIN_PIN_HASH");
}

export function getSupabaseCredentials() {
  return {
    url: requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    serviceRoleKey: requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
  };
}

export function getVapidConfig() {
  return {
    publicKey: requireEnv("NEXT_PUBLIC_VAPID_PUBLIC_KEY"),
    privateKey: requireEnv("VAPID_PRIVATE_KEY"),
    subject: requireEnv("VAPID_SUBJECT"),
  };
}

export function getBookingsBucketName() {
  return process.env.SUPABASE_BOOKINGS_BUCKET?.trim() || "booking-files";
}

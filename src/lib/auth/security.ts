import "server-only";

import bcrypt from "bcryptjs";

import { hasSupabaseConfig, getAdminPinHash } from "@/lib/env";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { AdminSecuritySnapshot } from "@/types/auth";

const AUTH_SETTINGS_TABLE = "admin_security_settings";
const AUTH_SETTINGS_KEY = "primary";
const SHORT_LOCK_MS = 30_000;
const LONG_LOCK_MS = 5 * 60_000;

type AdminSecurityRow = {
  key: string;
  pin_hash: string | null;
  consecutive_failed_attempts: number | null;
  failed_attempts_total: number | null;
  last_failed_at: string | null;
  last_login_at: string | null;
  locked_until: string | null;
  retry_after_until: string | null;
};

type SecurityContext = {
  row: AdminSecurityRow;
  storageMode: "database" | "env";
};

type FailedLoginResult = {
  ok: false;
  message: string;
  retryAfterMs: number;
  snapshot: AdminSecuritySnapshot;
  status: 401 | 429;
};

type SuccessfulLoginResult = {
  ok: true;
  snapshot: AdminSecuritySnapshot;
};

export type AdminLoginAttemptResult =
  | FailedLoginResult
  | SuccessfulLoginResult;

function buildFallbackRow(): AdminSecurityRow {
  return {
    key: AUTH_SETTINGS_KEY,
    pin_hash: getAdminPinHash(),
    consecutive_failed_attempts: 0,
    failed_attempts_total: 0,
    last_failed_at: null,
    last_login_at: null,
    locked_until: null,
    retry_after_until: null,
  };
}

function normalizeRow(row: AdminSecurityRow | null | undefined): AdminSecurityRow {
  const fallback = buildFallbackRow();

  return {
    ...fallback,
    ...row,
    pin_hash: row?.pin_hash?.trim() || fallback.pin_hash,
    consecutive_failed_attempts: row?.consecutive_failed_attempts ?? 0,
    failed_attempts_total: row?.failed_attempts_total ?? 0,
  };
}

function isRelationMissingError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "42P01"
  );
}

async function readSecurityRow() {
  if (!hasSupabaseConfig()) {
    return null;
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from(AUTH_SETTINGS_TABLE)
    .select(
      "key, pin_hash, consecutive_failed_attempts, failed_attempts_total, last_failed_at, last_login_at, locked_until, retry_after_until",
    )
    .eq("key", AUTH_SETTINGS_KEY)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data ?? null) as AdminSecurityRow | null;
}

async function insertSecurityRow() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from(AUTH_SETTINGS_TABLE)
    .insert({
      key: AUTH_SETTINGS_KEY,
      pin_hash: getAdminPinHash(),
    })
    .select(
      "key, pin_hash, consecutive_failed_attempts, failed_attempts_total, last_failed_at, last_login_at, locked_until, retry_after_until",
    )
    .single();

  if (error) {
    throw error;
  }

  return data as AdminSecurityRow;
}

async function getSecurityContext(): Promise<SecurityContext> {
  if (!hasSupabaseConfig()) {
    return {
      row: buildFallbackRow(),
      storageMode: "env",
    };
  }

  try {
    const existing = await readSecurityRow();

    if (existing) {
      return {
        row: normalizeRow(existing),
        storageMode: "database",
      };
    }

    return {
      row: normalizeRow(await insertSecurityRow()),
      storageMode: "database",
    };
  } catch (error) {
    if (isRelationMissingError(error)) {
      return {
        row: buildFallbackRow(),
        storageMode: "env",
      };
    }

    throw error;
  }
}

function toSnapshot(
  row: AdminSecurityRow,
  storageMode: "database" | "env",
): AdminSecuritySnapshot {
  return {
    consecutiveFailedAttempts: row.consecutive_failed_attempts ?? 0,
    failedAttemptsTotal: row.failed_attempts_total ?? 0,
    lastFailedAt: row.last_failed_at,
    lastLoginAt: row.last_login_at,
    lockedUntil: row.locked_until,
    retryAfterUntil: row.retry_after_until,
    storageMode,
  };
}

function getRemainingMs(until: string | null | undefined) {
  if (!until) {
    return 0;
  }

  const ms = new Date(until).getTime() - Date.now();
  return Number.isFinite(ms) && ms > 0 ? ms : 0;
}

function getProgressiveDelayMs(attempts: number) {
  return Math.min(5_000, 600 * 2 ** Math.max(0, attempts - 1));
}

async function updateSecurityRow(patch: Partial<AdminSecurityRow>) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from(AUTH_SETTINGS_TABLE)
    .update(patch)
    .eq("key", AUTH_SETTINGS_KEY)
    .select(
      "key, pin_hash, consecutive_failed_attempts, failed_attempts_total, last_failed_at, last_login_at, locked_until, retry_after_until",
    )
    .single();

  if (error) {
    throw error;
  }

  return data as AdminSecurityRow;
}

function buildThrottledMessage(retryAfterMs: number, isLock: boolean) {
  const seconds = Math.max(1, Math.ceil(retryAfterMs / 1000));

  if (isLock) {
    return `تم قفل تسجيل الدخول مؤقتاً. حاول مجدداً بعد ${seconds} ثانية.`;
  }

  return `انتظر ${seconds} ثانية قبل محاولة PIN جديدة.`;
}

export async function getAdminSecuritySnapshot() {
  const context = await getSecurityContext();
  return toSnapshot(context.row, context.storageMode);
}

export async function attemptAdminLogin(pin: string): Promise<AdminLoginAttemptResult> {
  const context = await getSecurityContext();
  const now = new Date();
  const lockRemainingMs = getRemainingMs(context.row.locked_until);

  if (lockRemainingMs > 0) {
    return {
      ok: false,
      message: buildThrottledMessage(lockRemainingMs, true),
      retryAfterMs: lockRemainingMs,
      snapshot: toSnapshot(context.row, context.storageMode),
      status: 429,
    };
  }

  const retryRemainingMs = getRemainingMs(context.row.retry_after_until);

  if (retryRemainingMs > 0) {
    return {
      ok: false,
      message: buildThrottledMessage(retryRemainingMs, false),
      retryAfterMs: retryRemainingMs,
      snapshot: toSnapshot(context.row, context.storageMode),
      status: 429,
    };
  }

  const activeHash = context.row.pin_hash?.trim() || getAdminPinHash();
  const isValid = await bcrypt.compare(pin, activeHash);

  if (isValid) {
    if (context.storageMode === "database") {
      const updated = await updateSecurityRow({
        consecutive_failed_attempts: 0,
        last_login_at: now.toISOString(),
        locked_until: null,
        retry_after_until: null,
      });

      return {
        ok: true,
        snapshot: toSnapshot(updated, context.storageMode),
      };
    }

    return {
      ok: true,
      snapshot: toSnapshot(
        {
          ...context.row,
          consecutive_failed_attempts: 0,
          last_login_at: now.toISOString(),
          locked_until: null,
          retry_after_until: null,
        },
        context.storageMode,
      ),
    };
  }

  const nextConsecutiveAttempts = (context.row.consecutive_failed_attempts ?? 0) + 1;
  const nextFailedAttemptsTotal = (context.row.failed_attempts_total ?? 0) + 1;
  const lockMs =
    nextConsecutiveAttempts >= 5
      ? LONG_LOCK_MS
      : nextConsecutiveAttempts >= 3
        ? SHORT_LOCK_MS
        : 0;
  const retryAfterMs = lockMs || getProgressiveDelayMs(nextConsecutiveAttempts);

  if (context.storageMode === "database") {
    const updated = await updateSecurityRow({
      consecutive_failed_attempts: nextConsecutiveAttempts,
      failed_attempts_total: nextFailedAttemptsTotal,
      last_failed_at: now.toISOString(),
      locked_until:
        lockMs > 0 ? new Date(now.getTime() + lockMs).toISOString() : null,
      retry_after_until:
        lockMs === 0
          ? new Date(now.getTime() + retryAfterMs).toISOString()
          : null,
    });

    return {
      ok: false,
      message:
        lockMs > 0
          ? buildThrottledMessage(retryAfterMs, true)
          : "PIN غير صحيح. حاول مرة أخرى.",
      retryAfterMs,
      snapshot: toSnapshot(updated, context.storageMode),
      status: lockMs > 0 ? 429 : 401,
    };
  }

  return {
    ok: false,
    message: "PIN غير صحيح. حاول مرة أخرى.",
    retryAfterMs,
    snapshot: toSnapshot(
      {
        ...context.row,
        consecutive_failed_attempts: nextConsecutiveAttempts,
        failed_attempts_total: nextFailedAttemptsTotal,
        last_failed_at: now.toISOString(),
      },
      context.storageMode,
    ),
    status: 401,
  };
}

export async function changeAdminPin(
  currentPin: string,
  nextPin: string,
): Promise<AdminSecuritySnapshot> {
  const context = await getSecurityContext();

  if (context.storageMode !== "database") {
    throw new Error(
      "تغيير PIN من داخل النظام يحتاج تشغيل schema.sql وتفعيل تخزين الأمان في Supabase.",
    );
  }

  const activeHash = context.row.pin_hash?.trim() || getAdminPinHash();
  const isCurrentValid = await bcrypt.compare(currentPin, activeHash);

  if (!isCurrentValid) {
    throw new Error("PIN الحالي غير صحيح.");
  }

  const nextHash = await bcrypt.hash(nextPin, 12);
  const updated = await updateSecurityRow({
    pin_hash: nextHash,
    consecutive_failed_attempts: 0,
    locked_until: null,
    retry_after_until: null,
  });

  return toSnapshot(updated, "database");
}

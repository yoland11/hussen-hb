export type AdminSecuritySnapshot = {
  consecutiveFailedAttempts: number;
  failedAttemptsTotal: number;
  lastFailedAt: string | null;
  lastLoginAt: string | null;
  lockedUntil: string | null;
  retryAfterUntil: string | null;
  storageMode: "database" | "env";
};

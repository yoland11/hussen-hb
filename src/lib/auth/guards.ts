import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  SESSION_COOKIE_NAME,
  verifyAdminSessionToken,
} from "@/lib/auth/session";

export class UnauthorizedError extends Error {
  constructor() {
    super("Unauthorized");
  }
}

export async function hasAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  return verifyAdminSessionToken(token);
}

export async function assertAdminSession() {
  const isAuthenticated = await hasAdminSession();

  if (!isAuthenticated) {
    throw new UnauthorizedError();
  }
}

export async function redirectIfUnauthenticated() {
  const isAuthenticated = await hasAdminSession();

  if (!isAuthenticated) {
    redirect("/login");
  }
}

export async function redirectIfAuthenticated() {
  const isAuthenticated = await hasAdminSession();

  if (isAuthenticated) {
    redirect("/dashboard");
  }
}

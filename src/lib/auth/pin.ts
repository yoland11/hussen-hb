import "server-only";

import bcrypt from "bcryptjs";

import { getAdminPinHash } from "@/lib/env";

export async function verifyAdminPin(pin: string) {
  return bcrypt.compare(pin, getAdminPinHash());
}

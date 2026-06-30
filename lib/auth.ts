import { cookies } from "next/headers";
import { createHash } from "crypto";

const COOKIE_NAME = "dash_auth";

function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

export function getExpectedHash(): string {
  const pw = process.env.DASHBOARD_PASSWORD;
  if (!pw) throw new Error("DASHBOARD_PASSWORD is not set");
  return hashPassword(pw);
}

export async function isAuthenticated(): Promise<boolean> {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return false;
  try {
    return token === getExpectedHash();
  } catch {
    return false;
  }
}

export { COOKIE_NAME, hashPassword };

import { NextRequest, NextResponse } from "next/server";
import { COOKIE_NAME, hashPassword, getExpectedHash } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { password } = await req.json();

  let expectedHash: string;
  try {
    expectedHash = getExpectedHash();
  } catch {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  if (hashPassword(password) !== expectedHash) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, expectedHash, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: "/",
  });
  return res;
}

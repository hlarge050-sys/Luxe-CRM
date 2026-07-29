"use server";

import { createHash, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  createSessionToken,
  SESSION_COOKIE,
  SESSION_MAX_AGE,
} from "@/lib/auth";

function safeEqual(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

export type SignInState = { error: string } | undefined;

export async function signIn(
  _prev: SignInState,
  formData: FormData
): Promise<SignInState> {
  const expected = process.env.AUTH_PASSWORD;
  if (!expected || !process.env.AUTH_SECRET) {
    return {
      error:
        "Server not configured yet. Add AUTH_PASSWORD and AUTH_SECRET in Vercel, then redeploy.",
    };
  }

  const given = String(formData.get("password") ?? "");
  if (!given || !safeEqual(given, expected)) {
    return { error: "Wrong password." };
  }

  const token = await createSessionToken();
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  redirect("/");
}

export async function signOut(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/login");
}

"use client";

import { useActionState } from "react";
import { signIn } from "@/lib/session-actions";

export default function LoginPage() {
  const [state, action, pending] = useActionState(signIn, undefined);

  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#101010] px-5">
      <div className="w-full max-w-sm">
        <div className="overflow-hidden rounded-md bg-white shadow-lg">
          <div className="h-[3px] bg-[#8EC63D]" />
          <div className="p-7">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-neutral-500">
              Luxe Landscaping Limited
            </p>
            <h1 className="mt-1 text-4xl font-bold tracking-tight text-[#101010]">
              CRM
            </h1>
            <p className="mt-1 text-sm text-neutral-500">Sign in to continue.</p>

            <form action={action} className="mt-6 space-y-3">
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoFocus
                autoComplete="current-password"
                placeholder="Password"
                className="w-full rounded border border-neutral-300 px-3 py-2.5 text-[15px] text-[#2C2C2A] outline-none focus:border-[#8EC63D] focus:ring-2 focus:ring-[#8EC63D]/30"
              />
              {state?.error && (
                <p className="text-sm text-red-600">{state.error}</p>
              )}
              <button
                type="submit"
                disabled={pending}
                className="w-full rounded bg-[#8EC63D] py-2.5 text-[15px] font-semibold text-[#101010] transition hover:brightness-95 disabled:opacity-60"
              >
                {pending ? "Signing in" : "Sign in"}
              </button>
            </form>
          </div>
        </div>
        <p className="mt-5 text-center text-[11px] text-neutral-500">
          Co. No. 14902951 | Internal system
        </p>
      </div>
    </main>
  );
}

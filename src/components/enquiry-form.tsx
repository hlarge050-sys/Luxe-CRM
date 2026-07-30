"use client";

// The front door. Built to be filled in one-handed while the caller is still
// talking: name, number, what they want, done. A visit date typed here files
// the job straight into Visit booked. The visit time is converted to ISO on
// the device so it lands in the right timezone whatever the server thinks.

import { useActionState, useState } from "react";
import { createEnquiry } from "@/lib/actions";

const input =
  "mt-1 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-base outline-none focus:border-[#8EC63D]";
const label = "block text-[13px] font-medium text-[#2C2C2A]";
const card =
  "rounded-md border border-neutral-200 border-l-[3px] border-l-[#8EC63D] bg-white p-4 shadow-sm";
const heading = "text-[15px] font-bold tracking-tight text-[#101010]";

function seg(on: boolean) {
  return `flex-1 rounded px-3 py-1.5 text-sm font-medium transition ${
    on ? "bg-[#101010] text-white" : "text-neutral-500"
  }`;
}

export function EnquiryForm({
  contacts,
}: {
  contacts: { id: number; name: string; town: string | null }[];
}) {
  const [state, formAction, pending] = useActionState(createEnquiry, undefined);
  const [mode, setMode] = useState<"new" | "existing">("new");
  const [siteSame, setSiteSame] = useState(true);
  const [visitLocal, setVisitLocal] = useState("");

  const visitIso = visitLocal ? new Date(visitLocal).toISOString() : "";

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="contactMode" value={mode} />
      <input type="hidden" name="visitAt" value={visitIso} />

      <section className={card}>
        <h2 className={heading}>Who is it for</h2>

        {contacts.length > 0 ? (
          <div className="mt-3 flex rounded-md border border-neutral-200 p-0.5">
            <button type="button" onClick={() => setMode("new")} className={seg(mode === "new")}>
              New contact
            </button>
            <button
              type="button"
              onClick={() => setMode("existing")}
              className={seg(mode === "existing")}
            >
              Existing
            </button>
          </div>
        ) : null}

        {mode === "existing" ? (
          <label className={`${label} mt-3`}>
            Contact
            <select name="contactId" defaultValue="" className={input}>
              <option value="" disabled>
                Pick a contact
              </option>
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                  {c.town ? `, ${c.town}` : ""}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <>
            <label className={`${label} mt-3`}>
              Name
              <input name="name" className={input} autoComplete="off" />
            </label>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <label className={label}>
                Phone
                <input name="phone" type="tel" className={input} />
              </label>
              <label className={label}>
                Email
                <input name="email" type="email" className={input} />
              </label>
            </div>
            <label className={`${label} mt-3`}>
              Address
              <input name="addressLine1" placeholder="House and street" className={input} />
            </label>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <label className={label}>
                Town
                <input name="town" className={input} />
              </label>
              <label className={label}>
                Postcode
                <input name="postcode" className={input} />
              </label>
            </div>
          </>
        )}
      </section>

      <section className={card}>
        <h2 className={heading}>The job</h2>
        <label className={`${label} mt-3`}>
          Job title
          <input name="title" required placeholder="Patio and raised beds" className={input} />
        </label>
        <label className={`${label} mt-3`}>
          Where it came from
          <select name="source" defaultValue="" className={input}>
            <option value="">Not sure</option>
            <option>Checkatrade</option>
            <option>Google</option>
            <option>Word of mouth</option>
            <option>Website</option>
            <option>Returning client</option>
            <option>Other</option>
          </select>
        </label>
        <label className={`${label} mt-3`}>
          Site visit
          <input
            type="datetime-local"
            value={visitLocal}
            onChange={(e) => setVisitLocal(e.target.value)}
            className={input}
          />
        </label>
        <p className="mt-1 text-xs text-neutral-400">
          Leave empty if nothing is booked. A visit date files the job straight
          into Visit booked.
        </p>

        <label className="mt-3 flex items-center gap-2 text-sm text-[#2C2C2A]">
          <input
            type="checkbox"
            name="siteSame"
            checked={siteSame}
            onChange={(e) => setSiteSame(e.target.checked)}
            className="h-4 w-4 accent-[#8EC63D]"
          />
          Work is at the contact address
        </label>

        {!siteSame ? (
          <>
            <label className={`${label} mt-3`}>
              Site address
              <input name="siteAddressLine1" placeholder="House and street" className={input} />
            </label>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <label className={label}>
                Town
                <input name="siteTown" className={input} />
              </label>
              <label className={label}>
                Postcode
                <input name="sitePostcode" className={input} />
              </label>
            </div>
          </>
        ) : null}
      </section>

      <section className={card}>
        <h2 className={heading}>First note</h2>
        <textarea
          name="notes"
          rows={3}
          placeholder="What they described on the phone (optional)"
          className={`${input} mt-3`}
        />
      </section>

      {state?.error ? <p className="text-sm text-red-700">{state.error}</p> : null}

      <button
        disabled={pending}
        className="w-full rounded-md bg-[#101010] px-4 py-3 text-[15px] font-semibold text-[#8EC63D] disabled:opacity-50"
      >
        {pending ? "Saving..." : "Log the enquiry"}
      </button>
    </form>
  );
}

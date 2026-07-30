"use client";

// Edits the contact facts. Contacts are born on the enquiry form; this keeps
// them right when numbers and addresses change.

import { useActionState } from "react";
import { updateContact } from "@/lib/actions";

const input =
  "mt-1 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-base outline-none focus:border-[#8EC63D]";
const label = "block text-[13px] font-medium text-[#2C2C2A]";

export function ContactForm({
  contact,
}: {
  contact: {
    id: number;
    name: string;
    phone: string | null;
    email: string | null;
    addressLine1: string | null;
    town: string | null;
    postcode: string | null;
  };
}) {
  const [state, formAction, pending] = useActionState(
    updateContact.bind(null, contact.id),
    undefined,
  );

  return (
    <form
      action={formAction}
      className="space-y-3 rounded-md border border-neutral-200 border-l-[3px] border-l-[#8EC63D] bg-white p-4 shadow-sm"
    >
      <label className={label}>
        Name
        <input name="name" required defaultValue={contact.name} className={input} />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className={label}>
          Phone
          <input
            name="phone"
            type="tel"
            defaultValue={contact.phone ?? ""}
            className={input}
          />
        </label>
        <label className={label}>
          Email
          <input
            name="email"
            type="email"
            defaultValue={contact.email ?? ""}
            className={input}
          />
        </label>
      </div>

      <label className={label}>
        Address
        <input
          name="addressLine1"
          defaultValue={contact.addressLine1 ?? ""}
          placeholder="House and street"
          className={input}
        />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className={label}>
          Town
          <input name="town" defaultValue={contact.town ?? ""} className={input} />
        </label>
        <label className={label}>
          Postcode
          <input
            name="postcode"
            defaultValue={contact.postcode ?? ""}
            className={input}
          />
        </label>
      </div>

      {state?.error ? <p className="text-sm text-red-700">{state.error}</p> : null}

      <button
        disabled={pending}
        className="w-full rounded-md bg-[#101010] px-4 py-2.5 text-sm font-semibold text-[#8EC63D] disabled:opacity-50"
      >
        {pending ? "Saving..." : "Save changes"}
      </button>
    </form>
  );
}

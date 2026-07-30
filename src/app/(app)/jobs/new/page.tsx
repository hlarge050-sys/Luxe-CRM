// New enquiry: the one page that gets used mid-phone-call, so it stays lean.
import { getDb } from "@/db";
import { EnquiryForm } from "@/components/enquiry-form";

export const dynamic = "force-dynamic";

export default async function NewEnquiryPage() {
  let contacts: { id: number; name: string; town: string | null }[] = [];
  try {
    const db = getDb();
    contacts = await db.query.contacts.findMany({
      columns: { id: true, name: true, town: true },
      orderBy: (t, { asc }) => [asc(t.name)],
    });
  } catch {
    // No contacts list just means the form starts in new-contact mode.
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-10">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
        New enquiry
      </p>
      <div className="mt-3">
        <EnquiryForm contacts={contacts} />
      </div>
    </div>
  );
}

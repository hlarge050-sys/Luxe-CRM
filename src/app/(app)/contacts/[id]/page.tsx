// One contact: their details, editable, and every job of theirs beneath.
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDb } from "@/db";
import { ContactForm } from "@/components/contact-form";

export const dynamic = "force-dynamic";

export default async function ContactPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const contactId = Number(id);
  if (!Number.isInteger(contactId)) notFound();

  const db = getDb();
  const contact = await db.query.contacts.findFirst({
    where: (t, { eq }) => eq(t.id, contactId),
    with: {
      jobs: {
        with: { stage: { columns: { name: true, isTerminal: true } } },
        orderBy: (t, { desc }) => [desc(t.createdAt)],
      },
    },
  });
  if (!contact) notFound();

  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-10">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
        Contact
      </p>
      <h1 className="mt-1 text-xl font-bold tracking-tight text-[#101010]">
        {contact.name}
      </h1>

      <div className="mt-4">
        <ContactForm
          contact={{
            id: contact.id,
            name: contact.name,
            phone: contact.phone,
            email: contact.email,
            addressLine1: contact.addressLine1,
            town: contact.town,
            postcode: contact.postcode,
          }}
        />
      </div>

      <h2 className="mt-8 text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
        Jobs
      </h2>
      <ul className="mt-2 space-y-2">
        {contact.jobs.map((j) => (
          <li key={j.id}>
            <Link
              href={`/jobs/${j.id}`}
              className="flex items-center justify-between gap-3 rounded-md border border-neutral-200 bg-white p-3.5 shadow-sm transition hover:border-neutral-300"
            >
              <span className="min-w-0">
                <span className="block truncate text-[15px] font-semibold text-[#101010]">
                  {j.title}
                </span>
                {j.reference ? (
                  <span className="text-xs text-neutral-400">{j.reference}</span>
                ) : null}
              </span>
              <span
                className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  j.stage.isTerminal
                    ? "bg-neutral-100 text-neutral-500"
                    : "border border-[#8EC63D]/50 bg-[#F4F9EA] text-[#3f6b12]"
                }`}
              >
                {j.stage.name}
              </span>
            </Link>
          </li>
        ))}
        {contact.jobs.length === 0 ? (
          <li className="rounded-md border border-dashed border-neutral-200 p-4 text-center text-sm text-neutral-400">
            No jobs for this contact yet.
          </li>
        ) : null}
      </ul>
    </div>
  );
}

// Edit a job. Serialises dates to ISO strings so the client form can convert
// them in the device timezone.
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDb } from "@/db";
import { JobForm } from "@/components/job-form";

export const dynamic = "force-dynamic";

export default async function EditJobPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const jobId = Number(id);
  if (!Number.isInteger(jobId)) notFound();

  const db = getDb();
  const job = await db.query.jobs.findFirst({
    where: (t, { eq }) => eq(t.id, jobId),
    with: { contact: { columns: { name: true } } },
  });
  if (!job) notFound();

  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-10">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
        Edit job
      </p>
      <div className="mt-1 flex items-center justify-between gap-3">
        <h1 className="text-lg font-bold tracking-tight text-[#101010]">
          {job.title}
        </h1>
        <Link
          href={`/jobs/${job.id}`}
          className="text-sm font-medium text-neutral-500 hover:text-[#101010]"
        >
          Back to the job
        </Link>
      </div>
      <p className="mt-0.5 text-sm text-neutral-500">For {job.contact.name}</p>

      <div className="mt-4">
        <JobForm
          job={{
            id: job.id,
            title: job.title,
            source: job.source,
            visitAt: job.visitAt ? job.visitAt.toISOString() : null,
            siteAddressLine1: job.siteAddressLine1,
            siteTown: job.siteTown,
            sitePostcode: job.sitePostcode,
          }}
        />
      </div>
    </div>
  );
}

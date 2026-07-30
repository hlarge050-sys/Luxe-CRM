// Job detail: everything about one job on one phone screen. Stage at the
// top because that is the thing that changes, timeline at the bottom because
// that is the thing that grows.
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDb } from "@/db";
import { StageSelect } from "@/components/stage-select";
import { NoteForm } from "@/components/note-form";

export const dynamic = "force-dynamic";

const dayFmt = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "Europe/London",
});
const stampFmt = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/London",
});

const kindLabels: Record<string, string> = {
  note: "Note",
  call: "Call",
  email: "Email",
  sms: "Text",
  visit: "Visit",
  stage_change: "Stage",
  system: "System",
};

function kindChip(kind: string) {
  if (kind === "note")
    return "border border-[#8EC63D]/50 bg-[#F4F9EA] text-[#3f6b12]";
  if (kind === "stage_change" || kind === "system")
    return "bg-neutral-100 text-neutral-500";
  return "border border-neutral-200 bg-white text-neutral-600";
}

const card =
  "rounded-md border border-neutral-200 border-l-[3px] border-l-[#8EC63D] bg-white p-4 shadow-sm";
const eyebrow =
  "text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500";

export default async function JobPage({
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
    with: {
      contact: true,
      stage: true,
      activities: {
        orderBy: (t, { desc }) => [desc(t.occurredAt), desc(t.id)],
      },
    },
  });
  if (!job) notFound();

  const stages = await db.query.jobStages.findMany({
    orderBy: (t, { asc }) => [asc(t.position)],
  });

  const site = [job.siteAddressLine1, job.siteTown, job.sitePostcode]
    .filter(Boolean)
    .join(", ");
  const contactAddress = [
    job.contact.addressLine1,
    job.contact.town,
    job.contact.postcode,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-10">
      <div className="flex items-center gap-2">
        <p className={eyebrow}>Job</p>
        {job.reference ? (
          <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-semibold text-neutral-500">
            {job.reference}
          </span>
        ) : null}
      </div>

      <div className="mt-1 flex items-start justify-between gap-3">
        <h1 className="text-xl font-bold tracking-tight text-[#101010]">
          {job.title}
        </h1>
        <Link
          href={`/jobs/${job.id}/edit`}
          className="shrink-0 text-sm font-medium text-[#3f6b12] underline-offset-2 hover:underline"
        >
          Edit job
        </Link>
      </div>

      <section className={`${card} mt-4`}>
        <p className={eyebrow}>Stage</p>
        <div className="mt-2">
          <StageSelect
            jobId={job.id}
            stages={stages.map((s) => ({
              id: s.id,
              name: s.name,
              position: s.position,
            }))}
            currentStageId={job.stageId}
          />
        </div>
        <p className="mt-2 text-xs text-neutral-400">
          In this stage since {dayFmt.format(job.stageChangedAt)}
        </p>
        {job.stage.name === "Lost" && job.lostReason ? (
          <p className="mt-2 rounded bg-neutral-50 p-2 text-sm italic text-neutral-600">
            Lost: {job.lostReason}
          </p>
        ) : null}
      </section>

      <section className={`${card} mt-4`}>
        <p className={eyebrow}>Contact</p>
        <p className="mt-2 text-[15px] font-semibold text-[#101010]">
          <Link
            href={`/contacts/${job.contact.id}`}
            className="underline-offset-2 hover:underline"
          >
            {job.contact.name}
          </Link>
        </p>
        <div className="mt-1 space-y-0.5 text-sm text-[#2C2C2A]">
          {job.contact.phone ? (
            <p>
              <a
                href={`tel:${job.contact.phone}`}
                className="text-[#3f6b12] underline-offset-2 hover:underline"
              >
                {job.contact.phone}
              </a>
            </p>
          ) : null}
          {job.contact.email ? (
            <p>
              <a
                href={`mailto:${job.contact.email}`}
                className="text-[#3f6b12] underline-offset-2 hover:underline"
              >
                {job.contact.email}
              </a>
            </p>
          ) : null}
          {contactAddress ? (
            <p className="text-neutral-500">{contactAddress}</p>
          ) : null}
        </div>
      </section>

      <section className={`${card} mt-4`}>
        <p className={eyebrow}>Details</p>
        <dl className="mt-2 space-y-2 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-neutral-500">Site</dt>
            <dd className="text-right text-[#2C2C2A]">
              {site || "At the contact address"}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-neutral-500">Visit</dt>
            <dd className="text-right text-[#2C2C2A]">
              {job.visitAt ? stampFmt.format(job.visitAt) : "Not booked"}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-neutral-500">Source</dt>
            <dd className="text-right text-[#2C2C2A]">{job.source ?? "Not sure"}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-neutral-500">Added</dt>
            <dd className="text-right text-[#2C2C2A]">
              {dayFmt.format(job.createdAt)}
            </dd>
          </div>
        </dl>
      </section>

      <h2 className={`${eyebrow} mt-8`}>Timeline</h2>
      <div className="mt-2">
        <NoteForm jobId={job.id} />
      </div>

      <ul className="mt-3 space-y-2">
        {job.activities.map((a) => (
          <li
            key={a.id}
            className="rounded-md border border-neutral-200 bg-white p-3 shadow-sm"
          >
            <div className="flex items-center gap-2 text-[11px] text-neutral-400">
              <span
                className={`rounded-full px-2 py-0.5 font-medium ${kindChip(a.kind)}`}
              >
                {kindLabels[a.kind] ?? a.kind}
              </span>
              <span>{stampFmt.format(a.occurredAt)}</span>
            </div>
            <p className="mt-1.5 whitespace-pre-wrap text-sm text-[#2C2C2A]">
              {a.body}
            </p>
          </li>
        ))}
        {job.activities.length === 0 ? (
          <li className="rounded-md border border-dashed border-neutral-200 p-4 text-center text-sm text-neutral-400">
            Nothing on the timeline yet.
          </li>
        ) : null}
      </ul>
    </div>
  );
}

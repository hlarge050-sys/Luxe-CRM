"use server";

// M2 server actions. Every mutation the board and the job pages make comes
// through here, and the one rule that matters is enforced at the door: a job
// never lands in Lost without a reason.

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { activities, contacts, jobs } from "@/db/schema";

export type MoveResult = { ok: true } | { ok: false; error: string };
export type FormState = { error: string } | undefined;

const loggableKinds = ["note", "call", "email", "sms", "visit"] as const;
type LoggableKind = (typeof loggableKinds)[number];

function text(form: FormData, key: string): string | null {
  const v = form.get(key);
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length ? t : null;
}

function parseWhen(iso: string | null): Date | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

// ---------------------------------------------------------------------------
// Stage moves. Used by the board drag and the select on the job page.
// ---------------------------------------------------------------------------
export async function moveJobStage(
  jobId: number,
  stageId: number,
  lostReason?: string,
): Promise<MoveResult> {
  const db = getDb();

  const job = await db.query.jobs.findFirst({
    where: (t, { eq: is }) => is(t.id, jobId),
    with: { stage: true },
  });
  if (!job) return { ok: false, error: "That job no longer exists." };

  const target = await db.query.jobStages.findFirst({
    where: (t, { eq: is }) => is(t.id, stageId),
  });
  if (!target) return { ok: false, error: "That stage does not exist." };
  if (job.stageId === target.id) return { ok: true };

  const toLost = target.name === "Lost";
  const reason = lostReason?.trim() ?? "";
  if (toLost && !reason) {
    return { ok: false, error: "A reason is required before a job goes to Lost." };
  }

  await db
    .update(jobs)
    .set({
      stageId: target.id,
      stageChangedAt: new Date(),
      lostReason: toLost ? reason : null,
    })
    .where(eq(jobs.id, jobId));

  await db.insert(activities).values({
    jobId,
    kind: "stage_change",
    body: toLost
      ? `Moved from ${job.stage.name} to Lost. Reason: ${reason}`
      : `Moved from ${job.stage.name} to ${target.name}.`,
  });

  revalidatePath("/");
  revalidatePath(`/jobs/${jobId}`);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// New enquiry. Creates the contact when needed, files the job in New enquiry,
// or straight into Visit booked when a visit date comes in with it.
// ---------------------------------------------------------------------------
export async function createEnquiry(
  _prev: FormState,
  form: FormData,
): Promise<FormState> {
  const db = getDb();

  const title = text(form, "title");
  if (!title) return { error: "The job needs a title." };

  let contactId: number;
  if (form.get("contactMode") === "existing") {
    const raw = text(form, "contactId");
    const id = raw ? Number(raw) : NaN;
    const found = Number.isInteger(id)
      ? await db.query.contacts.findFirst({ where: (t, { eq: is }) => is(t.id, id) })
      : undefined;
    if (!found) return { error: "Pick a contact for the job." };
    contactId = found.id;
  } else {
    const name = text(form, "name");
    if (!name) return { error: "The contact needs a name." };
    const [row] = await db
      .insert(contacts)
      .values({
        name,
        phone: text(form, "phone"),
        email: text(form, "email"),
        addressLine1: text(form, "addressLine1"),
        town: text(form, "town"),
        postcode: text(form, "postcode"),
        source: text(form, "source"),
      })
      .returning({ id: contacts.id });
    contactId = row.id;
  }

  const visitAt = parseWhen(text(form, "visitAt"));
  const stageName = visitAt ? "Visit booked" : "New enquiry";
  const stage = await db.query.jobStages.findFirst({
    where: (t, { eq: is }) => is(t.name, stageName),
  });
  if (!stage) {
    return { error: "Stages are missing from the database. Check /api/health." };
  }

  const siteSame = form.get("siteSame") === "on";
  const [job] = await db
    .insert(jobs)
    .values({
      contactId,
      title,
      stageId: stage.id,
      source: text(form, "source"),
      visitAt,
      siteAddressLine1: siteSame ? null : text(form, "siteAddressLine1"),
      siteTown: siteSame ? null : text(form, "siteTown"),
      sitePostcode: siteSame ? null : text(form, "sitePostcode"),
    })
    .returning({ id: jobs.id });

  await db.insert(activities).values({
    jobId: job.id,
    kind: "system",
    body: visitAt
      ? "Enquiry logged with a visit already booked."
      : "Enquiry logged.",
  });

  const note = text(form, "notes");
  if (note) {
    await db.insert(activities).values({ jobId: job.id, kind: "note", body: note });
  }

  revalidatePath("/");
  redirect(`/jobs/${job.id}`);
}

// ---------------------------------------------------------------------------
// Edits.
// ---------------------------------------------------------------------------
export async function updateJob(
  jobId: number,
  _prev: FormState,
  form: FormData,
): Promise<FormState> {
  const db = getDb();
  const found = await db.query.jobs.findFirst({
    where: (t, { eq: is }) => is(t.id, jobId),
  });
  if (!found) return { error: "That job no longer exists." };

  const title = text(form, "title");
  if (!title) return { error: "The job needs a title." };

  await db
    .update(jobs)
    .set({
      title,
      source: text(form, "source"),
      visitAt: parseWhen(text(form, "visitAt")),
      siteAddressLine1: text(form, "siteAddressLine1"),
      siteTown: text(form, "siteTown"),
      sitePostcode: text(form, "sitePostcode"),
    })
    .where(eq(jobs.id, jobId));

  revalidatePath("/");
  revalidatePath(`/jobs/${jobId}`);
  redirect(`/jobs/${jobId}`);
}

export async function updateContact(
  contactId: number,
  _prev: FormState,
  form: FormData,
): Promise<FormState> {
  const db = getDb();
  const found = await db.query.contacts.findFirst({
    where: (t, { eq: is }) => is(t.id, contactId),
  });
  if (!found) return { error: "That contact no longer exists." };

  const name = text(form, "name");
  if (!name) return { error: "The contact needs a name." };

  await db
    .update(contacts)
    .set({
      name,
      phone: text(form, "phone"),
      email: text(form, "email"),
      addressLine1: text(form, "addressLine1"),
      town: text(form, "town"),
      postcode: text(form, "postcode"),
    })
    .where(eq(contacts.id, contactId));

  revalidatePath("/");
  revalidatePath("/contacts");
  revalidatePath(`/contacts/${contactId}`);
  redirect(`/contacts/${contactId}`);
}

// ---------------------------------------------------------------------------
// Timeline notes on a job.
// ---------------------------------------------------------------------------
export async function addNote(
  jobId: number,
  _prev: FormState,
  form: FormData,
): Promise<FormState> {
  const db = getDb();
  const found = await db.query.jobs.findFirst({
    where: (t, { eq: is }) => is(t.id, jobId),
  });
  if (!found) return { error: "That job no longer exists." };

  const body = text(form, "body");
  if (!body) return { error: "Write the note first." };

  const raw = text(form, "kind") ?? "note";
  const kind: LoggableKind = (loggableKinds as readonly string[]).includes(raw)
    ? (raw as LoggableKind)
    : "note";

  await db.insert(activities).values({ jobId, kind, body });

  revalidatePath(`/jobs/${jobId}`);
  return undefined;
}

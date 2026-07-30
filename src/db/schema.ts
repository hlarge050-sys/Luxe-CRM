// M1 data foundation. Five tables: job_stages, contacts, jobs, activities,
// follow_ups. Stages are data, not an enum, so adding or renaming a stage is
// an insert or update, never a migration. Follow-up cadence logic arrives at
// M3 and is coded from the pricing formula document, this file only gives it
// somewhere to live.

import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// ---------------------------------------------------------------------------
// Job stages. Seeded by migration 0001 with the nine agreed stages:
// New enquiry, Visit booked, Takeoff done, Quote sent, Follow-up, Accepted,
// In progress, Complete, Lost. Complete and Lost are terminal.
// ---------------------------------------------------------------------------
export const jobStages = pgTable(
  "job_stages",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    name: text("name").notNull(),
    position: integer("position").notNull(),
    isTerminal: boolean("is_terminal").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("job_stages_name_uq").on(t.name),
    index("job_stages_position_idx").on(t.position),
  ],
);

// ---------------------------------------------------------------------------
// Contacts. One row per person. pipedrive_person_id keeps the door open for
// importing existing Pipedrive people without creating duplicates.
// ---------------------------------------------------------------------------
export const contacts = pgTable(
  "contacts",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    name: text("name").notNull(),
    email: text("email"),
    phone: text("phone"),
    addressLine1: text("address_line1"),
    addressLine2: text("address_line2"),
    town: text("town"),
    postcode: text("postcode"),
    source: text("source"),
    pipedrivePersonId: integer("pipedrive_person_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("contacts_name_idx").on(t.name),
    uniqueIndex("contacts_pipedrive_person_uq").on(t.pipedrivePersonId),
  ],
);

// ---------------------------------------------------------------------------
// Jobs. The spine of the CRM: everything hangs off a job. reference is the
// five digit quote reference and stays null until a quote is issued (M6 owns
// the sequence, per the pricing formula document). Site address is optional
// and falls back to the contact address. lost_reason is required whenever the
// stage is Lost, enforced at the application layer from M2.
// ---------------------------------------------------------------------------
export const jobs = pgTable(
  "jobs",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    reference: text("reference"),
    contactId: integer("contact_id")
      .notNull()
      .references(() => contacts.id, { onDelete: "restrict" }),
    title: text("title").notNull(),
    stageId: integer("stage_id")
      .notNull()
      .references(() => jobStages.id, { onDelete: "restrict" }),
    siteAddressLine1: text("site_address_line1"),
    siteAddressLine2: text("site_address_line2"),
    siteTown: text("site_town"),
    sitePostcode: text("site_postcode"),
    source: text("source"),
    // Rough figure in whole pounds, typed by hand for the board. The real
    // computed quote replaces its role from M6.
    valueEstimate: integer("value_estimate"),
    visitAt: timestamp("visit_at", { withTimezone: true }),
    lostReason: text("lost_reason"),
    stageChangedAt: timestamp("stage_changed_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    pipedriveDealId: integer("pipedrive_deal_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    uniqueIndex("jobs_reference_uq").on(t.reference),
    uniqueIndex("jobs_pipedrive_deal_uq").on(t.pipedriveDealId),
    index("jobs_stage_idx").on(t.stageId),
    index("jobs_contact_idx").on(t.contactId),
  ],
);

// ---------------------------------------------------------------------------
// Activities. The timeline on a job: notes, calls, visits, stage changes and
// system events. occurred_at is separate from created_at so history imported
// or logged after the fact keeps its real date.
// ---------------------------------------------------------------------------
export const activityKinds = [
  "note",
  "call",
  "email",
  "sms",
  "visit",
  "stage_change",
  "system",
] as const;

export const activities = pgTable(
  "activities",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    jobId: integer("job_id")
      .notNull()
      .references(() => jobs.id, { onDelete: "cascade" }),
    kind: text("kind", { enum: activityKinds }).notNull().default("note"),
    body: text("body").notNull(),
    occurredAt: timestamp("occurred_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("activities_job_idx").on(t.jobId),
    index("activities_occurred_idx").on(t.occurredAt),
  ],
);

// ---------------------------------------------------------------------------
// Follow-ups. One row per planned touch in a chase chain. M3's engine creates
// and cancels these, with the cadence coded from the pricing formula document.
// The (status, due_at) index serves the daily digest query directly.
// ---------------------------------------------------------------------------
export const followUpChannels = ["call", "email", "sms"] as const;
export const followUpStatuses = ["pending", "done", "cancelled"] as const;

export const followUps = pgTable(
  "follow_ups",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    jobId: integer("job_id")
      .notNull()
      .references(() => jobs.id, { onDelete: "cascade" }),
    sequence: integer("sequence").notNull(),
    channel: text("channel", { enum: followUpChannels })
      .notNull()
      .default("call"),
    status: text("status", { enum: followUpStatuses })
      .notNull()
      .default("pending"),
    dueAt: timestamp("due_at", { withTimezone: true }).notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    cancelledReason: text("cancelled_reason"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("follow_ups_job_idx").on(t.jobId),
    index("follow_ups_status_due_idx").on(t.status, t.dueAt),
  ],
);

// ---------------------------------------------------------------------------
// Relations, for db.query with { with: ... }.
// ---------------------------------------------------------------------------
export const jobStagesRelations = relations(jobStages, ({ many }) => ({
  jobs: many(jobs),
}));

export const contactsRelations = relations(contacts, ({ many }) => ({
  jobs: many(jobs),
}));

export const jobsRelations = relations(jobs, ({ one, many }) => ({
  contact: one(contacts, {
    fields: [jobs.contactId],
    references: [contacts.id],
  }),
  stage: one(jobStages, {
    fields: [jobs.stageId],
    references: [jobStages.id],
  }),
  activities: many(activities),
  followUps: many(followUps),
}));

export const activitiesRelations = relations(activities, ({ one }) => ({
  job: one(jobs, { fields: [activities.jobId], references: [jobs.id] }),
}));

export const followUpsRelations = relations(followUps, ({ one }) => ({
  job: one(jobs, { fields: [followUps.jobId], references: [jobs.id] }),
}));

// Inferred row types for use across the app.
export type JobStage = typeof jobStages.$inferSelect;
export type Contact = typeof contacts.$inferSelect;
export type NewContact = typeof contacts.$inferInsert;
export type Job = typeof jobs.$inferSelect;
export type NewJob = typeof jobs.$inferInsert;
export type Activity = typeof activities.$inferSelect;
export type NewActivity = typeof activities.$inferInsert;
export type FollowUp = typeof followUps.$inferSelect;
export type NewFollowUp = typeof followUps.$inferInsert;

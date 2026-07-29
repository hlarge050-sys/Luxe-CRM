# Luxe CRM

Internal, single-user CRM for Luxe Landscaping Limited (Co. No. 14902951).
Built and accepted milestone by milestone. Owner: Hazz.

## Working rules

- Strict milestone order, M0 to M10. A milestone starts only after the previous
  one is built, deployed and accepted by Hazz. State the current milestone at
  the start of every working session. Requests belonging to a later milestone
  get parked, not built.
- Pricing (M5, M6) is implemented only from the Pricing Formula v7 document
  supplied by Hazz. It lives in the claude.ai Project knowledge, not in this
  repo. Never implement pricing from memory. Unit tests must reproduce the
  worked example: £5,900 job total, £1,800 deposit.
- Reference numbering, deposit rules, follow-up cadence and document layout
  also come from the documents Hazz supplies (pricing formula and template
  pack). Ask for them if they are not to hand.
- British English everywhere, including UI copy and commit messages.
  No em dashes anywhere.
- No secrets in this repo, ever. Environment variables only.

## Stack

Next.js (App Router) + TypeScript, Tailwind v4, Drizzle ORM on Neon Postgres,
Vercel hosting, Inngest from M3, weasyprint document service at M7.
Auth: single password. AUTH_PASSWORD checked in a server action, AUTH_SECRET
signs a JWT session cookie. Guards live in src/middleware.ts and
src/app/(app)/layout.tsx. New pages go inside the (app) route group.

## Milestones

M0 scaffold (done) · M1 data foundation (Contact, Job, JobStage,
Activity/Note, FollowUp) · M2 job board kanban · M3 follow-up engine (Inngest)
· M4 takeoff · M5 pricing engine (pure, versioned function) · M6 quote builder
· M7 documents (weasyprint) · M8 staged works · M9 Gmail · M10 Calendar.

M2 stages: New enquiry, Visit booked, Takeoff done, Quote sent, Follow-up,
Accepted, In progress, Complete, plus Lost with a required reason.

## Brand

Green #8EC63D, black #101010, ink #2C2C2A, pale green #F4F9EA,
paper #FAFAF8. Helvetica/Arial. The 3px green rule under the header and the
stage-card style (black numbered badge, green left border) mirror the printed
Luxe document pack. The app should look like the paperwork.

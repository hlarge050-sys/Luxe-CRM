# Luxe CRM

Internal, single-user CRM for Luxe Landscaping Limited (Co. No. 14902951).
Built and accepted milestone by milestone. Owner: Hazz.

## Status

Live at https://luxe-crm-peach.vercel.app
M0 and M1 accepted by Hazz, 30 July 2026. M2 built 30 July 2026; first cut
rejected by Hazz for not matching Pipedrive, rebuilt the same day to the
Pipedrive layout in Luxe colours. Awaiting acceptance by Hazz. Next after
acceptance: M3, the follow-up engine.
Migrations run automatically on deploy (scripts/migrate.mjs), /api/health
reports db and schema state publicly.

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
signs a JWT session cookie. Guards live in src/proxy.ts and
src/app/(app)/layout.tsx. New pages go inside the (app) route group.
/api/health is public by design and carries no business data.

## Milestones

M0 scaffold (done) · M1 data foundation (done, see src/db/schema.ts)
· M2 job board kanban (built, awaiting acceptance) · M3 follow-up engine
(Inngest) · M4 takeoff · M5 pricing engine (pure, versioned function)
· M6 quote builder · M7 documents (weasyprint) · M8 staged works · M9 Gmail
· M10 Calendar.

M2 stages, in order: New enquiry, Visit booked, Takeoff done, Quote sent,
Follow-up, Parked / waiting (added at M2 on Hazz's decision), Accepted,
In progress, Complete, Lost. The eight live stages are board lanes; Complete
and Lost are drop zones that rise while dragging (Hazz's decision at the M2
rework) plus their own tabs, never lanes. Lost demands a reason, enforced in
src/lib/actions.ts. Stage changes write a stage_change activity. Jobs carry
an optional value_estimate in whole pounds for the board; real quote figures
take over from M6.

## Brand

Green #8EC63D, black #101010, ink #2C2C2A, pale green #F4F9EA,
paper #FAFAF8. Helvetica/Arial. Decided by Hazz at the M2 rework: the APP
follows Pipedrive's layout and interaction patterns in Luxe colours (flat
full-width lanes with value totals, white deal cards with value and rotting
dot, quick add per lane, outcome drop zones, chevron stage bar and split
detail page). The printed-paperwork styling (numbered badges, green left
borders) belongs to the DOCUMENTS at M7, not to app screens. Do not restyle
the app back towards the paperwork.

## Tooling notes

- If working in Claude Code, install the Vercel plugin first:
  `npx plugins add vercel/vercel-plugin`. Parked at M0, not needed for
  chat-based sessions.

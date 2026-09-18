# Weekly audit guide

Instructions for whoever (or whatever) performs the weekly audit — a
person, or a scheduled Claude Cowork task using Claude in Chrome to check
each scheduler and the GitHub connector to commit the results. Follow this
exactly so `data/audits.json` stays valid and the dashboard's automatic
status logic works correctly.

## Before you start

Read [`docs/JSON_SCHEMA.md`](JSON_SCHEMA.md) once if you haven't. The short
version: you only ever **append** raw observations to the `auditHistory`
array. You never touch `practices` or `locations`, and you never compute or
write `status`, `missingAppointmentTypes`, or anything else derived — the
dashboard does that from what you record here.

**Never record any patient information** — no patient names, contact
details, or specifics about a real person's appointment. You're auditing
public configuration (scheduler links and the appointment-type labels they
advertise), not real bookings.

## Step 1 — Get the current registry and history

Pull the latest `main` and open `data/audits.json`. For each of the 14
locations in the `locations` array, you already have:

- `id` — use this exact value as `locationId` in your new entry.
- `websiteUrl` — the public scheduler to check.
- `googleMapsUrl` — the Google Maps listing to check for a booking link.
- `expectedAppointmentTypes` — reference metadata only. It has proven
  unreliable and is **not** used for comparison or status; just record
  what you actually observe on each site (Step 2/3) and ignore this list.

## Step 2 — Audit each location

For each location, using Claude in Chrome (or manually):

1. **Open the website scheduler URL.** Note:
   - `websiteSchedulerStatus`:
     - `Working` if it loads within 30 seconds.
     - `Broken` if it errors, times out, or the reason-for-visit step never
       loads.
     - `WrongLocation` if it loads but is actually for a different office
       (warning only, not a failed audit).
     - `NotChecked` if you couldn't complete this step (see Step 3).
   - `observedWebsiteAppointmentTypes`: list every appointment/reason-for-visit
     option shown, exactly as written (don't fix casing or wording — the
     dashboard normalizes that itself).
   - Note any secondary broken links you notice along the way (e.g. a
     footer link, a "call us" link that's wrong) as `brokenOrIncorrectLinks`
     — `{url, issue}` pairs. These don't need to be the primary scheduler
     link.
   - **Deep check — click into every appointment type.** For each option in
     `observedWebsiteAppointmentTypes`, select it and proceed to the next
     step (time slot / calendar). Record one entry per type in
     `websiteAppointmentAvailability`:
     - `availabilityLoaded: true` if a real time-slot/calendar view appears
       with at least one open day or time to pick.
     - `availabilityLoaded: false` **only** when the fully loaded availability
       screen explicitly says that there are no open slots.
     - `availabilityLoaded: null` when latency, a timeout, or another
       inconclusive condition prevents a reliable answer. Set
       `verificationStatus: "SlowLoading"` (or `"Inconclusive"`) and explain
       what happened in `issue`. This flags the result without failing it.
     Do not actually submit a booking or enter real patient details at any
     point.

2. **Do not audit Google Maps booking links.** Google checks were retired on
   September 18, 2026. For compatibility with older history, record
   `googleSchedulerStatus: "NotChecked"`, empty Google arrays, and
   `auditSource: "Website Only"`.

<!-- Historical Google instructions retained below for older record interpretation only.
   Look for a booking/appointment link or button on the listing. Note:
   - `googleSchedulerStatus`:
     - `Working` if the booking link opens within 30 seconds.
     - `Broken` if it errors.
     - `WrongLocation` if it leads to a different office (warning only).
     - `NoBookingLink` if the listing has no booking link/button at all
       (warning only).
     - `Ambiguous` if the listing itself is unclear — e.g. duplicate or
       merged listings for the practice, or you can't tell which office
       it represents.
     - `NotChecked` if you couldn't complete this step.

   Only two observations produce a failed result: a booking page does not load
   within 30 seconds, or a tested appointment type reaches its availability
   screen and shows no appointment times. Do not fail for label differences,
   missing/extra reference types, a different-office destination, or a missing
   Google booking action.
   - `observedGoogleAppointmentTypes`: list every appointment/service type
     shown in the Google booking flow, exactly as written.
   - Some Google booking flows gate the appointment-type list behind a
     "Patient details" step (first name / last name / birthdate) before
     you can even see the types. It's fine to enter obviously fake
     placeholder data purely to get past that step and observe the types
     and their availability — e.g. `Test Patient`, `01/01/1990` — and
     never proceed past it to actually submit a booking. This placeholder
     text must never appear in `notes`, `manualReviewReason`, or anywhere
     else in the entry.
   - **Deep check — click into every appointment type**, same as the
     website: for each option in `observedGoogleAppointmentTypes`, select
     it, proceed to the time-slot step, and record one entry per type in
     `googleAppointmentAvailability` with the same `availabilityLoaded` /
     `issue` rules as above. -->

3. **If you hit a CAPTCHA, a login wall, a browser restriction, or
   anything else that stops you from completing either check reliably:**
   set `manualReviewNeeded: true`, fill in `manualReviewReason` with a short
   plain explanation (e.g. `"CAPTCHA blocked the website scheduler after 3 attempts"`),
   and set whichever status field(s) you couldn't verify to `NotChecked`.
   Still fill in whatever you *were* able to observe — partial data is
   fine and better than nothing.

4. **Evidence (optional but encouraged):** if you can generate a
   screenshot or capture and host it somewhere linkable (this repo isn't
   the place to store screenshots — don't commit images here), add the URL
   to `evidenceLinks`. Never link to anything containing patient data.

5. **Notes:** add anything a human should know that doesn't fit the
   structured fields — but nothing about a real patient.

## Step 3 — Build the entry

For each location, produce one object like this:

```json
{
  "auditId": "lakewood-anderson__2026-09-19T16:00:00Z",
  "locationId": "lakewood-anderson",
  "checkedAt": "2026-09-19T16:00:00Z",
  "auditedBy": "Claude Cowork Weekly Audit",
  "auditSource": "Website + Google",
  "websiteSchedulerStatus": "Working",
  "googleSchedulerStatus": "Working",
  "observedWebsiteAppointmentTypes": [
    "Invisalign Consultation",
    "Dental Consultation",
    "Emergency Exam",
    "Existing Patient Cleaning",
    "New Patient Exam & Cleaning"
  ],
  "observedGoogleAppointmentTypes": [
    "New Patient Exam and Cleaning",
    "Emergency Exam"
  ],
  "websiteAppointmentAvailability": [
    { "appointmentType": "Invisalign Consultation", "availabilityLoaded": true },
    { "appointmentType": "Dental Consultation", "availabilityLoaded": true },
    { "appointmentType": "Emergency Exam", "availabilityLoaded": true },
    { "appointmentType": "Existing Patient Cleaning", "availabilityLoaded": true },
    { "appointmentType": "New Patient Exam & Cleaning", "availabilityLoaded": false, "issue": "No open slots shown 60+ days out" }
  ],
  "googleAppointmentAvailability": [
    { "appointmentType": "New Patient Exam and Cleaning", "availabilityLoaded": true },
    { "appointmentType": "Emergency Exam", "availabilityLoaded": true }
  ],
  "manualReviewNeeded": false,
  "manualReviewReason": "",
  "brokenOrIncorrectLinks": [],
  "notes": "",
  "evidenceLinks": []
}
```

(Without the `availabilityLoaded: false` entry, this example would come out
**Passed** — the dashboard doesn't compare observed appointment-type labels
against `expectedAppointmentTypes` at all, so wording differences like
"New Patient Exam & Cleaning" vs. "New Patient Exam and Cleaning" are not
flagged. Because one appointment type failed to show real availability,
though, the dashboard computes **Failed** overall. The dashboard works all
of this out on its own from the fields above; you never compute or write
`status` yourself.)

`checkedAt` and the timestamp suffix of `auditId` should be the same UTC
time you performed the check.

## Step 4 — Commit the update

1. Read the current `data/audits.json` from `main`.
2. Append your new entries (one per location audited this run) to the end
   of the `auditHistory` array. **Do not remove, reorder, or edit any
   existing entry.** Do not touch `practices` or `locations`.
3. Update the top-level `updatedAt` to the current UTC time and
   `updatedBy` to identify this run (e.g. `"Claude Cowork Weekly Audit"`).
4. Validate before committing:
   ```bash
   node scripts/validate-data.js
   ```
   Fix anything it flags — it will catch a broken schema, an accidentally
   modified registry, or an accidentally edited/removed history entry.
5. Commit and push using the GitHub connector:
   - If the repository's branch protection requires pull requests: create a
     branch (e.g. `weekly-audit-2026-09-19`), commit `data/audits.json`
     there, open a PR into `main`, and let the `validate-data` check run.
     A maintainer (or an auto-merge rule you've set up for passing,
     data-only PRs) merges it.
   - If direct commits to `main` are allowed for your connected account:
     commit straight to `main` with a clear message, e.g.
     `"Weekly audit: 2026-09-19"`.
6. Once the change lands on `main`, GitHub Pages redeploys automatically
   (usually within a minute or two) and every dashboard viewer sees the
   update — nothing else to do.

## Quick checklist

- [ ] Every location checked has exactly one new `auditHistory` entry (or
      none, if it genuinely wasn't checked this run — it's fine to skip a
      location and audit it next time; it simply won't show a newer
      "last checked" date).
- [ ] No existing `auditHistory` entry was edited, reordered, or removed.
- [ ] `practices` and `locations` are untouched.
- [ ] No patient information anywhere in `notes`, `manualReviewReason`,
      or `evidenceLinks` (placeholder test data used to get past a
      "Patient details" gate is fine to *use*, but never write it into
      any field).
- [ ] Every appointment type in `observedWebsiteAppointmentTypes` /
      `observedGoogleAppointmentTypes` was actually clicked into, with a
      matching entry in `websiteAppointmentAvailability` /
      `googleAppointmentAvailability` recording whether real availability
      loaded.
- [ ] `node scripts/validate-data.js` passes locally before you push.
- [ ] `updatedAt` / `updatedBy` bumped.

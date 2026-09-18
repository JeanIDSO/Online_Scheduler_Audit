# Data schema — `data/audits.json`

This file is the single shared data source for the dashboard. It has three
top-level parts:

```json
{
  "schemaVersion": 1,
  "updatedAt": "2026-09-12T18:04:00Z",
  "updatedBy": "Claude Cowork Weekly Audit",
  "practices": [ ... ],
  "locations": [ ... ],
  "auditHistory": [ ... ]
}
```

Formal machine-readable versions of everything below live in
[`schema/audits-file.schema.json`](../schema/audits-file.schema.json) and
[`schema/audit-entry.schema.json`](../schema/audit-entry.schema.json)
(JSON Schema, draft 2020-12). `scripts/validate-data.js` enforces them — see
[CI validation](#ci-validation) below.

## `practices` — protected

The two general practices:

| id | name |
|---|---|
| `lakewood-family-dental` | Lakewood Family Dental |
| `dental-team-florida` | Dental Team Florida |

**Do not edit this array as part of a weekly audit.** It exists to group
locations on the dashboard.

## `locations` — protected

The 14-location registry: each location's id, display name, practice, the
public website scheduler URL, the Google Maps listing URL, and an
**expected appointment types** list.

That list is reference metadata only — it has proven unreliable (stale or
incorrect labels) and is **not** compared against what an audit observes.
Status is driven entirely by what's actually seen on the live site each
run: whether the schedulers load, and whether every appointment type
clicked into shows real availability. See "Status rules" below.

**This array must never be modified by an automated audit run.** It's
locked in [`data/registry-lock.json`](../data/registry-lock.json), and
`scripts/validate-data.js` fails the build if `practices` or `locations` in
`data/audits.json` drift from that lock file. If a location's registry data
genuinely needs to change, update `data/registry-lock.json` **and**
`data/audits.json` together in a deliberate, human-reviewed commit or PR —
never as a side effect of a routine audit.

## `auditHistory` — append-only

An array of **raw observation records**, one per completed audit of one
location. This is the only part of the file a weekly audit ever writes to,
and it only ever grows — existing entries are never edited or deleted, so
the dashboard can show accurate week-over-week history.

Each entry:

| Field | Type | Notes |
|---|---|---|
| `auditId` | string | Unique forever. Recommended: `<locationId>__<checkedAt>`. |
| `locationId` | string | Must match an id in `locations`. |
| `checkedAt` | ISO 8601 UTC timestamp | e.g. `2026-09-12T18:04:00Z`. |
| `auditedBy` | string | e.g. `"Claude Cowork Weekly Audit"`. Never a patient name. |
| `auditSource` | `"Website + Google"` \| `"Website Only"` \| `"Google Only"` | What was actually checked. |
| `websiteSchedulerStatus` | `Working` \| `Broken` \| `WrongLocation` \| `NotChecked` | Raw observation only. |
| `googleSchedulerStatus` | `Working` \| `Broken` \| `WrongLocation` \| `NoBookingLink` \| `Ambiguous` \| `NotChecked` | Raw observation only. |
| `observedWebsiteAppointmentTypes` | string[] | Exactly as displayed on the website. |
| `observedGoogleAppointmentTypes` | string[] | Exactly as displayed via Google. |
| `websiteAppointmentAvailability` | `{appointmentType, availabilityLoaded, issue?}[]` | Deep check: one entry per website appointment type actually clicked into, recording whether it led to a real time-slot/calendar view with open availability. Empty on runs that didn't perform this deeper check. |
| `googleAppointmentAvailability` | `{appointmentType, availabilityLoaded, issue?}[]` | Same as above, for the Google booking flow. |
| `manualReviewNeeded` | boolean | True on CAPTCHA / login wall / browser block / ambiguous listing / any incomplete audit. |
| `manualReviewReason` | string | Required in practice when `manualReviewNeeded` is true. |
| `brokenOrIncorrectLinks` | `{url, issue}[]` | Secondary link problems (not the primary scheduler). |
| `notes` | string | Free text. **Never patient information.** |
| `evidenceLinks` | string[] | Optional supporting links. Never anything containing patient data. |

**Deliberately not stored:** overall status is *never* written by the
audit — the dashboard computes it from the raw fields above, every time it
loads. This keeps the schema simple for an automated audit to fill in
correctly, and guarantees the status rules are applied consistently no
matter who or what ran the audit.

## Status rules (applied by the dashboard, not the data)

Status depends only on what an audit run actually observed — never on the
registry's `expectedAppointmentTypes` list:

1. **Manual Review** — `manualReviewNeeded` is true, or `googleSchedulerStatus`
   is `Ambiguous`, or either scheduler status is `NotChecked`.
2. **Failed** — otherwise, only when either scheduler is `Broken` (including a
   30-second load timeout), or any entry in `websiteAppointmentAvailability` /
   `googleAppointmentAvailability` has `availabilityLoaded: false` (an
   appointment type that was clicked into but showed no real availability).
3. **Warning** — otherwise, when `WrongLocation`, `NoBookingLink`, or a noted
   `brokenOrIncorrectLinks` item needs attention without blocking availability.
4. **Passed** — otherwise.
5. **Not Yet Audited** — a location with no entries in `auditHistory` at all.

## CI validation

`.github/workflows/validate-data.yml` runs `scripts/validate-data.js` on
every push and pull request touching `data/audits.json`. It checks, in order:

1. The file is valid JSON matching the schema above.
2. `practices` and `locations` exactly match `data/registry-lock.json`
   (the protected registry).
3. Compared to the previous commit's version of the file, every existing
   `auditHistory` entry (by `auditId`) is still present and byte-for-byte
   unchanged — i.e. history was only ever appended to, never edited or
   removed.

A pull request that fails any of these checks should not be merged.

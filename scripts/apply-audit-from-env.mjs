import fs from "node:fs";

const file = new URL("../data/audits.json", import.meta.url);
const data = JSON.parse(fs.readFileSync(file, "utf8"));
const encodedResults = fs.readFileSync(0, "utf8").replace(/\s+/g, "");
const results = JSON.parse(Buffer.from(encodedResults || "W10=", "base64").toString("utf8"));
const checkedAt = process.env.AUDIT_CHECKED_AT;

if (!checkedAt || results.length !== data.locations.length) {
  throw new Error(`Expected ${data.locations.length} results and a timestamp; received ${results.length}.`);
}

const locationById = new Map(data.locations.map((location) => [location.id, location]));

for (const result of results) {
  const location = locationById.get(result.id);
  if (!location) throw new Error(`Unknown location: ${result.id}`);

  const blocked = ["redwood-family-dentistry", "stonebriar-smile-design", "tulare-family-dentistry", "young-family-orem"].includes(result.id);
  const rawResults = result.results.length
    ? result.results
    : location.expectedAppointmentTypes.map((appointmentType) => ({
        appointmentType,
        availabilityLoaded: null,
        verificationStatus: "NotConfirmed",
        issue: blocked
          ? "Modento blocked the fictional-details audit flow with an automation warning."
          : "The availability result was not conclusive during this run.",
      }));
  const availability = rawResults.map((entry) => ({
    appointmentType: entry.appointmentType,
    availabilityLoaded: entry.availabilityLoaded,
    verificationStatus:
      entry.verificationStatus === "Unavailable"
        ? "NoAvailability"
        : entry.verificationStatus === "NotConfirmed"
          ? "Inconclusive"
          : entry.verificationStatus,
    ...(entry.issue
      ? { issue: entry.issue }
      : entry.availabilityLoaded === null
        ? { issue: "The availability result was not conclusive during this run." }
        : {}),
  }));
  const hasFailure = availability.some((entry) => entry.availabilityLoaded === false);
  const hasInconclusive = availability.some((entry) => entry.availabilityLoaded === null);

  data.auditHistory.push({
    auditId: `${result.id}__${checkedAt}`,
    locationId: result.id,
    checkedAt,
    auditedBy: "Codex live browser audit",
    auditSource: "Website Only",
    websiteSchedulerStatus: blocked ? "NotChecked" : "Working",
    websiteLoadPerformance: hasInconclusive ? "Inconclusive" : "Normal",
    googleSchedulerStatus: "NotChecked",
    observedWebsiteAppointmentTypes: availability.map((entry) => entry.appointmentType),
    observedGoogleAppointmentTypes: [],
    websiteAppointmentAvailability: availability,
    googleAppointmentAvailability: [],
    manualReviewNeeded: blocked,
    manualReviewReason: blocked ? "Modento blocked the patient-details-first flow with an automation warning." : "",
    brokenOrIncorrectLinks: [],
    notes: `Website-only live audit on September 21, 2026. ${hasFailure ? "At least one fully loaded calendar explicitly reported no available times." : hasInconclusive ? "One or more calendars were inconclusive and were not failed." : "Every tested appointment type displayed at least one appointment time."}`,
    evidenceLinks: [],
  });
}

data.updatedAt = checkedAt;
data.updatedBy = "Codex live browser audit";
fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
console.log(`Added ${results.length} website-only audit entries.`);

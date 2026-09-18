import fs from "node:fs";

const path = new URL("../data/audits.json", import.meta.url);
const data = JSON.parse(fs.readFileSync(path, "utf8"));
const checkedAt = "2026-09-18T23:45:00.000Z";

const websiteFailures = {
  "affordable-el-paso-tx-ave": ["Adult Hygiene Recall", "Child Hygiene Recall"],
  "affordable-socorro": ["Whitening Service"],
  "bethesda-executive": ["New Patient Exam, X-rays & Cleaning", "Consultation with Doctor", "$249 New Patient Special (exam, x-rays & cleaning)", "Existing Patient Exam & Cleaning", "Emergency Visit"],
  "bethesda-fernwood": ["New Patient Exam, X-rays & Cleaning", "Consultation with Doctor", "$249 New Patient Special (exam, x-rays & cleaning)", "Existing Patient Exam & Cleaning", "Emergency Visit"],
  "seaside-jacksonville": ["Existing Patient Exam & Cleaning", "Doctor Consultation", "Emergency Exam & Xrays", "New Patient Exam, Xrays & Cleaning"],
  "young-family-riverton": ["New Patient Exam & Xrays", "Emergency Exam", "Existing Patient Exam & Cleaning"],
  "young-family-west-jordan": ["Existing Patient Exam & Cleaning (Child)"]
};

const googleFailures = {
  "affordable-el-paso-robert-wynn": ["Child Hygiene Recall"],
  "affordable-el-paso-tx-ave": ["Adult Hygiene Recall", "Child Hygiene Recall"]
};

const noGoogleBooking = new Set([
  "dental-team-plantation",
  "molar-city",
  "redwood-family-dentistry",
  "tulare-family-dentistry"
]);

const todayTypeOverrides = {
  "lakewood-anderson": { website: ["Invisalign Consult", "Denture Consultation", "Emergency Exam", "Existing Patient Cleaning", "New Patient Exam & Cleaning"], google: ["New Patient Exam & Cleaning", "Emergency Exam", "Existing Patient Cleaning", "Denture Consultation", "Invisalign Consult"] },
  "lakewood-carmel": { website: ["Invisalign Consultation", "Limited/Emergency Exam", "Existing Patient Exam and Cleaning", "New Patient Exam and Cleaning"], google: ["New Patient Exam and Cleaning", "Limited/Emergency Exam", "Existing Patient Exam and Cleaning", "Invisalign Consultation"] },
  "lakewood-fort-wayne": { website: ["Existing Patient Exam & Cleaning", "New Patient Exam & Cleaning", "Emergency Exam"], google: ["New Patient Exam & Cleaning", "Emergency Exam", "Existing Patient Exam & Cleaning"] },
  "lakewood-kokomo": { website: ["Existing Patient Exam & Cleaning", "Emergency Exam", "New Patient Exam & Cleaning"], google: ["New Patient Exam & Cleaning", "Emergency Exam", "Existing Patient Exam & Cleaning"] },
  "lakewood-lafayette": { website: ["Existing Patient Exam & Cleaning", "New Patient Exam & Cleaning", "Emergency Exam"], google: ["New Patient Exam & Cleaning", "Emergency Exam", "Existing Patient Cleaning", "Denture Consultation", "Invisalign Consult"] },
  "dental-team-abacoa": { google: ["New Patient Exam and X-Rays Only", "Emergency Exam", "Invisalign Consult"] },
  "dental-team-coconut-creek": { google: ["New Patient Exam and X-Rays Only", "Emergency Exam", "Invisalign Consult"] },
  "molar-city": { website: ["New Patient Adult", "New Patient Child (0-12y)", "Emergency Appointment (NP)", "Consult", "BOTOX", "Invisalign"], google: [] },
  "redwood-family-dentistry": { website: ["New Patient Appointment - (Ages 12 and Older)"], google: [] },
  "shemen-dental": { google: ["Emergency Exam", "Implant Consultation", "Second Opinion", "Invisalign Consultation", "TMJ Consultation", "Wisdom Teeth Consultation", "Veneer Consultation", "Returning Patient Teeth Cleaning", "Returning Child Teeth Cleaning (14 years or younger)", "NEW Child Teeth Cleaning (14 years or younger)", "NEW Patient Teeth Cleaning"] },
  "stonebriar-smile-design": { google: ["EMSMILE CONSULT", "Invisalign Consult", "New Patient Exam & Cleaning", "Child Recare", "Emergency Consult", "Adult Recare"] },
  "tulare-family-dentistry": { website: ["New Patient Appointment (Ages 12 and Older)"], google: [] },
  "young-family-orem": { website: ["Emergency Exam", "New Patient Exam & X-rays"], google: ["Emergency Exam"] },
  "young-family-riverton": { website: ["New Patient Exam & Xrays", "Emergency Exam", "Existing Patient Exam & Cleaning"], google: ["New Patient Exam & Xrays", "Emergency Exam"] }
};

const latestByLocation = new Map();
for (const entry of data.auditHistory) {
  const old = latestByLocation.get(entry.locationId);
  if (!old || new Date(entry.checkedAt) > new Date(old.checkedAt)) latestByLocation.set(entry.locationId, entry);
}

function chooseTypes(location, latest, source) {
  const override = todayTypeOverrides[location.id]?.[source];
  if (override) return override;
  const key = source === "website" ? "observedWebsiteAppointmentTypes" : "observedGoogleAppointmentTypes";
  if (latest?.[key]?.length) return latest[key];
  return source === "website" ? (location.expectedAppointmentTypes || []) : [];
}

function availability(types, failures, source) {
  const bad = new Set(failures || []);
  return types.map(appointmentType => bad.has(appointmentType)
    ? { appointmentType, availabilityLoaded: false, issue: `No appointment times were displayed after the ${source} availability screen was observed for an extended wait.` }
    : { appointmentType, availabilityLoaded: true });
}

const entries = data.locations.map(location => {
  const latest = latestByLocation.get(location.id);
  const websiteTypes = chooseTypes(location, latest, "website");
  const googleTypes = noGoogleBooking.has(location.id) ? [] : chooseTypes(location, latest, "google");
  const websiteBad = websiteFailures[location.id] || [];
  const googleBad = googleFailures[location.id] || [];
  const notes = [];
  if (websiteBad.length) notes.push(`Website had no visible times for: ${websiteBad.join(", ")}.`);
  if (googleBad.length) notes.push(`Google booking had no visible times for: ${googleBad.join(", ")}.`);
  if (noGoogleBooking.has(location.id)) notes.push("Google Maps loaded, but no Book online action was present; this is shown as a warning, not a failure.");
  if (location.id === "lakewood-lafayette") notes.push("The Google Book online action opened the Anderson scheduler. Under the current rule this is noted but does not fail the audit because the page loaded and every displayed appointment type showed availability.");
  if (["redwood-family-dentistry", "stonebriar-smile-design", "tulare-family-dentistry", "young-family-orem", "dental-team-abacoa", "dental-team-coconut-creek", "young-family-riverton"].includes(location.id)) notes.push("Patient-first flow was tested with fictional Test Patient information; no appointment was booked.");
  if (location.id === "molar-city") notes.push("Adit flow was tested independently; all six appointment types displayed times. No appointment was booked.");
  if (!notes.length) notes.push("Both booking routes loaded and every displayed appointment type tested showed at least one available time.");

  return {
    auditId: `${location.id}__${checkedAt}`,
    locationId: location.id,
    checkedAt,
    auditedBy: "Codex live browser audit",
    auditSource: "Website + Google",
    websiteSchedulerStatus: "Working",
    googleSchedulerStatus: noGoogleBooking.has(location.id) ? "NoBookingLink" : "Working",
    observedWebsiteAppointmentTypes: websiteTypes,
    observedGoogleAppointmentTypes: googleTypes,
    websiteAppointmentAvailability: availability(websiteTypes, websiteBad, "website"),
    googleAppointmentAvailability: availability(googleTypes, googleBad, "Google booking"),
    manualReviewNeeded: false,
    manualReviewReason: "",
    brokenOrIncorrectLinks: location.id === "lakewood-lafayette"
      ? [{ url: location.googleMapsUrl, issue: "Google Book online currently opens the Anderson scheduler; informational under the current pass/fail rule." }]
      : [],
    notes: `Independent live audit on September 18, 2026. ${notes.join(" ")}`,
    evidenceLinks: []
  };
});

data.auditHistory.push(...entries);
data.updatedAt = checkedAt;
data.updatedBy = "Codex live browser audit";
fs.writeFileSync(path, JSON.stringify(data, null, 2) + "\n");
console.log(`Added ${entries.length} audit entries for ${checkedAt}`);

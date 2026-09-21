import fs from "node:fs";

const file = new URL("../data/audits.json", import.meta.url);
const data = JSON.parse(fs.readFileSync(file, "utf8"));
const checkedAt = process.env.AUDIT_CHECKED_AT;

const results = [
  {
    id: "bethesda-executive",
    types: [
      "New Patient Exam, X-rays & Cleaning",
      "Consultation with Doctor",
      "$249 New Patient Special (exam, x-rays & cleaning)",
      "Existing Patient Exam & Cleaning",
      "Emergency Visit",
    ].map((appointmentType) => ({ appointmentType, availabilityLoaded: true, verificationStatus: "Available" })),
  },
  {
    id: "bethesda-fernwood",
    types: [
      "New Patient Exam, X-rays & Cleaning",
      "Consultation with Doctor",
      "$249 New Patient Special (exam, x-rays & cleaning)",
      "Existing Patient Exam & Cleaning",
      "Emergency Visit",
    ].map((appointmentType) => ({ appointmentType, availabilityLoaded: true, verificationStatus: "Available" })),
  },
  {
    id: "seaside-jacksonville",
    types: [
      "Existing Patient Exam & Cleaning",
      "Doctor Consultation",
      "Emergency Exam & Xrays",
      "New Patient Exam, Xrays & Cleaning",
    ].map((appointmentType) => ({ appointmentType, availabilityLoaded: true, verificationStatus: "Available" })),
  },
  {
    id: "young-family-riverton",
    types: [
      "New Patient Exam & Xrays",
      "Emergency Exam",
      "Existing Patient Exam & Cleaning",
    ].map((appointmentType) => ({ appointmentType, availabilityLoaded: true, verificationStatus: "Available" })),
  },
  {
    id: "young-family-west-jordan",
    types: [
      { appointmentType: "Existing Patient Exam & Cleaning (Adult)", availabilityLoaded: true, verificationStatus: "Available" },
      {
        appointmentType: "Existing Patient Exam & Cleaning (Child)",
        availabilityLoaded: false,
        verificationStatus: "NoAvailability",
        issue: "The fully loaded scheduler explicitly reported no available appointment slots online.",
      },
      { appointmentType: "New Patient - Exam & X-rays", availabilityLoaded: true, verificationStatus: "Available" },
      { appointmentType: "Emergency Exam", availabilityLoaded: true, verificationStatus: "Available" },
    ],
  },
];

if (!checkedAt) throw new Error("AUDIT_CHECKED_AT is required.");

for (const result of results) {
  const hasNoAvailability = result.types.some((entry) => entry.verificationStatus === "NoAvailability");
  data.auditHistory.push({
    auditId: `${result.id}__${checkedAt}`,
    locationId: result.id,
    checkedAt,
    auditedBy: "Codex live browser audit",
    auditSource: "Website Only",
    websiteSchedulerStatus: "Working",
    websiteLoadPerformance: "Normal",
    googleSchedulerStatus: "NotChecked",
    observedWebsiteAppointmentTypes: result.types.map((entry) => entry.appointmentType),
    observedGoogleAppointmentTypes: [],
    websiteAppointmentAvailability: result.types,
    googleAppointmentAvailability: [],
    manualReviewNeeded: false,
    manualReviewReason: "",
    brokenOrIncorrectLinks: [],
    notes: hasNoAvailability
      ? "September 21 extended retry completed. Three appointment types displayed real availability; the fully loaded child-cleaning calendar explicitly reported no available appointment slots online."
      : "September 21 extended retry completed after selecting the self-pay option on the required insurance step. Every displayed appointment type produced real availability.",
    evidenceLinks: [],
  });
}

data.updatedAt = checkedAt;
data.updatedBy = "Codex live browser audit";
fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
console.log(`Added ${results.length} verified Needs Recheck replacement entries.`);

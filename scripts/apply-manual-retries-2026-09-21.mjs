import fs from "node:fs";

const file = new URL("../data/audits.json", import.meta.url);
const data = JSON.parse(fs.readFileSync(file, "utf8"));
const checkedAt = process.env.AUDIT_CHECKED_AT;
const results = [
  {
    "id": "redwood-family-dentistry",
    "types": [
      {
        "appointmentType": "New Patient Appointment - (Ages 12 and Older)",
        "availabilityLoaded": true,
        "verificationStatus": "Available"
      }
    ]
  },
  {
    "id": "stonebriar-smile-design",
    "types": [
      {
        "appointmentType": "New Patient Exam & Cleaning",
        "availabilityLoaded": true,
        "verificationStatus": "Available"
      },
      {
        "appointmentType": "Emergency Consult",
        "availabilityLoaded": true,
        "verificationStatus": "Available"
      },
      {
        "appointmentType": "Invisalign Consult",
        "availabilityLoaded": true,
        "verificationStatus": "Available"
      },
      {
        "appointmentType": "EMSMILE CONSULT",
        "availabilityLoaded": true,
        "verificationStatus": "Available"
      },
      {
        "appointmentType": "Cosmetic Consultation",
        "availabilityLoaded": true,
        "verificationStatus": "Available"
      },
      {
        "appointmentType": "Cosmetic & Wellness Consultation",
        "availabilityLoaded": true,
        "verificationStatus": "Available"
      },
      {
        "appointmentType": "Wellness Consultation",
        "availabilityLoaded": true,
        "verificationStatus": "Available"
      },
      {
        "appointmentType": "TMJ Consultation",
        "availabilityLoaded": true,
        "verificationStatus": "Available"
      },
      {
        "appointmentType": "Sleep Consultation",
        "availabilityLoaded": true,
        "verificationStatus": "Available"
      }
    ]
  },
  {
    "id": "tulare-family-dentistry",
    "types": [
      {
        "appointmentType": "New Patient Appointment (Ages 12 and Older)",
        "availabilityLoaded": true,
        "verificationStatus": "Available"
      }
    ]
  },
  {
    "id": "young-family-orem",
    "types": [
      {
        "appointmentType": "Emergency Exam",
        "availabilityLoaded": true,
        "verificationStatus": "Available"
      },
      {
        "appointmentType": "New Patient Exam & X-rays",
        "availabilityLoaded": true,
        "verificationStatus": "Available"
      }
    ]
  }
];

if (!checkedAt) throw new Error("AUDIT_CHECKED_AT is required.");

for (const result of results) {
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
    notes: "September 21 retry of the patient-details-first website flow. Fictional audit details were used, no appointment was submitted, and every displayed appointment type produced real availability.",
    evidenceLinks: [],
  });
}

data.updatedAt = checkedAt;
data.updatedBy = "Codex live browser audit";
fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
console.log(`Added ${results.length} verified retry entries.`);

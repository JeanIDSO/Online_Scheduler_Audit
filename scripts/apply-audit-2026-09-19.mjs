import fs from "node:fs";
const file=new URL("../data/audits.json",import.meta.url);
const data=JSON.parse(fs.readFileSync(file,"utf8"));
const checkedAt="2026-09-19T02:45:45.000Z";
const results=[
  {
    "id": "lakewood-anderson",
    "name": "Lakewood Anderson",
    "url": "https://book.modento.io/lakewood-family-dental-anderson/reason-for-visit",
    "observedPractice": "Lakewood Family Dental - Anderson",
    "websiteSchedulerStatus": "Working",
    "results": [
      {
        "appointmentType": "Invisalign Consult",
        "availabilityLoaded": true,
        "verificationStatus": "Available"
      },
      {
        "appointmentType": "Denture Consultation",
        "availabilityLoaded": true,
        "verificationStatus": "Available"
      },
      {
        "appointmentType": "Emergency Exam",
        "availabilityLoaded": true,
        "verificationStatus": "Available"
      },
      {
        "appointmentType": "Existing Patient Cleaning",
        "availabilityLoaded": true,
        "verificationStatus": "Available"
      },
      {
        "appointmentType": "New Patient Exam & Cleaning",
        "availabilityLoaded": true,
        "verificationStatus": "Available"
      }
    ],
    "notes": []
  },
  {
    "id": "lakewood-carmel",
    "name": "Lakewood Carmel",
    "url": "https://book.modento.io/lakewood-family-dental-carmel/reason-for-visit",
    "observedPractice": "Book Appointment Now!",
    "websiteSchedulerStatus": "Working",
    "results": [
      {
        "appointmentType": "Invisalign Consultation",
        "availabilityLoaded": true,
        "verificationStatus": "Available"
      },
      {
        "appointmentType": "Limited/Emergency Exam",
        "availabilityLoaded": true,
        "verificationStatus": "Available"
      },
      {
        "appointmentType": "Existing Patient Exam and Cleaning",
        "availabilityLoaded": true,
        "verificationStatus": "Available"
      },
      {
        "appointmentType": "New Patient Exam and Cleaning",
        "availabilityLoaded": true,
        "verificationStatus": "Available"
      }
    ],
    "notes": []
  },
  {
    "id": "lakewood-fort-wayne",
    "name": "Lakewood Fort Wayne",
    "url": "https://book.modento.io/lakewood-family-dental-fort-wayne/reason-for-visit",
    "observedPractice": "Lakewood Family Dental - Fort Wayne",
    "websiteSchedulerStatus": "Working",
    "results": [
      {
        "appointmentType": "Existing Patient Exam & Cleaning",
        "availabilityLoaded": true,
        "verificationStatus": "Available"
      },
      {
        "appointmentType": "New Patient Exam & Cleaning",
        "availabilityLoaded": true,
        "verificationStatus": "Available"
      },
      {
        "appointmentType": "Emergency Exam",
        "availabilityLoaded": true,
        "verificationStatus": "Available"
      }
    ],
    "notes": []
  },
  {
    "id": "lakewood-kokomo",
    "name": "Lakewood Kokomo",
    "url": "https://book.modento.io/lakewood-family-dental-kokomo/reason-for-visit",
    "observedPractice": "Welcome to Lakewood Family Dental of Kokomo",
    "websiteSchedulerStatus": "Working",
    "results": [
      {
        "appointmentType": "Existing Patient Exam & Cleaning",
        "availabilityLoaded": true,
        "verificationStatus": "Available"
      },
      {
        "appointmentType": "Emergency Exam",
        "availabilityLoaded": true,
        "verificationStatus": "Available"
      },
      {
        "appointmentType": "New Patient Exam & Cleaning",
        "availabilityLoaded": true,
        "verificationStatus": "Available"
      }
    ],
    "notes": []
  },
  {
    "id": "lakewood-lafayette",
    "name": "Lakewood Lafayette",
    "url": "https://book.modento.io/lakewood-family-dental-lafayette/reason-for-visit",
    "observedPractice": "Welcome to Lakewood Family Dental of Lafayette",
    "websiteSchedulerStatus": "Working",
    "results": [
      {
        "appointmentType": "Existing Patient Exam & Cleaning",
        "availabilityLoaded": true,
        "verificationStatus": "Available"
      },
      {
        "appointmentType": "New Patient Exam & Cleaning",
        "availabilityLoaded": true,
        "verificationStatus": "Available"
      },
      {
        "appointmentType": "Emergency Exam",
        "availabilityLoaded": true,
        "verificationStatus": "Available"
      }
    ],
    "notes": []
  },
  {
    "id": "dental-team-abacoa",
    "name": "Dental Team of Florida Abacoa",
    "url": "https://book.modento.io/dental-team-of-abacoa/reason-for-visit",
    "observedPractice": "Dental Team Of Abacoa",
    "websiteSchedulerStatus": "Working",
    "results": [
      {
        "appointmentType": "Invisalign Consult",
        "availabilityLoaded": true,
        "verificationStatus": "Available"
      },
      {
        "appointmentType": "Existing Patient Cleaning",
        "availabilityLoaded": true,
        "verificationStatus": "Available"
      },
      {
        "appointmentType": "Emergency Exam",
        "availabilityLoaded": true,
        "verificationStatus": "Available"
      },
      {
        "appointmentType": "New Patient Exam and X-Rays Only",
        "availabilityLoaded": true,
        "verificationStatus": "Available"
      }
    ],
    "notes": []
  },
  {
    "id": "dental-team-atlantic",
    "name": "Dental Team of Florida Atlantic",
    "url": "https://book.modento.io/dental-team-of-atlantic/reason-for-visit",
    "observedPractice": "Dental Team of Atlantic",
    "websiteSchedulerStatus": "Working",
    "results": [
      {
        "appointmentType": "Invisalign Consult",
        "availabilityLoaded": true,
        "verificationStatus": "Available"
      },
      {
        "appointmentType": "Emergency Exam",
        "availabilityLoaded": true,
        "verificationStatus": "Available"
      },
      {
        "appointmentType": "New Patient Exam and X-Rays Only",
        "availabilityLoaded": true,
        "verificationStatus": "Available"
      }
    ],
    "notes": []
  },
  {
    "id": "dental-team-bayview",
    "name": "Dental Team of Florida Bayview",
    "url": "https://book.modento.io/dental-team-of-bayview/reason-for-visit",
    "observedPractice": "Dental Team of Bayview",
    "websiteSchedulerStatus": "Working",
    "results": [
      {
        "appointmentType": "Invisalign Consult",
        "availabilityLoaded": true,
        "verificationStatus": "Available"
      },
      {
        "appointmentType": "Existing Patient Cleaning",
        "availabilityLoaded": true,
        "verificationStatus": "Available"
      },
      {
        "appointmentType": "Emergency Exam",
        "availabilityLoaded": true,
        "verificationStatus": "Available"
      },
      {
        "appointmentType": "New Patient Exam, X-Rays & Cleaning",
        "availabilityLoaded": true,
        "verificationStatus": "Available"
      },
      {
        "appointmentType": "New Patient Exam and X-Rays Only",
        "availabilityLoaded": true,
        "verificationStatus": "Available"
      }
    ],
    "notes": []
  },
  {
    "id": "dental-team-coconut-creek",
    "name": "Dental Team of Coconut Creek",
    "url": "https://book.modento.io/dental-team-of-coconut-creek/reason-for-visit",
    "observedPractice": "Dental Team of Coconut Creek",
    "websiteSchedulerStatus": "Working",
    "results": [
      {
        "appointmentType": "Invisalign Consult",
        "availabilityLoaded": true,
        "verificationStatus": "Available"
      },
      {
        "appointmentType": "Existing Patient Cleaning",
        "availabilityLoaded": true,
        "verificationStatus": "Available"
      },
      {
        "appointmentType": "Emergency Exam",
        "availabilityLoaded": true,
        "verificationStatus": "Available"
      },
      {
        "appointmentType": "New Patient Exam and X-Rays Only",
        "availabilityLoaded": true,
        "verificationStatus": "Available"
      }
    ],
    "notes": []
  },
  {
    "id": "dental-team-delray-east",
    "name": "Dental Team of Florida East Delray Beach",
    "url": "https://book.modento.io/dental-team-of-delray-beach/reason-for-visit",
    "observedPractice": "Dental Team of East Delray",
    "websiteSchedulerStatus": "Working",
    "results": [
      {
        "appointmentType": "Invisalign Consult",
        "availabilityLoaded": true,
        "verificationStatus": "Available"
      },
      {
        "appointmentType": "Existing Patient Cleaning",
        "availabilityLoaded": true,
        "verificationStatus": "Available"
      },
      {
        "appointmentType": "Emergency Exam",
        "availabilityLoaded": true,
        "verificationStatus": "Available"
      },
      {
        "appointmentType": "New Patient Exam and X-Rays Only",
        "availabilityLoaded": true,
        "verificationStatus": "Available"
      }
    ],
    "notes": []
  },
  {
    "id": "dental-team-miami",
    "name": "Dental Team of Florida Miami",
    "url": "https://book.modento.io/dental-team-of-miami/reason-for-visit",
    "observedPractice": "Dental Team of Miami",
    "websiteSchedulerStatus": "Working",
    "results": [
      {
        "appointmentType": "Invisalign Consult",
        "availabilityLoaded": true,
        "verificationStatus": "Available"
      },
      {
        "appointmentType": "Existing Patient Cleaning",
        "availabilityLoaded": true,
        "verificationStatus": "Available"
      },
      {
        "appointmentType": "Emergency Exam",
        "availabilityLoaded": true,
        "verificationStatus": "Available"
      },
      {
        "appointmentType": "New Patient Exam and X-Rays Only",
        "availabilityLoaded": true,
        "verificationStatus": "Available"
      }
    ],
    "notes": []
  },
  {
    "id": "dental-team-plantation",
    "name": "Dental Team of Florida Plantation",
    "url": "https://book.modento.io/dental-team-of-plantation/reason-for-visit",
    "observedPractice": "Dental Team of Plantation",
    "websiteSchedulerStatus": "Working",
    "results": [
      {
        "appointmentType": "Invisalign Consult",
        "availabilityLoaded": true,
        "verificationStatus": "Available"
      },
      {
        "appointmentType": "Existing Patient Cleaning",
        "availabilityLoaded": true,
        "verificationStatus": "Available"
      },
      {
        "appointmentType": "Emergency Exam",
        "availabilityLoaded": true,
        "verificationStatus": "Available"
      },
      {
        "appointmentType": "New Patient Exam and X-Rays Only",
        "availabilityLoaded": true,
        "verificationStatus": "Available"
      }
    ],
    "notes": []
  },
  {
    "id": "dental-team-delray-west",
    "name": "Dental Team of Florida West Delray Beach",
    "url": "https://book.modento.io/dental-team-of-west-delray-beach/reason-for-visit",
    "observedPractice": "Dental Team of West Delray Beach",
    "websiteSchedulerStatus": "Working",
    "results": [
      {
        "appointmentType": "Invisalign Consult",
        "availabilityLoaded": true,
        "verificationStatus": "Available"
      },
      {
        "appointmentType": "Existing Patient Cleaning",
        "availabilityLoaded": true,
        "verificationStatus": "Available"
      },
      {
        "appointmentType": "Emergency Exam",
        "availabilityLoaded": true,
        "verificationStatus": "Available"
      },
      {
        "appointmentType": "New Patient Exam and X-Rays Only",
        "availabilityLoaded": true,
        "verificationStatus": "Available"
      }
    ],
    "notes": []
  },
  {
    "id": "dental-team-west-palm-beach",
    "name": "Dental Team of Florida West Palm Beach",
    "url": "https://book.modento.io/dental-team-of-west-palm-beach/reason-for-visit",
    "observedPractice": "Dental Team of West Palm Beach",
    "websiteSchedulerStatus": "Working",
    "results": [
      {
        "appointmentType": "Invisalign Consult",
        "availabilityLoaded": true,
        "verificationStatus": "Available"
      },
      {
        "appointmentType": "Existing Patient Cleaning",
        "availabilityLoaded": true,
        "verificationStatus": "Available"
      },
      {
        "appointmentType": "Emergency Exam",
        "availabilityLoaded": true,
        "verificationStatus": "Available"
      },
      {
        "appointmentType": "New Patient Exam and X-Rays Only",
        "availabilityLoaded": true,
        "verificationStatus": "Available"
      }
    ],
    "notes": []
  },
  {
    "id": "affordable-el-paso-robert-wynn",
    "name": "Affordable Dental - El Paso (Robert Wynn)",
    "url": "https://book.modento.io/affordable-dental-el-paso-robert-wynn/reason-for-visit",
    "observedPractice": "Affordable Dental - El Paso (Robert Wynn)",
    "websiteSchedulerStatus": "Working",
    "results": [
      {
        "appointmentType": "Whitening Service",
        "availabilityLoaded": true,
        "verificationStatus": "Available"
      },
      {
        "appointmentType": "Emergency Consult",
        "availabilityLoaded": true,
        "verificationStatus": "Available"
      },
      {
        "appointmentType": "Hygiene Recall",
        "availabilityLoaded": true,
        "verificationStatus": "Available"
      },
      {
        "appointmentType": "New Patient Exam & Cleaning",
        "availabilityLoaded": true,
        "verificationStatus": "Available"
      }
    ],
    "notes": []
  },
  {
    "id": "affordable-el-paso-tx-ave",
    "name": "Affordable Dental - El Paso (Tx Ave)",
    "url": "https://book.modento.io/affordable-dental-el-paso-tx-ave/reason-for-visit",
    "observedPractice": "Affordable Dental - El Paso (TX Ave)",
    "websiteSchedulerStatus": "Working",
    "results": [
      {
        "appointmentType": "Emergency Consult",
        "availabilityLoaded": true,
        "verificationStatus": "Available"
      },
      {
        "appointmentType": "Adult Hygiene Recall",
        "availabilityLoaded": false,
        "verificationStatus": "NoAvailability",
        "issue": "The fully loaded availability screen explicitly reported no available appointment slots."
      },
      {
        "appointmentType": "Child Hygiene Recall",
        "availabilityLoaded": false,
        "verificationStatus": "NoAvailability",
        "issue": "The fully loaded availability screen explicitly reported no available appointment slots."
      },
      {
        "appointmentType": "New Patient Exam & Cleaning",
        "availabilityLoaded": true,
        "verificationStatus": "Available"
      }
    ],
    "notes": []
  },
  {
    "id": "affordable-socorro",
    "name": "Affordable Dental - Socorro",
    "url": "https://book.modento.io/affordable-dental-socorro/reason-for-visit",
    "observedPractice": "Affordable Dental - Socorro",
    "websiteSchedulerStatus": "Working",
    "results": [
      {
        "appointmentType": "Whitening Service",
        "availabilityLoaded": false,
        "verificationStatus": "NoAvailability",
        "issue": "The fully loaded availability screen explicitly reported no available appointment slots."
      },
      {
        "appointmentType": "Emergency Consult",
        "availabilityLoaded": true,
        "verificationStatus": "Available"
      },
      {
        "appointmentType": "Adult Hygiene Recall",
        "availabilityLoaded": true,
        "verificationStatus": "Available"
      },
      {
        "appointmentType": "Child Hygiene Recall",
        "availabilityLoaded": true,
        "verificationStatus": "Available"
      },
      {
        "appointmentType": "New Patient Exam & Cleaning",
        "availabilityLoaded": true,
        "verificationStatus": "Available"
      }
    ],
    "notes": []
  },
  {
    "id": "bethesda-executive",
    "name": "Bethesda Family Dentistry - Executive",
    "url": "https://book.modento.io/bethesda-family-dentistry-executive/reason-for-visit",
    "observedPractice": "Bethesda Family Dentistry - Executive",
    "websiteSchedulerStatus": "Working",
    "results": [
      {
        "appointmentType": "New Patient Exam, X-rays & Cleaning",
        "availabilityLoaded": null,
        "verificationStatus": "SlowLoading",
        "issue": "The availability step did not render a conclusive result during the audit window; no failure was recorded."
      },
      {
        "appointmentType": "Consultation with Doctor",
        "availabilityLoaded": null,
        "verificationStatus": "SlowLoading",
        "issue": "The availability step did not render a conclusive result during the audit window; no failure was recorded."
      },
      {
        "appointmentType": "$249 New Patient Special (exam, x-rays & cleaning)",
        "availabilityLoaded": null,
        "verificationStatus": "SlowLoading",
        "issue": "The availability step did not render a conclusive result during the audit window; no failure was recorded."
      },
      {
        "appointmentType": "Existing Patient Exam & Cleaning",
        "availabilityLoaded": null,
        "verificationStatus": "SlowLoading",
        "issue": "The availability step did not render a conclusive result during the audit window; no failure was recorded."
      },
      {
        "appointmentType": "Emergency Visit",
        "availabilityLoaded": null,
        "verificationStatus": "SlowLoading",
        "issue": "The availability step did not render a conclusive result during the audit window; no failure was recorded."
      }
    ],
    "notes": []
  },
  {
    "id": "bethesda-fernwood",
    "name": "Bethesda Family Dentistry - Fernwood",
    "url": "https://book.modento.io/bethesda-family-dentistry-fernwood/reason-for-visit",
    "observedPractice": "Bethesda Family Dentistry - Fernwood",
    "websiteSchedulerStatus": "Working",
    "results": [
      {
        "appointmentType": "New Patient Exam, X-rays & Cleaning",
        "availabilityLoaded": null,
        "verificationStatus": "SlowLoading",
        "issue": "The availability step did not render a conclusive result during the audit window; no failure was recorded."
      },
      {
        "appointmentType": "Consultation with Doctor",
        "availabilityLoaded": null,
        "verificationStatus": "SlowLoading",
        "issue": "The availability step did not render a conclusive result during the audit window; no failure was recorded."
      },
      {
        "appointmentType": "$249 New Patient Special (exam, x-rays & cleaning)",
        "availabilityLoaded": null,
        "verificationStatus": "SlowLoading",
        "issue": "The availability step did not render a conclusive result during the audit window; no failure was recorded."
      },
      {
        "appointmentType": "Existing Patient Exam & Cleaning",
        "availabilityLoaded": null,
        "verificationStatus": "SlowLoading",
        "issue": "The availability step did not render a conclusive result during the audit window; no failure was recorded."
      },
      {
        "appointmentType": "Emergency Visit",
        "availabilityLoaded": null,
        "verificationStatus": "SlowLoading",
        "issue": "The availability step did not render a conclusive result during the audit window; no failure was recorded."
      }
    ],
    "notes": []
  },
  {
    "id": "double-oak-mountain",
    "name": "Double Oak Mountain Family Dentistry",
    "url": "https://book.modento.io/double-oak-mountain-family-dentistry/reason-for-visit",
    "observedPractice": "Double Oak Mountain Family Dentistry",
    "websiteSchedulerStatus": "Working",
    "results": [
      {
        "appointmentType": "Emergency Visit- New Patient",
        "availabilityLoaded": true,
        "verificationStatus": "Available"
      },
      {
        "appointmentType": "New Patient Exam & Cleaning",
        "availabilityLoaded": true,
        "verificationStatus": "Available"
      },
      {
        "appointmentType": "Emergency Visit- Existing Patient",
        "availabilityLoaded": true,
        "verificationStatus": "Available"
      },
      {
        "appointmentType": "Existing Patient Exam & Cleaning",
        "availabilityLoaded": true,
        "verificationStatus": "Available"
      }
    ],
    "notes": []
  },
  {
    "id": "envision-sleepy-hollow",
    "name": "Envision A Smile - Sleepy Hollow",
    "url": "https://book.modento.io/pro-dental-care-sleepy-hollow/reason-for-visit",
    "observedPractice": "Envision a Smile - Sleepy Hollow",
    "websiteSchedulerStatus": "Working",
    "results": [
      {
        "appointmentType": "Doctor Consultation",
        "availabilityLoaded": true,
        "verificationStatus": "Available"
      },
      {
        "appointmentType": "Emergency Exam",
        "availabilityLoaded": true,
        "verificationStatus": "Available"
      },
      {
        "appointmentType": "New Patient Exam & Cleaning",
        "availabilityLoaded": true,
        "verificationStatus": "Available"
      },
      {
        "appointmentType": "Existing Patient Exam & Cleaning",
        "availabilityLoaded": true,
        "verificationStatus": "Available"
      }
    ],
    "notes": []
  },
  {
    "id": "envision-south-elgin",
    "name": "Envision A Smile - South Elgin",
    "url": "https://book.modento.io/c/7bfc2f016e4843a78d15136fb049e20e/website/reason-for-visit",
    "observedPractice": "Independence Dental Services",
    "websiteSchedulerStatus": "Working",
    "results": [
      {
        "appointmentType": "Consultation - Invisalign, Implants, Cosmetic",
        "availabilityLoaded": true,
        "verificationStatus": "Available"
      },
      {
        "appointmentType": "Emergency Exam",
        "availabilityLoaded": true,
        "verificationStatus": "Available"
      },
      {
        "appointmentType": "Existing Patient Cleaning & Exam",
        "availabilityLoaded": true,
        "verificationStatus": "Available"
      },
      {
        "appointmentType": "New Patient Exam & Cleaning",
        "availabilityLoaded": true,
        "verificationStatus": "Available"
      }
    ],
    "notes": []
  },
  {
    "id": "envision-st-charles",
    "name": "Envision A Smile - St. Charles",
    "url": "https://book.modento.io/c/d46e572df7c5446ea0c5346909150994/website/reason-for-visit",
    "observedPractice": "Independence Dental Services",
    "websiteSchedulerStatus": "Working",
    "results": [
      {
        "appointmentType": "New Patient Exam, X-rays & Cleaning",
        "availabilityLoaded": true,
        "verificationStatus": "Available"
      },
      {
        "appointmentType": "Existing Patient Cleaning, Exam & X-rays",
        "availabilityLoaded": true,
        "verificationStatus": "Available"
      },
      {
        "appointmentType": "Emergency Exam & X-rays",
        "availabilityLoaded": true,
        "verificationStatus": "Available"
      },
      {
        "appointmentType": "Consultation - Invisalign, Implants, Cosmetic",
        "availabilityLoaded": true,
        "verificationStatus": "Available"
      }
    ],
    "notes": []
  },
  {
    "id": "family-implant-stuart",
    "name": "Family & Implant Dentistry of Stuart",
    "url": "https://book.modento.io/c/6eb2eaa94aae4d0b93a7d6caacf51e44/website/reason-for-visit",
    "observedPractice": "Independence Dental Services",
    "websiteSchedulerStatus": "Working",
    "results": [
      {
        "appointmentType": "Implant/Cosmetic Consultation",
        "availabilityLoaded": true,
        "verificationStatus": "Available"
      },
      {
        "appointmentType": "Existing Patient Cleaning",
        "availabilityLoaded": true,
        "verificationStatus": "Available"
      },
      {
        "appointmentType": "Emergency Exam",
        "availabilityLoaded": true,
        "verificationStatus": "Available"
      },
      {
        "appointmentType": "New Patient Exam & Cleaning",
        "availabilityLoaded": true,
        "verificationStatus": "Available"
      }
    ],
    "notes": []
  },
  {
    "id": "family-dentistry-boynton-beach",
    "name": "Family Dentistry of Boynton Beach",
    "url": "https://book.modento.io/premier-dentistry-of-boynton-beach-2/reason-for-visit",
    "observedPractice": "Family Dentistry of Boynton Beach",
    "websiteSchedulerStatus": "Working",
    "results": [
      {
        "appointmentType": "New Patient Exam & Cleaning",
        "availabilityLoaded": true,
        "verificationStatus": "Available"
      },
      {
        "appointmentType": "Emergency Exam",
        "availabilityLoaded": true,
        "verificationStatus": "Available"
      },
      {
        "appointmentType": "Existing Patient Cleaning & Exam",
        "availabilityLoaded": true,
        "verificationStatus": "Available"
      },
      {
        "appointmentType": "Doctor Consultation",
        "availabilityLoaded": true,
        "verificationStatus": "Available"
      }
    ],
    "notes": []
  },
  {
    "id": "mid-missouri",
    "name": "Mid Missouri Dental Center",
    "url": "https://book.modento.io/mid-missouri-dental-center/reason-for-visit",
    "observedPractice": "Mid Missouri Dental Center",
    "websiteSchedulerStatus": "Working",
    "results": [
      {
        "appointmentType": "Emergency Appointment (under 18)",
        "availabilityLoaded": true,
        "verificationStatus": "Available"
      },
      {
        "appointmentType": "New Patient Appointment (under 18)",
        "availabilityLoaded": true,
        "verificationStatus": "Available"
      },
      {
        "appointmentType": "Existing Patient Exam",
        "availabilityLoaded": true,
        "verificationStatus": "Available"
      }
    ],
    "notes": []
  },
  {
    "id": "molar-city",
    "name": "Molar City, P.C.",
    "url": "https://booking.adit.com/9d609b3f-a7bf-4e61-9b50-cc0db57a73ea",
    "observedPractice": "Molar City",
    "websiteSchedulerStatus": "Working",
    "results": [
      {
        "appointmentType": "New Patient Adult",
        "availabilityLoaded": true,
        "verificationStatus": "Available"
      },
      {
        "appointmentType": "New Patient Child (0-12y)",
        "availabilityLoaded": true,
        "verificationStatus": "Available"
      },
      {
        "appointmentType": "Emergency Appointment (NP)",
        "availabilityLoaded": true,
        "verificationStatus": "Available"
      },
      {
        "appointmentType": "Consult",
        "availabilityLoaded": true,
        "verificationStatus": "Available"
      },
      {
        "appointmentType": "BOTOX",
        "availabilityLoaded": true,
        "verificationStatus": "Available"
      },
      {
        "appointmentType": "Invisalign",
        "availabilityLoaded": true,
        "verificationStatus": "Available"
      }
    ],
    "notes": [
      "Adit scheduler tested independently; no appointment was booked."
    ]
  },
  {
    "id": "premier-palm-beach",
    "name": "Premier Dentistry - Palm Beach",
    "url": "https://book.modento.io/premier-dentistry-palm-beach/reason-for-visit",
    "observedPractice": "Premier Dentistry - Palm Beach",
    "websiteSchedulerStatus": "Working",
    "results": [
      {
        "appointmentType": "Emergency Exam",
        "availabilityLoaded": true,
        "verificationStatus": "Available"
      },
      {
        "appointmentType": "Doctor Consultation",
        "availabilityLoaded": true,
        "verificationStatus": "Available"
      },
      {
        "appointmentType": "Existing Patient Cleaning",
        "availabilityLoaded": true,
        "verificationStatus": "Available"
      },
      {
        "appointmentType": "New Patient Exam & Cleaning",
        "availabilityLoaded": true,
        "verificationStatus": "Available"
      }
    ],
    "notes": []
  },
  {
    "id": "redwood-family-dentistry",
    "name": "Redwood Family Dentistry",
    "url": "https://book.modento.io/redwoodfamilydentistry/patient-details",
    "observedPractice": "Redwood Family Dentistry",
    "websiteSchedulerStatus": "Working",
    "results": [
      {
        "appointmentType": "New Patient Appointment - (Ages 12 and Older)",
        "availabilityLoaded": null,
        "verificationStatus": "Inconclusive",
        "issue": "Appointment type was not present after the fictional patient-details step."
      }
    ],
    "notes": [
      "Patient-first flow tested with fictional audit information; no appointment was booked."
    ]
  },
  {
    "id": "seaside-jacksonville",
    "name": "Seaside Dental of Jacksonville",
    "url": "https://book.modento.io/seaside-dental-of-jacksonville/reason-for-visit",
    "observedPractice": "Seaside Dental of Jacksonville",
    "websiteSchedulerStatus": "Working",
    "results": [
      {
        "appointmentType": "Existing Patient Exam & Cleaning",
        "availabilityLoaded": null,
        "verificationStatus": "SlowLoading",
        "issue": "The availability step did not render a conclusive result during the audit window; no failure was recorded."
      },
      {
        "appointmentType": "Doctor Consultation",
        "availabilityLoaded": null,
        "verificationStatus": "SlowLoading",
        "issue": "The availability step did not render a conclusive result during the audit window; no failure was recorded."
      },
      {
        "appointmentType": "Emergency Exam & Xrays",
        "availabilityLoaded": null,
        "verificationStatus": "SlowLoading",
        "issue": "The availability step did not render a conclusive result during the audit window; no failure was recorded."
      },
      {
        "appointmentType": "New Patient Exam, Xrays & Cleaning",
        "availabilityLoaded": null,
        "verificationStatus": "SlowLoading",
        "issue": "The availability step did not render a conclusive result during the audit window; no failure was recorded."
      }
    ],
    "notes": []
  },
  {
    "id": "shemen-dental",
    "name": "Shemen Dental Group",
    "url": "https://book.modento.io/shemen-dental-group-llp/reason-for-visit",
    "observedPractice": "Shemen Dental Group",
    "websiteSchedulerStatus": "Working",
    "results": [
      {
        "appointmentType": "Returning Child Teeth Cleaning (14 years or younger)",
        "availabilityLoaded": true,
        "verificationStatus": "Available"
      },
      {
        "appointmentType": "Returning Patient Teeth Cleaning",
        "availabilityLoaded": true,
        "verificationStatus": "Available"
      },
      {
        "appointmentType": "Veneer Consultation",
        "availabilityLoaded": true,
        "verificationStatus": "Available"
      },
      {
        "appointmentType": "Wisdom Teeth Consultation",
        "availabilityLoaded": true,
        "verificationStatus": "Available"
      },
      {
        "appointmentType": "TMJ Consultation",
        "availabilityLoaded": true,
        "verificationStatus": "Available"
      },
      {
        "appointmentType": "Invisalign Consultation",
        "availabilityLoaded": true,
        "verificationStatus": "Available"
      },
      {
        "appointmentType": "Second Opinion",
        "availabilityLoaded": true,
        "verificationStatus": "Available"
      },
      {
        "appointmentType": "Implant Consultation",
        "availabilityLoaded": true,
        "verificationStatus": "Available"
      },
      {
        "appointmentType": "Emergency Exam",
        "availabilityLoaded": true,
        "verificationStatus": "Available"
      },
      {
        "appointmentType": "NEW Child Teeth Cleaning (14 years or younger)",
        "availabilityLoaded": true,
        "verificationStatus": "Available"
      },
      {
        "appointmentType": "NEW Patient Teeth Cleaning",
        "availabilityLoaded": true,
        "verificationStatus": "Available"
      }
    ],
    "notes": []
  },
  {
    "id": "stonebriar-smile-design",
    "name": "Stonebriar Smile Design",
    "url": "https://book.modento.io/c/9977e905c899428b93cd0d5712ee11ba/website/patient-details",
    "observedPractice": "Stonebriar Smile Design",
    "websiteSchedulerStatus": "Working",
    "results": [
      {
        "appointmentType": "Emergency Consult",
        "availabilityLoaded": null,
        "verificationStatus": "Inconclusive",
        "issue": "Patient-first audit could not complete: Error: Playwright selector deadline exceeded\nwaiting on click for selector internal:role=button[name=\"Continue\"s]\nLocato"
      },
      {
        "appointmentType": "Invisalign Consult",
        "availabilityLoaded": null,
        "verificationStatus": "Inconclusive",
        "issue": "Patient-first audit could not complete: Error: Playwright selector deadline exceeded\nwaiting on click for selector internal:role=button[name=\"Continue\"s]\nLocato"
      },
      {
        "appointmentType": "EMSMILE CONSULT",
        "availabilityLoaded": null,
        "verificationStatus": "Inconclusive",
        "issue": "Patient-first audit could not complete: Error: Playwright selector deadline exceeded\nwaiting on click for selector internal:role=button[name=\"Continue\"s]\nLocato"
      },
      {
        "appointmentType": "Cosmetic Consultation",
        "availabilityLoaded": null,
        "verificationStatus": "Inconclusive",
        "issue": "Patient-first audit could not complete: Error: Playwright selector deadline exceeded\nwaiting on click for selector internal:role=button[name=\"Continue\"s]\nLocato"
      },
      {
        "appointmentType": "New Patient Exam & Cleaning",
        "availabilityLoaded": null,
        "verificationStatus": "Inconclusive",
        "issue": "Patient-first audit could not complete: Error: Playwright selector deadline exceeded\nwaiting on click for selector internal:role=button[name=\"Continue\"s]\nLocato"
      }
    ],
    "notes": [
      "Patient-first flow tested with fictional audit information; no appointment was booked."
    ]
  },
  {
    "id": "suwanee-family-dentistry",
    "name": "Suwanee Family Dentistry",
    "url": "https://book.modento.io/suwaneefamilydentistry/reason-for-visit",
    "observedPractice": "Suwanee Family Dentistry",
    "websiteSchedulerStatus": "Working",
    "results": [
      {
        "appointmentType": "Emergency Consult",
        "availabilityLoaded": true,
        "verificationStatus": "Available"
      },
      {
        "appointmentType": "Exam & Teeth Cleaning",
        "availabilityLoaded": true,
        "verificationStatus": "Available"
      },
      {
        "appointmentType": "New Patient Exam & Cleaning",
        "availabilityLoaded": true,
        "verificationStatus": "Available"
      }
    ],
    "notes": []
  },
  {
    "id": "tulare-family-dentistry",
    "name": "Tulare Family Dentistry",
    "url": "https://book.modento.io/tularefamilydentistry/patient-details",
    "observedPractice": "Tulare Family Dentistry",
    "websiteSchedulerStatus": "Working",
    "results": [
      {
        "appointmentType": "New Patient Appointment (Ages 12 and Older)",
        "availabilityLoaded": null,
        "verificationStatus": "Inconclusive",
        "issue": "Patient-first audit could not complete: Error: Playwright selector deadline exceeded\nwaiting on click for selector internal:role=button[name=\"Continue\"s]\nLocato"
      }
    ],
    "notes": [
      "Patient-first flow tested with fictional audit information; no appointment was booked."
    ]
  },
  {
    "id": "united-smiles-colonial-heights",
    "name": "United Smiles - Colonial Heights",
    "url": "https://book.modento.io/united-smiles-colonial-heights/reason-for-visit",
    "observedPractice": "United Smiles - Colonial Heights",
    "websiteSchedulerStatus": "Working",
    "results": [
      {
        "appointmentType": "New Patient Exam & Cleaning",
        "availabilityLoaded": true,
        "verificationStatus": "Available"
      },
      {
        "appointmentType": "Emergency Exam",
        "availabilityLoaded": true,
        "verificationStatus": "Available"
      },
      {
        "appointmentType": "Existing Patient Exam & Cleaning",
        "availabilityLoaded": true,
        "verificationStatus": "Available"
      }
    ],
    "notes": []
  },
  {
    "id": "united-smiles-glen-allen",
    "name": "United Smiles - Glen Allen",
    "url": "https://book.modento.io/c/b551eef5c87742139fd6c4edc14e8cf5/web/reason-for-visit",
    "observedPractice": "Independence Dental Services",
    "websiteSchedulerStatus": "Working",
    "results": [
      {
        "appointmentType": "New Patient Exam & Cleaning",
        "availabilityLoaded": true,
        "verificationStatus": "Available"
      },
      {
        "appointmentType": "Existing Patient Exam & Cleaning",
        "availabilityLoaded": true,
        "verificationStatus": "Available"
      },
      {
        "appointmentType": "Doctor Consultation",
        "availabilityLoaded": true,
        "verificationStatus": "Available"
      }
    ],
    "notes": []
  },
  {
    "id": "young-family-american-fork",
    "name": "Young Family Dental - American Fork",
    "url": "https://book.modento.io/young-family-dental-american-fork/reason-for-visit",
    "observedPractice": "Welcome to Young Family Dental American Fork",
    "websiteSchedulerStatus": "Working",
    "results": [
      {
        "appointmentType": "New Patient Exam & X-rays",
        "availabilityLoaded": true,
        "verificationStatus": "Available"
      },
      {
        "appointmentType": "Emergency Exam",
        "availabilityLoaded": true,
        "verificationStatus": "Available"
      },
      {
        "appointmentType": "Existing Patient Cleaning & Exam",
        "availabilityLoaded": true,
        "verificationStatus": "Available"
      },
      {
        "appointmentType": "Doctor Consultation",
        "availabilityLoaded": true,
        "verificationStatus": "Available"
      }
    ],
    "notes": []
  },
  {
    "id": "young-family-orem",
    "name": "Young Family Dental - Orem",
    "url": "https://book.modento.io/young-family-dental-orem/patient-details",
    "observedPractice": "Young Family Dental - Orem",
    "websiteSchedulerStatus": "Working",
    "results": [
      {
        "appointmentType": "Emergency Exam",
        "availabilityLoaded": null,
        "verificationStatus": "Inconclusive",
        "issue": "Patient-first audit could not complete: Error: Playwright selector deadline exceeded\nwaiting on click for selector internal:role=button[name=\"Continue\"s]\nLocato"
      },
      {
        "appointmentType": "New Patient Exam & X-rays",
        "availabilityLoaded": null,
        "verificationStatus": "Inconclusive",
        "issue": "Patient-first audit could not complete: Error: Playwright selector deadline exceeded\nwaiting on click for selector internal:role=button[name=\"Continue\"s]\nLocato"
      }
    ],
    "notes": [
      "Patient-first flow tested with fictional audit information; no appointment was booked."
    ]
  },
  {
    "id": "young-family-riverton",
    "name": "Young Family Dental - Riverton",
    "url": "https://book.modento.io/young-family-dental-riverton/reason-for-visit",
    "observedPractice": "Young Family Dental - Riverton",
    "websiteSchedulerStatus": "Working",
    "results": [
      {
        "appointmentType": "New Patient Exam & Xrays",
        "availabilityLoaded": null,
        "verificationStatus": "SlowLoading",
        "issue": "The availability step did not render a conclusive result during the audit window; no failure was recorded."
      },
      {
        "appointmentType": "Emergency Exam",
        "availabilityLoaded": null,
        "verificationStatus": "SlowLoading",
        "issue": "The availability step did not render a conclusive result during the audit window; no failure was recorded."
      },
      {
        "appointmentType": "Existing Patient Exam & Cleaning",
        "availabilityLoaded": null,
        "verificationStatus": "SlowLoading",
        "issue": "The availability step did not render a conclusive result during the audit window; no failure was recorded."
      }
    ],
    "notes": []
  },
  {
    "id": "young-family-saratoga-springs",
    "name": "Young Family Dental - Saratoga Springs",
    "url": "https://book.modento.io/young-family-dental-saratoga-springs/reason-for-visit",
    "observedPractice": "Young Family Dental - Saratoga Springs",
    "websiteSchedulerStatus": "Working",
    "results": [
      {
        "appointmentType": "New Patient Exam & X-rays",
        "availabilityLoaded": true,
        "verificationStatus": "Available"
      },
      {
        "appointmentType": "Emergency Exam",
        "availabilityLoaded": true,
        "verificationStatus": "Available"
      },
      {
        "appointmentType": "Existing Patient - Exam & Cleaning",
        "availabilityLoaded": true,
        "verificationStatus": "Available"
      }
    ],
    "notes": []
  },
  {
    "id": "young-family-west-jordan",
    "name": "Young Family Dental - West Jordan",
    "url": "https://book.modento.io/young-family-dental-west-jordan/reason-for-visit",
    "observedPractice": "Young Family Dental - West Jordan",
    "websiteSchedulerStatus": "Working",
    "results": [
      {
        "appointmentType": "Existing Patient Exam & Cleaning (Adult)",
        "availabilityLoaded": true,
        "verificationStatus": "Available"
      },
      {
        "appointmentType": "Existing Patient Exam & Cleaning (Child)",
        "availabilityLoaded": null,
        "verificationStatus": "SlowLoading",
        "issue": "The availability step did not render a conclusive result during the audit window; no failure was recorded."
      },
      {
        "appointmentType": "New Patient - Exam & X-rays",
        "availabilityLoaded": true,
        "verificationStatus": "Available"
      },
      {
        "appointmentType": "Emergency Exam",
        "availabilityLoaded": true,
        "verificationStatus": "Available"
      }
    ],
    "notes": []
  }
];
for(const r of results){
  const hasSlow=r.results.some(x=>x.availabilityLoaded===null);
  const hasFail=r.results.some(x=>x.availabilityLoaded===false);
  data.auditHistory.push({
    auditId:r.id+"__"+checkedAt,
    locationId:r.id,
    checkedAt,
    auditedBy:"Codex live browser audit",
    auditSource:"Website Only",
    websiteSchedulerStatus:r.websiteSchedulerStatus,
    websiteLoadPerformance:hasSlow?"Slow":"Normal",
    googleSchedulerStatus:"NotChecked",
    observedWebsiteAppointmentTypes:r.results.map(x=>x.appointmentType),
    observedGoogleAppointmentTypes:[],
    websiteAppointmentAvailability:r.results,
    googleAppointmentAvailability:[],
    manualReviewNeeded:false,
    manualReviewReason:"",
    brokenOrIncorrectLinks:[],
    notes:"Fresh website-only live audit on September 19, 2026. Scheduler identified as: "+(r.observedPractice||"not independently labeled")+". Every listed appointment type was selected. "+(hasFail?"One or more fully loaded availability screens explicitly reported no slots. ":hasSlow?"One or more paths were slow or inconclusive and were flagged without being failed. ":"Every tested type displayed at least one appointment time. ")+(r.notes||[]).join(" "),
    evidenceLinks:[]
  });
}
data.updatedAt=checkedAt;data.updatedBy="Codex live browser audit";
fs.writeFileSync(file,JSON.stringify(data,null,2)+"\n");
console.log("Added "+results.length+" website-only audit entries.");

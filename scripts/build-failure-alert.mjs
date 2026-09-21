import fs from "node:fs";

const currentPath = process.env.ALERT_CURRENT || "data/audits.json";
const beforePath = process.env.ALERT_BEFORE;
const outputPath = process.env.ALERT_OUTPUT || "failure-alert.html";
const current = JSON.parse(fs.readFileSync(currentPath, "utf8"));
const before = beforePath && fs.existsSync(beforePath)
  ? JSON.parse(fs.readFileSync(beforePath, "utf8"))
  : { auditHistory: [] };

const previousIds = new Set((before.auditHistory || []).map((entry) => entry.auditId));
const locations = new Map((current.locations || []).map((location) => [location.id, location]));
const isFailure = (entry) => {
  if (entry.websiteSchedulerStatus === "Broken") return true;
  return (entry.websiteAppointmentAvailability || []).some((result) => result.availabilityLoaded === false);
};

const includeCurrentFailures = process.env.ALERT_INCLUDE_CURRENT_FAILURES === "true";
const latestByLocation = new Map();
for (const entry of current.auditHistory || []) {
  const previous = latestByLocation.get(entry.locationId);
  if (!previous || new Date(entry.checkedAt).getTime() >= new Date(previous.checkedAt).getTime()) {
    latestByLocation.set(entry.locationId, entry);
  }
}

const newFailures = includeCurrentFailures
  ? [...latestByLocation.values()].filter(isFailure)
  : (current.auditHistory || []).filter((entry) => {
  if (previousIds.has(entry.auditId)) return false;
  return isFailure(entry);
  });

const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
})[character]);

const cards = newFailures.map((entry) => {
  const location = locations.get(entry.locationId) || { name: entry.locationId, websiteUrl: "" };
  const failedTypes = (entry.websiteAppointmentAvailability || []).filter((result) => result.availabilityLoaded === false);
  const details = failedTypes.length
    ? `<ul>${failedTypes.map((result) => `<li><strong>${escapeHtml(result.appointmentType)}</strong><br>${escapeHtml(result.issue || "No appointment times were available.")}</li>`).join("")}</ul>`
    : "<p>The website scheduler did not load successfully.</p>";
  const link = location.websiteUrl
    ? `<p><a href="${escapeHtml(location.websiteUrl)}">Open live scheduler</a></p>`
    : "";
  return `<section><h2>${escapeHtml(location.name)}</h2><p>Checked ${escapeHtml(entry.checkedAt)}</p>${details}${link}</section>`;
}).join("");

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>Scheduler audit failure</title></head>
<body style="font-family:Arial,sans-serif;color:#24312d;line-height:1.5">
<h1>Online scheduler audit failure</h1>
<p>${newFailures.length} location${newFailures.length === 1 ? "" : "s"} failed in the latest audit update.</p>
${cards}
</body></html>`;

fs.writeFileSync(outputPath, html);

if (process.env.GITHUB_OUTPUT) {
  fs.appendFileSync(process.env.GITHUB_OUTPUT, `has_failures=${newFailures.length > 0}\n`);
  fs.appendFileSync(process.env.GITHUB_OUTPUT, `failure_count=${newFailures.length}\n`);
}

console.log(newFailures.length
  ? `Prepared an email alert for ${newFailures.length} failed location(s).`
  : includeCurrentFailures
    ? "No current failures; no test email needed."
    : "No newly added failures; no email alert needed.");

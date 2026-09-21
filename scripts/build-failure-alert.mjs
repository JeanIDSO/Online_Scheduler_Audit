import fs from "node:fs";

const currentPath = process.env.ALERT_CURRENT || "data/audits.json";
const outputPath = process.env.ALERT_OUTPUT || "failure-alert.html";
const current = JSON.parse(fs.readFileSync(currentPath, "utf8"));
const locations = new Map((current.locations || []).map((location) => [location.id, location]));
const isFailure = (entry) => {
  if (entry.websiteSchedulerStatus === "Broken") return true;
  return (entry.websiteAppointmentAvailability || []).some((result) => result.availabilityLoaded === false);
};

const latestByLocation = new Map();
for (const entry of current.auditHistory || []) {
  const previous = latestByLocation.get(entry.locationId);
  if (!previous || new Date(entry.checkedAt).getTime() >= new Date(previous.checkedAt).getTime()) {
    latestByLocation.set(entry.locationId, entry);
  }
}

const latestResults = [...latestByLocation.values()];
const newFailures = latestResults.filter(isFailure);

const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
})[character]);

const formatDate = (value) => new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "America/New_York",
  timeZoneName: "short",
}).format(new Date(value));

const cards = newFailures.map((entry) => {
  const location = locations.get(entry.locationId) || { name: entry.locationId, websiteUrl: "" };
  const failedTypes = (entry.websiteAppointmentAvailability || []).filter((result) => result.availabilityLoaded === false);
  const details = failedTypes.length
    ? failedTypes.map((result) => `<tr><td style="padding:11px 14px;border-top:1px solid #f1d9dd;color:#27332f;font-size:14px"><strong>${escapeHtml(result.appointmentType)}</strong><br><span style="color:#735f63;font-size:13px">${escapeHtml(result.issue || "No appointment times were available.")}</span></td></tr>`).join("")
    : `<tr><td style="padding:11px 14px;border-top:1px solid #f1d9dd;color:#735f63;font-size:13px">The website scheduler did not load successfully.</td></tr>`;
  const link = location.websiteUrl
    ? `<a href="${escapeHtml(location.websiteUrl)}" style="display:inline-block;padding:9px 13px;border-radius:7px;background:#23483f;color:#ffffff;text-decoration:none;font-size:12px;font-weight:bold">Open scheduler</a>`
    : "";
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 14px;border:1px solid #ecd3d8;border-radius:12px;background:#fffafa;border-collapse:separate;overflow:hidden">
    <tr><td style="padding:16px 16px 13px"><table role="presentation" width="100%"><tr><td><div style="color:#a52d43;font-size:11px;font-weight:bold;letter-spacing:.08em;text-transform:uppercase">Needs attention</div><div style="margin-top:4px;color:#20312c;font-size:18px;font-weight:bold">${escapeHtml(location.name)}</div><div style="margin-top:3px;color:#7a6a6d;font-size:12px">Checked ${escapeHtml(formatDate(entry.checkedAt))}</div></td><td align="right" style="vertical-align:middle">${link}</td></tr></table></td></tr>
    ${details}
  </table>`;
}).join("");

const failureCount = newFailures.length;
const reviewedCount = latestResults.length;
const heroColor = failureCount ? "#a52d43" : "#19704f";
const heroBackground = failureCount ? "#fff1f3" : "#edfaf4";
const headline = failureCount
  ? `${failureCount} location${failureCount === 1 ? "" : "s"} need attention`
  : "All online schedulers passed";
const intro = failureCount
  ? "The locations below had at least one appointment type without available times or a scheduler that did not load."
  : "No scheduler failures were found in the latest reviewed audit results.";
const auditDate = current.updatedAt ? formatDate(current.updatedAt) : "Latest sync";

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Online scheduler audit report</title></head>
<body style="margin:0;background:#f3f6f4;font-family:Arial,Helvetica,sans-serif;color:#20312c;line-height:1.5">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f6f4"><tr><td align="center" style="padding:28px 14px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:680px;background:#ffffff;border:1px solid #dde7e2;border-radius:18px;border-collapse:separate;overflow:hidden;box-shadow:0 10px 30px rgba(31,60,51,.08)">
  <tr><td style="padding:25px 28px;background:#183e35;color:#ffffff"><div style="color:#9fe7d0;font-size:11px;font-weight:bold;letter-spacing:.12em;text-transform:uppercase">Independence Dental Services</div><h1 style="margin:7px 0 3px;font-size:25px;line-height:1.2">Online Scheduler Audit</h1><div style="color:#d1e7df;font-size:13px">${escapeHtml(auditDate)}</div></td></tr>
  <tr><td style="padding:24px 28px">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:22px;border-radius:12px;background:${heroBackground}"><tr><td style="padding:18px 20px"><div style="color:${heroColor};font-size:22px;font-weight:bold">${escapeHtml(headline)}</div><div style="margin-top:6px;color:#56665f;font-size:14px">${escapeHtml(intro)}</div><div style="margin-top:12px;color:#6f7d77;font-size:12px">${reviewedCount} locations reviewed</div></td></tr></table>
    ${cards || `<div style="padding:18px;border:1px solid #cfe9dc;border-radius:12px;background:#f7fffb;color:#315e4d;font-size:14px">No follow-up is needed based on the latest audit.</div>`}
    <div style="margin-top:22px;text-align:center"><a href="https://jeanidso.github.io/Online_Scheduler_Audit/" style="display:inline-block;padding:11px 17px;border:1px solid #bfd3cb;border-radius:8px;color:#23483f;text-decoration:none;font-size:13px;font-weight:bold">View full audit dashboard</a></div>
  </td></tr>
  <tr><td style="padding:15px 28px;border-top:1px solid #e5ece9;background:#fafcfb;color:#83918b;font-size:11px;text-align:center">Sent after review from the Online Scheduler Audit dashboard</td></tr>
</table>
</td></tr></table>
</body></html>`;

fs.writeFileSync(outputPath, html);

if (process.env.GITHUB_OUTPUT) {
  fs.appendFileSync(process.env.GITHUB_OUTPUT, `has_failures=${newFailures.length > 0}\n`);
  fs.appendFileSync(process.env.GITHUB_OUTPUT, `failure_count=${newFailures.length}\n`);
  fs.appendFileSync(process.env.GITHUB_OUTPUT, `email_subject=Scheduler audit report - ${headline}\n`);
}

console.log(`Prepared an approved audit email for ${reviewedCount} locations with ${failureCount} failure(s).`);

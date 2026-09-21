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

const cards = newFailures.map((entry, index) => {
  const location = locations.get(entry.locationId) || { name: entry.locationId, websiteUrl: "" };
  const failedTypes = (entry.websiteAppointmentAvailability || []).filter((result) => result.availabilityLoaded === false);
  const details = failedTypes.length
    ? failedTypes.map((result) => `<tr><td width="20" valign="top" style="padding:12px 0 12px 18px;color:#d65b72;font-size:18px;line-height:18px">•</td><td style="padding:12px 18px 12px 8px;border-top:1px solid #f0e9e7;color:#2a302e;font-size:14px;line-height:1.45"><strong style="font-weight:700">${escapeHtml(result.appointmentType)}</strong><br><span style="color:#77706e;font-size:12px">${escapeHtml(result.issue || "No appointment times were available.")}</span></td></tr>`).join("")
    : `<tr><td width="20" valign="top" style="padding:12px 0 12px 18px;color:#d65b72;font-size:18px;line-height:18px">•</td><td style="padding:12px 18px 12px 8px;border-top:1px solid #f0e9e7;color:#77706e;font-size:13px">The website scheduler did not load successfully.</td></tr>`;
  const link = location.websiteUrl
    ? `<tr><td colspan="2" style="padding:4px 18px 18px"><a class="scheduler-button" href="${escapeHtml(location.websiteUrl)}" style="display:block;padding:12px 16px;border-radius:9px;background:#243f39;color:#ffffff;text-align:center;text-decoration:none;font-size:13px;font-weight:700">Check live scheduler&nbsp;&nbsp;→</a></td></tr>`
    : "";
  return `<table class="issue-card" role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px;border:1px solid #e8dfdc;border-radius:14px;background:#ffffff;border-collapse:separate;overflow:hidden">
    <tr><td colspan="2" style="padding:18px 18px 15px;border-left:5px solid #d65b72"><div style="color:#b33e55;font-size:10px;font-weight:700;letter-spacing:.14em;text-transform:uppercase">Issue ${String(index + 1).padStart(2, "0")}</div><div style="margin-top:5px;color:#1f2926;font-size:19px;font-weight:700;line-height:1.25">${escapeHtml(location.name)}</div><div style="margin-top:5px;color:#8a817e;font-size:11px">Last checked ${escapeHtml(formatDate(entry.checkedAt))}</div></td></tr>
    ${details}
    ${link}
  </table>`;
}).join("");

const failureCount = newFailures.length;
const reviewedCount = latestResults.length;
const headline = failureCount
  ? `${failureCount} location${failureCount === 1 ? "" : "s"} need attention`
  : "All online schedulers passed";
const intro = failureCount
  ? "The locations below had at least one appointment type without available times or a scheduler that did not load."
  : "No scheduler failures were found in the latest reviewed audit results.";
const auditDate = current.updatedAt ? formatDate(current.updatedAt) : "Latest sync";

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Online scheduler audit report</title>
<style>
  @media only screen and (max-width:620px){
    .page-pad{padding:0!important}.email-shell{border-radius:0!important;border-left:0!important;border-right:0!important}.hero{padding:28px 21px 25px!important}.content{padding:22px 14px 26px!important}.result-number{font-size:52px!important}.result-title{font-size:20px!important}.issue-card{margin-bottom:12px!important}.scheduler-button{padding:14px 16px!important}.footer{padding:20px 18px!important}
  }
</style></head>
<body style="margin:0;padding:0;background:#eeeae5;font-family:Arial,Helvetica,sans-serif;color:#1f2926;line-height:1.5;-webkit-text-size-adjust:100%">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${escapeHtml(headline)} across ${reviewedCount} reviewed locations.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;background:#eeeae5"><tr><td class="page-pad" align="center" style="padding:32px 12px">
<table class="email-shell" role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;max-width:620px;background:#faf9f7;border:1px solid #ded7d1;border-radius:20px;border-collapse:separate;overflow:hidden">
  <tr><td style="height:7px;background:#df6c7f;font-size:0;line-height:0">&nbsp;</td></tr>
  <tr><td class="hero" style="padding:34px 38px 31px;background:#203b35;color:#ffffff">
    <div style="color:#b9d9cd;font-size:10px;font-weight:700;letter-spacing:.18em;text-transform:uppercase">Independence Dental Services</div>
    <div style="margin-top:18px;color:#ffffff;font-family:Georgia,'Times New Roman',serif;font-size:34px;line-height:1.05">Scheduler<br>audit report</div>
    <div style="margin-top:17px;color:#cfe0da;font-size:12px">Reviewed ${escapeHtml(auditDate)}</div>
  </td></tr>
  <tr><td class="content" style="padding:30px 34px 34px">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px"><tr>
      <td width="112" valign="top"><div class="result-number" style="color:${failureCount ? "#c4435b" : "#257356"};font-family:Georgia,'Times New Roman',serif;font-size:64px;line-height:.9">${failureCount}</div><div style="margin-top:7px;color:#8a817e;font-size:10px;font-weight:700;letter-spacing:.12em;text-transform:uppercase">of ${reviewedCount} reviewed</div></td>
      <td valign="top" style="padding-left:18px"><div class="result-title" style="color:#26312e;font-size:22px;font-weight:700;line-height:1.2">${escapeHtml(headline)}</div><div style="margin-top:8px;color:#726c69;font-size:13px;line-height:1.55">${escapeHtml(intro)}</div></td>
    </tr></table>
    ${failureCount ? `<div style="margin:0 0 12px;color:#8a817e;font-size:10px;font-weight:700;letter-spacing:.14em;text-transform:uppercase">Locations to review</div>${cards}` : `<table role="presentation" width="100%" style="border:1px solid #cfe2d9;border-radius:14px;background:#f2faf6"><tr><td style="padding:22px;color:#32624f;font-size:14px;text-align:center"><strong style="font-size:16px">Everything looks clear.</strong><br><span style="color:#638173">No follow-up is needed from this audit.</span></td></tr></table>`}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:25px"><tr><td><a href="https://jeanidso.github.io/Online_Scheduler_Audit/" style="display:block;padding:14px 18px;border:1px solid #cfc6c0;border-radius:10px;color:#29473f;text-align:center;text-decoration:none;font-size:13px;font-weight:700">Open complete audit dashboard&nbsp;&nbsp;→</a></td></tr></table>
  </td></tr>
  <tr><td class="footer" style="padding:20px 34px;border-top:1px solid #e6dfda;background:#f5f2ef;color:#958c87;font-size:10px;line-height:1.5;text-align:center">This report was reviewed and sent manually from the Online Scheduler Audit dashboard.</td></tr>
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

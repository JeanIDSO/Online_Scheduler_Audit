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
    ? failedTypes.map((result) => `<tr><td width="16" valign="top" style="padding:9px 0;color:#c54a61;font-size:16px;line-height:18px">●</td><td style="padding:9px 0 9px 9px;color:#29312e;font-size:14px;line-height:1.45"><span style="font-weight:700">${escapeHtml(result.appointmentType)}</span><br><span style="color:#817a77;font-size:12px">${escapeHtml(result.issue || "No appointment times were available.")}</span></td></tr>`).join("")
    : `<tr><td width="16" valign="top" style="padding:9px 0;color:#c54a61;font-size:16px;line-height:18px">●</td><td style="padding:9px 0 9px 9px;color:#817a77;font-size:13px">The website scheduler did not load successfully.</td></tr>`;
  const link = location.websiteUrl
    ? `<a href="${escapeHtml(location.websiteUrl)}" style="color:#24594c;text-decoration:none;font-size:13px;font-weight:700">Review live scheduler&nbsp;&nbsp;→</a>`
    : "";
  return `<table class="location-section" role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #ddd9d4">
    <tr><td style="padding:24px 0 8px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td width="38" valign="top"><div style="width:28px;height:28px;border-radius:50%;background:#f8e5e8;color:#a6384d;font-size:11px;font-weight:700;line-height:28px;text-align:center">${String(index + 1).padStart(2, "0")}</div></td><td valign="top"><div style="color:#202825;font-family:Georgia,'Times New Roman',serif;font-size:21px;line-height:1.2">${escapeHtml(location.name)}</div><div style="margin-top:5px;color:#938b87;font-size:11px">Checked ${escapeHtml(formatDate(entry.checkedAt))}</div></td></tr></table></td></tr>
    <tr><td style="padding:3px 0 12px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${details}</table></td></tr>
    <tr><td style="padding:0 0 24px">${link}</td></tr>
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
    .page-pad{padding:0!important}.email-shell{border-radius:0!important}.header,.content{padding-left:22px!important;padding-right:22px!important}.header-date{display:block!important;padding-top:6px!important;text-align:left!important}.headline{font-size:35px!important}.summary-number{font-size:50px!important}.summary-copy{padding-left:14px!important}.footer{padding:21px 22px!important}
  }
</style></head>
<body style="margin:0;padding:0;background:#eef1ee;font-family:Arial,Helvetica,sans-serif;color:#1f2926;line-height:1.5;-webkit-text-size-adjust:100%">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${escapeHtml(headline)} across ${reviewedCount} reviewed locations.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;background:#eef1ee"><tr><td class="page-pad" align="center" style="padding:34px 12px">
<table class="email-shell" role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;max-width:620px;background:#fffefd;border-radius:18px;border-collapse:separate;overflow:hidden;box-shadow:0 14px 40px rgba(33,54,47,.08)">
  <tr><td class="header" style="padding:24px 38px 21px;border-bottom:1px solid #e9e5e0"><table role="presentation" width="100%"><tr><td><div style="color:#254b41;font-size:11px;font-weight:700;letter-spacing:.15em;text-transform:uppercase">Independence Dental Services</div></td><td class="header-date" align="right" style="color:#918a86;font-size:11px">${escapeHtml(auditDate)}</td></tr></table></td></tr>
  <tr><td class="content" style="padding:38px 38px 40px">
    <div style="color:#b34358;font-size:10px;font-weight:700;letter-spacing:.18em;text-transform:uppercase">Online scheduling</div>
    <div class="headline" style="margin-top:10px;color:#1e2925;font-family:Georgia,'Times New Roman',serif;font-size:43px;line-height:1.06;letter-spacing:-.02em">Audit results,<br>ready for review.</div>
    <div style="margin-top:17px;max-width:475px;color:#706a67;font-size:14px;line-height:1.65">${escapeHtml(intro)}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:30px 0 34px;background:${failureCount ? "#fbf0f2" : "#edf7f2"};border-radius:12px"><tr><td style="padding:22px 24px"><table role="presentation" width="100%"><tr>
      <td width="82" valign="middle"><div class="summary-number" style="color:${failureCount ? "#b73d54" : "#276c52"};font-family:Georgia,'Times New Roman',serif;font-size:58px;line-height:.9">${failureCount}</div></td>
      <td class="summary-copy" valign="middle" style="padding-left:20px"><div style="color:#2b322f;font-size:18px;font-weight:700;line-height:1.25">${escapeHtml(headline)}</div><div style="margin-top:5px;color:#837c78;font-size:11px">${reviewedCount} total locations reviewed</div></td>
    </tr></table></td></tr></table>
    ${failureCount ? `<div style="margin-bottom:8px;color:#8f8783;font-size:10px;font-weight:700;letter-spacing:.15em;text-transform:uppercase">Details</div>${cards}` : `<div style="padding:23px 0;border-top:1px solid #dce5df;border-bottom:1px solid #dce5df;color:#35614f;font-size:14px"><strong style="font-family:Georgia,'Times New Roman',serif;font-size:20px;font-weight:400">Everything looks clear.</strong><br><span style="color:#73837c">No follow-up is needed from this audit.</span></div>`}
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:30px"><tr><td style="border-radius:9px;background:#254b41"><a href="https://jeanidso.github.io/Online_Scheduler_Audit/" style="display:inline-block;padding:13px 20px;color:#ffffff;text-decoration:none;font-size:12px;font-weight:700">View Full Audit Dashboard&nbsp;&nbsp;→</a></td></tr></table>
  </td></tr>
  <tr><td class="footer" style="padding:21px 38px;background:#254b41;color:#cbdad5;font-size:10px;line-height:1.5">Reviewed and sent from the Online Scheduler Audit dashboard.</td></tr>
</table>
</td></tr></table>
</body></html>`;

fs.writeFileSync(outputPath, html);

if (process.env.GITHUB_OUTPUT) {
  fs.appendFileSync(process.env.GITHUB_OUTPUT, `has_failures=${newFailures.length > 0}\n`);
  fs.appendFileSync(process.env.GITHUB_OUTPUT, `failure_count=${newFailures.length}\n`);
  const subject = failureCount
    ? `Online Scheduler Audit: ${failureCount} Location${failureCount === 1 ? "" : "s"} Need Attention`
    : "Online Scheduler Audit: All Locations Passed";
  fs.appendFileSync(process.env.GITHUB_OUTPUT, `email_subject=${subject}\n`);
}

console.log(`Prepared an approved audit email for ${reviewedCount} locations with ${failureCount} failure(s).`);

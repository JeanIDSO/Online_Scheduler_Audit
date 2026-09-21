import fs from "node:fs";

const currentPath = process.env.ALERT_CURRENT || "data/audits.json";
const outputPath = process.env.ALERT_OUTPUT || "failure-alert.html";
const current = JSON.parse(fs.readFileSync(currentPath, "utf8"));
const locations = new Map((current.locations || []).map((location) => [location.id, location]));
const practices = new Map((current.practices || []).map((practice) => [practice.id, practice]));
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

const renderLocation = (entry) => {
  const location = locations.get(entry.locationId) || { name: entry.locationId, websiteUrl: "" };
  const failedTypes = (entry.websiteAppointmentAvailability || []).filter((result) => result.availabilityLoaded === false);
  const details = failedTypes.length
    ? failedTypes.map((result) => `<tr><td width="18" valign="top" style="padding:8px 0;color:#ff6577;font-size:13px;line-height:18px">◆</td><td style="padding:8px 0 8px 8px;color:#eef0f8;font-size:13px;line-height:1.45"><span style="font-weight:700">${escapeHtml(result.appointmentType)}</span><br><span style="color:#8f96ab;font-size:11px">${escapeHtml(result.issue || "No appointment times were available.")}</span></td></tr>`).join("")
    : `<tr><td width="18" valign="top" style="padding:8px 0;color:#ff6577;font-size:13px;line-height:18px">◆</td><td style="padding:8px 0 8px 8px;color:#8f96ab;font-size:12px">The website scheduler did not load successfully.</td></tr>`;
  const link = location.websiteUrl
    ? `<a href="${escapeHtml(location.websiteUrl)}" style="color:#67e8f9;text-decoration:none;font-size:11px;font-weight:700;letter-spacing:.03em">OPEN LIVE SCHEDULER&nbsp;&nbsp;↗</a>`
    : "";
  return `<table class="location-row" role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #292e40">
    <tr><td style="padding:18px 18px 5px"><div style="color:#f5f6fb;font-size:16px;font-weight:700;line-height:1.3">${escapeHtml(location.name)}</div><div style="margin-top:4px;color:#6f778e;font-size:10px">Checked ${escapeHtml(formatDate(entry.checkedAt))}</div></td></tr>
    <tr><td style="padding:2px 18px 10px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${details}</table></td></tr>
    <tr><td style="padding:0 18px 18px">${link}</td></tr>
  </table>`;
};

const groupedFailures = new Map();
for (const entry of newFailures) {
  const location = locations.get(entry.locationId) || {};
  const practiceId = location.practiceId || "other";
  if (!groupedFailures.has(practiceId)) groupedFailures.set(practiceId, []);
  groupedFailures.get(practiceId).push(entry);
}

const accents = ["#8e7dff", "#59e1ff", "#ff6577", "#ffca62", "#50e3a4"];
const practiceSections = [...groupedFailures.entries()].map(([practiceId, entries], index) => {
  const practice = practices.get(practiceId) || { name: "Other Practices" };
  const accent = accents[index % accents.length];
  return `<table class="practice-block" role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 18px;border:1px solid #30364b;border-radius:14px;background:#121622;border-collapse:separate;overflow:hidden">
    <tr><td style="padding:16px 18px;border-left:4px solid ${accent};background:#181d2c"><table role="presentation" width="100%"><tr><td><div style="color:${accent};font-size:9px;font-weight:700;letter-spacing:.16em;text-transform:uppercase">Practice</div><div style="margin-top:5px;color:#ffffff;font-size:17px;font-weight:700">${escapeHtml(practice.name)}</div></td><td align="right"><span style="display:inline-block;padding:5px 8px;border-radius:99px;background:#22283a;color:#b8bfd0;font-size:9px;font-weight:700">${entries.length} LOCATION${entries.length === 1 ? "" : "S"}</span></td></tr></table></td></tr>
    <tr><td>${entries.map(renderLocation).join("")}</td></tr>
  </table>`;
}).join("");

const failureCount = newFailures.length;
const reviewedCount = latestResults.length;
const headline = failureCount ? "Locations Need Attention" : "All Online Schedulers Passed";
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
<body style="margin:0;padding:0;background:#080a12;font-family:Arial,Helvetica,sans-serif;color:#f4f5fb;line-height:1.5;-webkit-text-size-adjust:100%">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${escapeHtml(headline)} across ${reviewedCount} reviewed locations.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;background:#080a12"><tr><td class="page-pad" align="center" style="padding:34px 12px">
<table class="email-shell" role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;max-width:650px;background:#0e111c;border:1px solid #272c3d;border-radius:20px;border-collapse:separate;overflow:hidden">
  <tr><td style="height:4px;background:#8e7dff;font-size:0;line-height:0">&nbsp;</td></tr>
  <tr><td class="header" style="padding:24px 38px 21px;border-bottom:1px solid #272c3d"><table role="presentation" width="100%"><tr><td><div style="color:#f4f5fb;font-size:12px;font-weight:700;letter-spacing:.08em">INDEPENDENCE <span style="color:#59e1ff">/</span> DENTAL SERVICES</div></td><td class="header-date" align="right" style="color:#727a93;font-size:10px">${escapeHtml(auditDate)}</td></tr></table></td></tr>
  <tr><td class="content" style="padding:38px 38px 40px">
    <div style="color:#59e1ff;font-size:9px;font-weight:700;letter-spacing:.18em;text-transform:uppercase">Online Scheduler Audit</div>
    <div class="headline" style="margin-top:10px;color:#f7f8fc;font-size:40px;font-weight:700;line-height:1.04;letter-spacing:-.035em">Latest results,<br><span style="color:#a99cff">ready to review.</span></div>
    <div style="margin-top:17px;max-width:500px;color:#969db1;font-size:13px;line-height:1.65">${escapeHtml(intro)}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0 32px;border:1px solid ${failureCount ? "#56303d" : "#285443"};border-radius:13px;background:${failureCount ? "#1b151f" : "#111d1a"}"><tr><td style="padding:22px 24px"><table role="presentation" width="100%"><tr>
      <td width="76" valign="middle"><div class="summary-number" style="color:${failureCount ? "#ff6577" : "#50e3a4"};font-size:56px;font-weight:700;line-height:.9">${failureCount}</div></td>
      <td class="summary-copy" valign="middle" style="padding-left:20px"><div style="color:#f4f5fb;font-size:17px;font-weight:700;line-height:1.25">${escapeHtml(headline)}</div><div style="margin-top:6px;color:#7d859b;font-size:10px">${reviewedCount} total locations reviewed</div></td>
    </tr></table></td></tr></table>
    ${failureCount ? `<div style="margin-bottom:11px;color:#737b91;font-size:9px;font-weight:700;letter-spacing:.16em;text-transform:uppercase">Affected Practices</div>${practiceSections}` : `<div style="padding:23px;border:1px solid #285443;border-radius:13px;background:#111d1a;color:#50e3a4;font-size:14px"><strong style="font-size:18px">Everything looks clear.</strong><br><span style="color:#8ea99e">No follow-up is needed from this audit.</span></div>`}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:26px"><tr><td style="border-radius:10px;background:#8e7dff"><a href="https://jeanidso.github.io/Online_Scheduler_Audit/" style="display:block;padding:14px 20px;color:#ffffff;text-align:center;text-decoration:none;font-size:11px;font-weight:700;letter-spacing:.04em">VIEW FULL AUDIT DASHBOARD&nbsp;&nbsp;→</a></td></tr></table>
  </td></tr>
  <tr><td class="footer" style="padding:21px 38px;border-top:1px solid #272c3d;background:#0a0d16;color:#626a80;font-size:9px;line-height:1.5;text-align:center">REVIEWED AND SENT FROM THE ONLINE SCHEDULER AUDIT DASHBOARD</td></tr>
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

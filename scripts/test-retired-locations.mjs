import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const data = JSON.parse(fs.readFileSync(path.join(root, "data/audits.json"), "utf8"));
const retired = JSON.parse(fs.readFileSync(path.join(root, "data/retired-registry.json"), "utf8"));
assert.equal(retired.locations.length, 5);
assert.equal(data.locations.length, 39);
assert.ok(data.locations.every((location) => location.practiceId !== "lakewood-family-dental"));
assert.ok(data.practices.every((practice) => practice.id !== "lakewood-family-dental"));
const retiredIds = new Set(retired.locations.map((location) => location.id));
assert.ok(data.auditHistory.some((entry) => retiredIds.has(entry.locationId)), "Retired history must be preserved");
const octEntries = data.auditHistory.filter((entry) => entry.checkedAt.startsWith("2026-10-01"));
assert.equal(octEntries.length, 39);
assert.ok(octEntries.every((entry) => !retiredIds.has(entry.locationId)));

const fixture = fs.mkdtempSync(path.join(os.tmpdir(), "scheduler-retirement-"));
try {
  fs.mkdirSync(path.join(fixture, "scripts"));
  fs.cpSync(path.join(root, "data"), path.join(fixture, "data"), { recursive: true });
  for (const name of ["validate-data.js", "build-failure-alert.mjs"]) {
    fs.copyFileSync(path.join(root, "scripts", name), path.join(fixture, "scripts", name));
  }
  const run = (script) => spawnSync(process.execPath, [path.join(fixture, "scripts", script)], {
    cwd: fixture, encoding: "utf8"
  });
  const valid = run("validate-data.js");
  assert.equal(valid.status, 0, valid.stderr);
  const example = data.auditHistory.find((entry) => retiredIds.has(entry.locationId));
  const restoredAudit = {
    ...example, auditId: "retired-regression-check", checkedAt: "2026-10-02T12:00:00Z",
    websiteAppointmentAvailability: [{ appointmentType: "Emergency Exam", availabilityLoaded: false, issue: "Regression fixture" }]
  };
  const modified = { ...data, auditHistory: [...data.auditHistory, restoredAudit] };
  fs.writeFileSync(path.join(fixture, "data/audits.json"), JSON.stringify(modified));
  const invalid = run("validate-data.js");
  assert.notEqual(invalid.status, 0, "New audits for retired locations must be rejected");
  assert.match(invalid.stderr, /was retired on 2026-10-01/);
  const email = run("build-failure-alert.mjs");
  assert.equal(email.status, 0, email.stderr);
  assert.match(email.stdout, /39 locations with 2 failure\(s\)/);
  const html = fs.readFileSync(path.join(fixture, "failure-alert.html"), "utf8");
  assert.ok(!html.includes("Lakewood"), "Retired failures must not appear in the approved email");
  console.log("PASS: Lakewood is retired, prior history remains valid, new retired audits are rejected, and email includes only 39 active locations.");
} finally {
  fs.rmSync(fixture, { recursive: true, force: true });
}

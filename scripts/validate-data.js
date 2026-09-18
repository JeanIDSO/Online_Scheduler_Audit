#!/usr/bin/env node
/**
 * Validates data/audits.json for the Online Scheduler Audit dashboard.
 *
 * Zero dependencies on purpose (so this runs in CI with a bare Node
 * install). Checks, in order:
 *
 *   1. The file is valid JSON and matches the expected shape (required
 *      fields, types, enums) for the top level, each location, and each
 *      auditHistory entry.
 *   2. `practices` and `locations` exactly match data/registry-lock.json
 *      — the protected registry cannot drift.
 *   3. Compared to the previous committed version of the file (via git),
 *      every existing auditHistory entry (by auditId) is still present
 *      and unchanged — history is append-only.
 *
 * Usage:
 *   node scripts/validate-data.js
 *
 * Exits 0 on success, 1 on any failure, printing every problem found
 * (not just the first).
 */

"use strict";

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const DATA_PATH = path.join(ROOT, "data", "audits.json");
const LOCK_PATH = path.join(ROOT, "data", "registry-lock.json");

const errors = [];
function fail(msg) { errors.push(msg); }

// ---------------------------------------------------------------------
// 1. Load + structural validation
// ---------------------------------------------------------------------

function loadJson(p, label) {
  let raw;
  try {
    raw = fs.readFileSync(p, "utf8");
  } catch (e) {
    fail(`${label}: could not read file at ${p} (${e.message})`);
    return null;
  }
  try {
    return JSON.parse(raw);
  } catch (e) {
    fail(`${label}: not valid JSON (${e.message})`);
    return null;
  }
}

const WEBSITE_STATUSES = ["Working", "Broken", "WrongLocation", "NotChecked"];
const GOOGLE_STATUSES = ["Working", "Broken", "WrongLocation", "NoBookingLink", "Ambiguous", "NotChecked"];
const AUDIT_SOURCES = ["Website + Google", "Website Only", "Google Only"];

function isString(v) { return typeof v === "string"; }
function isNonEmptyString(v) { return isString(v) && v.length > 0; }
function isArrayOfStrings(v) { return Array.isArray(v) && v.every(isString); }
function isBoolean(v) { return typeof v === "boolean"; }
function isIsoDate(v) { return isString(v) && !isNaN(new Date(v).getTime()); }
function isUri(v) { return isString(v) && /^https?:\/\//.test(v); }

function validateEntry(entry, idx, validLocationIds) {
  const where = `auditHistory[${idx}]`;
  if (typeof entry !== "object" || entry === null || Array.isArray(entry)) {
    fail(`${where}: must be an object`);
    return;
  }
  if (!isNonEmptyString(entry.auditId)) fail(`${where}: "auditId" must be a non-empty string`);
  if (!isNonEmptyString(entry.locationId)) fail(`${where}: "locationId" must be a non-empty string`);
  else if (!validLocationIds.has(entry.locationId)) fail(`${where}: locationId "${entry.locationId}" does not match any location in the registry`);
  if (!isIsoDate(entry.checkedAt)) fail(`${where}: "checkedAt" must be an ISO 8601 timestamp`);
  if (!isNonEmptyString(entry.auditedBy)) fail(`${where}: "auditedBy" must be a non-empty string`);
  if (!AUDIT_SOURCES.includes(entry.auditSource)) fail(`${where}: "auditSource" must be one of ${JSON.stringify(AUDIT_SOURCES)}`);
  if (!WEBSITE_STATUSES.includes(entry.websiteSchedulerStatus)) fail(`${where}: "websiteSchedulerStatus" must be one of ${JSON.stringify(WEBSITE_STATUSES)}`);
  if (!GOOGLE_STATUSES.includes(entry.googleSchedulerStatus)) fail(`${where}: "googleSchedulerStatus" must be one of ${JSON.stringify(GOOGLE_STATUSES)}`);
  if (!isArrayOfStrings(entry.observedWebsiteAppointmentTypes)) fail(`${where}: "observedWebsiteAppointmentTypes" must be an array of strings`);
  if (!isArrayOfStrings(entry.observedGoogleAppointmentTypes)) fail(`${where}: "observedGoogleAppointmentTypes" must be an array of strings`);
  if (!isBoolean(entry.manualReviewNeeded)) fail(`${where}: "manualReviewNeeded" must be a boolean`);
  if (entry.manualReviewNeeded && !isNonEmptyString(entry.manualReviewReason)) {
    fail(`${where}: "manualReviewReason" should explain why when manualReviewNeeded is true`);
  }
  if (entry.brokenOrIncorrectLinks !== undefined) {
    if (!Array.isArray(entry.brokenOrIncorrectLinks)) {
      fail(`${where}: "brokenOrIncorrectLinks" must be an array`);
    } else {
      entry.brokenOrIncorrectLinks.forEach((b, i) => {
        if (typeof b !== "object" || b === null || !isUri(b.url) || !isNonEmptyString(b.issue)) {
          fail(`${where}.brokenOrIncorrectLinks[${i}]: must be {url: <http(s) uri>, issue: <non-empty string>}`);
        }
      });
    }
  }
  if (entry.notes !== undefined && !isString(entry.notes)) fail(`${where}: "notes" must be a string`);
  if (entry.evidenceLinks !== undefined) {
    if (!Array.isArray(entry.evidenceLinks) || !entry.evidenceLinks.every(isUri)) {
      fail(`${where}: "evidenceLinks" must be an array of http(s) URIs`);
    }
  }
  function validateAvailability(fieldName) {
    const arr = entry[fieldName];
    if (arr === undefined) return;
    if (!Array.isArray(arr)) { fail(`${where}: "${fieldName}" must be an array`); return; }
    arr.forEach((a, i) => {
      if (typeof a !== "object" || a === null || !isNonEmptyString(a.appointmentType) || !(isBoolean(a.availabilityLoaded) || a.availabilityLoaded === null)) {
        fail(`${where}.${fieldName}[${i}]: must be {appointmentType: <non-empty string>, availabilityLoaded: <boolean|null>, issue?: <non-empty string>}`);
        return;
      }
      if (a.availabilityLoaded !== true && !isNonEmptyString(a.issue)) {
        fail(`${where}.${fieldName}[${i}]: "issue" should explain why when availabilityLoaded is false or null`);
      }
    });
  }
  validateAvailability("websiteAppointmentAvailability");
  validateAvailability("googleAppointmentAvailability");

  const NOTES_RED_FLAGS = /\b(ssn|social security|dob|date of birth|patient name|medical record)\b/i;
  if (isString(entry.notes) && NOTES_RED_FLAGS.test(entry.notes)) {
    fail(`${where}: "notes" contains a term (${entry.notes.match(NOTES_RED_FLAGS)[0]}) that suggests patient information — this dashboard must never store patient data`);
  }
}

function validateShape(data) {
  if (typeof data !== "object" || data === null) { fail("root: must be an object"); return; }
  if (data.schemaVersion !== 1) fail(`root: "schemaVersion" must be 1`);
  if (!isIsoDate(data.updatedAt)) fail(`root: "updatedAt" must be an ISO 8601 timestamp`);
  if (!Array.isArray(data.practices)) { fail(`root: "practices" must be an array`); }
  if (!Array.isArray(data.locations)) { fail(`root: "locations" must be an array`); }
  if (!Array.isArray(data.auditHistory)) { fail(`root: "auditHistory" must be an array`); return; }

  const validLocationIds = new Set((data.locations || []).map((l) => l && l.id));
  const seenAuditIds = new Set();
  data.auditHistory.forEach((entry, idx) => {
    validateEntry(entry, idx, validLocationIds);
    if (entry && entry.auditId) {
      if (seenAuditIds.has(entry.auditId)) fail(`auditHistory[${idx}]: duplicate auditId "${entry.auditId}"`);
      seenAuditIds.add(entry.auditId);
    }
  });
}

// ---------------------------------------------------------------------
// 2. Registry lock check
// ---------------------------------------------------------------------

function deepEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function validateRegistryLock(data, lock) {
  if (!lock) return; // already reported as a load failure
  if (!deepEqual(data.practices, lock.practices)) {
    fail(`data/audits.json "practices" does not match the protected registry in data/registry-lock.json. If this change is intentional, update registry-lock.json in the same reviewed commit.`);
  }
  if (!deepEqual(data.locations, lock.locations)) {
    fail(`data/audits.json "locations" does not match the protected registry in data/registry-lock.json. If this change is intentional (e.g. a location's expected appointment types genuinely changed), update registry-lock.json in the same reviewed commit.`);
  }
}

// ---------------------------------------------------------------------
// 3. Append-only history check (via git)
// ---------------------------------------------------------------------

function getPreviousVersion() {
  const relPath = path.relative(ROOT, DATA_PATH);
  const refsToTry = [];
  if (process.env.GITHUB_BASE_REF) {
    refsToTry.push(`origin/${process.env.GITHUB_BASE_REF}`);
  }
  refsToTry.push("HEAD~1");

  for (const ref of refsToTry) {
    try {
      const raw = execFileSync("git", ["show", `${ref}:${relPath}`], { cwd: ROOT, encoding: "utf8" });
      return JSON.parse(raw);
    } catch (e) {
      // try next ref
    }
  }
  return null;
}

function validateAppendOnly(data) {
  const prev = getPreviousVersion();
  if (!prev || !Array.isArray(prev.auditHistory)) {
    console.log("(No previous version of data/audits.json found via git — skipping append-only check. This is expected on the first commit.)");
    return;
  }
  const currentById = new Map((data.auditHistory || []).map((e) => [e && e.auditId, e]));
  prev.auditHistory.forEach((prevEntry, idx) => {
    if (!prevEntry || !prevEntry.auditId) return;
    const current = currentById.get(prevEntry.auditId);
    if (!current) {
      fail(`auditHistory: entry "${prevEntry.auditId}" (previously at index ${idx}) is missing — existing audit history must never be deleted.`);
      return;
    }
    if (!deepEqual(current, prevEntry)) {
      fail(`auditHistory: entry "${prevEntry.auditId}" was modified — existing audit history must never be edited, only appended to.`);
    }
  });
}

// ---------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------

function main() {
  const data = loadJson(DATA_PATH, "data/audits.json");
  const lock = loadJson(LOCK_PATH, "data/registry-lock.json");

  if (data) {
    validateShape(data);
    validateRegistryLock(data, lock);
    validateAppendOnly(data);
  }

  if (errors.length) {
    console.error(`\n✗ data/audits.json failed validation (${errors.length} problem${errors.length === 1 ? "" : "s"}):\n`);
    errors.forEach((e) => console.error("  - " + e));
    console.error("");
    process.exit(1);
  }
  console.log("✓ data/audits.json is valid: schema OK, registry matches lock file, audit history is append-only.");
}

main();

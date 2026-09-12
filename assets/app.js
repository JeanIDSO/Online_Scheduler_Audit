/**
 * Online Scheduler Audit — dashboard logic.
 *
 * This is a read-only, static dashboard. All data lives in
 * `data/audits.json` (a location registry plus an append-only audit
 * history). Nothing here writes back to the file — updates happen by
 * committing a new audit entry to the JSON file in the GitHub repo
 * (see docs/WEEKLY_AUDIT_GUIDE.md).
 *
 * Business rules implemented here (kept in one place so the JSON the
 * weekly audit writes can stay simple — raw observations only):
 *   - appointment-type comparison / normalization
 *   - overall status derivation
 *   - week-over-week change summaries
 */

(function () {
  "use strict";

  var STATUS_ORDER = ["Failed", "Manual Review", "Warning", "Passed", "Not Yet Audited"];
  var RANK = { "Passed": 0, "Warning": 1, "Manual Review": 2, "Failed": 3 };

  var STATUS_META = {
    "Passed": {
      cls: "status-passed",
      icon: '<svg viewBox="0 0 20 20" width="12" height="12" aria-hidden="true"><path d="M4 10l4 4 8-9" stroke="currentColor" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>'
    },
    "Warning": {
      cls: "status-warning",
      icon: '<svg viewBox="0 0 20 20" width="12" height="12" aria-hidden="true"><path d="M10 3l8 14H2L10 3z" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linejoin="round"/><path d="M10 8.2v3.6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><circle cx="10" cy="14.4" r="0.9" fill="currentColor"/></svg>'
    },
    "Failed": {
      cls: "status-failed",
      icon: '<svg viewBox="0 0 20 20" width="12" height="12" aria-hidden="true"><path d="M5 5l10 10M15 5L5 15" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>'
    },
    "Manual Review": {
      cls: "status-manual",
      icon: '<svg viewBox="0 0 20 20" width="12" height="12" aria-hidden="true"><circle cx="10" cy="10" r="7.6" stroke="currentColor" stroke-width="1.5" fill="none"/><path d="M7.9 8.1a2.2 2.2 0 114 1.2c-.6.5-1.3.9-1.3 2" stroke="currentColor" stroke-width="1.4" fill="none" stroke-linecap="round"/><circle cx="10" cy="14.1" r="0.85" fill="currentColor"/></svg>'
    },
    "Not Yet Audited": {
      cls: "status-notyet",
      icon: '<svg viewBox="0 0 20 20" width="12" height="12" aria-hidden="true"><path d="M5 10h10" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>'
    }
  };

  var SCHEDULER_LABELS = {
    "Working": "Working",
    "Broken": "Broken / error",
    "WrongLocation": "Wrong location",
    "NoBookingLink": "No booking link found",
    "Ambiguous": "Ambiguous / could not verify",
    "NotChecked": "Not checked"
  };

  var state = {
    data: null,
    locationViews: [],
    historyRows: []
  };

  // ---------------------------------------------------------------------
  // Comparison rules
  // ---------------------------------------------------------------------

  /** Case-insensitive, whitespace- and punctuation-insensitive; "and" == "&". */
  function normalize(s) {
    return String(s || "")
      .toLowerCase()
      .replace(/&/g, " and ")
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function computeDiff(expectedList, observedWebsite, observedGoogle) {
    var expected = (expectedList || []).map(function (e) {
      return { raw: e, norm: normalize(e) };
    });
    var observed = []
      .concat((observedWebsite || []).map(function (o) { return { raw: o, norm: normalize(o), source: "Website" }; }))
      .concat((observedGoogle || []).map(function (o) { return { raw: o, norm: normalize(o), source: "Google" }; }));

    var missing = expected
      .filter(function (e) { return e.norm && !observed.some(function (o) { return o.norm === e.norm; }); })
      .map(function (e) { return e.raw; });

    var unexpectedMap = {};
    observed.forEach(function (o) {
      if (!o.norm) return;
      var isExpected = expected.some(function (e) { return e.norm === o.norm; });
      if (!isExpected) {
        var key = o.raw + "|" + o.source;
        unexpectedMap[key] = { type: o.raw, source: o.source };
      }
    });
    var unexpected = Object.keys(unexpectedMap).map(function (k) { return unexpectedMap[k]; });

    var labelDiffMap = {};
    expected.forEach(function (e) {
      observed.forEach(function (o) {
        if (o.norm && o.norm === e.norm && o.raw.trim() !== e.raw.trim()) {
          var key = e.raw + "=>" + o.raw;
          if (!labelDiffMap[key]) labelDiffMap[key] = { expected: e.raw, observed: o.raw, sources: {} };
          labelDiffMap[key].sources[o.source] = true;
        }
      });
    });
    var labelDifferences = Object.keys(labelDiffMap).map(function (k) {
      var d = labelDiffMap[k];
      return { expected: d.expected, observed: d.observed, sources: Object.keys(d.sources) };
    });

    return { missing: missing, unexpected: unexpected, labelDifferences: labelDifferences };
  }

  // ---------------------------------------------------------------------
  // Status rules
  // ---------------------------------------------------------------------

  function computeStatus(entry, diff) {
    if (entry.manualReviewNeeded) return "Manual Review";
    if (entry.googleSchedulerStatus === "Ambiguous") return "Manual Review";
    if (entry.websiteSchedulerStatus === "NotChecked" || entry.googleSchedulerStatus === "NotChecked") return "Manual Review";

    var websiteBad = entry.websiteSchedulerStatus === "Broken" || entry.websiteSchedulerStatus === "WrongLocation";
    var googleBad = entry.googleSchedulerStatus === "Broken" ||
      entry.googleSchedulerStatus === "WrongLocation" ||
      entry.googleSchedulerStatus === "NoBookingLink";

    if (websiteBad || googleBad) return "Failed";
    if (diff.missing.length > 0 || diff.unexpected.length > 0) return "Failed";

    var hasMinorLinkNote = Array.isArray(entry.brokenOrIncorrectLinks) && entry.brokenOrIncorrectLinks.length > 0;
    if (diff.labelDifferences.length > 0 || hasMinorLinkNote) return "Warning";

    return "Passed";
  }

  function evaluateEntry(entry, location) {
    var diff = computeDiff(location.expectedAppointmentTypes, entry.observedWebsiteAppointmentTypes, entry.observedGoogleAppointmentTypes);
    var status = computeStatus(entry, diff);
    return { entry: entry, diff: diff, status: status };
  }

  function reasonText(view) {
    if (!view.latest) return "No audit has been completed for this location yet.";
    var entry = view.latest.entry, diff = view.latest.diff, status = view.status;

    if (status === "Manual Review") {
      return entry.manualReviewReason || "Audit could not be completed automatically and needs manual review.";
    }
    var parts = [];
    if (status === "Failed") {
      if (entry.websiteSchedulerStatus === "Broken") parts.push("Website scheduler is broken");
      if (entry.websiteSchedulerStatus === "WrongLocation") parts.push("Website scheduler leads to the wrong location");
      if (entry.googleSchedulerStatus === "Broken") parts.push("Google booking link is broken");
      if (entry.googleSchedulerStatus === "WrongLocation") parts.push("Google booking link leads to the wrong location");
      if (entry.googleSchedulerStatus === "NoBookingLink") parts.push("No Google booking link found");
      if (diff.missing.length) parts.push(diff.missing.length + " missing appointment type" + (diff.missing.length > 1 ? "s" : ""));
      if (diff.unexpected.length) parts.push(diff.unexpected.length + " unexpected appointment type" + (diff.unexpected.length > 1 ? "s" : ""));
      return parts.length ? parts.join("; ") : "Audit failed.";
    }
    if (status === "Warning") {
      if (diff.labelDifferences.length) parts.push(diff.labelDifferences.length + " label wording difference" + (diff.labelDifferences.length > 1 ? "s" : ""));
      if (entry.brokenOrIncorrectLinks && entry.brokenOrIncorrectLinks.length) parts.push(entry.brokenOrIncorrectLinks.length + " secondary link note" + (entry.brokenOrIncorrectLinks.length > 1 ? "s" : ""));
      return parts.length ? parts.join("; ") : "Minor issue flagged for review.";
    }
    return "";
  }

  // ---------------------------------------------------------------------
  // Week-over-week change
  // ---------------------------------------------------------------------

  function buildChange(curr, prev) {
    if (!prev) return { text: "First recorded audit", direction: null };

    var parts = [];
    if (curr.status !== prev.status) parts.push("Status: " + prev.status + " → " + curr.status);

    if (curr.entry.websiteSchedulerStatus !== prev.entry.websiteSchedulerStatus) {
      parts.push("Website: " + labelFor(prev.entry.websiteSchedulerStatus) + " → " + labelFor(curr.entry.websiteSchedulerStatus));
    }
    if (curr.entry.googleSchedulerStatus !== prev.entry.googleSchedulerStatus) {
      parts.push("Google: " + labelFor(prev.entry.googleSchedulerStatus) + " → " + labelFor(curr.entry.googleSchedulerStatus));
    }

    var newMissing = curr.diff.missing.filter(function (m) { return prev.diff.missing.indexOf(m) === -1; });
    var resolvedMissing = prev.diff.missing.filter(function (m) { return curr.diff.missing.indexOf(m) === -1; });
    if (newMissing.length) parts.push("New missing: " + newMissing.join(", "));
    if (resolvedMissing.length) parts.push("Resolved missing: " + resolvedMissing.join(", "));

    var keyU = function (u) { return u.type + "|" + u.source; };
    var currUKeys = curr.diff.unexpected.map(keyU);
    var prevUKeys = prev.diff.unexpected.map(keyU);
    var newU = curr.diff.unexpected.filter(function (u) { return prevUKeys.indexOf(keyU(u)) === -1; });
    var resolvedU = prev.diff.unexpected.filter(function (u) { return currUKeys.indexOf(keyU(u)) === -1; });
    if (newU.length) parts.push("New unexpected: " + newU.map(function (u) { return u.type + " (" + u.source + ")"; }).join(", "));
    if (resolvedU.length) parts.push("Resolved unexpected: " + resolvedU.map(function (u) { return u.type + " (" + u.source + ")"; }).join(", "));

    var keyL = function (l) { return l.expected + "=>" + l.observed; };
    var currLKeys = curr.diff.labelDifferences.map(keyL);
    var prevLKeys = prev.diff.labelDifferences.map(keyL);
    var newL = curr.diff.labelDifferences.filter(function (l) { return prevLKeys.indexOf(keyL(l)) === -1; });
    var resolvedL = prev.diff.labelDifferences.filter(function (l) { return currLKeys.indexOf(keyL(l)) === -1; });
    if (newL.length) parts.push("New label difference: " + newL.map(function (l) { return "“" + l.observed + "” for “" + l.expected + "”"; }).join(", "));
    if (resolvedL.length) parts.push("Resolved label difference: " + resolvedL.map(function (l) { return "“" + l.expected + "”"; }).join(", "));

    if (parts.length === 0) parts.push("No change since previous audit");

    var direction = "none";
    if (RANK[curr.status] < RANK[prev.status]) direction = "up";
    else if (RANK[curr.status] > RANK[prev.status]) direction = "down";

    return { text: parts.join(" · "), direction: direction };
  }

  function labelFor(code) { return SCHEDULER_LABELS[code] || code || "—"; }

  // ---------------------------------------------------------------------
  // Formatting helpers
  // ---------------------------------------------------------------------

  function formatDateTime(iso) {
    if (!iso) return "—";
    var d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleString(undefined, { year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  }

  function formatDateOnly(iso) {
    if (!iso) return "—";
    var d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  }

  function dateKey(iso) {
    var d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    return d.toISOString().slice(0, 10);
  }

  function escapeHtml(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function statusPillHtml(status) {
    var meta = STATUS_META[status] || STATUS_META["Not Yet Audited"];
    return '<span class="status-pill ' + meta.cls + '">' + meta.icon + escapeHtml(status) + "</span>";
  }

  function tagListHtml(items, cls) {
    if (!items || !items.length) return '<span class="dd-empty">None</span>';
    return '<span class="tag-list">' + items.map(function (t) {
      return '<span class="tag ' + (cls || "") + '">' + escapeHtml(t) + "</span>";
    }).join("") + "</span>";
  }

  // ---------------------------------------------------------------------
  // Data pipeline
  // ---------------------------------------------------------------------

  function buildViews(data) {
    var evalByLocation = {};
    data.locations.forEach(function (loc) {
      var entries = data.auditHistory
        .filter(function (e) { return e.locationId === loc.id; })
        .slice()
        .sort(function (a, b) { return new Date(b.checkedAt) - new Date(a.checkedAt); });
      evalByLocation[loc.id] = entries.map(function (e) { return evaluateEntry(e, loc); });
    });

    var locationViews = data.locations.map(function (loc) {
      var evals = evalByLocation[loc.id];
      var latest = evals[0] || null;
      var prev = evals[1] || null;
      var status = latest ? latest.status : "Not Yet Audited";
      var changeInfo = latest ? buildChange(latest, prev) : null;
      return { location: loc, latest: latest, prev: prev, status: status, changeInfo: changeInfo, evalCount: evals.length };
    });

    var historyRows = [];
    Object.keys(evalByLocation).forEach(function (locId) {
      var loc = data.locations.filter(function (l) { return l.id === locId; })[0];
      var evals = evalByLocation[locId];
      evals.forEach(function (ev, idx) {
        var prev = evals[idx + 1] || null;
        var change = buildChange(ev, prev);
        historyRows.push({ location: loc, ev: ev, change: change });
      });
    });
    historyRows.sort(function (a, b) { return new Date(b.ev.entry.checkedAt) - new Date(a.ev.entry.checkedAt); });

    return { locationViews: locationViews, historyRows: historyRows };
  }

  // ---------------------------------------------------------------------
  // Rendering
  // ---------------------------------------------------------------------

  function renderHeader(data) {
    document.getElementById("data-updated-at").textContent = data.updatedAt ? formatDateTime(data.updatedAt) : "—";
  }

  function renderKpis(locationViews) {
    var counts = { "Passed": 0, "Warning": 0, "Failed": 0, "Manual Review": 0, "Not Yet Audited": 0 };
    var lastCompleted = null;
    locationViews.forEach(function (v) {
      counts[v.status] = (counts[v.status] || 0) + 1;
      if (v.latest) {
        var t = new Date(v.latest.entry.checkedAt);
        if (!lastCompleted || t > lastCompleted) lastCompleted = t;
      }
    });

    document.getElementById("kpi-total").textContent = locationViews.length;
    document.getElementById("kpi-passed").textContent = counts["Passed"];
    document.getElementById("kpi-failed").textContent = counts["Failed"];
    document.getElementById("kpi-manual").textContent = counts["Manual Review"];
    document.getElementById("kpi-last").textContent = lastCompleted ? formatDateTime(lastCompleted.toISOString()) : "No audits yet";
    document.getElementById("kpi-warning-footnote").textContent = "Warning: " + counts["Warning"];
    document.getElementById("kpi-notyet-footnote").textContent = "Not yet audited: " + counts["Not Yet Audited"];
  }

  function renderPractices(data, locationViews) {
    var grid = document.getElementById("practice-grid");
    grid.innerHTML = "";
    data.practices.forEach(function (practice) {
      var views = locationViews.filter(function (v) { return v.location.practiceId === practice.id; });
      var counts = { "Passed": 0, "Warning": 0, "Failed": 0, "Manual Review": 0, "Not Yet Audited": 0 };
      var lastAudited = null;
      views.forEach(function (v) {
        counts[v.status]++;
        if (v.latest) {
          var t = new Date(v.latest.entry.checkedAt);
          if (!lastAudited || t > lastAudited) lastAudited = t;
        }
      });

      var card = document.createElement("div");
      card.className = "practice-card";
      card.innerHTML =
        "<h3>" + escapeHtml(practice.name) + "</h3>" +
        '<p class="practice-sub">' + views.length + " location" + (views.length === 1 ? "" : "s") +
        (lastAudited ? " · last audited " + formatDateTime(lastAudited.toISOString()) : " · no audits completed yet") + "</p>" +
        '<div class="practice-stat-row">' +
        statChip("Passed", counts["Passed"], "st-passed") +
        statChip("Warning", counts["Warning"], "st-warning") +
        statChip("Failed", counts["Failed"], "st-failed") +
        statChip("Manual review", counts["Manual Review"], "st-manual") +
        statChip("Not yet audited", counts["Not Yet Audited"], "st-notyet") +
        "</div>";
      grid.appendChild(card);
    });
  }

  function statChip(label, count, cls) {
    return '<span class="practice-stat ' + cls + '"><b>' + count + "</b> " + escapeHtml(label) + "</span>";
  }

  function renderAttention(locationViews) {
    var listEl = document.getElementById("attention-list");
    var emptyEl = document.getElementById("attention-empty");
    var countEl = document.getElementById("attention-count");

    var items = locationViews.filter(function (v) {
      return v.status === "Failed" || v.status === "Manual Review" || v.status === "Warning";
    });
    items.sort(function (a, b) {
      return STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status);
    });

    countEl.textContent = items.length;
    listEl.innerHTML = "";
    emptyEl.hidden = items.length > 0;

    items.forEach(function (v) {
      var practice = practiceNameFor(v.location.practiceId);
      var sevClass = v.status === "Failed" ? "sev-failed" : v.status === "Manual Review" ? "sev-manual" : "sev-warning";
      var row = document.createElement("div");
      row.className = "attention-item " + sevClass;
      row.innerHTML =
        statusPillHtml(v.status) +
        '<span class="attn-name">' + escapeHtml(v.location.name) + "</span>" +
        '<span class="attn-practice">' + escapeHtml(practice) + "</span>" +
        '<span class="attn-reason">' + escapeHtml(reasonText(v)) + "</span>";
      listEl.appendChild(row);
    });
  }

  function practiceNameFor(id) {
    var p = state.data.practices.filter(function (p) { return p.id === id; })[0];
    return p ? p.name : id;
  }

  function locationNameFor(id) {
    var l = state.data.locations.filter(function (l) { return l.id === id; })[0];
    return l ? l.name : id;
  }

  // ---- Filters -----------------------------------------------------------

  function populateFilterOptions(data) {
    var practiceSel = document.getElementById("filter-practice");
    data.practices.forEach(function (p) {
      var opt = document.createElement("option");
      opt.value = p.id; opt.textContent = p.name;
      practiceSel.appendChild(opt);
    });

    refreshLocationOptions("");

    var sourceSel = document.getElementById("filter-source");
    var sources = Array.from(new Set(data.auditHistory.map(function (e) { return e.auditSource; }).filter(Boolean))).sort();
    sources.forEach(function (s) {
      var opt = document.createElement("option");
      opt.value = s; opt.textContent = s;
      sourceSel.appendChild(opt);
    });

    var dateSel = document.getElementById("filter-date");
    var dates = Array.from(new Set(data.auditHistory.map(function (e) { return dateKey(e.checkedAt); }).filter(Boolean))).sort().reverse();
    dates.forEach(function (dk) {
      var opt = document.createElement("option");
      opt.value = dk; opt.textContent = formatDateOnly(dk + "T00:00:00Z");
      dateSel.appendChild(opt);
    });
  }

  function refreshLocationOptions(practiceId) {
    var locationSel = document.getElementById("filter-location");
    var current = locationSel.value;
    locationSel.innerHTML = '<option value="">All locations</option>';
    state.data.locations
      .filter(function (l) { return !practiceId || l.practiceId === practiceId; })
      .forEach(function (l) {
        var opt = document.createElement("option");
        opt.value = l.id; opt.textContent = l.name;
        locationSel.appendChild(opt);
      });
    if (Array.from(locationSel.options).some(function (o) { return o.value === current; })) {
      locationSel.value = current;
    }
  }

  function currentFilters() {
    return {
      practice: document.getElementById("filter-practice").value,
      location: document.getElementById("filter-location").value,
      status: document.getElementById("filter-status").value,
      source: document.getElementById("filter-source").value,
      date: document.getElementById("filter-date").value
    };
  }

  function locationMatchesFilters(v, f) {
    if (f.practice && v.location.practiceId !== f.practice) return false;
    if (f.location && v.location.id !== f.location) return false;
    if (f.status && v.status !== f.status) return false;
    if (f.source && (!v.latest || v.latest.entry.auditSource !== f.source)) return false;
    if (f.date && (!v.latest || dateKey(v.latest.entry.checkedAt) !== f.date)) return false;
    return true;
  }

  function historyRowMatchesFilters(row, f) {
    if (f.practice && row.location.practiceId !== f.practice) return false;
    if (f.location && row.location.id !== f.location) return false;
    if (f.status && row.ev.status !== f.status) return false;
    if (f.source && row.ev.entry.auditSource !== f.source) return false;
    if (f.date && dateKey(row.ev.entry.checkedAt) !== f.date) return false;
    return true;
  }

  // ---- Location grid -------------------------------------------------

  function renderLocationGrid() {
    var f = currentFilters();
    var grid = document.getElementById("location-grid");
    var emptyEl = document.getElementById("locations-empty");
    var countEl = document.getElementById("locations-result-count");
    var tpl = document.getElementById("location-card-template");

    var filtered = state.locationViews.filter(function (v) { return locationMatchesFilters(v, f); });
    countEl.textContent = filtered.length + " of " + state.locationViews.length + " shown";
    grid.innerHTML = "";
    emptyEl.hidden = filtered.length > 0;

    filtered.forEach(function (v) {
      var node = tpl.content.cloneNode(true);
      var article = node.querySelector(".location-card");
      var summaryBtn = node.querySelector(".location-card-summary");

      node.querySelector(".location-name").textContent = v.location.name;
      node.querySelector(".status-pill").outerHTML = statusPillHtml(v.status);
      node.querySelector(".location-practice").textContent = practiceNameFor(v.location.practiceId);
      node.querySelector(".location-checked").textContent = v.latest ? "Checked " + formatDateTime(v.latest.entry.checkedAt) : "Not yet checked";

      var changeBadge = node.querySelector(".change-badge");
      if (v.changeInfo && v.prev) {
        changeBadge.hidden = false;
        changeBadge.textContent = v.changeInfo.text;
        changeBadge.className = "change-badge" + (v.changeInfo.direction === "up" ? " change-up" : v.changeInfo.direction === "down" ? " change-down" : "");
      } else if (v.latest && !v.prev) {
        changeBadge.hidden = false;
        changeBadge.textContent = "First recorded audit";
      }

      // Detail fields
      var detail = node.querySelector(".location-card-detail");
      var entry = v.latest ? v.latest.entry : null;
      var diff = v.latest ? v.latest.diff : { missing: [], unexpected: [], labelDifferences: [] };

      detail.querySelector(".dd-website-status").textContent = entry ? labelFor(entry.websiteSchedulerStatus) : "Not yet checked";
      detail.querySelector(".dd-google-status").textContent = entry ? labelFor(entry.googleSchedulerStatus) : "Not yet checked";
      detail.querySelector(".website-link").href = v.location.websiteUrl;
      detail.querySelector(".gmaps-link").href = v.location.googleMapsUrl;

      detail.querySelector(".dd-expected").innerHTML = tagListHtml(v.location.expectedAppointmentTypes);
      detail.querySelector(".dd-observed-website").innerHTML = entry ? tagListHtml(entry.observedWebsiteAppointmentTypes) : '<span class="dd-empty">Not yet checked</span>';
      detail.querySelector(".dd-observed-google").innerHTML = entry ? tagListHtml(entry.observedGoogleAppointmentTypes) : '<span class="dd-empty">Not yet checked</span>';
      detail.querySelector(".dd-missing").innerHTML = tagListHtml(diff.missing, "tag-missing");
      detail.querySelector(".dd-unexpected").innerHTML = tagListHtml(diff.unexpected.map(function (u) { return u.type + " (" + u.source + ")"; }), "tag-unexpected");
      detail.querySelector(".dd-labeldiff").innerHTML = diff.labelDifferences.length
        ? '<span class="tag-list">' + diff.labelDifferences.map(function (l) {
            return '<span class="tag">“' + escapeHtml(l.observed) + '” for “' + escapeHtml(l.expected) + '” (' + escapeHtml(l.sources.join(", ")) + ")</span>";
          }).join("") + "</span>"
        : '<span class="dd-empty">None</span>';

      var brokenLinks = entry && entry.brokenOrIncorrectLinks && entry.brokenOrIncorrectLinks.length
        ? entry.brokenOrIncorrectLinks.map(function (b) {
            return '<div><a href="' + escapeHtml(b.url) + '" target="_blank" rel="noopener">' + escapeHtml(b.url) + "</a> — " + escapeHtml(b.issue || "") + "</div>";
          }).join("")
        : '<span class="dd-empty">None reported</span>';
      detail.querySelector(".dd-brokenlinks").innerHTML = brokenLinks;

      detail.querySelector(".dd-notes").textContent = (entry && entry.notes) ? entry.notes : "No notes recorded.";
      var evidence = entry && entry.evidenceLinks && entry.evidenceLinks.length
        ? entry.evidenceLinks.map(function (u, i) {
            return '<div><a href="' + escapeHtml(u) + '" target="_blank" rel="noopener">Evidence ' + (i + 1) + " ↗</a></div>";
          }).join("")
        : '<span class="dd-empty">None provided</span>';
      detail.querySelector(".dd-evidence").innerHTML = evidence;

      detail.querySelector(".dd-change").textContent = v.changeInfo ? v.changeInfo.text : "—";
      detail.querySelector(".dd-auditedby").textContent = entry && entry.auditedBy ? entry.auditedBy : "—";

      summaryBtn.addEventListener("click", function () {
        var expanded = summaryBtn.getAttribute("aria-expanded") === "true";
        summaryBtn.setAttribute("aria-expanded", String(!expanded));
        detail.hidden = expanded;
      });

      grid.appendChild(node);
    });
  }

  // ---- History table ---------------------------------------------------

  function renderHistoryTable() {
    var f = currentFilters();
    var tbody = document.getElementById("history-tbody");
    var emptyEl = document.getElementById("history-empty");
    var countEl = document.getElementById("history-result-count");

    var filtered = state.historyRows.filter(function (row) { return historyRowMatchesFilters(row, f); });
    countEl.textContent = filtered.length + " of " + state.historyRows.length + " shown";
    tbody.innerHTML = "";
    emptyEl.hidden = filtered.length > 0;

    filtered.forEach(function (row) {
      var tr = document.createElement("tr");
      tr.innerHTML =
        '<td class="hist-checked">' + escapeHtml(formatDateTime(row.ev.entry.checkedAt)) + "</td>" +
        "<td>" + escapeHtml(row.location.name) + "</td>" +
        "<td>" + escapeHtml(practiceNameFor(row.location.practiceId)) + "</td>" +
        "<td>" + statusPillHtml(row.ev.status) + "</td>" +
        "<td>" + escapeHtml(row.ev.entry.auditSource || "—") + "</td>" +
        "<td>" + escapeHtml(row.ev.entry.auditedBy || "—") + "</td>" +
        "<td>" + escapeHtml(row.change.text) + "</td>";
      tbody.appendChild(tr);
    });
  }

  function renderAll() {
    renderLocationGrid();
    renderHistoryTable();
  }

  // ---------------------------------------------------------------------
  // Boot
  // ---------------------------------------------------------------------

  function init(data) {
    state.data = data;
    var built = buildViews(data);
    state.locationViews = built.locationViews;
    state.historyRows = built.historyRows;

    renderHeader(data);
    renderKpis(state.locationViews);
    renderPractices(data, state.locationViews);
    renderAttention(state.locationViews);
    populateFilterOptions(data);
    renderAll();

    document.getElementById("filter-practice").addEventListener("change", function (e) {
      refreshLocationOptions(e.target.value);
      renderAll();
    });
    ["filter-location", "filter-status", "filter-source", "filter-date"].forEach(function (id) {
      document.getElementById(id).addEventListener("change", renderAll);
    });
    document.getElementById("filter-reset").addEventListener("click", function () {
      ["filter-practice", "filter-location", "filter-status", "filter-source", "filter-date"].forEach(function (id) {
        document.getElementById(id).value = "";
      });
      refreshLocationOptions("");
      renderAll();
    });
  }

  fetch("data/audits.json", { cache: "no-store" })
    .then(function (res) {
      if (!res.ok) throw new Error("HTTP " + res.status);
      return res.json();
    })
    .then(init)
    .catch(function (err) {
      var main = document.getElementById("main");
      var msg = document.createElement("div");
      msg.className = "empty-note";
      msg.style.color = "var(--failed)";
      msg.textContent = "Could not load data/audits.json (" + err.message + "). If you're viewing this file directly from disk, serve it over http:// (e.g. \"npx serve\") instead of opening it with file://.";
      main.prepend(msg);
    });
})();

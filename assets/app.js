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
 *   - overall status derivation
 *   - week-over-week change summaries
 *
 * Status is based only on what an audit run actually observes: does the
 * website scheduler load, and does every appointment type clicked into show real
 * availability. The location registry's `expectedAppointmentTypes` list
 * is reference metadata only and is never compared against what's
 * observed or used to compute status — it has proven unreliable.
 */

(function () {
  "use strict";

  var STATUS_ORDER = ["Failed", "Needs Recheck", "Slow Loading", "Manual Review", "Warning", "Passed", "Not Yet Audited"];
  var RANK = { "Passed": 0, "Warning": 1, "Slow Loading": 2, "Needs Recheck": 3, "Manual Review": 3, "Failed": 4 };

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
    "Slow Loading": {
      cls: "status-slow",
      icon: '<svg viewBox="0 0 20 20" width="12" height="12" aria-hidden="true"><circle cx="10" cy="10" r="7.5" stroke="currentColor" stroke-width="1.5" fill="none"/><path d="M10 6v4l2.7 1.8" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round"/></svg>'
    },
    "Needs Recheck": {
      cls: "status-recheck",
      icon: '<svg viewBox="0 0 20 20" width="12" height="12" aria-hidden="true"><path d="M16 7a6.5 6.5 0 10.2 5" stroke="currentColor" stroke-width="1.7" fill="none" stroke-linecap="round"/><path d="M13 4h3v3" stroke="currentColor" stroke-width="1.7" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>'
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
  // Status rules
  // ---------------------------------------------------------------------

  /**
   * Status is driven only by things actually observed this run:
   *   1. Did the correct website scheduler load?
   *   2. For every appointment type that was clicked into, did it show
   *      real, bookable availability?
   *
   * The location registry's `expectedAppointmentTypes` list is kept as
   * reference metadata only — it is intentionally NOT compared against
   * what's observed, and never affects status. That list has proven
   * unreliable (stale/incorrect labels), so it is not used as a pass/fail
   * test; only what the audit actually sees on the live site counts.
   */
  function computeStatus(entry, availIssues) {
    if (entry.manualReviewNeeded) return "Manual Review";
    if (availIssues && availIssues.length > 0) return "Failed";
    if (entry.websiteLoadPerformance === "Slow" || slowLoadingIssues(entry).length) return "Slow Loading";
    if (entry.websiteSchedulerStatus === "Broken" || entry.websiteSchedulerStatus === "NotChecked" || entry.websiteLoadPerformance === "Inconclusive") return "Needs Recheck";

    var hasMinorLinkNote = entry.websiteSchedulerStatus === "WrongLocation" ||
      (Array.isArray(entry.brokenOrIncorrectLinks) && entry.brokenOrIncorrectLinks.length > 0);
    if (hasMinorLinkNote) return "Warning";

    return "Passed";
  }

  /**
   * An entry only records appointment types when it actually checked them.
   * A "load-check only" audit run (confirming the scheduler link loads,
   * without walking through to the appointment-type list) legitimately
   * leaves both observed lists empty — that must not be read as "every
   * expected appointment type is missing". Treat empty/empty as "not
   * checked this run" and skip the appointment-type comparison entirely,
   * so status is driven only by the scheduler load statuses.
   */
  function appointmentTypesCheckedThisRun(entry) {
    return entry.observedWebsiteAppointmentTypes && entry.observedWebsiteAppointmentTypes.length > 0;
  }

  /**
   * Deep check: appointment types that were clicked into this run but did
   * not surface real, bookable availability (an empty calendar, an error,
   * a dead end). Populated only on runs that performed the deeper
   * per-appointment-type availability check — older/lighter audit runs
   * simply have empty (or absent) websiteAppointmentAvailability /
   * googleAppointmentAvailability arrays and contribute no issues here.
   */
  function availabilityIssues(entry) {
    var issues = [];
    (entry.websiteAppointmentAvailability || []).forEach(function (a) {
      if (a && a.availabilityLoaded === false) {
        issues.push({ appointmentType: a.appointmentType, source: "Website", issue: a.issue || "" });
      }
    });
    return issues;
  }

  function slowLoadingIssues(entry) {
    return (entry.websiteAppointmentAvailability || []).filter(function (a) {
      return a && (a.availabilityLoaded === null || a.verificationStatus === "SlowLoading");
    });
  }

  function evaluateEntry(entry, location) {
    var typesChecked = appointmentTypesCheckedThisRun(entry);
    var availIssues = availabilityIssues(entry);
    var status = computeStatus(entry, availIssues);
    return { entry: entry, status: status, typesChecked: typesChecked, availIssues: availIssues };
  }

  function reasonText(view) {
    if (!view.latest) return "No audit has been completed for this location yet.";
    var entry = view.latest.entry, status = view.status;

    if (status === "Manual Review") {
      return entry.manualReviewReason || "Audit could not be completed automatically and needs manual review.";
    }
    if (status === "Slow Loading") {
      var slow = slowLoadingIssues(entry);
      return slow.length ? slow.length + " appointment type" + (slow.length > 1 ? "s" : "") + " loaded too slowly to verify reliably" : "Website scheduler loaded slowly; recheck when the connection is stable.";
    }
    if (status === "Needs Recheck") return "The website audit was inconclusive; no failure was recorded.";
    var parts = [];
    if (status === "Failed") {
      if (view.latest.availIssues && view.latest.availIssues.length) {
        parts.push(view.latest.availIssues.length + " appointment type" + (view.latest.availIssues.length > 1 ? "s" : "") + " explicitly reported no availability");
      }
      return parts.length ? parts.join("; ") : "Audit failed.";
    }
    if (status === "Warning") {
      if (entry.websiteSchedulerStatus === "WrongLocation") parts.push("Booking destination differs from the listed office");
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

    var keyA = function (a) { return a.appointmentType + "|" + a.source; };
    var currAKeys = (curr.availIssues || []).map(keyA);
    var prevAKeys = (prev.availIssues || []).map(keyA);
    var newA = (curr.availIssues || []).filter(function (a) { return prevAKeys.indexOf(keyA(a)) === -1; });
    var resolvedA = (prev.availIssues || []).filter(function (a) { return currAKeys.indexOf(keyA(a)) === -1; });
    if (newA.length) parts.push("New no-availability: " + newA.map(function (a) { return a.appointmentType + " (" + a.source + ")"; }).join(", "));
    if (resolvedA.length) parts.push("Resolved no-availability: " + resolvedA.map(function (a) { return a.appointmentType + " (" + a.source + ")"; }).join(", "));

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

  /** Renders the per-appointment-type deep availability check as a small pass/fail list. */
  function availabilityListHtml(items) {
    if (!items || !items.length) return '<span class="dd-empty">Not checked this run</span>';
    return '<span class="tag-list">' + items.map(function (a) {
      var slow = a.availabilityLoaded === null || a.verificationStatus === "SlowLoading";
      var ok = a.availabilityLoaded === true;
      var cls = slow ? "tag-avail-slow" : ok ? "tag-avail-ok" : "tag-avail-fail";
      var label = escapeHtml(a.appointmentType) + (slow ? " ◷" : ok ? " ✓" : " ✗");
      var title = ok ? "" : ' title="' + escapeHtml(a.issue || (slow ? "Slow loading; recheck needed" : "No availability shown")) + '"';
      return '<span class="tag ' + cls + '"' + title + ">" + label + "</span>";
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
    var counts = { "Passed": 0, "Warning": 0, "Failed": 0, "Slow Loading": 0, "Needs Recheck": 0, "Manual Review": 0, "Not Yet Audited": 0 };
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
    document.getElementById("kpi-slow").textContent = counts["Slow Loading"];
    document.getElementById("kpi-last").textContent = lastCompleted ? formatDateTime(lastCompleted.toISOString()) : "No audits yet";
    document.getElementById("kpi-warning-footnote").textContent = "Warning: " + counts["Warning"];
    document.getElementById("kpi-notyet-footnote").textContent = "Not yet audited: " + counts["Not Yet Audited"];
  }

  function renderPractices(data, locationViews) {
    var grid = document.getElementById("practice-grid");
    grid.innerHTML = "";
    var f = currentFilters();
    data.practices.forEach(function (practice) {
      var views = locationViews.filter(function (v) { return v.location.practiceId === practice.id && locationMatchesFilters(v, f); });
      if (!views.length) return;
      var counts = { "Passed": 0, "Warning": 0, "Failed": 0, "Slow Loading": 0, "Needs Recheck": 0, "Manual Review": 0, "Not Yet Audited": 0 };
      var lastAudited = null;
      views.forEach(function (v) {
        counts[v.status]++;
        if (v.latest) {
          var t = new Date(v.latest.entry.checkedAt);
          if (!lastAudited || t > lastAudited) lastAudited = t;
        }
      });

      var panelId = "practice-panel-" + practice.id;
      var card = document.createElement("article");
      card.className = "practice-card practice-accordion";
      card.innerHTML =
        '<button type="button" class="practice-summary" aria-expanded="false" aria-controls="' + escapeHtml(panelId) + '">' +
          '<span class="practice-summary-copy">' +
            "<h3>" + escapeHtml(practice.name) + "</h3>" +
            '<span class="practice-sub">' + views.length + " location" + (views.length === 1 ? "" : "s") +
              (lastAudited ? " · updated " + formatDateOnly(lastAudited.toISOString()) : " · no audits yet") + "</span>" +
          "</span>" +
          '<span class="practice-stat-row">' +
            statChip("Passed", counts["Passed"], "st-passed") +
            statChip("Warning", counts["Warning"], "st-warning") +
            statChip("Failed", counts["Failed"], "st-failed") +
            statChip("Slow", counts["Slow Loading"], "st-slow") +
            statChip("Recheck", counts["Needs Recheck"], "st-recheck") +
            statChip("Manual", counts["Manual Review"], "st-manual") +
            statChip("Not audited", counts["Not Yet Audited"], "st-notyet") +
          "</span>" +
          '<svg class="practice-chev" viewBox="0 0 20 20" width="20" height="20" aria-hidden="true"><path d="M6 8l4 4 4-4" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
        "</button>" +
        '<div class="practice-locations" id="' + escapeHtml(panelId) + '" hidden>' +
          '<div class="practice-locations-head"><span>Location</span><span>Latest result</span><span></span></div>' +
          views.map(function (v) {
            return '<div class="practice-location-row">' +
              '<span class="practice-location-name">' + escapeHtml(v.location.name) + "</span>" +
              statusPillHtml(v.status) +
              '<button type="button" class="practice-location-view" data-location-id="' + escapeHtml(v.location.id) + '">View audit</button>' +
            "</div>";
          }).join("") +
        "</div>";

      var summary = card.querySelector(".practice-summary");
      var panel = card.querySelector(".practice-locations");
      summary.addEventListener("click", function () {
        var expanded = summary.getAttribute("aria-expanded") === "true";
        summary.setAttribute("aria-expanded", String(!expanded));
        panel.hidden = expanded;
      });
      Array.from(card.querySelectorAll(".practice-location-view")).forEach(function (button) {
        button.addEventListener("click", function () {
          showLocationFromPractice(button.getAttribute("data-location-id"));
        });
      });
      grid.appendChild(card);
    });
  }

  function showLocationFromPractice(locationId) {
    var location = state.data.locations.filter(function (l) { return l.id === locationId; })[0];
    if (!location) return;
    document.getElementById("filter-practice").value = location.practiceId;
    refreshLocationOptions(location.practiceId);
    document.getElementById("filter-location").value = locationId;
    document.getElementById("filter-status").value = "";
    document.getElementById("filter-type").value = "";
    document.getElementById("filter-date").value = "";
    renderAll();

    var card = document.querySelector('.location-card[data-location-id="' + CSS.escape(locationId) + '"]');
    if (card) {
      var summary = card.querySelector(".location-card-summary");
      var detail = card.querySelector(".location-card-detail");
      summary.setAttribute("aria-expanded", "true");
      detail.hidden = false;
      card.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function statChip(label, count, cls) {
    return '<span class="practice-stat ' + cls + '"><b>' + count + "</b> " + escapeHtml(label) + "</span>";
  }

  function renderAttention(locationViews) {
    var listEl = document.getElementById("attention-list");
    var emptyEl = document.getElementById("attention-empty");
    var countEl = document.getElementById("attention-count");

    var items = locationViews.filter(function (v) {
      return v.status === "Failed" || v.status === "Needs Recheck" || v.status === "Slow Loading" || v.status === "Manual Review" || v.status === "Warning";
    });
    items.sort(function (a, b) {
      return STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status);
    });

    countEl.textContent = items.length;
    listEl.innerHTML = "";
    emptyEl.hidden = items.length > 0;

    items.forEach(function (v) {
      var practice = practiceNameFor(v.location.practiceId);
      var sevClass = v.status === "Failed" ? "sev-failed" : (v.status === "Manual Review" || v.status === "Needs Recheck") ? "sev-manual" : "sev-warning";
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
    var typeSel = document.getElementById("filter-type");
    var types = Array.from(new Set(data.auditHistory.reduce(function (all, e) {
      return all.concat(e.observedWebsiteAppointmentTypes || []);
    }, []))).sort(function (a, b) { return a.localeCompare(b); });
    types.forEach(function (s) {
      var opt = document.createElement("option");
      opt.value = s; opt.textContent = s;
      typeSel.appendChild(opt);
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
      search: document.getElementById("filter-search").value.trim().toLowerCase(),
      practice: document.getElementById("filter-practice").value,
      location: document.getElementById("filter-location").value,
      status: document.getElementById("filter-status").value,
      type: document.getElementById("filter-type").value,
      date: document.getElementById("filter-date").value,
      sort: document.getElementById("sort-by").value
    };
  }

  function locationMatchesFilters(v, f) {
    if (f.practice && v.location.practiceId !== f.practice) return false;
    if (f.location && v.location.id !== f.location) return false;
    if (f.status && v.status !== f.status) return false;
    if (f.type && (!v.latest || (v.latest.entry.observedWebsiteAppointmentTypes || []).indexOf(f.type) === -1)) return false;
    if (f.date && (!v.latest || dateKey(v.latest.entry.checkedAt) !== f.date)) return false;
    if (f.search) {
      var e = v.latest ? v.latest.entry : {};
      var haystack = [
        v.location.name,
        practiceNameFor(v.location.practiceId),
        (v.location.expectedAppointmentTypes || []).join(" "),
        (e.observedWebsiteAppointmentTypes || []).join(" "),
        e.notes || "",
        e.manualReviewReason || "",
        e.auditSource || "",
        reasonText(v)
      ].join(" ").toLowerCase();
      if (haystack.indexOf(f.search) === -1) return false;
    }
    return true;
  }

  function historyRowMatchesFilters(row, f) {
    if (f.practice && row.location.practiceId !== f.practice) return false;
    if (f.location && row.location.id !== f.location) return false;
    if (f.status && row.ev.status !== f.status) return false;
    if (f.type && (row.ev.entry.observedWebsiteAppointmentTypes || []).indexOf(f.type) === -1) return false;
    if (f.date && dateKey(row.ev.entry.checkedAt) !== f.date) return false;
    if (f.search) {
      var e = row.ev.entry;
      var haystack = [row.location.name, practiceNameFor(row.location.practiceId),
        (e.observedWebsiteAppointmentTypes || []).join(" "),
        e.notes || "", e.auditSource || ""
      ].join(" ").toLowerCase();
      if (haystack.indexOf(f.search) === -1) return false;
    }
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
    filtered.sort(function (a, b) {
      if (f.sort === "location") return a.location.name.localeCompare(b.location.name);
      if (f.sort === "status") return STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status) || a.location.name.localeCompare(b.location.name);
      if (f.sort === "recent") return new Date(b.latest ? b.latest.entry.checkedAt : 0) - new Date(a.latest ? a.latest.entry.checkedAt : 0);
      if (f.sort === "appointment") {
        var at = a.latest && a.latest.entry.observedWebsiteAppointmentTypes[0] || "";
        var bt = b.latest && b.latest.entry.observedWebsiteAppointmentTypes[0] || "";
        return at.localeCompare(bt) || a.location.name.localeCompare(b.location.name);
      }
      return practiceNameFor(a.location.practiceId).localeCompare(practiceNameFor(b.location.practiceId)) || a.location.name.localeCompare(b.location.name);
    });
    countEl.textContent = filtered.length + " of " + state.locationViews.length + " shown";
    grid.innerHTML = "";
    emptyEl.hidden = filtered.length > 0;

    filtered.forEach(function (v) {
      var node = tpl.content.cloneNode(true);
      var article = node.querySelector(".location-card");
      article.setAttribute("data-location-id", v.location.id);
      var summaryBtn = node.querySelector(".location-card-summary");

      node.querySelector(".location-name").textContent = v.location.name;
      node.querySelector(".status-pill").outerHTML = statusPillHtml(v.status);
      node.querySelector(".location-status-rail").className = "location-status-rail rail-" + v.status.toLowerCase().replace(/[^a-z]+/g, "-");
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

      detail.querySelector(".dd-website-status").textContent = entry ? labelFor(entry.websiteSchedulerStatus) : "Not yet checked";
      detail.querySelector(".website-link").href = v.location.websiteUrl;

      var typesChecked = v.latest ? v.latest.typesChecked : false;
      var notCheckedHtml = '<span class="dd-empty">Not checked this run</span>';
      detail.querySelector(".dd-observed-website").innerHTML = !entry ? '<span class="dd-empty">Not yet checked</span>' : typesChecked ? tagListHtml(entry.observedWebsiteAppointmentTypes) : notCheckedHtml;

      detail.querySelector(".dd-avail-website").innerHTML = availabilityListHtml(entry && entry.websiteAppointmentAvailability);

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
    renderPractices(state.data, state.locationViews);
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
    renderAttention(state.locationViews);
    populateFilterOptions(data);
    renderAll();

    document.getElementById("filter-practice").addEventListener("change", function (e) {
      refreshLocationOptions(e.target.value);
      renderAll();
    });
    ["filter-location", "filter-status", "filter-type", "filter-date", "sort-by"].forEach(function (id) {
      document.getElementById(id).addEventListener("change", renderAll);
    });
    document.getElementById("filter-search").addEventListener("input", renderAll);
    document.addEventListener("keydown", function (event) {
      if (event.key === "/" && !/input|select|textarea/i.test(document.activeElement.tagName)) {
        event.preventDefault();
        document.getElementById("filter-search").focus();
      }
    });
    document.getElementById("filter-reset").addEventListener("click", function () {
      ["filter-search", "filter-practice", "filter-location", "filter-status", "filter-type", "filter-date"].forEach(function (id) {
        document.getElementById(id).value = "";
      });
      document.getElementById("sort-by").value = "practice";
      refreshLocationOptions("");
      renderAll();
    });
  }

  fetch("data/audits.json?v=" + Date.now(), { cache: "no-store" })
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

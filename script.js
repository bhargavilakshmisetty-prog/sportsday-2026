const CONFIG = {
  API_URL: "https://script.google.com/macros/s/AKfycbzoqoyI-R2-ZdzGrI2bonfdU5ugYij0UfgHmVKsLilQJUK9t4W_MNyl7I7g50aG2VW8sg/exec",
  SCHOOL_NAME: "CHRYSALIS SCHOOL",
  EVENT_NAME: "SPORTS DAY STEMATHON 2026"
};

const searchForm = document.getElementById("searchForm");
const searchInput = document.getElementById("searchInput");
const results = document.getElementById("results");
const message = document.getElementById("message");

let currentStudent = null;

document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const qrId = params.get("id") || params.get("studentId");
  const qrPhone = params.get("phone");

  if (qrId || qrPhone) {
    const value = qrId || qrPhone;
    searchInput.value = value;
    searchStudent(value, true);
  }
});

searchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const query = searchInput.value.trim();
  if (!query) {
    showMessage("Please enter a Student ID, name, or phone number.", "error");
    return;
  }
  searchStudent(query, false);
});

async function searchStudent(query, fromQr = false) {
  if (!isConfigured()) return;

  setBusy(true);
  results.hidden = false;
  results.innerHTML = '<div class="loading">Loading student information...</div>';
  clearMessage();

  try {
    const url = apiUrl({
      action: "getStudent",
      query: query
    });

    const response = await fetch(url, { method: "GET", cache: "no-store" });
    if (!response.ok) throw new Error("HTTP " + response.status);

    const data = await response.json();

    if (!data.success) {
      if (data.multiple && Array.isArray(data.students)) {
        renderChoices(data.students);
      } else {
        results.innerHTML = "";
        results.hidden = true;
        showMessage("❌ Student Not Found<br>Please check the ID, name, or phone number.", "error");
      }
      return;
    }

    renderStudent(data.student);
  } catch (error) {
    console.error(error);
    results.innerHTML = "";
    results.hidden = true;
    showMessage("⚠️ Unable to connect to Sports Day database.<br>Please try again or contact the Help Desk.", "error");
  } finally {
    setBusy(false);
  }
}

function renderChoices(students) {
  results.hidden = false;
  results.innerHTML = `
    <div class="student-card">
      <div class="zone-direction" style="padding-top:18px">
        Multiple students found. Please select the correct student.
      </div>
      <div class="choice-list">
        ${students.map((s, i) => `
          <button class="choice" type="button" data-index="${i}">
            <strong>${escapeHtml(s.name)}</strong>
            <span>ID: ${escapeHtml(s.id)} · Class: ${escapeHtml(s.class)} ${escapeHtml(s.section || "")}</span>
          </button>
        `).join("")}
      </div>
    </div>
  `;

  results.querySelectorAll(".choice").forEach(button => {
    button.addEventListener("click", () => {
      renderStudent(students[Number(button.dataset.index)]);
    });
  });
}

function renderStudent(student) {
  currentStudent = student;
  results.hidden = false;

  const zoneClass = zoneCssClass(student.zone);
  const checkedIn = isCheckedIn(student.status);

  results.innerHTML = `
    <div class="student-card ${zoneClass}">
      <div class="info-row">
        <span class="info-label">Student:</span>
        <span class="info-value">${escapeHtml(student.name)}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Roll No:</span>
        <span class="info-value">${escapeHtml(student.id)}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Seating:</span>
        <span class="info-value">Row ${escapeHtml(student.row)}, Seat ${escapeHtml(student.seat)}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Status:</span>
        <span class="info-value ${checkedIn ? "status-done" : "status-pending"}">${escapeHtml(student.status || "Not Checked In")}</span>
      </div>

      <div class="zone-card">
        <h2>Zone: ${escapeHtml(student.zone)}</h2>
      </div>

      <div class="zone-direction">${escapeHtml(student.directions || "Please follow the designated zone pathway.")}</div>

      ${
        checkedIn
        ? `
          <div class="confirmed">
            <strong>✓ Already Checked In</strong>
            <p>Check-in Time: ${escapeHtml(student.checkInTime || "Recorded in school database")}</p>
          </div>
        `
        : `
          <div class="action-wrap">
            <button id="confirmBtn" class="btn btn-success" type="button">Confirm Arrival</button>
          </div>
        `
      }

      <div class="action-wrap">
        <button id="directionsBtn" class="btn btn-secondary" type="button">📍 View Directions</button>
      </div>

      <div id="directionsBox" class="directions" hidden>
        <h3>Directions</h3>
        <div class="path">
          ${pathSteps(student).map((step, i) => `
            ${i ? '<div class="path-arrow">↓</div>' : ""}
            <div class="path-step">${escapeHtml(step)}</div>
          `).join("")}
        </div>
      </div>

      ${renderSchoolInfo(student)}
    </div>
  `;

  const confirmBtn = document.getElementById("confirmBtn");
  if (confirmBtn) {
    confirmBtn.addEventListener("click", confirmArrival);
  }

  document.getElementById("directionsBtn").addEventListener("click", () => {
    const box = document.getElementById("directionsBox");
    box.hidden = !box.hidden;
    document.getElementById("directionsBtn").textContent =
      box.hidden ? "📍 View Directions" : "📍 Hide Directions";
  });
}

async function confirmArrival() {
  if (!currentStudent || isCheckedIn(currentStudent.status)) return;
  if (!isConfigured()) return;

  const button = document.getElementById("confirmBtn");
  if (!button) return;

  button.disabled = true;
  button.textContent = "Confirming...";

  try {
    const url = apiUrl({
      action: "checkIn",
      id: currentStudent.id
    });

    const response = await fetch(url, { method: "GET", cache: "no-store" });
    if (!response.ok) throw new Error("HTTP " + response.status);

    const data = await response.json();

    if (!data.success) {
      if (data.alreadyCheckedIn) {
        currentStudent.status = "Checked In";
        currentStudent.checkInTime = data.checkInTime || "";
        renderStudent(currentStudent);
        showMessage("✓ Already Checked In", "success");
      } else {
        throw new Error(data.message || "Check-in failed");
      }
      return;
    }

    currentStudent.status = "Checked In";
    currentStudent.checkInTime = data.checkInTime || "";
    renderStudent(currentStudent);

    // Keep the success state visible without requiring another search.
    const confirmation = document.querySelector(".confirmed");
    if (confirmation) {
      confirmation.innerHTML = `
        <strong>✓ ARRIVAL CONFIRMED</strong>
        <p>${escapeHtml(data.message || "Arrival confirmed")}</p>
        <p>Check-in Time: ${escapeHtml(data.checkInTime || "")}</p>
        <p>Welcome to Chrysalis School Sports Day Stemathon 2026!</p>
      `;
    }
  } catch (error) {
    console.error(error);
    button.disabled = false;
    button.textContent = "Confirm Arrival";
    showMessage("⚠️ Unable to save check-in. Please try again or contact the Help Desk.", "error");
  }
}

function renderSchoolInfo(student) {
  const c = student.config || {};
  return `
    <section class="school-info">
      <h3>Sports Day Information</h3>
      <div class="school-grid">
        ${infoCell("Venue", c.venue)}
        ${infoCell("Date", c.date)}
        ${infoCell("Reporting Time", student.reportingTime)}
        ${infoCell("Student Entry", c.studentEntry || "Gate 1")}
        ${infoCell("Parent Entry", c.parentEntry || "Gate 2")}
        ${infoCell("Help Desk", c.helpDesk)}
        ${infoCell("First Aid", c.firstAid)}
        ${infoCell("Drinking Water", c.drinkingWater)}
        ${infoCell("Washrooms", c.washrooms)}
      </div>
    </section>
  `;
}

function infoCell(label, value) {
  return `<div class="label">${escapeHtml(label)}</div><div class="value">${escapeHtml(value || "—")}</div>`;
}

function pathSteps(student) {
  return [
    student.ground ? `${student.ground} · Student Entry` : "Student Entry",
    "Check-In Counter",
    student.zone || "Zone",
    student.row ? `Row ${student.row}` : "Row",
    student.seat ? `Seat ${student.seat}` : "Seat"
  ];
}

function apiUrl(params) {
  const url = new URL(CONFIG.API_URL);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) url.searchParams.set(key, value);
  });
  return url.toString();
}

function zoneCssClass(zone) {
  const z = String(zone || "").toLowerCase();
  if (z.includes("red")) return "zone-red";
  if (z.includes("green")) return "zone-green";
  if (z.includes("yellow")) return "zone-yellow";
  return "zone-blue";
}

function isCheckedIn(status) {
  return String(status || "").toLowerCase().replace(/\s+/g, " ") === "checked in"
      || String(status || "").toLowerCase().includes("already checked");
}

function isConfigured() {
  if (!CONFIG.API_URL || CONFIG.API_URL === "https://script.google.com/macros/s/AKfycbzoqoyI-R2-ZdzGrI2bonfdU5ugYij0UfgHmVKsLilQJUK9t4W_MNyl7I7g50aG2VW8sg/exec") {
    showMessage("Please configure the Google Apps Script URL in script.js.", "error");
    return false;
  }
  return true;
}

function setBusy(busy) {
  searchForm.querySelector("button").disabled = busy;
}

function showMessage(text, type) {
  message.innerHTML = text;
  message.className = `message show ${type}`;
}

function clearMessage() {
  message.innerHTML = "";
  message.className = "message";
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

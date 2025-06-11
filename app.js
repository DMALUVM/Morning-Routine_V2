const CLIENT_ID = '310678099655-asbf4ldapiqj7agr7i90vkaa5keqvm7h.apps.googleusercontent.com';
const API_KEY = 'AIzaSyCWwPIllw_q48zZ4D1CqhApZ9AjY2kfltk';
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

let tokenClient, gapiInited = false, gisInited = false;
let backupFileId = null;
let data = {}; // loaded later

document.addEventListener("DOMContentLoaded", () => {
  // DOM refs
  const calendarEl = document.getElementById("calendar");
  const monthYearEl = document.getElementById("monthYear");
  const streakEl = document.getElementById("streak");
  const ytdEl = document.getElementById("ytd");
  const saunaYtdEl = document.getElementById("saunaYTD");
  const coldYtdEl = document.getElementById("coldYTD");
  const todayForm = document.getElementById("todayForm");
  const editForm = document.getElementById("editForm");
  const cancelEdit = document.getElementById("cancelEdit");
  const exportBtn = document.getElementById("exportDrive");
  const restoreBtn = document.getElementById("restoreDrive");

  // Initialize data
  data = JSON.parse(localStorage.getItem("routineData") || "{}");

  // Utility functions
  const activities = {
    breathwork: "🧘", hydration: "💧", reading: "📖",
    mobility: "🤸", exercise: "🏋️", supplements: "💊",
    sauna: "🔥", cold: "🧊"
  };
  const requiredKeys = ["breathwork","hydration","reading","mobility","exercise","supplements"];
  const optionalKeys = ["sauna","cold"];

  function saveLocal() {
    localStorage.setItem("routineData", JSON.stringify(data));
  }
  function getLocalDate(d = new Date()) {
    return new Date(d.toLocaleString("en-US", { timeZone: "America/New_York" }));
  }
  function getDateKey(d = new Date()) {
    return getLocalDate(d).toISOString().split("T")[0];
  }

  // Calendar rendering
  function renderCalendar() {
    calendarEl.innerHTML = "";
    const now = getLocalDate();
    const nowKey = getDateKey(now);
    const year = now.getFullYear();
    const month = now.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDay = firstDay.getDay();
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();

    // Weekday headers
    ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].forEach(day => {
      const h = document.createElement("div");
      h.className = "font-bold";
      h.textContent = day;
      calendarEl.appendChild(h);
    });
    for (let i = 0; i < startDay; i++) {
      calendarEl.appendChild(document.createElement("div"));
    }

    // Days
    let todayEl = null;
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      const key = getDateKey(date);
      const entry = data[key] || {};
      const dayEl = document.createElement("div");
      dayEl.className = "calendar-day";

      if (key === nowKey) {
        dayEl.classList.add("today");
        todayEl = dayEl;
      }

      if (key > nowKey && !data[key]) {
        dayEl.innerHTML = `<div class="text-xs font-semibold">${d}</div>
          <div class="status-icon">--</div><div class="badge-row"></div>`;
      } else {
        const reqComplete = requiredKeys.every(k => entry[k]);
        const optBadges = optionalKeys.filter(k => entry[k]).map(k => activities[k]).join(" ");
        dayEl.classList.add(reqComplete ? "complete" : "incomplete");
        dayEl.innerHTML = `<div class="text-xs font-semibold">${d}</div>
          <div class="status-icon">${reqComplete ? "✅" : "❌"}</div>
          <div class="badge-row">${optBadges}</div>`;
      }

      dayEl.addEventListener("click", () => openEditModal(key));
      calendarEl.appendChild(dayEl);
    }

    if (todayEl) {
      setTimeout(() => todayEl.scrollIntoView({ behavior: "smooth", block: "center" }), 50);
    }

    monthYearEl.textContent = firstDay.toLocaleString("default", { month: "long", year: "numeric" });
    updateStats();
  }

  // Stats
  function updateStats() {
    const now = getLocalDate();
    const thisYear = now.getFullYear().toString();
    let streak = 0, ytd = 0, saunaCount = 0, coldCount = 0;

    let cur = new Date(now);
    while (true) {
      const key = getDateKey(cur);
      const entry = data[key];
      if (entry && requiredKeys.every(k => entry[k])) {
        streak++;
        cur.setDate(cur.getDate() - 1);
      } else break;
    }

    Object.entries(data).forEach(([key, entry]) => {
      if (key.startsWith(thisYear)) {
        if (requiredKeys.every(k => entry[k])) ytd++;
        if ('sauna' in entry && entry.sauna) saunaCount++;
        if ('cold' in entry && entry.cold) coldCount++;
      }
    });

    streakEl.textContent = `🔥 Streak: ${streak} day${streak!==1?'s':''}`;
    ytdEl.textContent = `📆 YTD: ${ytd} day${ytd!==1?'s':''}`;
    saunaYtdEl.textContent = `🔥 Sauna YTD: ${saunaCount}`;
    coldYtdEl.textContent = `🧊 Cold Plunge YTD: ${coldCount}`;
  }

  // Today form
  todayForm.addEventListener("submit", e => {
    e.preventDefault();
    const fd = new FormData(todayForm);
    const result = {};
    Object.keys(activities).forEach(k => result[k] = fd.get(k)==="on");
    const key = getDateKey();
    data[key] = result;
    saveLocal();
    renderCalendar();
  });

  // Edit modal
  function openEditModal(key) {
    const entry = data[key] || {};
    Array.from(editForm.elements).forEach(el => {
      if (el.name) el.checked = !!entry[el.name];
    });
    editForm.onsubmit = e => {
      e.preventDefault();
      const fd = new FormData(editForm);
      const result = {};
      Object.keys(activities).forEach(k => result[k] = fd.get(k)==="on");
      data[key] = result;
      saveLocal();
      renderCalendar();
      closeModal();
    };
    editModal.classList.remove("hidden");
  }
  function closeModal() {
    editModal.classList.add("hidden");
  }
  cancelEdit.addEventListener("click", closeModal);

  // Backup
  exportBtn.addEventListener("click", () => {
    tokenClient.callback = async resp => {
      if (resp.error) throw resp;
      const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
      const meta = new Blob([JSON.stringify({ name: "routineData.json", mimeType: "application/json" })], { type: "application/json" });
      const form = new FormData();
      form.append("metadata", meta);
      form.append("file", blob);
      await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart", {
        method: "POST",
        headers: { Authorization: "Bearer " + gapi.client.getToken().access_token },
        body: form
      });
      localStorage.setItem("lastBackup", getDateKey());
      alert("✅ Backup complete!");
    };
    tokenClient.requestAccessToken({ prompt: '' });
  });

  // Restore
  restoreBtn.addEventListener("click", () => {
    tokenClient.callback = async resp => {
      if (resp.error) throw resp;
      const respList = await gapi.client.drive.files.list({
        q: "name='routineData.json' and trashed=false",
        fields: "files(id)"
      });
      if (!respList.result.files.length) return alert("No backup found!");
      const fid = respList.result.files[0].id;
      const content = await fetch(`https://www.googleapis.com/drive/v3/files/${fid}?alt=media`, {
        headers: { Authorization: "Bearer " + gapi.client.getToken().access_token }
      });
      data = await content.json();
      saveLocal();
      renderCalendar();
      alert("✅ Restore complete!");
    };
    tokenClient.requestAccessToken({ prompt: '' });
  });

  // Auto-backup once per day
  const todayKey = getDateKey();
  if (localStorage.getItem("lastBackup") !== todayKey) {
    exportBtn.click();
  }

  // Initial render
  renderCalendar();
});

// Google API Loaders
function gapiLoaded() {
  gapi.load("client", async () => {
    await gapi.client.init({ apiKey: API_KEY, discoveryDocs: [DISCOVERY_DOC] });
    gapiInited = true;
    if (gisInited) enableButtons();
  });
}
function gisLoaded() {
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES,
    callback: ""
  });
  gisInited = true;
  if (gapiInited) enableButtons();
}
function enableButtons() {
  document.getElementById("exportDrive").disabled = false;
  document.getElementById("restoreDrive").disabled = false;
}

function maybeEnableExportButton() {
  if (gapiInited && gisInited) {
    document.getElementById("exportDrive").disabled = false;
  }
}

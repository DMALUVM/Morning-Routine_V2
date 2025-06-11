document.addEventListener("DOMContentLoaded", () => {
  const calendarEl = document.getElementById("calendar");
  const monthYearEl = document.getElementById("monthYear");
  const streakEl = document.getElementById("streak");
  const ytdEl = document.getElementById("ytd");
  const saunaYtdEl = document.getElementById("saunaYTD");
  const coldYtdEl = document.getElementById("coldYTD");

  const todayForm = document.getElementById("todayForm");
  const editForm = document.getElementById("editForm");
  const cancelEdit = document.getElementById("cancelEdit");

  let currentDate = new Date();
  let data = JSON.parse(localStorage.getItem("routineData") || "{}");
  let selectedDate = null;

  const activities = {
    breathwork: "🧘", hydration: "💧", reading: "📖",
    mobility: "🤸", exercise: "🏋️", supplements: "💊",
    sauna: "🔥", cold: "🧊"
  };
  const requiredKeys = ["breathwork","hydration","reading","mobility","exercise","supplements"];
  const optionalKeys = ["sauna","cold"];

  function getLocalDate(d = new Date()) {
    return new Date(d.toLocaleString("en-US", { timeZone: "America/New_York" }));
  }
  function getDateKey(d = new Date()) {
    return getLocalDate(d).toISOString().split("T")[0];
  }

  function renderCalendar() {
    calendarEl.innerHTML = "";
    const now = getLocalDate();
    const nowKey = getDateKey(now);
    currentDate = now; // always use today for now

    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const startDay = firstDay.getDay();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth()+1, 0).getDate();

    ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].forEach(day => {
      const h = document.createElement("div");
      h.className = "font-bold";
      h.textContent = day;
      calendarEl.appendChild(h);
    });

    for (let i = 0; i < startDay; i++) {
      calendarEl.appendChild(document.createElement("div"));
    }

    let todayEl = null;
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(now.getFullYear(), now.getMonth(), d);
      const key = getDateKey(date);
      const entry = data[key] || {};

      const dayEl = document.createElement("div");
      dayEl.className = "calendar-day";

      if (key === nowKey) {
        dayEl.classList.add("today");
        todayEl = dayEl;
      }

      if (date > now) {
        dayEl.innerHTML = `
          <div class="text-xs font-semibold">${d}</div>
          <div class="status-icon">--</div>
          <div class="badge-row"></div>
        `;
      } else {
        const doneReq = requiredKeys.every(k => entry[k]);
        const badges = optionalKeys.filter(k => entry[k]).map(k => activities[k]).join(" ");
        dayEl.classList.add(doneReq ? "complete" : "incomplete");
        dayEl.innerHTML = `
          <div class="text-xs font-semibold">${d}</div>
          <div class="status-icon">${doneReq ? "✅" : "❌"}</div>
          <div class="badge-row">${badges}</div>
        `;
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

  function updateStats() {
    const now = getLocalDate(), yearStr = now.getFullYear().toString();
    let streak = 0, ytd = 0, saunaCount = 0, coldCount = 0;

    let cur = new Date(now);
    while (true) {
      const key = getDateKey(cur);
      const e = data[key];
      if (e && requiredKeys.every(k => e[k])) {
        streak++;
        cur.setDate(cur.getDate() - 1);
      } else break;
    }

    Object.entries(data).forEach(([k, e]) => {
      if (k.startsWith(yearStr)) {
        if (requiredKeys.every(key => e[key])) ytd++;
        if (e.sauna) saunaCount++;
        if (e.cold) coldCount++;
      }
    });

    streakEl.textContent = `🔥 Streak: ${streak} day${streak!==1?'s':''}`;
    ytdEl.textContent = `📆 YTD: ${ytd} day${ytd!==1?'s':''}`;
    saunaYtdEl.textContent = `🔥 Sauna YTD: ${saunaCount}`;
    coldYtdEl.textContent = `🧊 Cold Plunge YTD: ${coldCount}`;
  }

  todayForm.addEventListener("submit", e => {
    e.preventDefault();
    const fd = new FormData(todayForm);
    const obj = {};
    Object.keys(activities).forEach(k => obj[k] = fd.get(k) === "on");
    const key = getDateKey();
    data[key] = obj;
    localStorage.setItem("routineData", JSON.stringify(data));
    renderCalendar();
  });

  function openEditModal(key) {
    selectedDate = key;
    const e = data[key] || {};
    Array.from(editForm.elements).forEach(el => {
      if (el.name) el.checked = !!e[el.name];
    });
    editForm.onsubmit = evt => {
      evt.preventDefault();
      const fd = new FormData(editForm);
      const obj = {};
      Object.keys(activities).forEach(k => obj[k] = fd.get(k) === "on");
      data[key] = obj;
      localStorage.setItem("routineData", JSON.stringify(data));
      renderCalendar();
      closeModal();
    };
    document.getElementById("editModal").classList.remove("hidden");
  }

  cancelEdit.addEventListener("click", closeModal);
  function closeModal() {
    document.getElementById("editModal").classList.add("hidden");
  }

  document.getElementById("prevMonth").addEventListener("click", () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
  });
  document.getElementById("nextMonth").addEventListener("click", () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
  });

  renderCalendar();
});

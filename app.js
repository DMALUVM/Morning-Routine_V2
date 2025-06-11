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

  let selectedDate = null;
  let currentDate = new Date();
  let data = JSON.parse(localStorage.getItem("routineData") || "{}");

  const activities = {
    breathwork: "🧘",
    hydration: "💧",
    reading: "📖",
    mobility: "🤸",
    exercise: "🏋️",
    supplements: "💊",
    sauna: "🔥",
    cold: "🧊",
  };

  const requiredKeys = ["breathwork", "hydration", "reading", "mobility", "exercise", "supplements"];
  const optionalKeys = ["sauna", "cold"];

  function getLocalDate(date = new Date()) {
    return new Date(date.toLocaleString("en-US", { timeZone: "America/New_York" }));
  }

  function getDateKey(date = new Date()) {
    return getLocalDate(date).toISOString().split("T")[0];
  }

  function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const now = getLocalDate();
    const nowKey = getDateKey(now);

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDay = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    calendarEl.innerHTML = "";

    ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].forEach(day => {
      const header = document.createElement("div");
      header.className = "font-bold";
      header.textContent = day;
      calendarEl.appendChild(header);
    });

    for (let i = 0; i < startDay; i++) {
      calendarEl.appendChild(document.createElement("div"));
    }

    let todayEl = null;

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const key = getDateKey(date);
      const entry = data[key] || {};
      const dayEl = document.createElement("div");
      dayEl.className = "calendar-day";

      if (key === nowKey) {
        dayEl.classList.add("today");
        todayEl = dayEl;
      }

      if (key > nowKey && !data[key]) {
        dayEl.innerHTML = `
          <div class="text-xs font-semibold">${day}</div>
          <div class="status-icon">--</div>
          <div class="badge-row"></div>
        `;
      } else {
        const completedRequired = requiredKeys.every(k => entry[k]);
        const badges = optionalKeys.filter(k => entry[k]).map(k => activities[k]).join(" ");
        dayEl.classList.add(completedRequired ? "complete" : "incomplete");
        dayEl.innerHTML = `
          <div class="text-xs font-semibold">${day}</div>
          <div class="status-icon">${completedRequired ? "✅" : "❌"}</div>
          <div class="badge-row">${badges}</div>
        `;
      }

      dayEl.addEventListener("click", () => openEditModal(key));
      calendarEl.appendChild(dayEl);
    }

    if (todayEl) {
      setTimeout(() => {
        todayEl.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);
    }

    monthYearEl.textContent = `${firstDay.toLocaleString("default", { month: "long" })} ${year}`;
    updateStats();
  }

  function updateStats() {
    let streak = 0;
    let ytd = 0;
    let saunaCount = 0;
    let coldCount = 0;
    const now = getLocalDate();
    const yearStart = now.getFullYear().toString();

    let cur = new Date(now);
    while (true) {
      const key = getDateKey(cur);
      const entry = data[key];
      if (entry && requiredKeys.every(k => entry[k])) {
        streak++;
        cur.setDate(cur.getDate() - 1);
      } else {
        break;
      }
    }

    for (const [key, entry] of Object.entries(data)) {
      if (key.startsWith(yearStart)) {
        if (requiredKeys.every(k => entry[k])) {
          ytd++;
        }
        if (entry.sauna) saunaCount++;
        if (entry.cold) coldCount++;
      }
    }

    streakEl.textContent = `🔥 Streak: ${streak} day${streak !== 1 ? "s" : ""}`;
    ytdEl.textContent = `📆 YTD: ${ytd} day${ytd !== 1 ? "s" : ""}`;
    saunaYtdEl.textContent = `🔥 Sauna YTD: ${saunaCount}`;
    coldYtdEl.textContent = `🧊 Cold Plunge YTD: ${coldCount}`;
  }

  todayForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const formData = new FormData(todayForm);
    const entry = {};
    for (const key of Object.keys(activities)) {
      entry[key] = formData.get(key) === "on";
    }
    const key = getDateKey();
    data[key] = entry;
    localStorage.setItem("routineData", JSON.stringify(data));
    renderCalendar();
  });

  function openEditModal(dateKey) {
    selectedDate = dateKey;
    const entry = data[dateKey] || {};
    for (const el of editForm.elements) {
      if (el.name) el.checked = !!entry[el.name];
    }
    editForm.onsubmit = (e) => {
      e.preventDefault();
      const formData = new FormData(editForm);
      const updated = {};
      for (const key of Object.keys(activities)) {
        updated[key] = formData.get(key) === "on";
      }
      data[dateKey] = updated;
      localStorage.setItem("routineData", JSON.stringify(data));
      renderCalendar();
      closeModal();
    };
  }

  function closeModal() {
    document.getElementById("editModal").classList.add("hidden");
  }

  cancelEdit.addEventListener("click", closeModal);

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

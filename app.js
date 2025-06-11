document.addEventListener("DOMContentLoaded", () => {
  const calendarEl = document.getElementById("calendar");
  const monthYearEl = document.getElementById("monthYear");
  const streakEl = document.getElementById("streak");
  const ytdEl = document.getElementById("ytd");

  const editModal = document.getElementById("editModal");
  const editForm = document.getElementById("editForm");
  const todayForm = document.getElementById("todayForm");
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

  function getDateKey(date) {
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

    ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].forEach(day => {
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
      const requiredComplete = requiredKeys.every(k => entry[k]);
      const optionalCompleted = optionalKeys.filter(k => entry[k]).map(k => activities[k]);
      const completed = requiredKeys.filter(k => entry[k]).length;
      const progress = Math.round((completed / requiredKeys.length) * 100);

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
        dayEl.classList.add(requiredComplete ? "complete" : "incomplete");
        dayEl.innerHTML = `
          <div class="text-xs font-semibold">${day}</div>
          <div class="status-icon">${requiredComplete ? "✅" : "❌"}</div>
          <div class="badge-row">${optionalCompleted.join(" ")}</div>
          <div class="progress-bar" style="width:${progress}%"></div>
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
    updateTodayForm();
  }

  function updateStats() {
    let streak = 0;
    let ytd = 0;
    let current = getLocalDate();

    while (true) {
      const key = getDateKey(current);
      const entry = data[key];
      const ok = entry && requiredKeys.every(k => entry[k]);
      if (ok) {
        streak++;
        current.setDate(current.getDate() - 1);
      } else {
        break;
      }
    }

    for (const [key, entry] of Object.entries(data)) {
      if (key.startsWith(getLocalDate().getFullYear().toString()) && requiredKeys.every(k => entry[k])) {
        ytd++;
      }
    }

    streakEl.textContent = `🔥 Streak: ${streak} day${streak === 1 ? "" : "s"}`;
    ytdEl.textContent = `📆 YTD: ${ytd} day${ytd === 1 ? "" : "s"}`;
  }

  function updateTodayForm() {
    const todayKey = getDateKey(getLocalDate());
    const lastCheckedKey = localStorage.getItem("lastCheckedDate") || "";

    if (lastCheckedKey !== todayKey) {
      for (const el of todayForm.elements) {
        if (el.type === "checkbox") el.checked = false;
      }
      localStorage.setItem("lastCheckedDate", todayKey);
    } else {
      const entry = data[todayKey] || {};
      for (const el of todayForm.elements) {
        if (el.type === "checkbox") {
          el.checked = !!entry[el.name];
        }
      }
    }
  }

  todayForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const formData = new FormData(todayForm);
    const result = {};
    for (const key of Object.keys(activities)) {
      result[key] = formData.get(key) === "on";
    }

    const todayKey = getDateKey(getLocalDate());
    data[todayKey] = result;
    localStorage.setItem("routineData", JSON.stringify(data));
    localStorage.setItem("lastCheckedDate", todayKey);
    renderCalendar();
  });

  function openEditModal(dateKey) {
    selectedDate = dateKey;
    const entry = data[dateKey] || {};

    for (const el of editForm.elements) {
      if (el.type === "checkbox") {
        el.checked = !!entry[el.name];
      }
    }

    editModal.classList.add("show");
    editModal.classList.remove("hidden");
  }

  editForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const formData = new FormData(editForm);
    const result = {};
    for (const key of Object.keys(activities)) {
      result[key] = formData.get(key) === "on";
    }

    data[selectedDate] = result;
    localStorage.setItem("routineData", JSON.stringify(data));
    closeModal();
    renderCalendar();
  });

  cancelEdit.addEventListener("click", closeModal);

  function closeModal() {
    editModal.classList.remove("show");
    editModal.classList.add("hidden");
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


document.addEventListener("DOMContentLoaded", () => {
  const calendarEl = document.getElementById("calendar");
  const monthYearEl = document.getElementById("monthYear");
  const streakEl = document.getElementById("streak");
  const ytdEl = document.getElementById("ytd");
  const saunaYtdEl = document.getElementById("saunaYTD");
  const coldYtdEl = document.getElementById("coldYTD");
  const trtYtdEl = document.getElementById("trtYTD");

  const editModal = document.getElementById("editModal");
  const editForm = document.getElementById("editForm");
  const todayForm = document.getElementById("todayForm");
  const cancelEdit = document.getElementById("cancelEdit");

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
    trt: "💉"
  };

  const requiredKeys = ["breathwork", "hydration", "reading", "mobility", "exercise", "supplements"];
  const optionalKeys = ["sauna", "cold", "trt"];

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
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startDay = firstDay.getDay();

    ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].forEach(day => {
      const h = document.createElement("div");
      h.className = "font-bold text-xs";
      h.textContent = day;
      calendarEl.appendChild(h);
    });

    for (let i = 0; i < startDay; i++) {
      calendarEl.appendChild(document.createElement("div"));
    }

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

      const num = document.createElement("div");
      num.className = "text-xs font-semibold";
      num.textContent = d;
      dayEl.appendChild(num);

      const status = document.createElement("div");
      status.className = "status-icon";

      if (date > now) {
        status.textContent = "--";
      } else {
        const ok = requiredKeys.every(k => entry[k]);
        status.textContent = ok ? "✅" : "❌";
        dayEl.classList.add(ok ? "complete" : "incomplete");
      }

      dayEl.appendChild(status);

      const badges = document.createElement("div");
      badges.className = "badge-row";
      optionalKeys.forEach(k => {
        if (entry[k]) badges.textContent += activities[k];
      });
      dayEl.appendChild(badges);

      dayEl.addEventListener("click", () => openEditModal(key));
      calendarEl.appendChild(dayEl);
    }

    if (todayEl) {
      setTimeout(() => todayEl.scrollIntoView({ behavior: "smooth", block: "center" }), 100);
    }

    monthYearEl.textContent = firstDay.toLocaleString("default", { month: "long", year: "numeric" });
    updateStats();
    updateTodayForm();
  }

  function updateStats() {
    const now = getLocalDate();
    const currentYear = now.getFullYear().toString();

    let streak = 0, ytd = 0, saunaCount = 0, coldCount = 0, trtCount = 0;

    let cur = new Date(now);
    while (true) {
      const key = getDateKey(cur);
      const entry = data[key];
      if (entry && requiredKeys.every(k => entry[k])) {
        streak++;
        cur.setDate(cur.getDate() - 1);
      } else break;
    }

    Object.entries(data).forEach(([k, entry]) => {
      if (k.startsWith(currentYear)) {
        if (requiredKeys.every(k => entry[k])) ytd++;
        if (entry.sauna) saunaCount++;
        if (entry.cold) coldCount++;
        if (entry.trt) trtCount++;
      }
    });

    streakEl.textContent = `🔥 Streak: ${streak} day${streak !== 1 ? "s" : ""}`;
    ytdEl.textContent = `📆 YTD: ${ytd} day${ytd !== 1 ? "s" : ""}`;
    saunaYtdEl.textContent = `🔥 Sauna YTD: ${saunaCount}`;
    coldYtdEl.textContent = `🧊 Cold YTD: ${coldCount}`;
    trtYtdEl.textContent = `💉 TRT YTD: ${trtCount}`;
  }

  function updateTodayForm() {
    const key = getDateKey();
    const entry = data[key] || {};
    for (const el of todayForm.elements) {
      if (el.name) el.checked = !!entry[el.name];
    }
  }

  todayForm.addEventListener("submit", e => {
    e.preventDefault();
    const formData = new FormData(todayForm);
    const result = {};
    Object.keys(activities).forEach(k => {
      result[k] = formData.get(k) === "on";
    });
    data[getDateKey()] = result;
    localStorage.setItem("routineData", JSON.stringify(data));
    renderCalendar();
  });

  function openEditModal(dateKey) {
    selectedDate = dateKey;
    const entry = data[dateKey] || {};
    for (const el of editForm.elements) {
      if (el.name) el.checked = !!entry[el.name];
    }
    editModal.classList.remove("hidden");
    editModal.classList.add("show");
  }

  editForm.addEventListener("submit", e => {
    e.preventDefault();
    const formData = new FormData(editForm);
    const result = {};
    Object.keys(activities).forEach(k => {
      result[k] = formData.get(k) === "on";
    });
    data[selectedDate] = result;
    localStorage.setItem("routineData", JSON.stringify(data));
    editModal.classList.remove("show");
    editModal.classList.add("hidden");
    renderCalendar();
  });

  cancelEdit.addEventListener("click", () => {
    editModal.classList.remove("show");
    editModal.classList.add("hidden");
  });

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

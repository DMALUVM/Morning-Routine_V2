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
    trt: "💉"
  };

  const requiredKeys = ["breathwork", "hydration", "reading", "mobility", "exercise", "supplements"];
  const optionalKeys = ["sauna", "cold", "trt"];

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
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startDay = firstDay.getDay();

    calendarEl.innerHTML = "";
    ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].forEach(day => {
      const header = document.createElement("div");
      header.className = "font-bold text-xs";
      header.textContent = day;
      calendarEl.appendChild(header);
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

      const dateNum = document.createElement("div");
      dateNum.className = "text-xs font-semibold";
      dateNum.textContent = d;
      dayEl.appendChild(dateNum);

      const statusIcon = entry && requiredKeys.every(k => entry[k]) ? "✅" : "❌";
      const iconEl = document.createElement("div");
      iconEl.className = "status-icon";
      iconEl.textContent = date > now ? "--" : statusIcon;
      dayEl.appendChild(iconEl);

      const badgeRow = document.createElement("div");
      badgeRow.className = "badge-row";
      optionalKeys.forEach(k => {
        if (entry[k]) badgeRow.textContent += activities[k];
      });
      dayEl.appendChild(badgeRow);

      /** Restore click/edit logic */
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
    let streak = 0, ytd = 0, saunaCount = 0, coldCount = 0, trtCount = 0;
    const now = getLocalDate();
    const thisYear = now.getFullYear();

    // Compute streak
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

    // Yearly totals
    for (const [key, entry] of Object.entries(data)) {
      if (key.startsWith(thisYear)) {
        if (requiredKeys.every(k => entry[k])) ytd++;
        if (entry.sauna) saunaCount++;
        if (entry.cold) coldCount++;
        if (entry.trt) trtCount++;
      }
    }

    streakEl.textContent = `🔥 Streak: ${streak} day${streak !== 1 ? "s" : ""}`;
    ytdEl.textContent = `📆 YTD: ${ytd} day${ytd !== 1 ? "s" : ""}`;
    saunaYtdEl.textContent = `🔥 Sauna YTD: ${saunaCount}`;
    coldYtdEl.textContent = `🧊 Cold YTD: ${coldCount}`;
    // Add TRT stats:
    const trtEl = document.getElementById("trtYTD") || createTRTElement();
    trtEl.textContent = `💉 TRT YTD: ${trtCount}`;
  }

  function createTRTElement() {
    const div = document.createElement("p");
    div.id = "trtYTD";
    div.className = "text-sm";
    document.querySelector(".flex > div").appendChild(div);
    return div;
  }

  function updateTodayForm() {
    const todayKey = getDateKey();
    const entry = data[todayKey] || {};
    for (const el of todayForm.elements) {
      if (el.name) el.checked = !!entry[el.name];
    }
  }

  todayForm.addEventListener("submit", e => {
    e.preventDefault();
    const formData = new FormData(todayForm), result = {};
    for (const key of Object.keys(activities)) {
      result[key] = formData.get(key) === "on";
    }
    const todayKey = getDateKey();
    data[todayKey] = result;
    localStorage.setItem("routineData", JSON.stringify(data));
    renderCalendar();
  });

  function openEditModal(dateKey) {
    selectedDate = dateKey;
    const entry = data[dateKey] || {};
    for (const el of editForm.elements) {
      if (el.name) el.checked = !!entry[el.name];
    }
    editModal.classList.add("show");
    editModal.classList.remove("hidden");
  }

  editForm.addEventListener("submit", e => {
    e.preventDefault();
    const formData = new FormData(editForm), result = {};
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

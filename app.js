document.addEventListener("DOMContentLoaded", () => {
  const cal = document.getElementById("calendar"),
        monthYearEl = document.getElementById("monthYear"),
        streakEl = document.getElementById("streak"),
        ytdEl = document.getElementById("ytd"),
        saunaYtdEl = document.getElementById("saunaYTD"),
        coldYtdEl = document.getElementById("coldYTD"),
        todayForm = document.getElementById("todayForm"),
        editForm = document.getElementById("editForm"),
        cancelEdit = document.getElementById("cancelEdit"),
        editModal = document.getElementById("editModal");

  let data = JSON.parse(localStorage.getItem("routineData") || "{}");

  const activities = {
    breathwork: "🧘", hydration: "💧", reading: "📖",
    mobility: "🤸", exercise: "🏋️", supplements: "💊",
    sauna: "🔥", cold: "🧊"
  };
  const required = ["breathwork","hydration","reading","mobility","exercise","supplements"];
  const optional = ["sauna","cold"];

  function getLocalDate(d = new Date()) {
    return new Date(d.toLocaleString("en-US", { timeZone: "America/New_York" }));
  }

  function getKey(d = new Date()) {
    return getLocalDate(d).toISOString().split("T")[0];
  }

  function renderCalendar(){
    cal.innerHTML = "";
    const now = getLocalDate(), nowKey = getKey(now);
    const year = now.getFullYear(), month = now.getMonth();
    const firstDay = new Date(year, month, 1),
          startDay = firstDay.getDay(),
          dim = new Date(year, month + 1, 0).getDate();

    // Weekday labels
    ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].forEach(wday => {
      const hd = document.createElement("div");
      hd.textContent = wday;
      hd.className = "font-bold text-xs";
      cal.appendChild(hd);
    });

    // Empty grid cells until first day
    for(let i = 0; i < startDay; i++){
      cal.appendChild(document.createElement("div"));
    }

    let todayEl;
    for(let d = 1; d <= dim; d++){
      const date = new Date(year, month, d),
            key = getKey(date),
            entry = data[key] || {},
            dayEl = document.createElement("div");
      dayEl.className = "calendar-day";

      if(key === nowKey){
        dayEl.classList.add("today");
        todayEl = dayEl;
      }

      // Date number
      const cellDate = document.createElement("div");
      cellDate.textContent = d;
      cellDate.className = "cell-date";
      dayEl.appendChild(cellDate);

      // Status icon
      const st = document.createElement("div");
      st.className = "status-icon";
      if(date > now){
        st.textContent = "--";
      } else {
        const ok = required.every(k => entry[k]);
        st.textContent = ok ? "✅" : "❌";
        dayEl.classList.add(ok ? "complete" : "incomplete");
      }
      dayEl.appendChild(st);

      // Optional badges
      const br = document.createElement("div");
      br.className = "badge-row";
      optional.forEach(k => {
        if(entry[k]) br.textContent += activities[k];
      });
      dayEl.appendChild(br);

      // Click handler to edit day
      dayEl.onclick = () => {
        Object.values(editForm.elements)
          .filter(el => el.name)
          .forEach(el => el.checked = !!entry[el.name]);
        
        editForm.onsubmit = e => {
          e.preventDefault();
          const fd = new FormData(editForm),
                newEntry = {};
          Object.keys(activities).forEach(k => {
            newEntry[k] = fd.get(k) === "on";
          });
          data[key] = newEntry;
          localStorage.setItem("routineData", JSON.stringify(data));
          renderCalendar();
          editModal.classList.add("hidden");
        };
        editModal.classList.remove("hidden");
      };

      cal.appendChild(dayEl);
    }

    if(todayEl) {
      setTimeout(() => {
        todayEl.scrollIntoView({ behavior:"smooth", block:"center" });
      }, 50);
    }
    monthYearEl.textContent = firstDay.toLocaleString("default", { month:"long", year:"numeric" });
    updateStats();
  }

  function updateStats(){
    const now = getLocalDate(),
          yearStr = now.getFullYear().toString();

    let streak = 0, ytd = 0, saunaCount = 0, coldCount = 0;

    // Calculate streak up to today
    let cur = new Date(now);
    while(true) {
      const key = getKey(cur),
            entry = data[key];
      if(entry && required.every(k => entry[k])) {
        streak++;
        cur.setDate(cur.getDate() - 1);
      } else {
        break;
      }
    }

    // Calculate yearly totals
    Object.entries(data).forEach(([k, entry]) => {
      if(k.startsWith(yearStr)) {
        if(required.every(x => entry[x])){
          ytd++;
        }
        if(entry.sauna) saunaCount++;
        if(entry.cold) coldCount++;
      }
    });

    streakEl.textContent = `🔥 Streak: ${streak} day${streak !== 1 ? "s" : ""}`;
    ytdEl.textContent = `📆 YTD: ${ytd} day${ytd !== 1 ? "s" : ""}`;
    saunaYtdEl.textContent = `🔥 Sauna YTD: ${saunaCount}`;
    coldYtdEl.textContent = `🧊 Cold YTD: ${coldCount}`;
  }

  cancelEdit.onclick = () => editModal.classList.add("hidden");

  renderCalendar();
});

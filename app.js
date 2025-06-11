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
  const editModal = document.getElementById("editModal");

  let data = JSON.parse(localStorage.getItem("routineData") || "{}");

  const activities = {
    breathwork: "🧘", hydration: "💧", reading: "📖",
    mobility: "🤸", exercise: "🏋️", supplements: "💊",
    sauna: "🔥", cold: "🧊"
  };
  const requiredKeys = ["breathwork","hydration","reading","mobility","exercise","supplements"];
  const optionalKeys = ["sauna","cold"];

  function getLocalDate(d=new Date()){ return new Date(d.toLocaleString("en-US",{timeZone:"America/New_York"})); }
  function getDateKey(d=new Date()){ return getLocalDate(d).toISOString().split("T")[0]; }

  function renderCalendar() {
    calendarEl.innerHTML = "";
    const now = getLocalDate();
    const nowKey = getDateKey(now);
    const year = now.getFullYear(), month = now.getMonth();
    const firstDay = new Date(year, month, 1), startDay = firstDay.getDay();
    const daysInMonth = new Date(year, month+1, 0).getDate();

    ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].forEach(day => {
      const h = document.createElement("div");
      h.className = "font-bold text-xs";
      h.textContent = day;
      calendarEl.appendChild(h);
    });

    for (let i=0; i<startDay; i++) calendarEl.appendChild(document.createElement("div"));

    let todayEl = null;
    for (let d=1; d<=daysInMonth; d++) {
      const date = new Date(year, month, d);
      const key = getDateKey(date);
      const entry = data[key] || {};
      const dayEl = document.createElement("div");
      dayEl.className = "calendar-day";

      if (key === nowKey) { dayEl.classList.add("today"); todayEl = dayEl; }

      const dateDiv = document.createElement("div");
      dateDiv.textContent = d;
      dateDiv.className = "cell-date";
      dayEl.appendChild(dateDiv);

      const statusDiv = document.createElement("div");
      statusDiv.className = "status-icon";
      if (date > now) {
        statusDiv.textContent = "--";
      } else {
        const completeReq = requiredKeys.every(k=>entry[k]);
        statusDiv.textContent = completeReq ? "✅" : "❌";
        dayEl.classList.add(completeReq ? "complete" : "incomplete");
      }
      dayEl.appendChild(statusDiv);

      const badgeRow = document.createElement("div");
      badgeRow.className = "badge-row";
      optionalKeys.filter(k=>entry[k]).forEach(k=>{
        badgeRow.textContent += activities[k];
      });
      dayEl.appendChild(badgeRow);

      dayEl.addEventListener("click",()=>{
        for(const el of editForm.elements){
          if(el.name) el.checked = !!entry[el.name];
        }
        editForm.onsubmit = e=>{
          e.preventDefault();
          const fd = new FormData(editForm);
          const newEntry = {};
          Object.keys(activities).forEach(k=> newEntry[k] = fd.get(k)==="on");
          data[key] = newEntry;
          localStorage.setItem("routineData",JSON.stringify(data));
          renderCalendar();
          closeModal();
        };
        editModal.classList.remove("hidden");
      });

      calendarEl.appendChild(dayEl);
    }

    if (todayEl) setTimeout(()=> todayEl.scrollIntoView({behavior:"smooth", block:"center"}),50);
    monthYearEl.textContent = firstDay.toLocaleString("default",{month:"long", year:"numeric"});
    updateStats();
  }

  function updateStats(){
    const now=getLocalDate(), ys=now.getFullYear().toString();
    let streak=0,ytd=0,sc=0,cc=0;
    let cur=new Date(now);
    const requiredDaily=entry=>requiredKeys.every(k=>entry[k]);
    while(true){
      const key=getDateKey(cur), e=data[key];
      if(e && requiredDaily(e)) {streak++; cur.setDate(cur.getDate()-1);}
      else break;
    }
    Object.values(data).forEach(e=>{
      const keyYear = Object.keys(e)[0];
      if(keyYear && keyYear.startsWith(ys) && requiredDaily(e)) {
        ytd++;
        if(e.sauna) sc++;
        if(e.cold) cc++;
      }
    });
    streakEl.textContent=`🔥 Streak: ${streak} day${streak!==1?'s':''}`;
    ytdEl.textContent=`📆 YTD: ${ytd} day${ytd!==1?'s':''}`;
    saunaYtdEl.textContent=`🔥 Sauna YTD: ${sc}`;
    coldYtdEl.textContent=`🧊 Cold YTD: ${cc}`;
  }

  cancelEdit.addEventListener("click", closeModal);
  function closeModal(){ editModal.classList.add("hidden"); }

  renderCalendar();
});

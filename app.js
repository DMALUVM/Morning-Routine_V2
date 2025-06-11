document.addEventListener("DOMContentLoaded", () => {
  const cal = document.getElementById("calendar");
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
  const required = ["breathwork","hydration","reading","mobility","exercise","supplements"];
  const optional = ["sauna","cold"];

  function getLocalDate(d=new Date()){ return new Date(d.toLocaleString("en-US",{timeZone:"America/New_York"})); }
  function getKey(d=new Date()){ return getLocalDate(d).toISOString().split("T")[0]; }

  function renderCalendar(){
    cal.innerHTML = "";
    const now = getLocalDate(), nowKey = getKey(now);
    const y = now.getFullYear(), m = now.getMonth();
    const fd = new Date(y,m,1), sd = fd.getDay(), dim = new Date(y,m+1,0).getDate();

    ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].forEach(w=>{
      const h = document.createElement("div");
      h.textContent = w;
      h.className = "font-bold text-xs";
      cal.appendChild(h);
    });
    for(let i=0;i<sd;i++) cal.appendChild(document.createElement("div"));

    let todayEl;
    for(let d=1; d<=dim; d++){
      const date = new Date(y,m,d), key = getKey(date);
      const entry = data[key]||{};
      const dayEl = document.createElement("div");
      dayEl.className = "calendar-day";

      if(key===nowKey){
        dayEl.classList.add("today");
        todayEl = dayEl;
      }

      const dt = document.createElement("div");
      dt.textContent = d;
      dt.className = "cell-date";
      dayEl.appendChild(dt);

      const st = document.createElement("div");
      st.className = "status-icon";
      if(date>now) st.textContent="--";
      else {
        const ok = required.every(a=>entry[a]);
        st.textContent = ok?"✅":"❌";
        dayEl.classList.add(ok?"complete":"incomplete");
      }      
      dayEl.appendChild(st);

      const br = document.createElement("div");
      br.className = "badge-row";
      optional.forEach(a=>{ if(entry[a]) br.textContent += activities[a]; });
      dayEl.appendChild(br);

      dayEl.onclick = () => {
        for(const el of editForm.elements) if(el.name) el.checked = !!entry[el.name];
        editForm.onsubmit = e => {
          e.preventDefault();
          const fd = new FormData(editForm), nn = {};
          Object.keys(activities).forEach(k=>nn[k] = fd.get(k)==="on");
          data[key] = nn;
          localStorage.setItem("routineData", JSON.stringify(data));
          renderCalendar();
          editModal.classList.add("hidden");
        };
        editModal.classList.remove("hidden");
      };

      cal.appendChild(dayEl);
    }

    if(todayEl) setTimeout(()=>todayEl.scrollIntoView({ behavior:"smooth", block:"center" }), 50);
    monthYearEl.textContent = fd.toLocaleString("default",{ month:"long", year:"numeric" });
    updateStats();
  }

  function updateStats(){
    const now = getLocalDate(), ys = now.getFullYear().toString();
    let streak = 0, ytd = 0, sa=0, co=0;
    const cur = new Date(now);
    const okReq = e => required.every(a=>e[a]);
    while(true){
      const e = data[getKey(cur)];
      if(e && okReq(e)){ streak++; cur.setDate(cur.getDate()-1); }
      else break;
    }
    Object.entries(data).forEach(([k,e])=>{
      if(k.startsWith(ys) && okReq(e)){
        ytd++;
        if(e.sauna) sa++;
        if(e.cold) co++;
      }
    });
    streakEl.textContent = `🔥 Streak: ${streak} day${streak!==1?'s':''}`;
    ytdEl.textContent = `📆 YTD: ${ytd} day${ytd!==1?'s':''}`;
    saunaYtdEl.textContent = `🔥 Sauna YTD: ${sa}`;
    coldYtdEl.textContent = `🧊 Cold YTD: ${co}`;
  }

  cancelEdit.onclick = () => editModal.classList.add("hidden");
  renderCalendar();
});

document.addEventListener('DOMContentLoaded', () => {
  const habits = ['breathwork', 'hydration', 'reading', 'exercise', 'supplements', 'sauna', 'cold', 'trt', 'redlight'];
  const coreHabits = ['breathwork', 'hydration', 'reading', 'exercise', 'supplements'];
  const optionalHabits = ['sauna', 'cold', 'redlight'];
  const habitEmojis = {
    breathwork: '🧘',
    hydration: '💧',
    reading: '📖',
    exercise: '🏋️',
    supplements: '💊',
    sauna: '🔥',
    cold: '🧊',
    trt: '💉',
    redlight: '🔴'
  };

  function getData() {
    return JSON.parse(localStorage.getItem('routineData') || '{}');
  }

  function saveData(data) {
    localStorage.setItem('routineData', JSON.stringify(data));
  }

  let currentDate = new Date(); // Use actual current date
  let viewDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

  function formatDate(d) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function isTRTDay(date) {
    const day = date.getDay();
    return day === 1 || day === 4; // Monday or Thursday
  }

  function isCompleted(dayData) {
    return coreHabits.every(h => dayData[h]);
  }

  function calculateStreak(data) {
    let streak = 0;
    let tempDate = new Date(currentDate);
    while (true) {
      const dateStr = formatDate(tempDate);
      const dayData = data[dateStr];
      if (dayData && isCompleted(dayData)) {
        streak++;
        tempDate.setDate(tempDate.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  }

  function calculateYTD(data, year) {
    let ytd = 0;
    let counts = {};
    habits.forEach(h => counts[h] = 0);
    Object.keys(data).forEach(key => {
      if (key.startsWith(year + '-')) {
        const dayData = data[key];
        if (isCompleted(dayData)) ytd++;
        habits.forEach(h => {
          if (dayData[h]) counts[h]++;
        });
      }
    });
    return { ytd, counts };
  }

  function updateStats() {
    const data = getData();
    const year = currentDate.getFullYear().toString();
    const { ytd, counts } = calculateYTD(data, year);
    const streak = calculateStreak(data);
    document.getElementById('streak').textContent = `🔥 Streak: ${streak} day${streak !== 1 ? 's' : ''}`;
    document.getElementById('ytd').textContent = `📆 YTD: ${ytd} day${ytd !== 1 ? 's' : ''}`;
    document.getElementById('saunaYTD').textContent = `🔥 Sauna YTD: ${counts.sauna}`;
    document.getElementById('coldYTD').textContent = `🧊 Cold YTD: ${counts.cold}`;
    document.getElementById('trtYTD').textContent = `💉 TRT YTD: ${counts.trt}`;
    document.getElementById('redlightYTD').textContent = `🔴 Red Light YTD: ${counts.redlight}`;
    return { streak, ytd, counts };
  }

  function renderCalendar() {
    const calendar = document.getElementById('calendar');
    calendar.innerHTML = '';
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    days.forEach(day => {
      const div = document.createElement('div');
      div.textContent = day;
      div.classList.add('font-bold', 'text-center');
      calendar.appendChild(div);
    });
    const firstDay = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();
    const lastDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
    for (let i = 0; i < firstDay; i++) {
      const emptyDiv = document.createElement('div');
      calendar.appendChild(emptyDiv);
    }
    const data = getData();
    let todayEl = null;
    for (let d = 1; d <= lastDate; d++) {
      const dayDiv = document.createElement('div');
      dayDiv.classList.add('calendar-day');
      const date = new Date(viewDate.getFullYear(), viewDate.getMonth(), d);
      const dateStr = formatDate(date);
      if (dateStr === formatDate(currentDate)) {
        dayDiv.classList.add('today');
        todayEl = dayDiv;
      }
      const dayNumber = document.createElement('span');
      dayNumber.textContent = d;
      dayNumber.classList.add('font-medium');
      dayDiv.appendChild(dayNumber);
      const statusIcon = document.createElement('span');
      statusIcon.classList.add('status-icon');
      dayDiv.appendChild(statusIcon);
      const badgeRow = document.createElement('div');
      badgeRow.classList.add('badge-row');
      if (isTRTDay(date)) {
        const trtIcon = document.createElement('span');
        trtIcon.textContent = '💉';
        trtIcon.title = 'TRT Day';
        badgeRow.appendChild(trtIcon);
      }
      dayDiv.appendChild(badgeRow);
      const progressContainer = document.createElement('div');
      progressContainer.classList.add('w-full', 'bg-gray-200', 'dark:bg-gray-700', 'h-1.5', 'rounded');
      const progressBar = document.createElement('div');
      progressBar.classList.add('progress-bar', 'h-full', 'rounded');
      progressContainer.appendChild(progressBar);
      dayDiv.appendChild(progressContainer);
      const dayData = data[dateStr] || {};
      const count = coreHabits.reduce((acc, h) => acc + (dayData[h] ? 1 : 0), 0);
      const percent = (count / coreHabits.length) * 100;
      progressBar.style.width = `${percent}%`;
      const ok = isCompleted(dayData);
      if (date > currentDate) {
        statusIcon.textContent = '--';
        dayDiv.classList.remove('cursor-pointer');
        dayDiv.classList.add('opacity-50');
      } else {
        if (ok) {
          statusIcon.textContent = '✅';
          dayDiv.classList.add('complete');
        } else if (count === 0) {
          statusIcon.textContent = '❌';
          dayDiv.classList.add('incomplete');
        } else {
          statusIcon.textContent = '📊';
          dayDiv.classList.add('partial');
        }
        optionalHabits.forEach(h => {
          if (dayData[h]) {
            const emoji = document.createElement('span');
            emoji.textContent = habitEmojis[h];
            emoji.title = capitalize(h);
            badgeRow.appendChild(emoji);
          }
        });
        if (dayData.trt && isTRTDay(date)) {
          const emoji = document.createElement('span');
          emoji.textContent = habitEmojis.trt;
          emoji.title = 'TRT Injection';
          badgeRow.appendChild(emoji);
        }
        dayDiv.addEventListener('click', () => openEditModal(dateStr, date));
      }
      calendar.appendChild(dayDiv);
    }
    if (todayEl) {
      setTimeout(() => todayEl.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
    }
    document.getElementById('monthYear').textContent = viewDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  }

  function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  function loadToday() {
    const data = getData();
    const dayData = data[formatDate(currentDate)] || {};
    habits.forEach(h => {
      const checkbox = document.querySelector(`#todayForm input[name="${h}"]`);
      if (checkbox) {
        checkbox.checked = !!dayData[h];
      }
    });
    const trtLabel = document.getElementById('trtLabel');
    trtLabel.classList.toggle('hidden', !isTRTDay(currentDate));
    updateProgress();
  }

  function updateProgress() {
    const checkboxes = document.querySelectorAll('#todayForm input[type="checkbox"]:not([name="trt"])');
    const checked = Array.from(checkboxes).filter(cb => cb.checked).length;
    const total = isTRTDay(currentDate) ? coreHabits.length + 1 : coreHabits.length;
    const percent = (checked / total) * 100;
    document.getElementById('progressBar').style.width = `${percent}%`;
  }

  let editDate;
  function openEditModal(dateStr, date) {
    editDate = dateStr;
    const data = getData();
    const dayData = data[dateStr] || {};
    habits.forEach(h => {
      const checkbox = document.querySelector(`#editForm input[name="${h}"]`);
      if (checkbox) {
        checkbox.checked = !!dayData[h];
      }
    });
    const trtLabel = document.getElementById('editTrtLabel');
    trtLabel.classList.toggle('hidden', !isTRTDay(date));
    document.getElementById('editModal').classList.remove('hidden');
  }

  function closeEditModal() {
    document.getElementById('editModal').classList.add('hidden');
  }

  function exportToCSV() {
    const data = getData();
    let csv = 'Date,' + habits.join(',') + '\n';
    Object.keys(data).sort().forEach(date => {
      let row = date;
      habits.forEach(h => {
        row += ',' + (data[date][h] ? 1 : 0);
      });
      csv += row + '\n';
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'daily_routine_tracker.csv';
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function updateThemeToggle() {
    const isDark = document.documentElement.classList.contains('dark');
    document.getElementById('themeToggle').textContent = isDark ? '☀️' : '🌙';
  }

  function toggleTheme() {
    const html = document.documentElement;
    html.classList.toggle('dark');
    localStorage.setItem('theme', html.classList.contains('dark') ? 'dark' : 'light');
    updateThemeToggle();
  }

  // Initialization
  const storedTheme = localStorage.getItem('theme');
  if (storedTheme === 'dark' || (!storedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
  }
  updateThemeToggle();
  document.getElementById('themeToggle').addEventListener('click', toggleTheme);

  loadToday();
  updateStats();
  renderCalendar();

  habits.forEach(h => {
    const checkbox = document.querySelector(`#todayForm input[name="${h}"]`);
    if (checkbox) {
      checkbox.addEventListener('change', updateProgress);
    }
  });

  document.getElementById('todayForm').addEventListener('submit', e => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const dayData = {};
    habits.forEach(h => {
      if (h !== 'trt' || isTRTDay(currentDate)) {
        dayData[h] = formData.get(h) === 'on';
      }
    });
    const data = getData();
    data[formatDate(currentDate)] = dayData;
    saveData(data);
    updateStats();
    renderCalendar();
    loadToday();
  });

  document.getElementById('editForm').addEventListener('submit', e => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const dayData = {};
    habits.forEach(h => {
      if (h !== 'trt' || isTRTDay(new Date(editDate))) {
        dayData[h] = formData.get(h) === 'on';
      }
    });
    const data = getData();
    data[editDate] = dayData;
    saveData(data);
    updateStats();
    renderCalendar();
    if (editDate === formatDate(currentDate)) loadToday();
    closeEditModal();
  });

  document.getElementById('cancelEdit').addEventListener('click', closeEditModal);

  document.getElementById('prevMonth').addEventListener('click', () => {
    viewDate.setMonth(viewDate.getMonth() - 1);
    renderCalendar();
  });

  document.getElementById('nextMonth').addEventListener('click', () => {
    viewDate.setMonth(viewDate.getMonth() + 1);
    renderCalendar();
  });

  document.getElementById('exportCSV').addEventListener('click', exportToCSV);

  document.getElementById('viewStats').addEventListener('click', () => {
    const { counts } = updateStats();
    habits.forEach(h => {
      document.getElementById(`stats-${h}`).textContent = `${habitEmojis[h]} ${capitalize(h)}: ${counts[h]}`;
    });
    document.getElementById('statsModal').classList.remove('hidden');
  });

  document.getElementById('closeStats').addEventListener('click', () => {
    document.getElementById('statsModal').classList.add('hidden');
  });

  document.getElementById('clearData').addEventListener('click', () => {
    if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
      localStorage.removeItem('routineData');
      updateStats();
      renderCalendar();
      loadToday();
      document.getElementById('statsModal').classList.add('hidden');
    }
  });
});

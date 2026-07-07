function renderDashboard() {
  const today = getToday();
  const todaysStats = AppState.dailyStats[today];
  const todayTotal = todaysStats ? todaysStats.total : 0;

  let allTotal = 0;
  AppState.dhikrList.forEach(d => { allTotal += d.totalCount; });

  const streak = AppState.streak;

  let goalsReached = 0;
  let totalGoals = 0;
  AppState.dhikrList.forEach(d => {
    if (d.target > 0) {
      totalGoals++;
      goalsReached += d.targetReachedCount;
    }
  });

  document.getElementById('dashToday').textContent = formatNumber(todayTotal);
  document.getElementById('dashTotal').textContent = formatNumber(allTotal);
  document.getElementById('dashStreak').textContent = formatNumber(streak.current);
  document.getElementById('dashGoals').textContent = formatNumber(goalsReached);

  renderWeeklyChart();
  renderTopDhikr();
}

function renderWeeklyChart() {
  const days = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const key = `${y}-${m}-${day}`;

    const dayNames = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const label = dayNames[d.getDay()];
    const count = AppState.dailyStats[key] ? AppState.dailyStats[key].total : 0;
    days.push({ label, count, key });
  }

  const maxCount = Math.max(...days.map(d => d.count), 1);
  const svg = document.getElementById('weeklyChart');
  const width = 350;
  const height = 200;
  const padding = { top: 20, right: 10, bottom: 30, left: 10 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;
  const barWidth = chartW / days.length * 0.6;
  const gap = chartW / days.length;
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const barColor = isDark ? '#4caf50' : '#2e7d32';
  const textColor = isDark ? '#a0a0c0' : '#5a5a7a';

  let bars = '';
  days.forEach((d, i) => {
    const barH = maxCount > 0 ? (d.count / maxCount) * chartH : 0;
    const x = padding.left + i * gap + (gap - barWidth) / 2;
    const y = padding.top + chartH - barH;
    const labelX = padding.left + i * gap + gap / 2;

    bars += `
      <rect class="bar" x="${x}" y="${y}" width="${barWidth}" height="${barH}" rx="4" fill="${barColor}" opacity="0.85">
        <title>${d.key}: ${d.count}</title>
      </rect>
      <text class="bar-value" x="${labelX}" y="${y - 5}" fill="${textColor}">${d.count}</text>
      <text class="bar-label" x="${labelX}" y="${height - 5}" fill="${textColor}">${d.label}</text>
    `;
  });

  svg.innerHTML = bars;
}

function renderTopDhikr() {
  const container = document.getElementById('topDhikrList');
  const sorted = [...AppState.dhikrList].sort((a, b) => b.totalCount - a.totalCount).slice(0, 5);

  if (sorted.length === 0) {
    container.innerHTML = '<div class="empty-state"><p>لا توجد بيانات كافية</p></div>';
    return;
  }

  container.innerHTML = sorted.map((d, i) => {
    const rank = i + 1;
    const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}.`;
    return `
      <div class="top-dhikr-item">
        <span class="top-dhikr-rank">${medal}</span>
        <span class="top-dhikr-name">${d.name}</span>
        <span class="top-dhikr-count">${formatNumber(d.totalCount)}</span>
      </div>
    `;
  }).join('');
}

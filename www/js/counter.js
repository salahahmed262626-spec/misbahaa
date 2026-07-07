let currentDhikrId = null;
let lastTapTime = 0;

function formatNumber(num) {
  const fmt = AppState.settings.numberFormat;
  if (fmt === 'arabic') {
    const arabicDigits = '٠١٢٣٤٥٦٧٨٩';
    return String(num).replace(/\d/g, d => arabicDigits[parseInt(d)]);
  }
  return num.toLocaleString('en-US');
}

function getActiveDhikrFromState() {
  return AppState.dhikrList.find(d => d.id === currentDhikrId) || AppState.dhikrList[0];
}

function selectDhikr(id) {
  currentDhikrId = id;
  setActiveDhikr(id);
  const current = getActiveDhikrFromState();
  if (current) {
    updateCounterDisplay(current);
    updateStatsRow(current);
  }
  updateDrawerSelection();
  closeDrawer();
}

function updateCounterDisplay(dhikr) {
  if (!dhikr) dhikr = getActiveDhikrFromState();
  const nameEl = document.getElementById('dhikrName');
  const countEl = document.getElementById('counterDisplay');
  const targetEl = document.getElementById('dhikrTargetDisplay');
  const progressFill = document.getElementById('progressFill');
  const progressText = document.getElementById('progressText');

  nameEl.textContent = dhikr.name;
  nameEl.style.fontFamily = `'${AppState.settings.font}', serif`;
  nameEl.style.fontSize = `${AppState.settings.fontSize}px`;

  countEl.textContent = formatNumber(dhikr.currentCount);
  countEl.style.fontFamily = `'${AppState.settings.font}', serif`;

  if (dhikr.target > 0) {
    targetEl.textContent = `الهدف: ${formatNumber(dhikr.target)}`;
    const pct = Math.min((dhikr.currentCount / dhikr.target) * 100, 100);
    progressFill.style.width = `${pct}%`;
    progressText.textContent = `${Math.round(pct)}%`;
  } else {
    targetEl.textContent = 'لا يوجد هدف';
    progressFill.style.width = '0%';
    progressText.textContent = '';
  }
}

function updateStatsRow(dhikr) {
  if (!dhikr) dhikr = getActiveDhikrFromState();
  document.getElementById('lastSessionDisplay').textContent = formatNumber(dhikr.lastSessionCount);
  document.getElementById('totalDisplay').textContent = formatNumber(dhikr.totalCount);
  document.getElementById('targetReachedDisplay').textContent = formatNumber(dhikr.targetReachedCount);
}

function createRipple(x, y) {
  const tapZone = document.getElementById('tapZone');
  const rect = tapZone.getBoundingClientRect();
  const ripple = document.createElement('span');
  ripple.className = 'ripple';
  const size = Math.max(rect.width, rect.height) * 0.4;
  ripple.style.width = ripple.style.height = `${size}px`;
  ripple.style.left = `${x - rect.left - size / 2}px`;
  ripple.style.top = `${y - rect.top - size / 2}px`;
  tapZone.appendChild(ripple);
  ripple.addEventListener('animationend', () => ripple.remove());
}

function handleTap(e) {
  const now = Date.now();
  if (now - lastTapTime < 50) return;

  let clientX, clientY;
  if (e.touches && e.touches.length > 0) {
    clientX = e.touches[0].clientX;
    clientY = e.touches[0].clientY;
  } else {
    clientX = e.clientX;
    clientY = e.clientY;
  }
  createRipple(clientX, clientY);

  const dhikr = getActiveDhikrFromState();
  if (!dhikr) return;

  dhikr.currentCount += 1;
  dhikr.totalCount += 1;

  const today = getToday();
  if (!AppState.dailyStats[today]) {
    AppState.dailyStats[today] = { total: 0, byDhikr: {} };
  }
  AppState.dailyStats[today].total += 1;
  if (!AppState.dailyStats[today].byDhikr[dhikr.id]) {
    AppState.dailyStats[today].byDhikr[dhikr.id] = 0;
  }
  AppState.dailyStats[today].byDhikr[dhikr.id] += 1;

  updateStreak(today);

  const countEl = document.getElementById('counterDisplay');
  countEl.textContent = formatNumber(dhikr.currentCount);
  countEl.classList.remove('bump');
  void countEl.offsetWidth;
  countEl.classList.add('bump');

  updateCounterDisplay(dhikr);
  updateStatsRow(dhikr);

  if (AppState.settings.vibrationEnabled) {
    try { navigator.vibrate(20); } catch(e) {}
  }

  if (dhikr.target > 0 && dhikr.currentCount >= dhikr.target) {
    const prevCount = dhikr.currentCount - 1;
    if (prevCount < dhikr.target) {
      dhikr.targetReachedCount += 1;
      showCelebration(dhikr);
      if (AppState.settings.vibrationEnabled) {
        try { navigator.vibrate([50, 50, 50]); } catch(e) {}
      }
    }
  }

  saveState();
  lastTapTime = now;
}

function handleUndo() {
  const dhikr = getActiveDhikrFromState();
  if (!dhikr || dhikr.currentCount <= 0) return;

  dhikr.currentCount -= 1;
  dhikr.totalCount -= 1;

  const today = getToday();
  if (AppState.dailyStats[today]) {
    AppState.dailyStats[today].total = Math.max(0, AppState.dailyStats[today].total - 1);
    if (AppState.dailyStats[today].byDhikr[dhikr.id]) {
      AppState.dailyStats[today].byDhikr[dhikr.id] = Math.max(0, AppState.dailyStats[today].byDhikr[dhikr.id] - 1);
    }
  }

  updateCounterDisplay(dhikr);
  updateStatsRow(dhikr);
  saveState();
  showToast('تم التراجع عن آخر نقرة');
}

function handleReset() {
  const dhikr = getActiveDhikrFromState();
  if (!dhikr || (dhikr.currentCount === 0 && dhikr.totalCount === 0)) return;

  showConfirm('تصفير العداد', `هل تريد تصفير عداد "${dhikr.name}"؟`, () => {
    dhikr.lastSessionCount = dhikr.currentCount;
    dhikr.currentCount = 0;
    updateCounterDisplay(dhikr);
    updateStatsRow(dhikr);
    saveState();
    showToast('تم تصفير العداد');
  });
}

function updateStreak(today) {
  const s = AppState.streak;
  if (s.lastActiveDate === today) return;

  const yesterday = getYesterday();
  if (s.lastActiveDate === yesterday) {
    s.current += 1;
  } else if (s.lastActiveDate && s.lastActiveDate !== today) {
    s.current = 1;
  } else {
    s.current = 1;
  }

  if (s.current > s.longest) s.longest = s.current;
  s.lastActiveDate = today;
}

function initCounter() {
  currentDhikrId = getActiveDhikr();
  if (!currentDhikrId && AppState.dhikrList.length > 0) {
    currentDhikrId = AppState.dhikrList[0].id;
  }

  const dhikr = getActiveDhikrFromState();
  if (dhikr) {
    updateCounterDisplay(dhikr);
    updateStatsRow(dhikr);
  }

  const tapZone = document.getElementById('tapZone');
  tapZone.addEventListener('click', handleTap);
  tapZone.addEventListener('touchstart', (e) => {
    e.preventDefault();
    handleTap(e);
  });

  document.getElementById('undoBtn').addEventListener('click', handleUndo);
  document.getElementById('resetBtn').addEventListener('click', handleReset);
}

let AppState = null;

const DefaultDhikrList = [
  { id: 'd001', name: 'سبحان الله', isDefault: true, currentCount: 0, lastSessionCount: 0, totalCount: 0, target: 33, targetReachedCount: 0, color: '#2e7d32', order: 1 },
  { id: 'd002', name: 'الحمد لله', isDefault: true, currentCount: 0, lastSessionCount: 0, totalCount: 0, target: 33, targetReachedCount: 0, color: '#1565c0', order: 2 },
  { id: 'd003', name: 'الله أكبر', isDefault: true, currentCount: 0, lastSessionCount: 0, totalCount: 0, target: 33, targetReachedCount: 0, color: '#6a1b9a', order: 3 },
  { id: 'd004', name: 'لا إله إلا الله', isDefault: true, currentCount: 0, lastSessionCount: 0, totalCount: 0, target: 0, targetReachedCount: 0, color: '#e65100', order: 4 },
  { id: 'd005', name: 'أستغفر الله', isDefault: true, currentCount: 0, lastSessionCount: 0, totalCount: 0, target: 100, targetReachedCount: 0, color: '#c62828', order: 5 },
  { id: 'd006', name: 'سبحان الله وبحمده', isDefault: true, currentCount: 0, lastSessionCount: 0, totalCount: 0, target: 100, targetReachedCount: 0, color: '#00838f', order: 6 },
  { id: 'd007', name: 'سبحان الله العظيم', isDefault: true, currentCount: 0, lastSessionCount: 0, totalCount: 0, target: 100, targetReachedCount: 0, color: '#f9a825', order: 7 },
  { id: 'd008', name: 'لا حول ولا قوة إلا بالله', isDefault: true, currentCount: 0, lastSessionCount: 0, totalCount: 0, target: 0, targetReachedCount: 0, color: '#4e342e', order: 8 },
  { id: 'd009', name: 'اللهم صل على محمد', isDefault: true, currentCount: 0, lastSessionCount: 0, totalCount: 0, target: 0, targetReachedCount: 0, color: '#37474f', order: 9 },
];

function createDefaultState() {
  const today = getToday();
  return {
    version: 1,
    settings: {
      theme: 'dark',
      themeMode: 'auto',
      font: 'Amiri',
      fontSize: 28,
      numberFormat: 'arabic',
      vibrationEnabled: true,
      soundEnabled: false
    },
    dhikrList: DefaultDhikrList.map(d => ({ ...d, createdAt: new Date().toISOString() })),
    dailyStats: {
      [today]: { total: 0, byDhikr: {} }
    },
    streak: {
      current: 0,
      longest: 0,
      lastActiveDate: ''
    }
  };
}

function getToday() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getYesterday() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function initState() {
  const saved = Storage.load();
  if (saved && Storage.validate(saved)) {
    AppState = migrateIfNeeded(saved);
  } else {
    AppState = createDefaultState();
    Storage.save(AppState);
  }
  return AppState;
}

function migrateIfNeeded(state) {
  const today = getToday();
  if (!state.dailyStats[today]) {
    state.dailyStats[today] = { total: 0, byDhikr: {} };
  }
  state.dhikrList.sort((a, b) => a.order - b.order);
  return state;
}

function saveState() {
  Storage.save(AppState);
}

function getActiveDhikr() {
  const id = localStorage.getItem('tasbeeh_active_dhikr') || (AppState.dhikrList[0] ? AppState.dhikrList[0].id : null);
  return AppState.dhikrList.find(d => d.id === id) || AppState.dhikrList[0];
}

function setActiveDhikr(id) {
  localStorage.setItem('tasbeeh_active_dhikr', id);
}

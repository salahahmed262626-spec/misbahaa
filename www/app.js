document.addEventListener('DOMContentLoaded', () => {
  initState();
  initTheme();
  initCounter();
  initUI();

  const dhikr = getActiveDhikrFromState();
  if (dhikr) {
    updateCounterDisplay(dhikr);
    updateStatsRow(dhikr);
  }

  renderDhikrList();

  if (AppState.settings.themeMode === 'auto') {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', () => {
      if (AppState.settings.themeMode === 'auto') {
        applyTheme('auto', AppState.settings.theme);
      }
    });
  }

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      saveState();
    }
  });

  window.addEventListener('beforeunload', () => {
    saveState();
  });
});

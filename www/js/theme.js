function applyTheme(themeMode, theme) {
  const html = document.documentElement;
  if (themeMode === 'auto') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
    html.setAttribute('data-theme', prefersDark.matches ? 'dark' : 'light');
  } else {
    html.setAttribute('data-theme', theme);
  }
  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) {
    const isDark = html.getAttribute('data-theme') === 'dark';
    metaTheme.setAttribute('content', isDark ? '#0f0f1a' : '#f5f0e8');
  }
}

function initTheme() {
  const s = AppState.settings;
  applyTheme(s.themeMode, s.theme);

  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
  prefersDark.addEventListener('change', () => {
    if (AppState.settings.themeMode === 'auto') {
      applyTheme('auto', AppState.settings.theme);
    }
  });
}

function setTheme(mode, theme) {
  AppState.settings.themeMode = mode;
  AppState.settings.theme = theme;
  applyTheme(mode, theme);
  saveState();
  updateThemeUI();
}

function updateThemeUI() {
  const mode = AppState.settings.themeMode;
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.themeMode === mode);
  });
}

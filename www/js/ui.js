let confirmCallback = null;

function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toast._hideTimer);
  toast._hideTimer = setTimeout(() => {
    toast.classList.remove('show');
  }, 2000);
}

function showConfirm(title, message, callback) {
  document.getElementById('confirmTitle').textContent = title;
  document.getElementById('confirmMessage').textContent = message;
  document.getElementById('confirmOverlay').classList.add('open');
  document.getElementById('confirmModal').classList.add('open');
  confirmCallback = callback;
}

function hideConfirm() {
  document.getElementById('confirmOverlay').classList.remove('open');
  document.getElementById('confirmModal').classList.remove('open');
  confirmCallback = null;
}

function showCelebration(dhikr) {
  const el = document.getElementById('celebration');
  document.getElementById('celebrationText').textContent = `لقد حققت هدف "${dhikr.name}" ${formatNumber(dhikr.target)} مرة! 🎉`;
  el.classList.add('show');
}

function hideCelebration() {
  document.getElementById('celebration').classList.remove('show');
}

function openDrawer() {
  document.getElementById('drawerOverlay').classList.add('open');
  document.getElementById('dhikrDrawer').classList.add('open');
  renderDhikrList();
  document.getElementById('dhikrSearch').value = '';
  document.getElementById('dhikrSearch').focus();
}

function closeDrawer() {
  document.getElementById('drawerOverlay').classList.remove('open');
  document.getElementById('dhikrDrawer').classList.remove('open');
}

function openModal(title, dhikr) {
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('dhikrNameInput').value = dhikr ? dhikr.name : '';
  document.getElementById('dhikrTargetInput').value = dhikr ? dhikr.target : 0;
  document.getElementById('editingDhikrId').value = dhikr ? dhikr.id : '';

  document.querySelectorAll('.color-option').forEach(el => {
    el.classList.toggle('active', dhikr ? el.dataset.color === dhikr.color : el.dataset.color === '#2e7d32');
  });

  document.getElementById('dhikrModalOverlay').classList.add('open');
  document.getElementById('dhikrModal').classList.add('open');
}

function closeModal() {
  document.getElementById('dhikrModalOverlay').classList.remove('open');
  document.getElementById('dhikrModal').classList.remove('open');
}

function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(screenId).classList.add('active');
}

function renderDhikrList(filterText) {
  const container = document.getElementById('dhikrList');
  const list = AppState.dhikrList.filter(d => {
    if (!filterText) return true;
    return d.name.includes(filterText);
  });

  if (list.length === 0) {
    container.innerHTML = '<div class="empty-state"><div class="empty-icon">📿</div><p>لا توجد أذكار مطابقة</p></div>';
    return;
  }

  container.innerHTML = list.map(d => {
    const isActive = d.id === currentDhikrId;
    const countDisplay = formatNumber(d.currentCount);
    return `
      <div class="drawer-item ${isActive ? 'active' : ''}" data-id="${d.id}">
        <span class="dhikr-dot" style="background:${d.color}"></span>
        <span class="dhikr-item-name">${d.name}</span>
        <span class="dhikr-item-count">${countDisplay}</span>
        <div class="dhikr-item-actions">
          <button class="edit-dhikr-btn" data-id="${d.id}" aria-label="تعديل">✏️</button>
          ${d.isDefault ? '' : `<button class="delete-dhikr-btn" data-id="${d.id}" aria-label="حذف">🗑️</button>`}
        </div>
      </div>
    `;
  }).join('');

  container.querySelectorAll('.drawer-item').forEach(el => {
    el.addEventListener('click', (e) => {
      if (e.target.closest('.dhikr-item-actions')) return;
      selectDhikr(el.dataset.id);
    });
  });

  container.querySelectorAll('.edit-dhikr-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const d = AppState.dhikrList.find(x => x.id === btn.dataset.id);
      if (d) openModal('تعديل الذكر', d);
    });
  });

  container.querySelectorAll('.delete-dhikr-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const d = AppState.dhikrList.find(x => x.id === btn.dataset.id);
      if (d) {
        showConfirm('حذف الذكر', `هل أنت متأكد من حذف "${d.name}"؟`, () => {
          AppState.dhikrList = AppState.dhikrList.filter(x => x.id !== d.id);
          if (currentDhikrId === d.id) {
            currentDhikrId = AppState.dhikrList[0]?.id || null;
            if (currentDhikrId) setActiveDhikr(currentDhikrId);
          }
          saveState();
          renderDhikrList();
          if (currentDhikrId) {
            const next = AppState.dhikrList.find(x => x.id === currentDhikrId);
            if (next) {
              updateCounterDisplay(next);
              updateStatsRow(next);
            }
          }
          showToast('تم حذف الذكر');
        });
      }
    });
  });

  updateDrawerSelection();
}

function updateDrawerSelection() {
  document.querySelectorAll('.drawer-item').forEach(el => {
    el.classList.toggle('active', el.dataset.id === currentDhikrId);
  });
}

function saveDhikrFromModal() {
  const id = document.getElementById('editingDhikrId').value;
  const name = document.getElementById('dhikrNameInput').value.trim();
  const target = parseInt(document.getElementById('dhikrTargetInput').value) || 0;
  const selectedColor = document.querySelector('.color-option.active');
  const color = selectedColor ? selectedColor.dataset.color : '#2e7d32';

  if (!name) {
    showToast('الرجاء إدخال نص الذكر');
    return;
  }

  if (id) {
    const existing = AppState.dhikrList.find(d => d.id === id);
    if (existing) {
      existing.name = name;
      existing.target = target;
      existing.color = color;
    }
  } else {
    const newId = 'd' + Date.now();
    const maxOrder = AppState.dhikrList.reduce((max, d) => Math.max(max, d.order), 0);
    AppState.dhikrList.push({
      id: newId,
      name,
      isDefault: false,
      currentCount: 0,
      lastSessionCount: 0,
      totalCount: 0,
      target,
      targetReachedCount: 0,
      color,
      order: maxOrder + 1,
      createdAt: new Date().toISOString()
    });
  }

  AppState.dhikrList.sort((a, b) => a.order - b.order);
  saveState();
  closeModal();

  if (currentDhikrId) {
    const current = AppState.dhikrList.find(d => d.id === currentDhikrId);
    if (current) {
      updateCounterDisplay(current);
      updateStatsRow(current);
    }
  }

  renderDhikrList();
  showToast(id ? 'تم تعديل الذكر' : 'تم إضافة الذكر');
}

function initUI() {
  document.getElementById('menuBtn').addEventListener('click', openDrawer);
  document.getElementById('closeDrawerBtn').addEventListener('click', closeDrawer);
  document.getElementById('drawerOverlay').addEventListener('click', closeDrawer);

  document.getElementById('addDhikrBtn').addEventListener('click', () => openModal('إضافة ذكر جديد', null));

  document.getElementById('closeModalBtn').addEventListener('click', closeModal);
  document.getElementById('dhikrModalOverlay').addEventListener('click', closeModal);
  document.getElementById('cancelModalBtn').addEventListener('click', closeModal);
  document.getElementById('saveDhikrBtn').addEventListener('click', saveDhikrFromModal);

  document.querySelectorAll('.color-option').forEach(el => {
    el.addEventListener('click', () => {
      document.querySelectorAll('.color-option').forEach(x => x.classList.remove('active'));
      el.classList.add('active');
    });
  });

  document.getElementById('confirmCancelBtn').addEventListener('click', hideConfirm);
  document.getElementById('confirmOverlay').addEventListener('click', hideConfirm);
  document.getElementById('confirmOkBtn').addEventListener('click', () => {
    if (confirmCallback) confirmCallback();
    hideConfirm();
  });

  document.getElementById('celebrationClose').addEventListener('click', hideCelebration);

  document.getElementById('dashboardBtn').addEventListener('click', () => {
    showScreen('dashboardScreen');
    renderDashboard();
  });
  document.getElementById('backFromDashboard').addEventListener('click', () => showScreen('mainScreen'));

  document.getElementById('settingsBtn').addEventListener('click', () => {
    showScreen('settingsScreen');
    loadSettingsUI();
  });
  document.getElementById('backFromSettings').addEventListener('click', () => showScreen('mainScreen'));

  document.getElementById('dhikrSearch').addEventListener('input', (e) => {
    renderDhikrList(e.target.value.trim());
  });

  initSettingsUI();
}

function initSettingsUI() {
  document.getElementById('vibrationToggle').addEventListener('change', (e) => {
    AppState.settings.vibrationEnabled = e.target.checked;
    saveState();
  });

  document.getElementById('soundToggle').addEventListener('change', (e) => {
    AppState.settings.soundEnabled = e.target.checked;
    saveState();
  });

  document.getElementById('fontSelect').addEventListener('change', (e) => {
    AppState.settings.font = e.target.value;
    saveState();
    const dhikr = getActiveDhikrFromState();
    if (dhikr) updateCounterDisplay(dhikr);
  });

  document.getElementById('fontSizeSlider').addEventListener('input', (e) => {
    const val = parseInt(e.target.value);
    AppState.settings.fontSize = val;
    document.getElementById('fontSizeLabel').textContent = val;
    saveState();
    const dhikr = getActiveDhikrFromState();
    if (dhikr) updateCounterDisplay(dhikr);
  });

  document.getElementById('numberFormatSelect').addEventListener('change', (e) => {
    AppState.settings.numberFormat = e.target.value;
    saveState();
    const dhikr = getActiveDhikrFromState();
    if (dhikr) {
      updateCounterDisplay(dhikr);
      updateStatsRow(dhikr);
    }
  });

  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = btn.dataset.themeMode;
      let theme = AppState.settings.theme;
      if (mode === 'light') theme = 'light';
      else if (mode === 'dark') theme = 'dark';
      else theme = AppState.settings.theme;
      setTheme(mode, theme);
    });
  });

  document.getElementById('exportBtn').addEventListener('click', () => {
    const json = Storage.exportJSON(AppState);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tasbeeh_backup_${getToday()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('تم تصدير البيانات بنجاح');
  });

  document.getElementById('importBtn').addEventListener('click', () => {
    document.getElementById('importFileInput').click();
  });

  document.getElementById('importFileInput').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const data = Storage.importJSON(event.target.result);
      if (!data) {
        showToast('ملف غير صالح. تأكد من اختيار ملف JSON صحيح');
        return;
      }
      showConfirm('استيراد البيانات', 'سيتم استبدال جميع البيانات الحالية. هل أنت متأكد؟', () => {
        AppState = data;
        migrateIfNeeded(AppState);
        saveState();
        currentDhikrId = AppState.dhikrList[0]?.id || null;
        if (currentDhikrId) setActiveDhikr(currentDhikrId);
        const dhikr = getActiveDhikrFromState();
        if (dhikr) {
          updateCounterDisplay(dhikr);
          updateStatsRow(dhikr);
        }
        loadSettingsUI();
        showToast('تم استيراد البيانات بنجاح');
      });
    };
    reader.readAsText(file);
    e.target.value = '';
  });

  document.getElementById('clearDataBtn').addEventListener('click', () => {
    showConfirm('مسح جميع البيانات', 'هل أنت متأكد؟ سيتم فقدان جميع الأذكار والإحصائيات نهائيًا.', () => {
      showConfirm('تأكيد مسح البيانات', 'هذا الإجراء لا يمكن التراجع عنه. هل أنت متأكد تمامًا؟', () => {
        Storage.clearAll();
        AppState = createDefaultState();
        Storage.save(AppState);
        currentDhikrId = AppState.dhikrList[0]?.id || null;
        if (currentDhikrId) setActiveDhikr(currentDhikrId);
        const dhikr = getActiveDhikrFromState();
        if (dhikr) {
          updateCounterDisplay(dhikr);
          updateStatsRow(dhikr);
        }
        loadSettingsUI();
        renderDhikrList();
        showToast('تم مسح جميع البيانات');
      });
    });
  });
}

function loadSettingsUI() {
  const s = AppState.settings;
  document.getElementById('vibrationToggle').checked = s.vibrationEnabled;
  document.getElementById('soundToggle').checked = s.soundEnabled;
  document.getElementById('fontSelect').value = s.font;
  document.getElementById('fontSizeSlider').value = s.fontSize;
  document.getElementById('fontSizeLabel').textContent = s.fontSize;
  document.getElementById('numberFormatSelect').value = s.numberFormat;

  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.themeMode === s.themeMode);
  });
}

const Storage = {
  STORAGE_KEY: 'tasbeeh_app_data',

  load() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      return data;
    } catch (e) {
      console.warn('Storage load error:', e);
      return null;
    }
  },

  save(state) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(state));
      return true;
    } catch (e) {
      console.warn('Storage save error:', e);
      return false;
    }
  },

  exportJSON(state) {
    return JSON.stringify(state, null, 2);
  },

  importJSON(text) {
    try {
      const data = JSON.parse(text);
      if (!this.validate(data)) return null;
      return data;
    } catch (e) {
      return null;
    }
  },

  validate(data) {
    if (!data || typeof data !== 'object') return false;
    if (!data.version || typeof data.version !== 'number') return false;
    if (!data.settings || typeof data.settings !== 'object') return false;
    if (!Array.isArray(data.dhikrList)) return false;
    if (!data.dailyStats || typeof data.dailyStats !== 'object') return false;
    if (!data.streak || typeof data.streak !== 'object') return false;
    return true;
  },

  clearAll() {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      return true;
    } catch (e) {
      return false;
    }
  }
};

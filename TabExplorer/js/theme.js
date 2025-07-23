import { loadCursors } from './cursors.js';

let themeSelect;

function setThemeClass(theme) {
  document.body.className = 'theme-' + theme;
  themeSelect.value = theme;
}

function saveThemeToStorage(theme) {
  browser.storage.local.set({ theme });
}

export function cycleTheme() {
  const themes = ['green', 'amber', 'blue'];
  let current = themeSelect.value;
  let next = themes[(themes.indexOf(current) + 1) % themes.length];
  setThemeClass(next);
  saveThemeToStorage(next);
  loadCursors(next);
}

export function initTheme() {
  themeSelect = document.getElementById('themeSelect');
  browser.storage.local.get('theme').then(({ theme }) => {
    const selected = theme || 'green';
    setThemeClass(selected);
    loadCursors(selected);
  });
  themeSelect.addEventListener('change', () => {
    const theme = themeSelect.value;
    setThemeClass(theme);
    saveThemeToStorage(theme);
    loadCursors(theme);
  });
  window.onload = function () {
    loadCursors(themeSelect.value, true);
  };
} 
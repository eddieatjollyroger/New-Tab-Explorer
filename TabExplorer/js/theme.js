import { loadCursors } from './cursors.js';

let themeSelect;
let selectedEl;
let optionsEl;
let internalThemeValue = 'green';

function setThemeClass(theme) {
  document.body.className = 'theme-' + theme;

  if (selectedEl) {
    selectedEl.dataset.value = theme;
    selectedEl.textContent = formatSelectValues(theme);
  }
  if (theme) internalThemeValue = theme;
}

function saveThemeToStorage(theme) {
  browser.storage.local.set({ theme });
}

function livePreviewOnHover() {
  optionsEl.querySelectorAll('.option').forEach((opt) => {
    const theme = opt.dataset.value;

    opt.addEventListener('mouseenter', () => {
      document.body.className = 'theme-' + theme;
      loadCursors(theme);
    });

    opt.addEventListener('mouseleave', () => {
      document.body.className = 'theme-' + internalThemeValue;
      loadCursors(internalThemeValue);
    });
  });
}

export function cycleTheme() {
  const themes = ['green', 'amber', 'blue'];
  const current = selectedEl?.dataset.value || 'green';
  const next = themes[(themes.indexOf(current) + 1) % themes.length];
  setThemeClass(next);
  saveThemeToStorage(next);
  loadCursors(next);
}

export function initTheme() {
  themeSelect = document.getElementById('themeSelect');

  // Get parts of the custom select
  selectedEl = themeSelect.querySelector('.selected');
  optionsEl = themeSelect.querySelector('.options');

  // Load from storage
  browser.storage.local.get('theme').then(({ theme }) => {
    const selected = theme || 'green';
    setThemeClass(selected);
    loadCursors(selected);
  });

  // Toggle visibility on click
  selectedEl.addEventListener('click', () => {
    optionsEl.classList.toggle('hidden');
  });

  // Handle selection
  optionsEl.querySelectorAll('.option').forEach((opt) => {
    opt.addEventListener('click', (e) => {
      if (!themeSelect.contains(e.target)) {
        optionsEl.classList.add('hidden');
        document.body.className = 'theme-' + internalThemeValue;
        loadCursors(internalThemeValue);
      }
      const theme = opt.dataset.value;
      setThemeClass(theme);
      saveThemeToStorage(theme);
      loadCursors(theme);
      optionsEl.classList.add('hidden');
    });
  });

  // Blur to close dropdown
  themeSelect.addEventListener('blur', () => {
    optionsEl.classList.add('hidden');
  });

  // Live preview on hover
  livePreviewOnHover();

  // Allow `themeSelect.value` externally
  Object.defineProperty(themeSelect, 'value', {
    get() {
      return internalThemeValue;
    },
    set(value) {
      internalThemeValue = value;
      setThemeClass(value); // updates UI
      saveThemeToStorage(value);
      loadCursors(value);
    }
  });

document.addEventListener("DOMContentLoaded", loadCursorsBootAnimation);
}

function loadCursorsBootAnimation() {
 
    loadCursors(themeSelect.value, true);

    const startupEl = document.getElementById('crtStartup');
    if (startupEl) {
      setTimeout(() => {
        startupEl.remove(); // Clean up after animation
      }, 500); // Match duration of animation
    }
}
function formatSelectValues(str) {
  switch (str) {
    case 'green': return 'CRT Green';
    case 'amber': return 'Amber';
    case 'blue': return 'Blue';
    default: return str.charAt(0).toUpperCase() + str.slice(1);
  }
}

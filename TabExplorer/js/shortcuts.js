import { prependHttps, cleanURL, loadFavicon, handleTextInput } from './utils.js';
import { loadCursors } from './cursors.js';

let isEditMode = false;

function createDeleteButton(shortcuts, index) {
  const delBtn = document.createElement('button');
  delBtn.textContent = 'X';
  delBtn.className = 'deleteBtn';
  delBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    shortcuts.splice(index, 1);
    browser.storage.local.set({ quickShortcuts: shortcuts }).then(loadQuickShortcuts);
  });
  return delBtn;
}

function createInlineEdit(btn, s, shortcuts) {
  btn.innerHTML = '';
  btn.classList.add('inline-edit');
  btn.draggable = false;
  const labelInput = document.createElement('input');
  labelInput.className = 'edit-label';
  labelInput.value = s.label;
  const urlInput = document.createElement('input');
  urlInput.className = 'edit-url';
  const urlStored = new URL(s.url);
  urlInput.value = cleanURL(urlStored);
  urlInput.addEventListener('click', (e) => handleTextInput(urlInput, e));
  labelInput.addEventListener('click', (e) => handleTextInput(labelInput, e));
  const saveBtn = document.createElement('button');
  saveBtn.textContent = 'Save';
  saveBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    s.label = labelInput.value.trim();
    s.url = urlInput.value.trim() ? prependHttps(urlInput.value.trim()) : urlInput.value.trim();
    updateShortcut(s, shortcuts);
  });
  btn.appendChild(labelInput);
  btn.appendChild(urlInput);
  btn.appendChild(saveBtn);
  loadCursors(document.getElementById('themeSelect').value);
}

function createShortcutButton(s, index, shortcuts) {
  const btn = document.createElement('div');
  btn.className = 'shortcut';
  if (isEditMode) btn.classList.add('edit-mode');
  btn.draggable = true;
  const link = document.createElement('a');
  link.href = s.url;
  const icon = document.createElement('img');
  icon.src = s.favIconUrl;
  icon.alt = '';
  link.prepend(icon);
  const labelSpan = document.createElement('span');
  labelSpan.textContent = s.label;
  link.appendChild(labelSpan);
  btn.appendChild(link);
  btn.appendChild(createDeleteButton(shortcuts, index));
  btn.addEventListener('click', (e) => {
    if (btn.classList.contains('edit-mode')) e.preventDefault();
  });
  btn.addEventListener('dblclick', (e) => {
    if (!btn.classList.contains('edit-mode') || btn.classList.contains('inline-edit')) return;
    if (Array.from(btn.parentNode.childNodes).some(e => e.classList.contains('inline-edit'))) return;
    e.stopPropagation();
    createInlineEdit(btn, s, shortcuts);
  });
  return btn;
}

function loadQuickShortcuts() {
  browser.storage.local.get('quickShortcuts').then(({ quickShortcuts }) => {
    const shortcuts = quickShortcuts || [];
    const panel = document.getElementById('shortcutPanel');
    panel.innerHTML = '';
    shortcuts.forEach((s, index) => {
      panel.appendChild(createShortcutButton(s, index, shortcuts));
    });
    loadCursors(document.getElementById('themeSelect').value);
    initShortcutDragHandlers();
    addShortcutAutoSuggestion(document.getElementById('shortcutInputsSuggested'));
  });
}

function addShortcutFromInputs(label, url) {
  if (!label || !url) {
    alert('Please insert both a label and a URL.');
    return;
  }
  let favIconUrl = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(url)}`;
  const loadingFavIcon = loadFavicon(url);
  browser.storage.local.get('quickShortcuts').then(({ quickShortcuts }) => {
    const shortcuts = quickShortcuts || [];
    loadingFavIcon.then((img) => {
      if (img.naturalHeight == 16) {
        favIconUrl = '/favicongif.gif';
      }
      shortcuts.push({ label, url, favIconUrl });
      browser.storage.local.set({ quickShortcuts: shortcuts }).then(() => {
        document.getElementById('shortcutLabel').value = '';
        document.getElementById('shortcutUrl').value = '';
        document.getElementById('shortcutLabelSuggested').value = '';
        document.getElementById('shortcutUrlSuggested').value = '';
        loadQuickShortcuts();
      });
    });
  });
}

function updateShortcut(shortcut, shortcuts) {
  if (!shortcut.label || !shortcut.url) return alert('Please insert both a label and a URL.');
  const loadingFavIcon = loadFavicon(shortcut.url);
  shortcut.favIconUrl = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(shortcut.url)}`;
  loadingFavIcon.then((img) => {
    if (img.naturalHeight == 16) {
      shortcut.favIconUrl = '/favicongif.gif';
    }
    browser.storage.local.set({ quickShortcuts: shortcuts }).then(loadQuickShortcuts);
  });
}

function addShortcutAutoSuggestion(inputs, isSaving = false) {
  browser.storage.local.get('quickShortcuts').then(({ quickShortcuts }) => {
    browser.topSites.get().then(data => {
      const suggested = getAutoSuggestion(quickShortcuts, data, inputs, isSaving);
      if (suggested) {
        const innerInputURL = document.getElementById('shortcutUrlSuggested');
        const innerInputLabel = document.getElementById('shortcutLabelSuggested');
        innerInputURL.value = cleanURL(suggested.url);
        innerInputURL.addEventListener('click', (e) => handleTextInput(innerInputURL, e));
        const secondSpaceIndex = (suggested.title.indexOf(' ', suggested.title.indexOf(' ') + 1));
        const truncatedOnSecondSpace = secondSpaceIndex == -1 ? suggested.title : suggested.title.substring(0, secondSpaceIndex);
        innerInputLabel.value = truncatedOnSecondSpace;
        innerInputLabel.addEventListener('click', (e) => handleTextInput(innerInputLabel, e));
      }
    });
  });
}

function getAutoSuggestion(shortcuts, data, inputs) {
  let quickShortcuts = shortcuts?.map(s => s.url) || [];
  const dataArr = data.map(d => d.url);
  let uniqueNewSuggestions = dataArr.filter(d => !quickShortcuts.includes(d));
  let rand = Math.floor(Math.random() * uniqueNewSuggestions.length);
  if (dataArr.every(d => quickShortcuts.includes(d))) {
    inputs.style.display = 'none';
    return;
  }
  inputs.style.display = isEditMode ? 'flex' : 'none';
  const uniqueSuggestion = uniqueNewSuggestions[rand];
  return data.find(d => d.url == uniqueSuggestion);
}

function initShortcutDragHandlers() {
  let dragIndex = null;
  let isDragging = false;
  let ghostEl = null;
  let dragStartX = 0;
  let dragStartY = 0;
  let activeBtn = null;
  const DRAG_THRESHOLD = 3;
  const buttons = document.querySelectorAll('.shortcut');
  buttons.forEach((btn, index) => {
    btn.setAttribute('draggable', 'false');
    btn.addEventListener('mousedown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON') return;
      e.preventDefault();
      dragStartX = e.pageX;
      dragStartY = e.pageY;
      dragIndex = index;
      activeBtn = btn;
      isDragging = false;
      const onMouseMove = (e) => {
        const dx = Math.abs(e.pageX - dragStartX);
        const dy = Math.abs(e.pageY - dragStartY);
        if (!isDragging && (dx > DRAG_THRESHOLD || dy > DRAG_THRESHOLD)) {
          isDragging = true;
          if (activeBtn) activeBtn.classList.add('dragging');
          ghostEl = activeBtn.cloneNode(true);
          ghostEl.style.position = 'absolute';
          ghostEl.style.pointerEvents = 'none';
          ghostEl.style.opacity = '0.7';
          ghostEl.style.zIndex = '1000';
          document.body.appendChild(ghostEl);
        }
        if (isDragging && ghostEl) {
          ghostEl.style.left = `${e.pageX + 10}px`;
          ghostEl.style.top = `${e.pageY + 10}px`;
          buttons.forEach((btn) => {
            const rect = btn.getBoundingClientRect();
            const inside =
              e.clientX >= rect.left &&
              e.clientX <= rect.right &&
              e.clientY >= rect.top &&
              e.clientY <= rect.bottom;
            btn.style.border = inside ? '2px dashed var(--theme-color)' : '';
          });
        }
      };
      const onMouseUp = (e) => {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        if (isDragging) {
          e.preventDefault();
          if (activeBtn) activeBtn.classList.remove('dragging');
          ghostEl?.remove();
          ghostEl = null;
          buttons.forEach((btn) => (btn.style.border = ''));
          const dropTarget = document.elementFromPoint(e.clientX, e.clientY);
          const dropBtn = dropTarget?.closest('.shortcut');
          if (!dropBtn) return;
          const toIndex = [...buttons].indexOf(dropBtn);
          if (dragIndex === toIndex || toIndex === -1) return;
          browser.storage.local.get('quickShortcuts').then(({ quickShortcuts }) => {
            const shortcuts = quickShortcuts || [];
            const moved = shortcuts.splice(dragIndex, 1)[0];
            shortcuts.splice(toIndex, 0, moved);
            browser.storage.local.set({ quickShortcuts: shortcuts }).then(loadQuickShortcuts);
          });
        }
        isDragging = false;
        activeBtn = null;
      };
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    });
    btn.addEventListener('click', (e) => {
      if (isDragging) e.preventDefault();
    });
  });
}

export function initShortcuts() {
  document.getElementById('addQuickShortcut').addEventListener('click', () => {
    const label = document.getElementById('shortcutLabel').value.trim();
    const urlTrim = document.getElementById('shortcutUrl').value.trim();
    const url = urlTrim ? prependHttps(urlTrim) : urlTrim;
    addShortcutFromInputs(label, url);
  });
  document.getElementById('addQuickShortcutSuggested').addEventListener('click', () => {
    const label = document.getElementById('shortcutLabelSuggested').value.trim();
    const urlTrim = document.getElementById('shortcutUrlSuggested').value.trim();
    const url = urlTrim ? prependHttps(urlTrim) : urlTrim;
    addShortcutFromInputs(label, url);
  });
  document.getElementById('editShortcutsBtn').addEventListener('click', () => {
    isEditMode = !isEditMode;
    const panel = document.getElementById('shortcutPanel');
    const shortcuts = panel.querySelectorAll('.shortcut');
    shortcuts.forEach(s => {
      if (isEditMode) {
        s.classList.add('edit-mode');
      } else {
        s.classList.remove('edit-mode');
      }
    });
    document.getElementById('editShortcutsBtn').textContent = isEditMode ? '[DONE]' : '[EDIT]';
    let permanentInputs = document.getElementById('shortcutInputs');
    permanentInputs.style.display = isEditMode ? 'flex' : 'none';
    let autoSuggestInputs = document.getElementById('shortcutInputsSuggested');
    autoSuggestInputs.style.display = isEditMode ? 'flex' : 'none';
    addShortcutAutoSuggestion(autoSuggestInputs);
  });
  loadQuickShortcuts();
} 
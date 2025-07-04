const themeSelect = document.getElementById('themeSelect');

// Load theme from storage
browser.storage.local.get('theme').then(({ theme }) => {
  const selected = theme || 'green';
  document.body.className = 'theme-' + selected;
  themeSelect.value = selected;
});

// Theme change handler
themeSelect.addEventListener('change', () => {
  const theme = themeSelect.value;
  document.body.className = 'theme-' + theme;
  browser.storage.local.set({ theme });
});

//Escape HTML
function escapeHTML(str) {
  return str.replace(/[&<>"'`=\/]/g, (s) => {
    return ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
      '`': '&#x60;',
      '=': '&#x3D;',
      '/': '&#x2F;',
    })[s];
  });
}


function groupTabsByDomain(tabs) {
  const groups = {};
  for (const tab of tabs) {
    try {
      const url = new URL(tab.url);
      const domain = url.hostname;
      if (!groups[domain]) {
        groups[domain] = [];
      }
      groups[domain].push(tab);
    } catch (e) {
      console.warn("Invalid URL:", tab.url);
    }
  }
  return groups;
}

function createTabElement(tab) {
  const el = document.createElement('div');
  el.className = 'tab';
  el.draggable = true;
  el.dataset.title = (tab.title || '').toLowerCase();
  el.dataset.url = tab.url;
  el.dataset.favIconUrl = tab.favIconUrl;

  // Click to activate
  el.addEventListener('click', (e) => {
    // Avoid triggering when clicking the button
    if (e.target.classList.contains('close-btn') || e.target.classList.contains('pin-btn')) {
      return;
    }
    browser.tabs.update(tab.id, { active: true });
  });

  const icon = document.createElement('img');
  icon.className = 'favicon';
  icon.src = tab.favIconUrl || 'https://www.mozilla.org/media/protocol/img/logos/firefox/browser/logo-md.3f5f8412e4b0.png';
  icon.alt = '';

  const title = document.createElement('span');
  title.textContent = tab.title.toLowerCase() || tab.url;
  title.style.flex = '1';

  const pinBtn = document.createElement('button');
  pinBtn.textContent = tab.pinned ? '[UNPIN]' : '[PIN]';
  pinBtn.className = 'pin-btn';
  pinBtn.style.marginLeft = '0.5em';
  pinBtn.style.background = 'transparent';
  pinBtn.style.border = 'none';
  pinBtn.style.color = 'inherit';
  pinBtn.style.font = 'inherit';
  pinBtn.style.cursor = 'pointer';
  pinBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    browser.tabs.update(tab.id, { pinned: !tab.pinned });
    // Refresh the UI after pin change
    refreshTabs();
  });

  const closeBtn = document.createElement('button');
  closeBtn.textContent = '[X]';
  closeBtn.className = 'close-btn';
  closeBtn.style.marginLeft = '0.5em';
  closeBtn.style.background = 'transparent';
  closeBtn.style.border = 'none';
  closeBtn.style.color = '#f00';
  closeBtn.style.font = 'inherit';
  closeBtn.style.cursor = 'pointer';
  closeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    browser.tabs.remove(tab.id);
    el.remove(); // Remove element instantly
  });

  el.appendChild(icon);
  el.appendChild(title);
  el.appendChild(pinBtn);
  el.appendChild(closeBtn);
  return el;
}

function renderTabs(groups, open) { //open is the parameter that decides if the parent folders details will be open or closed on render
  const container = document.getElementById('tabs');
  container.innerHTML = '';

  for (const domain in groups) {
    const details = document.createElement('details');
    details.open = open;

    const summary = document.createElement('summary');
    summary.textContent = `${domain} (${groups[domain].length} tab${groups[domain].length !== 1 ? 's' : ''})`;

    const icon = document.createElement('img');
    icon.className = 'favicon';
    icon.src = groups[domain][0].favIconUrl || 'https://www.mozilla.org/media/protocol/img/logos/firefox/browser/logo-md.3f5f8412e4b0.png';
    icon.alt = '';
    summary.prepend(icon);

    details.appendChild(summary);

    const tabList = document.createElement('div');
    tabList.className = 'tab-list';

    for (const tab of groups[domain]) {
      const tabEl = createTabElement(tab);
      tabList.appendChild(tabEl);
    }

    details.appendChild(tabList);
    container.appendChild(details);

  }
}

function refreshTabs() {
  browser.tabs.query({}).then((tabs) => {
    allTabs = tabs;
    const grouped = groupTabsByDomain(tabs);
    renderTabs(grouped, true); // Renders tabs without closing the details
  });
}

// CLOCK
function updateClock() {
  const clock = document.getElementById('clock');
  const now = new Date();
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  const s = String(now.getSeconds()).padStart(2, '0');
  clock.textContent = `${h}:${m}:${s}`;
}
setInterval(updateClock, 1000);
updateClock();

// LOAD & RENDER
let allTabs = [];

browser.tabs.query({})
  .then((tabs) => {
    allTabs = tabs;
    const grouped = groupTabsByDomain(tabs);
    renderTabs(grouped, false); // Renders tabs with details closed
  });

// Load and display Quick Access shortcuts
let isEditMode = false;
function loadQuickShortcuts() {
  browser.storage.local.get('quickShortcuts').then(({ quickShortcuts }) => {
    const shortcuts = quickShortcuts || [];
    const panel = document.getElementById('shortcutPanel');
    panel.innerHTML = '';

    shortcuts.forEach((s, index) => {
      const btn = document.createElement('div');
      btn.className = 'shortcut';
      if (isEditMode) {
        btn.classList.add('edit-mode');
      }
      btn.draggable = true;

      const icon = document.createElement('img');
      icon.src = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(s.url)}`;
      icon.alt = '';
      btn.prepend(icon);

      // Label span
      const labelSpan = document.createElement('span');
      labelSpan.textContent = s.label;
      btn.appendChild(labelSpan);

      // Delete button
      const delBtn = document.createElement('button');
      delBtn.textContent = 'X';
      delBtn.className = 'deleteBtn';
      delBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        shortcuts.splice(index, 1);
        browser.storage.local.set({ quickShortcuts: shortcuts }).then(loadQuickShortcuts);
      });
      btn.appendChild(delBtn);

      // Open on click
      btn.addEventListener('click', () => {
        if (!btn.classList.contains('edit-mode')) {
          window.open(s.url, '_blank');
        }
      });

      // Inline edit on double click (edit mode only)
      btn.addEventListener('dblclick', (e) => {
        if (!btn.classList.contains('edit-mode')) return;

        e.stopPropagation();
        btn.innerHTML = '';

        const labelInput = document.createElement('input');
        labelInput.className = 'edit-label';
        labelInput.value = s.label;

        const urlInput = document.createElement('input');
        urlInput.className = 'edit-url';
        urlInput.value = s.url;

        const saveBtn = document.createElement('button');
        saveBtn.textContent = 'Save';
        saveBtn.addEventListener('click', () => {
          s.label = labelInput.value.trim();
          s.url = urlInput.value.trim();
          browser.storage.local.set({ quickShortcuts: shortcuts }).then(loadQuickShortcuts);
        });

        btn.appendChild(labelInput);
        btn.appendChild(urlInput);
        btn.appendChild(saveBtn);
      });

      // Drag/drop handlers
      btn.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', index);
        btn.classList.add('dragging');
      });
      btn.addEventListener('dragend', () => {
        btn.classList.remove('dragging');
      });

      btn.addEventListener('dragover', (e) => {
        e.preventDefault();
        btn.style.border = '2px dashed #0f0';
      });
      btn.addEventListener('dragleave', () => {
        btn.style.border = '';
      });
      btn.addEventListener('drop', (e) => {
        e.preventDefault();
        btn.style.border = '';

        const fromIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
        const toIndex = index;

        if (fromIndex === toIndex) return;

        const moved = shortcuts.splice(fromIndex, 1)[0];
        shortcuts.splice(toIndex, 0, moved);
        browser.storage.local.set({ quickShortcuts: shortcuts }).then(loadQuickShortcuts);
      });

      panel.appendChild(btn);
    });
  });
}

// Add shortcut
document.getElementById('addQuickShortcut').addEventListener('click', () => {
  const label = document.getElementById('shortcutLabel').value.trim();
  const url = document.getElementById('shortcutUrl').value.trim();

  if (!label || !url) {
    alert('Please enter both label and URL.');
    return;
  }

  browser.storage.local.get('quickShortcuts').then(({ quickShortcuts }) => {
    const shortcuts = quickShortcuts || [];
    shortcuts.push({ label, url });
    browser.storage.local.set({ quickShortcuts: shortcuts }).then(() => {
      document.getElementById('shortcutLabel').value = '';
      document.getElementById('shortcutUrl').value = '';
      loadQuickShortcuts();
    });
  });
});

// Toggle Edit mode
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

  const inputs = document.getElementById('shortcutInputs');
  inputs.style.display = isEditMode ? 'flex' : 'none';
});

// Load on startup
loadQuickShortcuts();
// SEARCH
document.getElementById('search').addEventListener('input', (e) => {
  const query = e.target.value.trim().toLowerCase();
  const allGroups = document.querySelectorAll('#tabs > details');

  // HIDE QUICK SHORTCUTS ON SEARCH
  const quickPanel = document.getElementById('quickAccess');
  quickPanel.style.display = query ? 'none' : 'block';

  allGroups.forEach(details => {
    const tabList = details.querySelector('.tab-list');
    const tabs = Array.from(tabList.querySelectorAll('.tab'));

    if (!query) {
      tabs.forEach(tab => {
        tab.style.display = '';
        const titleEl = tab.querySelector('span');
        const original = titleEl.dataset.original;
        if (original) {
          titleEl.textContent = original;
          delete titleEl.dataset.original;
        }
      });
      details.style.display = '';
      details.open = false;
      return;
    }

    const matchingTabs = tabs.filter(tab => {
      const title = tab.dataset.title || '';
      const url = tab.dataset.url || '';
      return title.includes(query) || url.includes(query);
    });

    tabs.forEach(tab => {
      tab.style.display = 'none';
    });

    matchingTabs.sort((a, b) => {
      const titleA = a.dataset.title;
      const titleB = b.dataset.title;
      return titleA.localeCompare(titleB);
    });

    const safeQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // Escape for RegExp
    const regex = new RegExp(`(${safeQuery})`, 'gi');

    matchingTabs.forEach(tab => {
      tab.style.display = '';
      tabList.appendChild(tab);

      const titleEl = tab.querySelector('span');
      const rawTitle = titleEl.dataset.original || titleEl.textContent;

      // Store original if not already stored
      if (!titleEl.dataset.original) {
        titleEl.dataset.original = rawTitle;
      }

      // Escape HTML before highlighting
      const escapedTitle = escapeHTML(rawTitle);
      const highlighted = escapedTitle.replace(regex, '<span class="highlight">$1</span>');

      titleEl.innerHTML = highlighted;
    });

    if (matchingTabs.length === 0) {
      details.style.display = 'none';
    } else {
      details.style.display = '';
      details.open = true;
    }
  });
});

document.getElementById('collapseAll').addEventListener('click', () => {
  document.querySelectorAll('#tabs > details').forEach(el => el.open = false);
});

document.getElementById('expandAll').addEventListener('click', () => {
  document.querySelectorAll('#tabs > details').forEach(el => el.open = true);
});

// Save groups to storage
document.getElementById('save').addEventListener('click', () => {
  const groups = {};
  const detailsEls = document.querySelectorAll('#tabs > details');
  detailsEls.forEach((details) => {
    const domain = details.querySelector('summary').textContent;
    domain.favIconUrl = details.querySelector('summary');
    const tabs = [];
    details.querySelectorAll('.tab').forEach((tabEl) => {
      tabs.push({
        url: tabEl.dataset.url,
        title: tabEl.dataset.title,
        favIconUrl: tabEl.dataset.favIconUrl
      });
    });
    groups[domain] = tabs;
  });

  browser.storage.local.set({ savedGroups: groups }).then(() => {
    alert('Groups saved!');
  });
});

// Load groups from storage
document.getElementById('load').addEventListener('click', () => {
  browser.storage.local.get('savedGroups').then((data) => {
    if (data.savedGroups) {
      renderSavedGroups(data.savedGroups);
    } else {
      alert('No saved groups found.');
    }
  });
});

// Render saved groups (URLs only, since IDs are stale)
function renderSavedGroups(savedGroups) {
  const container = document.getElementById('tabs');
  container.innerHTML = '';

  for (const domain in savedGroups) {
    const details = document.createElement('details');
    details.open = true;

    const summary = document.createElement('summary');
    summary.textContent = domain;

    const icon = document.createElement('img');
    icon.className = 'favicon';
    icon.src = savedGroups[domain][0].favIconUrl || 'https://www.mozilla.org/media/protocol/img/logos/firefox/browser/logo-md.3f5f8412e4b0.png';
    icon.alt = '';
    summary.prepend(icon);


    details.appendChild(summary);

    const tabList = document.createElement('div');
    tabList.className = 'tab-list';

    for (const saved of savedGroups[domain]) {
      const el = document.createElement('div');
      el.className = 'tab';
      el.dataset.title = saved.title;
      el.dataset.url = saved.url;

      const icon = document.createElement('img');
      icon.className = 'favicon';
      icon.src = savedGroups[domain][0].favIconUrl || 'https://www.mozilla.org/media/protocol/img/logos/firefox/browser/logo-md.3f5f8412e4b0.png';
      icon.alt = '';

      const title = document.createElement('span');
      title.textContent = saved.title || saved.url;
      title.style.flex = '1';

      const openBtn = document.createElement('button');
      openBtn.textContent = '[OPEN]';
      openBtn.style.marginLeft = '0.5em';
      openBtn.style.background = 'transparent';
      openBtn.style.border = 'none';
      openBtn.style.color = '#0f0';
      openBtn.style.font = 'inherit';
      openBtn.style.cursor = 'pointer';
      openBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        browser.tabs.create({ url: saved.url });
      });

      el.appendChild(icon);
      el.appendChild(title);
      el.appendChild(openBtn);

      tabList.appendChild(el);
    }

    details.appendChild(tabList);
    container.appendChild(details);
  }
}

document.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

  if (e.key === '[') {
    document.querySelectorAll('#tabs > details').forEach(el => el.open = false);

  } else if (e.key === ']') {
    document.querySelectorAll('#tabs > details').forEach(el => el.open = true);

  } else if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
    e.preventDefault();
    document.getElementById('search').focus();

  } else if (e.key === 't' || e.key === 'T') {
    cycleTheme();
  } else if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 's') {
    document.getElementById('save').click();
  } else if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'l') {
    document.getElementById('load').click();
  }
});

// Cycle through themes
function cycleTheme() {
  const themes = ['green', 'amber', 'blue'];
  let current = themeSelect.value;
  let next = themes[(themes.indexOf(current) + 1) % themes.length];
  themeSelect.value = next;
  document.body.className = 'theme-' + next;
  browser.storage.local.set({ theme: next });
}

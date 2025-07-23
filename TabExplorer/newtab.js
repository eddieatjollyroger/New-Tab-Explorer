const themeSelect = document.getElementById('themeSelect');

// Load theme from storage
browser.storage.local.get('theme').then(({ theme }) => {
  const selected = theme || 'green';
  document.body.className = 'theme-' + selected;
  themeSelect.value = selected;
  loadCursors(selected);
});

// Theme change handler
themeSelect.addEventListener('change', () => {
  const theme = themeSelect.value;
  document.body.className = 'theme-' + theme;
  browser.storage.local.set({ theme });
  loadCursors(theme);
});

// Cycle through themes
function cycleTheme() {
  const themes = ['green', 'amber', 'blue'];
  let current = themeSelect.value;
  let next = themes[(themes.indexOf(current) + 1) % themes.length];
  themeSelect.value = next;
  document.body.className = 'theme-' + next;
  browser.storage.local.set({ theme: next });
  loadCursors(next);
}


browser.tabs.onUpdated.addListener(function (tabID, changeinfo, tab) {
  if (tab.url.startsWith("moz-extension://")
    && tab.url.endsWith('/newtab.html') && tab.selected) return; // Dont update needlessly on own load
  if (changeinfo.status == 'complete') refreshTabs();
});

browser.tabs.onRemoved.addListener(function (tabId) {
  allTabs = allTabs.filter(tab => tab.id !== tabId);
  const grouped = groupTabsByDomain(allTabs);
  refreshTabs(grouped);
});



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
  icon.src = getFavIcon(tab);
  icon.alt = '';

  const title = document.createElement('span');
  title.textContent = tab.title.toLowerCase() || tab.url;
  title.style.flex = '1';

  const pinBtn = document.createElement('button');
  pinBtn.textContent = tab.pinned ? '[UNPIN]' : '[PIN]';
  pinBtn.className = 'pin-btn';


  pinBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    browser.tabs.update(tab.id, { pinned: !tab.pinned });
    // Refresh the UI after pin change
    refreshTabs();
  });

  const closeBtn = document.createElement('button');
  closeBtn.textContent = '[X]';
  closeBtn.className = 'close-btn';

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

function renderTabs(groups, isFirstRender) {
  const detailsEls = document.querySelectorAll('#tabs > details');
  const container = document.getElementById('tabs');
  container.innerHTML = '';
  for (const domain in groups) {

    const details = document.createElement('details');
    details.className = domain;

    if (!isFirstRender) {
      const detail = Array.from(detailsEls).find(node => node.className == domain);
      details.open = detail ? detail.open : "";
    }
    else {
      details.open = false;
    }
    const summary = document.createElement('summary');
    summary.textContent = `${domain} (${groups[domain].length} tab${groups[domain].length !== 1 ? 's' : ''})`;

    const icon = document.createElement('img');
    icon.className = 'favicon';
    icon.src = getFavIcon(groups[domain][0]);
    icon.alt = '';
    summary.prepend(icon);

    const marker = document.createElement('span');
    marker.className = 'marker';
    summary.append(marker);


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
  loadCursors(themeSelect.value);
}

function refreshTabs(tabs) {
  if (tabs) return renderTabs(tabs, isFirstRender = false);
  browser.tabs.query({}).then((tabs) => {
    allTabs = groupByFirstDomainSeen(tabs, 'url');
    const grouped = groupTabsByDomain(tabs);
    renderTabs(grouped, isFirstRender = false); // Renders tabs without closing the details
  });
}

function groupTabsByDomain(tabs) {
  const groups = {};
  for (const tab of tabs) {
    try {
      if (!tab.url) {
        tab.url = fixPendingURL(tab.pendingUrl);
      }
      const url = new URL(tab.url);
      const domain = url.hostname.startsWith('www.') ?
        url.hostname.split('www.')[1] : url.hostname;
      if (!groups[domain]) {
        groups[domain] = [];
      }
      groups[domain].push(tab);
    } catch (e) {
      console.warn("Invalid URL:", tab);
    }
  }
  return groups;
}

function groupByFirstDomainSeen(arr, key) {
  const grouped = new Map();
  const justTabs = [];
  for (const tab of arr) {
    const host = new URL(tab[key]).hostname; //group by hostname instead of just url
    if (!grouped.has(host)) {
      grouped.set(host, []);
    }
    grouped.get(host).push(tab);
  }
  grouped.forEach((key) => key.forEach(value => justTabs.push(value)));
  return justTabs;
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
    allTabs = groupByFirstDomainSeen(tabs, 'url');
    const grouped = groupTabsByDomain(allTabs);
    renderTabs(grouped, isFirstRender = true); // First time rendering tabs
  });

// Load and display Quick Access shortcuts
let isEditMode = false;
function loadQuickShortcuts() {
  browser.storage.local.get('quickShortcuts').then(({ quickShortcuts }) => {
    const shortcuts = quickShortcuts || [];
    console.log(shortcuts)
    const panel = document.getElementById('shortcutPanel');
    panel.innerHTML = '';

    shortcuts.forEach((s, index) => {
      const btn = document.createElement('div');
      btn.className = 'shortcut';
      if (isEditMode) {
        btn.classList.add('edit-mode');
      }
      btn.draggable = true;

      const link = document.createElement('a');
      link.href = s.url;

      const icon = document.createElement('img');
      icon.src = s.favIconUrl;
      icon.alt = '';
      link.prepend(icon);

      // Label span
      const labelSpan = document.createElement('span');
      labelSpan.textContent = s.label;
      link.appendChild(labelSpan);

      btn.appendChild(link);

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

      // Prevent opening on click when in edit mode
      btn.addEventListener('click', (e) => {
        if (btn.classList.contains('edit-mode')) {
          e.preventDefault();
        }
      });

      // Inline edit on double click (edit mode only)
      btn.addEventListener('dblclick', (e) => {

        if (!btn.classList.contains('edit-mode') || (btn.classList.contains('inline-edit'))) return;
        if (Array.from(panel.childNodes).some(e => e.classList.contains('inline-edit'))) return;

        e.stopPropagation();
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

        //Scrolls input to the end of line on mouse click               
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

        loadCursors(themeSelect.value); //RELOAD CURSORS FOR INLINE MENU
      });
      panel.appendChild(btn);
    });
    loadCursors(themeSelect.value);
    initShortcutDragHandlers();
    addShortcutAutoSuggestion(document.getElementById('shortcutInputsSuggested')); //On save and delete update the autosuggestion
  });
}

// Add shortcut
document.getElementById('addQuickShortcut').addEventListener('click', () => {
  const label = document.getElementById('shortcutLabel').value.trim();
  const urlTrim = document.getElementById('shortcutUrl').value.trim();
  const url = urlTrim ? prependHttps(urlTrim) : urlTrim;

  addShortcutFromInputs(label, url);
});

//Add shortcut suggested
document.getElementById('addQuickShortcutSuggested').addEventListener('click', () => {
  const label = document.getElementById('shortcutLabelSuggested').value.trim();
  const urlTrim = document.getElementById('shortcutUrlSuggested').value.trim();
  const url = urlTrim ? prependHttps(urlTrim) : urlTrim;

  addShortcutFromInputs(label, url);
})

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
      if (img.naturalHeight == 16) { // check if its the default google globe
        favIconUrl = '/favicongif.gif'
      }

      shortcuts.push({ label, url, favIconUrl });
      browser.storage.local.set({ quickShortcuts: shortcuts }).then(() => {
        document.getElementById('shortcutLabel').value = '';
        document.getElementById('shortcutUrl').value = '';
        loadQuickShortcuts();
      });
    });
  })
}

function updateShortcut(shortcut, shortcuts) {
  if (!shortcut.label || !shortcut.url) return alert('Please insert both a label and a URL.')
  const loadingFavIcon = loadFavicon(shortcut.url);
  shortcut.favIconUrl = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(shortcut.url)}`;

  loadingFavIcon.then((img) => {
    if (img.naturalHeight == 16) { // check if its the default google globe
      shortcut.favIconUrl = '/favicongif.gif'
      browser.storage.local.set({ quickShortcuts: shortcuts }).then(loadQuickShortcuts);
    }
  });
}

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

  let permanentInputs = document.getElementById('shortcutInputs');
  permanentInputs.style.display = isEditMode ? 'flex' : 'none';
  let autoSuggestInputs = document.getElementById('shortcutInputsSuggested')

  addShortcutAutoSuggestion(autoSuggestInputs);
})

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
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON') return; //Avoid dragging behaviour on input field
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

          // Highlight buttons
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

          // Fetch current shortcuts again
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

function addShortcutAutoSuggestion(inputs, isSaving = false) {
  browser.storage.local.get('quickShortcuts').then(({ quickShortcuts }) => {
    browser.topSites.get().then(data => {
      const suggested = getAutoSuggestion(quickShortcuts, data, inputs, isSaving);

      if (suggested) {
        const innerInputURL = document.getElementById('shortcutUrlSuggested');
        const innerInputLabel = document.getElementById('shortcutLabelSuggested');

        innerInputURL.value = cleanURL(suggested.url)
        innerInputURL.addEventListener('click', (e) => handleTextInput(innerInputURL, e));

        const secondSpaceIndex = (suggested.title.indexOf(' ', suggested.title.indexOf(' ') + 1));
        const truncatedOnSecondSpace = secondSpaceIndex == -1 ? suggested.title : suggested.title.substring(0, secondSpaceIndex);

        innerInputLabel.value = truncatedOnSecondSpace;
        innerInputLabel.addEventListener('click', (e) => handleTextInput(innerInputLabel, e));
      }
    });
  });
}

function getAutoSuggestion(shortcuts, data, inputs, isSaving = false) {
  let quickShortcuts = shortcuts.map(s => s.url) || [];
  const dataArr = data.map(d => d.url);
  let uniqueNewSuggestions = dataArr.filter(d => !quickShortcuts.includes(d))
  let rand = Math.floor(Math.random() * uniqueNewSuggestions.length);

  console.log(quickShortcuts)
  console.log(dataArr.length)
  console.log(uniqueNewSuggestions.length)

  if (dataArr.every(d => quickShortcuts.includes(d))) {//Check if all suggestions are already added
    inputs.style.display = 'none';
    return;
  }
  inputs.style.display = isEditMode ? 'flex' : 'none';
  const uniqueSuggestion = uniqueNewSuggestions[rand];
  return data.find(d => d.url == uniqueSuggestion); //return unique suggestion
}


// SEARCH
document.getElementById('search-input').addEventListener('input', (e) => {
  const query = e.target.textContent.trim().toLowerCase();
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


document.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.id === 'search-input') return;

  if (e.key === '[') {
    document.querySelectorAll('#tabs > details').forEach(el => el.open = false);

  } else if (e.key === ']') {
    document.querySelectorAll('#tabs > details').forEach(el => el.open = true);

  } else if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
    e.preventDefault();
    document.getElementById('search-input').focus();

  } else if (e.key === 't' || e.key === 'T') {
    cycleTheme();
  } else if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 's') {
    document.getElementById('save').click();
  } else if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'l') {
    document.getElementById('load').click();
  }
});

//DEFAULT SEARCH ENGINE
document.getElementById('search-input').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const query = e.target.textContent.trim();
    if (query) {
      browser.search.query({
        text: query
      });
    }
  }
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
function prependHttps(url) {
  return url.startsWith("http://") || url.startsWith("https://") ?
    url : new URL("https://" + url).href;
}

function cleanURL(urlIn) {
  try {
    const url = new URL(urlIn);

    if (url.search) {
      return url.hostname + url.pathname + url.search;
    }
    return url.pathname.length > 1 ?
      url.hostname + url.pathname : url.hostname;
  } catch {
    return urlIn; //Invalid URL but still return it
  }
}

function fixPendingURL(url) {
  const formattedUrl = new URL(url);
  return formattedUrl;
}
function getFavIcon(tab) {
  if (tab.favIconUrl) {
    return tab.favIconUrl;
  }
  const url = new URL(tab.url);
  if (url?.protocol.startsWith('http')) {
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(url)}`;
  }
  return '/favicongif.gif';
}

function loadFavicon(url) {
  return new Promise((resolve, reject) => {
    const sizeQuery = '&sz=64';
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(url)}${sizeQuery}`;
  });
}

function handleTextInput(textInput, event) {
  var selection = event.view.getSelection().toString();
  if (event.detail == 1 && selection.length == 0 && textInput.value.length > 20) { // If 1 click only select and scroll to end of text and avoid triggering on text selection
    textInput.focus();
    textInput.scrollLeft = textInput.scrollWidth;
    textInput.setSelectionRange(textInput.value.length, textInput.value.length);
  }
  if (event.detail == 2) { // Default select all behaviour (for firefox only)
    textInput.setSelectionRange(0, textInput.value.length);
  }
}

const placeholders = [
  "PRESS / TO SEARCH YOUR TABS",
  "PRESS ENTER WHEN TYPING TO SEARCH THE WEB",
  "DOUBLE CLICK A SHORTCUT WHILE IN EDIT MODE TO CHANGE IT",
  "DRAG SHORTCUTS TO REORDER THEM",
  "PRESS T TO SWITCH THE COLOR THEME"
];

const input = document.getElementById("search-input");
let currentPlaceholder = "";
let index = 0;
let typingInterval;
let isTyping = false;

function getRandomPlaceholder() {
  let next;
  do {
    next = placeholders[Math.floor(Math.random() * placeholders.length)];
  } while (next === currentPlaceholder); // Avoid immediate repeat
  return next;
}

function typePlaceholder() {
  if (isTyping || input.textContent.trim() !== "" || document.activeElement === input) return;

  isTyping = true;
  input.classList.add("placeholder");

  const placeholder = getRandomPlaceholder();

  typingInterval = setInterval(() => {
    input.textContent += placeholder[index++];
    if (index >= placeholder.length) {
      clearInterval(typingInterval);
      isTyping = false;


      setTimeout(() => {
        if (
          document.activeElement !== input &&
          input.textContent.trim() === placeholder
        ) {
          input.textContent = "";
          index = 0;
          typePlaceholder();
        }
      }, 3000);
    }
  }, 100);
}

function stopTyping() {
  clearInterval(typingInterval);
  isTyping = false;
  input.classList.remove("placeholder");
  input.textContent = "";
  index = 0;
}

input.addEventListener("focus", stopTyping);
input.addEventListener("blur", () => {
  if (input.textContent.trim() === "") {
    typePlaceholder();
  }
});

// Load on startup
loadQuickShortcuts();
typePlaceholder(); // kickstart

//On load set cursors again because many els were not yet loaded
window.onload = function () {
  loadCursors(themeSelect.value, isOnLoad = true)
};

function loadCursors(currentColor, isOnLoad = false) {
  const rgbColors = { green: "rgb(0, 255, 0)", amber: "rgb(255, 191, 0)", blue: "rgb(0,191,255)" };
  const stringSVG = '<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"32\" height=\"32\"><path d=\"m30.621 28.246-.578-2.082-1.07.273-.563-2.015 1.34-.344 1.578-1.52-.293-1.054-.289-1.027-1.07.273-.285-1.027-1.07.277-.286-1.027-1.07.273-.29-1.027-1.07.273-.285-1.027-1.07.277-.285-1.027-1.07.273-.29-1.027-1.066.277-.289-1.027-1.07.273-.285-1.027-1.07.277-.29-1.027-1.066.273-.29-1.027-1.07.277-.285-1.027-1.101.281L13.145 14l4.878 17.5 1.102-.285 1.07-.274 1.582-1.52-.129-.456.868-.836.043-.008-.13-.457.204-.195.457 1.625 1.07-.274.57 2.055 1.07-.277.29 1.027 2.168-.559 1.582-1.515-.13-.457.872-.836Zm0 0\" style=\"stroke:none;fill-rule:nonzero;fill:#000;fill-opacity:1\"/><path d=\"m26.25 29.855-1.07.274-.575-2.055-1.07.278-.574-2.059-1.234 1.187.12.434-.906.871.13.457-1.204 1.153-1.394.359-4.625-16.57 1.203-1.157.324-.082.29 1.028 1.07-.278.285 1.028 1.07-.274.285 1.028 1.07-.278.29 1.031 1.07-.277.285 1.027 1.07-.273.285 1.027 1.07-.277.29 1.027 1.07-.273.285 1.027 1.07-.277.286 1.027 1.07-.273.289 1.027 1.07-.277.285 1.027 1.07-.273.325 1.16-1.203 1.152-1.79.461.891 3.188 1.07-.274.317 1.137-.902.867.125.457-1.2 1.156-1.398.36Zm0 0\" style=\"stroke:none;fill-rule:nonzero;fill:#fff;fill-opacity:1\"/><path d=\"m29.668 20.77-.29-1.028-1.07.274-.285-1.028-1.07.278-.285-1.028-1.07.274-.29-1.028-1.07.278-.285-1.028-1.07.274-.285-1.028-1.07.278-.29-1.028-1.07.274-.285-1.027-1.07.273-.286-1.027-1.07.277-.289-1.027-1.07.273-.285-1.027-1.07.277 4.874 17.465 1.07-.273 1.07-.278-.288-1.027 1.07-.274-.285-1.027 1.07-.277-.289-1.028 1.07-.273.575 2.055 1.07-.278.574 2.059 1.07-.277.286 1.027 2.14-.55-.289-1.028 1.07-.274-.57-2.054-1.07.273-.574-2.055-1.07.274-.286-1.028 4.278-1.097-.286-1.031-.285-1.028Zm0 0\" style=\"stroke:none;fill-rule:nonzero;fill:#fff;fill-opacity:1\"/><path d=\"m14.742 12.496 1.07-.277 4.872 17.468-1.067.274Zm0 0\" style=\"stroke:none;fill-rule:nonzero;fill:#000;fill-opacity:1\"/><path d=\"m16.098 13.246 1.07-.273.289 1.027-1.07.273Zm0 0\" style=\"stroke:none;fill-rule:nonzero;fill:#000;fill-opacity:1\"/><path d=\"m17.453 14 1.07-.277.29 1.027-1.07.277ZM18.813 14.75l1.07-.273.285 1.027-1.07.273ZM20.168 15.504l1.07-.277.285 1.027-1.066.277ZM21.523 16.258l1.07-.278.29 1.028-1.07.277ZM22.883 17.008l1.07-.274.285 1.028-1.07.273ZM24.238 17.762l1.07-.278.286 1.028-1.07.277ZM25.594 18.512l1.07-.274.29 1.028-1.071.273Zm0 0\" style=\"stroke:none;fill-rule:nonzero;fill:#000;fill-opacity:1\"/><path d=\"m26.953 19.266 1.07-.278.286 1.028-1.07.277ZM28.309 20.016l1.07-.274.289 1.028-1.07.273Zm0 0\" style=\"stroke:none;fill-rule:nonzero;fill:#000;fill-opacity:1\"/><path d=\"m29.664 20.77 1.07-.278.29 1.028-1.07.277Zm0 0\" style=\"stroke:none;fill-rule:nonzero;fill:#000;fill-opacity:1\"/><path d=\"m25.672 22.898 5.351-1.378.286 1.027-5.352 1.379Zm0 0\" style=\"stroke:none;fill-rule:nonzero;fill:#000;fill-opacity:1\"/><path d=\"m25.957 23.926 1.07-.278.29 1.028-1.07.277ZM22.75 24.75l1.07-.273.285 1.027-1.07.273ZM24.105 25.504l1.07-.277.575 2.054-1.07.278ZM25.75 27.281l1.066-.273.575 2.055-1.07.277Zm0 0\" style=\"stroke:none;fill-rule:nonzero;fill:#000;fill-opacity:1\"/><path d=\"m27.39 29.063 2.141-.551.29 1.027-2.141.55ZM27.316 24.676l1.07-.274.575 2.055-1.07.273ZM28.96 26.46l1.071-.276.574 2.054-1.07.278ZM21.969 26.055l1.066-.278.29 1.028-1.071.277ZM21.184 27.355l1.07-.273.285 1.027-1.07.274ZM20.398 28.66l1.07-.277.29 1.027-1.07.277Zm0 0\" style=\"stroke:none;fill-rule:nonzero;fill:#000;fill-opacity:1\"/><\/svg>';
  const stringLinkSVG = '<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"32\" height=\"32\"><path d=\"m30.926 24.898-.656-2.293.812-.761.04-.008-1.884-6.586-.996.25-.27-.938-1 .254-.265-.937-2 .5-.266-.938-3 .754-.265-.937-2 .504-1.07-3.75-1 .254-.266-.938-2.027.508-.731 1.187v.008l-1.477 1.38 1.872 6.55-2.25.562-1.477 1.387.277.961.536 1.875 1-.25.265.938 1-.254.535 1.875 1-.25.535 1.87 1-.25.536 1.876 1-.25.535 1.87.265.938 8.993-2.257 1.027-.258 1.476-1.383-.656-2.293.813-.762Zm0 0\" style=\"stroke:none;fill-rule:nonzero;fill:#000;fill-opacity:1\"/><path d=\"m18.848 28.371-.996.25-.54-1.871-.996.25-.535-1.875-1 .254-.535-1.875-1 .25-.27-.938-.996.25-.57-1.992 1.121-1.054 2.668-.668-1.933-6.778 1.476-1.375 1.68-1.195.27.937.995-.25 1.075 3.746 1.996-.5.27.938 2.995-.754.266.938 2-.504.266.937 1-.25.27.938 1-.254 1.632 5.722-.844.793.649 2.27-.844.793.652 2.289-1.12 1.055-9.298 2.336Zm0 0\" style=\"stroke:none;fill-rule:nonzero;fill:#fff;fill-opacity:1\"/><path d=\"m28.23 15.52-.27-.938-.995.25-.27-.937-1.996.503-.27-.937-2.995.754-.27-.938-1.996.5-1.07-3.746-1 .25-.27-.937-1.996.504.266.937-1 .25 2.41 8.434-.996.25-.27-.938-2.996.754.399 1.406.402 1.407 1-.254.27.937.995-.25.536 1.875 1-.254.535 1.875 1-.25.535 1.871 1-.25.535 1.875.266.938 8.992-2.262 1-.25-.805-2.812 1-.25-.8-2.809.996-.254-1.872-6.558Zm0 0\" style=\"stroke:none;fill-rule:nonzero;fill:#fff;fill-opacity:1\"/><path d=\"m14.098 11.035 1-.25 3.21 11.242-1 .254ZM14.828 9.848l2-.5.266.933-1.996.504ZM17.094 10.277l1-.25 2.41 8.434-1 .25Zm0 0\" style=\"stroke:none;fill-rule:nonzero;fill:#000;fill-opacity:1\"/><path d=\"m19.164 13.777 2-.5.266.938-1.996.5ZM21.703 15.148l1-.25.8 2.813-1 .25Zm0 0\" style=\"stroke:none;fill-rule:nonzero;fill:#000;fill-opacity:1\"/><path d=\"m21.43 14.215 3-.754.265.937-2.996.754ZM24.965 15.332l.996-.254.805 2.813-1 .25Zm0 0\" style=\"stroke:none;fill-rule:nonzero;fill:#000;fill-opacity:1\"/><path d=\"m24.695 14.398 2-.5.266.934-1.996.504ZM26.965 14.832l.996-.25.27.938-1 .25ZM28.234 15.516l1-.25 1.871 6.558-1 .25ZM29.105 22.324l1-.25.801 2.809-.996.254ZM28.91 25.39l.996-.25.805 2.81-1 .253Zm0 0\" style=\"stroke:none;fill-rule:nonzero;fill:#000;fill-opacity:1\"/><path d=\"m20.45 29.523 8.991-2.257.27.933-8.992 2.262ZM15.508 19.715l1-.25.265.937-.996.25ZM12.242 19.535l3-.754.266.938-2.996.754ZM12.512 20.473l1-.25.535 1.875-1 .25Zm0 0\" style=\"stroke:none;fill-rule:nonzero;fill:#000;fill-opacity:1\"/><path d=\"m14.043 22.098 1-.254.27.937-1 .254ZM15.313 22.781l1-.25.535 1.875-1 .25ZM16.848 24.402l1-.254.535 1.875-1 .25ZM18.383 26.023l.996-.253.539 1.875-1 .25ZM19.918 27.645l.996-.25.535 1.875-.996.25Zm0 0\" style=\"stroke:none;fill-rule:nonzero;fill:#000;fill-opacity:1\"/><\/svg>';
  if (!isOnLoad) {
    setCursorFromSVGFile(stringSVG, document.body, rgbColors[currentColor]);

  }
  setInputCursorFromTheme(rgbColors[currentColor]);
  setLinkCursorFromSVGFile(stringLinkSVG, rgbColors[currentColor])
}

//Dynamic cursor color
function setInputCursorFromTheme(color) {
  let size = "15";
  let y = "15";
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="30">
      <text y="##Y" fill="${color}" font-size="##SIZE" font-family="monospace">█</text>
    </svg>`;
  let encodedSVG = encodeURIComponent(svg.replace("##Y", y).replace("##SIZE", size).trim());
  let dataURL = `url("data:image/svg+xml,${encodedSVG}"), auto`;
  input.style.cursor = dataURL;

  //smaller svg for small inputs
  size = "15";
  y = "13";
  encodedSVG = encodeURIComponent(svg.replace("##Y", y).replace("##SIZE", size).trim());
  dataURL = `url("data:image/svg+xml,${encodedSVG}"), auto`;
  const inputs = Array.from(document.querySelectorAll('input'));
  inputs.forEach(i => i.style.cursor = dataURL);
}

function setCursorFromSVGFile(svg, el, themeColor) {
  const coloredSVG = svg.replace(/fill:\s*(?!none)[#a-zA-Z0-9()]+(?=;?)/g, `fill:${themeColor}`); // Replace all fill:* inside style attributes
  const encoded = encodeURIComponent(coloredSVG.trim());
  const url = `url("data:image/svg+xml,${encoded}")16 16, auto`;
  el.style.cursor = url;
}

function setLinkCursorFromSVGFile(svg, color) {
  let btns = Array.from(document.querySelectorAll('button'));
  btns = btns.concat(Array.from(document.querySelectorAll('a')));
  btns = btns.concat(Array.from(document.querySelectorAll('summary')));
  btns = btns.concat(Array.from(document.querySelectorAll('select')));
  btns.forEach(btn => setCursorFromSVGFile(svg, btn, color))
}


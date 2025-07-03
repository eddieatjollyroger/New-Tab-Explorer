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

// SEARCH
document.getElementById('search').addEventListener('input', (e) => {
  const query = e.target.value.trim().toLowerCase();
  const allGroups = document.querySelectorAll('#tabs > details');

  allGroups.forEach(details => {
    const tabList = details.querySelector('.tab-list');
    const tabs = Array.from(tabList.querySelectorAll('.tab'));

    // If query is empty, reset everything
    if (!query) {
      tabs.forEach(tab => {
        tab.style.display = '';
        // Restore original title if highlight was applied
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

    // Filter matching tabs
    const matchingTabs = tabs.filter(tab => {
      const title = tab.dataset.title || '';
      const url = tab.dataset.url || '';
      return title.includes(query) || url.includes(query);
    });

    // Hide all tabs initially
    tabs.forEach(tab => {
      tab.style.display = 'none';
    });

    // Show and sort matching tabs
    matchingTabs.sort((a, b) => {
      const titleA = a.dataset.title;
      const titleB = b.dataset.title;
      return titleA.localeCompare(titleB);
    });

    matchingTabs.forEach(tab => {
      tab.style.display = '';
      tabList.appendChild(tab);

      // Highlight match
      const titleEl = tab.querySelector('span');
      const rawTitle = titleEl.textContent;
      if (!titleEl.dataset.original) {
        titleEl.dataset.original = rawTitle;
      }
      const regex = new RegExp(`(${query})`, 'gi');
      titleEl.innerHTML = rawTitle.replace(regex, '<span class="highlight">$1</span>');
    });

    // Show or hide the group
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
    playClick();
  } else if (e.key === ']') {
    document.querySelectorAll('#tabs > details').forEach(el => el.open = true);
    playClick();
  } else if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
    e.preventDefault();
    document.getElementById('search').focus();
    playClick();
  } else if (e.key === 't' || e.key === 'T') {
    cycleTheme();
    playBeep();
  } else if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 's') {
    document.getElementById('save').click();
  } else if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'l') {
    document.getElementById('load').click();
  }
});

//STARTPAGE SEARCH
document.getElementById('search').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const query = e.target.value.trim();
    if (query) {
      const url = 'https://www.startpage.com/do/dsearch?query=' + encodeURIComponent(query);
      browser.tabs.create({ url });
    }
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

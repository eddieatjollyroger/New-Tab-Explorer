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
  el.dataset.url = tab.url.toLowerCase();

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
  title.textContent = tab.title || tab.url;
  title.style.flex = '1';

  const pinBtn = document.createElement('button');
  pinBtn.textContent = tab.pinned ? '[UNPIN]' : '[PIN]';
  pinBtn.className = 'pin-btn';
  pinBtn.style.marginLeft = '0.5em';
  pinBtn.style.background = 'transparent';
  pinBtn.style.border = 'none';
  pinBtn.style.color = '#0f0';
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
    summary.textContent = domain;

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

  const allTabEls = document.querySelectorAll('.tab');
  for (const el of allTabEls) {
    const title = el.dataset.title;
    const url = el.dataset.url;
    if (title.includes(query) || url.includes(query)) {
      el.style.display = '';
      el.parentNode.parentNode.open = true;
    } else {
      el.style.display = 'none';
    }

    //If empty query close all folders
    if(!query){
      el.parentNode.parentNode.open = false;
    }
  }
});

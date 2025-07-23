import { getFavIcon, fixPendingURL } from './utils.js';
import { loadCursors } from './cursors.js';

let allTabs = [];

function createTabIcon(tab) {
  const icon = document.createElement('img');
  icon.className = 'favicon';
  icon.src = getFavIcon(tab);
  icon.alt = '';
  return icon;
}

function createTabTitle(tab) {
  const title = document.createElement('span');
  title.textContent = tab.title.toLowerCase() || tab.url;
  title.style.flex = '1';
  return title;
}

function createPinButton(tab) {
  const pinBtn = document.createElement('button');
  pinBtn.textContent = tab.pinned ? '[UNPIN]' : '[PIN]';
  pinBtn.className = 'pin-btn';
  pinBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    browser.tabs.update(tab.id, { pinned: !tab.pinned });
    refreshTabs();
  });
  return pinBtn;
}

function createCloseButton(tab, el) {
  const closeBtn = document.createElement('button');
  closeBtn.textContent = '[X]';
  closeBtn.className = 'close-btn';
  closeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    browser.tabs.remove(tab.id);
    el.remove();
  });
  return closeBtn;
}

function createTabElement(tab) {
  const el = document.createElement('div');
  el.className = 'tab';
  el.draggable = true;
  el.dataset.title = (tab.title || '').toLowerCase();
  el.dataset.url = tab.url;
  el.dataset.favIconUrl = tab.favIconUrl;
  el.addEventListener('click', (e) => {
    if (e.target.classList.contains('close-btn') || e.target.classList.contains('pin-btn')) {
      return;
    }
    browser.tabs.update(tab.id, { active: true });
  });
  el.appendChild(createTabIcon(tab));
  el.appendChild(createTabTitle(tab));
  el.appendChild(createPinButton(tab));
  el.appendChild(createCloseButton(tab, el));
  return el;
}

function createSummary(domain, group) {
  const summary = document.createElement('summary');
  summary.textContent = `${domain} (${group.length} tab${group.length !== 1 ? 's' : ''})`;
  const icon = createTabIcon(group[0]);
  summary.prepend(icon);
  const marker = document.createElement('span');
  marker.className = 'marker';
  summary.append(marker);
  return summary;
}

function createTabList(group) {
  const tabList = document.createElement('div');
  tabList.className = 'tab-list';
  for (const tab of group) {
    const tabEl = createTabElement(tab);
    tabList.appendChild(tabEl);
  }
  return tabList;
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
    } else {
      details.open = false;
    }
    details.appendChild(createSummary(domain, groups[domain]));
    details.appendChild(createTabList(groups[domain]));
    container.appendChild(details);
  }
  loadCursors(document.getElementById('themeSelect').value);
}

export function refreshTabs(tabs) {
  if (tabs) return renderTabs(tabs, false);
  browser.tabs.query({}).then((tabs) => {
    allTabs = groupByFirstDomainSeen(tabs, 'url');
    const grouped = groupTabsByDomain(tabs);
    renderTabs(grouped, false);
  });
}

export function groupTabsByDomain(tabs) {
  const groups = {};
  for (const tab of tabs) {
    try {
      if (!tab.url) {
        tab.url = fixPendingURL(tab.pendingUrl);
      }
      const url = new URL(tab.url);
      const domain = url.hostname.startsWith('www.') ? url.hostname.split('www.')[1] : url.hostname;
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
    const host = new URL(tab[key]).hostname;
    if (!grouped.has(host)) {
      grouped.set(host, []);
    }
    grouped.get(host).push(tab);
  }
  grouped.forEach((key) => key.forEach(value => justTabs.push(value)));
  return justTabs;
}

function createSavedTabElement(saved, favIconUrl) {
  const el = document.createElement('div');
  el.className = 'tab';
  el.dataset.title = saved.title;
  el.dataset.url = saved.url;
  const icon = document.createElement('img');
  icon.className = 'favicon';
  icon.src = favIconUrl;
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
  return el;
}

export function renderSavedGroups(savedGroups) {
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
      tabList.appendChild(createSavedTabElement(saved, savedGroups[domain][0].favIconUrl || 'https://www.mozilla.org/media/protocol/img/logos/firefox/browser/logo-md.3f5f8412e4b0.png'));
    }
    details.appendChild(tabList);
    container.appendChild(details);
  }
}

export function initTabs() {
  browser.tabs.query({})
    .then((tabs) => {
      allTabs = groupByFirstDomainSeen(tabs, 'url');
      const grouped = groupTabsByDomain(allTabs);
      renderTabs(grouped, true);
    });
  browser.tabs.onUpdated.addListener(function (tabID, changeinfo, tab) {
      if (tab.url.startsWith("moz-extension://") && 
          tab.url.endsWith('/newtab.html') && tab.selected) return;
    if (changeinfo.status == 'complete') refreshTabs();
  });
  browser.tabs.onRemoved.addListener(function (tabId) {
    allTabs = allTabs.filter(tab => tab.id !== tabId);
    const grouped = groupTabsByDomain(allTabs);
    refreshTabs(grouped);
  });
} 
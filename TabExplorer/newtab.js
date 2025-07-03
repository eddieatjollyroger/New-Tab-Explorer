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
  el.draggable = true; // For native drag (optional)
  el.dataset.title = (tab.title || '').toLowerCase();
  el.dataset.url = tab.url.toLowerCase();

  el.addEventListener('click', () => {
    browser.tabs.update(tab.id, { active: true });
  });

  const icon = document.createElement('img');
  icon.className = 'favicon';
  icon.src = tab.favIconUrl || 'https://www.mozilla.org/media/protocol/img/logos/firefox/browser/logo-md.3f5f8412e4b0.png';
  icon.alt = '';

  const title = document.createElement('span');
  title.textContent = tab.title || tab.url;

  el.appendChild(icon);
  el.appendChild(title);
  return el;
}

function renderTabs(groups) {
  const container = document.getElementById('tabs');
  container.innerHTML = '';

  for (const domain in groups) {
    const details = document.createElement('details');
    details.open = false;

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
    renderTabs(grouped);
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

    if(!query){
      el.parentNode.parentNode.open = false;
    }
  }
});

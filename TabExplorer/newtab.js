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

// Load and render
browser.tabs.query({})
  .then((tabs) => {
    const grouped = groupTabsByDomain(tabs);
    renderTabs(grouped);
  });

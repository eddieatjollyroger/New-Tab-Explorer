import { renderSavedGroups } from './tabs.js';

export function initStorage() {
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
  document.getElementById('load').addEventListener('click', () => {
    browser.storage.local.get('savedGroups').then((data) => {
      if (data.savedGroups) {
        renderSavedGroups(data.savedGroups);
      } else {
        alert('No saved groups found.');
      }
    });
  });
} 
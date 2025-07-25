import { escapeHTML } from './utils.js';
import { cycleTheme } from './theme.js';

function highlightMatchingTabs(tabs, query, regex) {
  tabs.forEach(tab => {
    tab.style.display = '';
    const titleEl = tab.querySelector('span');
    const rawTitle = titleEl.dataset.original || titleEl.textContent;
    if (!titleEl.dataset.original) {
      titleEl.dataset.original = rawTitle;
    }
    const escapedTitle = escapeHTML(rawTitle);
    const highlighted = escapedTitle.replace(regex, '<span class="highlight">$1</span>');
    titleEl.innerHTML = highlighted;
  });
}

function resetTabDisplay(tabs) {
  tabs.forEach(tab => {
    tab.style.display = '';
    const titleEl = tab.querySelector('span');
    const original = titleEl.dataset.original;
    if (original) {
      titleEl.textContent = original;
      delete titleEl.dataset.original;
    }
  });
}

function handleKeyboardShortcuts(e) {
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
}

function typePlaceholder() {
  const placeholders = [
    "PRESS / TO START SEARCHING",
    "PRESS ENTER WHEN TYPING TO SEARCH THE WEB",
    "PRESS T TO SWITCH THE COLOR THEME",
    "DOUBLE CLICK A SHORTCUT WHILE IN EDIT MODE TO CHANGE IT",
    "DRAG SHORTCUTS TO REORDER THEM"
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
    } while (next === currentPlaceholder);
    return next;
  }
  function doType() {
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
          if (document.activeElement !== input && input.textContent.trim() === placeholder) {
            input.textContent = "";
            index = 0;
            doType();
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
      doType();
    }
  });
  doType();
}

export function initSearch() {
  const input = document.getElementById('search-input');
  input.addEventListener('input', (e) => {
    const query = e.target.textContent.trim().toLowerCase();
    const allGroups = document.querySelectorAll('#tabs > details');
    const quickPanel = document.getElementById('quickAccess');
    quickPanel.style.display = query ? 'none' : 'block';
    allGroups.forEach(details => {
      const tabList = details.querySelector('.tab-list');
      const tabs = Array.from(tabList.querySelectorAll('.tab'));
      if (!query) {
        resetTabDisplay(tabs);
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
      const safeQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(${safeQuery})`, 'gi');
      highlightMatchingTabs(matchingTabs, query, regex);
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
  document.addEventListener('keydown', handleKeyboardShortcuts);
  document.getElementById('search-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const query = e.target.textContent.trim();
      if (query) {
        browser.search.query({ text: query });
      }
    }
  });
  typePlaceholder();
} 
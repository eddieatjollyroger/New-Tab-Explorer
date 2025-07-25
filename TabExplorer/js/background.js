browser.runtime.onInstalled.addListener((reason) => {
  browser.storage.local.get('quickShortcuts').then(({ quickShortcuts }) => {
    let shortcuts = quickShortcuts || [];
    if (shortcuts.length > 0) {
      shortcuts.forEach((shortcut) => {
        if (!shortcut.favIconUrl) {
          shortcut.favIconUrl = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(shortcut.url)}`;
        }
      });
      browser.storage.local.set({ quickShortcuts: shortcuts });
    }
    else {
      browser.topSites.get().then(data => {
        let uniqueNewSuggestions = data.map(d => d.url).filter(d => !shortcuts.includes(d));
        if (uniqueNewSuggestions.length === 0) return;
        const suggestions = uniqueNewSuggestions.slice(0, 5);
        for (url in suggestions) {
          const title = data.find(d => d.url === suggestions[url]).title;
          const urlToinsert = suggestions[url].startsWith("http://") || suggestions[url].startsWith("https://") ?
            suggestions[url] : new URL("https://" + suggestions[url]).href;
          const secondSpaceIndex = (title.indexOf(' ', title.indexOf(' ') + 1));
          const truncatedOnSecondSpace = secondSpaceIndex == -1 ?
            title : title.substring(0, secondSpaceIndex);

          shortcuts.push({
            label: truncatedOnSecondSpace,
            url: urlToinsert,
            favIconUrl: `https://www.google.com/s2/favicons?domain=${encodeURIComponent(urlToinsert)}`
          })
        }
        browser.storage.local.set({ quickShortcuts: shortcuts });
      })
    }
  });
});
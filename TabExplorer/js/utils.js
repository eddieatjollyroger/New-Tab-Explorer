export function escapeHTML(str) {
  return str.replace(/[&<>"]|'|`|=|\//g, (s) => {
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

export function prependHttps(url) {
  return url.startsWith("http://") || url.startsWith("https://") ?
    url : new URL("https://" + url).href;
}

export function cleanURL(urlIn) {
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

export function fixPendingURL(url) {
  const formattedUrl = new URL(url);
  return formattedUrl;
}

export function getFavIcon(tab) {
  if (tab.favIconUrl) {
    return tab.favIconUrl;
  }
  const url = new URL(tab.url);
  if (url?.protocol.startsWith('http')) {
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(url)}`;
  }
  return '/favicongif.gif';
}

export function loadFavicon(url) {
  return new Promise((resolve, reject) => {
    const sizeQuery = '&sz=64';
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(url)}${sizeQuery}`;
  });
}

export function handleTextInput(textInput, event) {
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
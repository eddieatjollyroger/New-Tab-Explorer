export function loadCursors(currentColor, isOnLoad = false) {
  const rgbColors = { green: "rgb(0, 255, 0)", amber: "rgb(255, 191, 0)", blue: "rgb(0,191,255)" };
  const stringSVG = '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><path d="m30.621 28.246-.578-2.082-1.07.273-.563-2.015 1.34-.344 1.578-1.52-.293-1.054-.289-1.027-1.07.273-.285-1.027-1.07.277-.286-1.027-1.07.273-.29-1.027-1.07.273-.285-1.027-1.07.277-.285-1.027-1.07.273-.29-1.027-1.066.277-.289-1.027-1.07.273-.285-1.027-1.07.277-.29-1.027-1.066.273-.29-1.027-1.07.277-.285-1.027-1.101.281L13.145 14l4.878 17.5 1.102-.285 1.07-.274 1.582-1.52-.129-.456.868-.836.043-.008-.13-.457.204-.195.457 1.625 1.07-.274.57 2.055 1.07-.277.29 1.027 2.168-.559 1.582-1.515-.13-.457.872-.836Zm0 0" style="stroke:none;fill-rule:nonzero;fill:#000;fill-opacity:1"/><path d="m26.25 29.855-1.07.274-.575-2.055-1.07.278-.574-2.059-1.234 1.187.12.434-.906.871.13.457-1.204 1.153-1.394.359-4.625-16.57 1.203-1.157.324-.082.29 1.028 1.07-.278.285 1.028 1.07-.274.285 1.028 1.07-.278.29 1.031 1.07-.277.285 1.027 1.07-.273.285 1.027 1.07-.277.29 1.027 1.07-.273.285 1.027 1.07-.277.286 1.027 1.07-.273.289 1.027 1.07-.277.285 1.027 1.07-.273.325 1.16-1.203 1.152-1.79.461.891 3.188 1.07-.274.317 1.137-.902.867.125.457-1.2 1.156-1.398.36Zm0 0" style="stroke:none;fill-rule:nonzero;fill:#fff;fill-opacity:1"/><path d="m29.668 20.77-.29-1.028-1.07.274-.285-1.028-1.07.278-.285-1.028-1.07.274-.29-1.028-1.07.278-.285-1.028-1.07.274-.285-1.028-1.07.278-.29-1.028-1.07.274-.285-1.027-1.07.273-.286-1.027-1.07.277-.289-1.027-1.07.273-.285-1.027-1.07.277 4.874 17.465 1.07-.273 1.07-.278-.288-1.027 1.07-.274-.285-1.027 1.07-.277-.289-1.028 1.07-.273.575 2.055 1.07-.278.574 2.059 1.07-.277.286 1.027 2.14-.55-.289-1.028 1.07-.274-.57-2.054-1.07.273-.574-2.055-1.07.274-.286-1.028 4.278-1.097-.286-1.031-.285-1.028Zm0 0" style="stroke:none;fill-rule:nonzero;fill:#fff;fill-opacity:1"/><path d="m14.742 12.496 1.07-.277 4.872 17.468-1.067.274Zm0 0" style="stroke:none;fill-rule:nonzero;fill:#000;fill-opacity:1"/><path d="m16.098 13.246 1.07-.273.289 1.027-1.07.273Zm0 0" style="stroke:none;fill-rule:nonzero;fill:#000;fill-opacity:1"/><path d="m17.453 14 1.07-.277.29 1.027-1.07.277ZM18.813 14.75l1.07-.273.285 1.027-1.07.273ZM20.168 15.504l1.07-.277.285 1.027-1.066.277ZM21.523 16.258l1.07-.278.29 1.028-1.07.277ZM22.883 17.008l1.07-.274.285 1.028-1.07.273ZM24.238 17.762l1.07-.278.286 1.028-1.07.277ZM25.594 18.512l1.07-.274.29 1.028-1.071.273Zm0 0" style="stroke:none;fill-rule:nonzero;fill:#000;fill-opacity:1"/><path d="m26.953 19.266 1.07-.278.286 1.028-1.07.277ZM28.309 20.016l1.07-.274.289 1.028-1.07.273Zm0 0" style="stroke:none;fill-rule:nonzero;fill:#000;fill-opacity:1"/><path d="m29.664 20.77 1.07-.278.29 1.028-1.07.277Zm0 0" style="stroke:none;fill-rule:nonzero;fill:#000;fill-opacity:1"/><path d="m25.672 22.898 5.351-1.378.286 1.027-5.352 1.379Zm0 0" style="stroke:none;fill-rule:nonzero;fill:#000;fill-opacity:1"/><path d="m25.957 23.926 1.07-.278.29 1.028-1.07.277ZM22.75 24.75l1.07-.273.285 1.027-1.07.273ZM24.105 25.504l1.07-.277.575 2.054-1.07.278ZM25.75 27.281l1.066-.273.575 2.055-1.07.277Zm0 0" style="stroke:none;fill-rule:nonzero;fill:#000;fill-opacity:1"/><path d="m27.39 29.063 2.141-.551.29 1.027-2.141.55ZM27.316 24.676l1.07-.274.575 2.055-1.07.273ZM28.96 26.46l1.071-.276.574 2.054-1.07.278ZM21.969 26.055l1.066-.278.29 1.028-1.071.277ZM21.184 27.355l1.07-.273.285 1.027-1.07.274ZM20.398 28.66l1.07-.277.29 1.027-1.07.277Zm0 0" style="stroke:none;fill-rule:nonzero;fill:#000;fill-opacity:1"/><\/svg>';
  const stringLinkSVG = '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><path d="m30.926 24.898-.656-2.293.812-.761.04-.008-1.884-6.586-.996.25-.27-.938-1 .254-.265-.937-2 .5-.266-.938-3 .754-.265-.937-2 .504-1.07-3.75-1 .254-.266-.938-2.027.508-.731 1.187v.008l-1.477 1.38 1.872 6.55-2.25.562-1.477 1.387.277.961.536 1.875 1-.25.265.938 1-.254.535 1.875 1-.25.535 1.87 1-.25.536 1.876 1-.25.535 1.87.265.938 8.993-2.257 1.027-.258 1.476-1.383-.656-2.293.813-.762Zm0 0" style="stroke:none;fill-rule:nonzero;fill:#000;fill-opacity:1"/><path d="m18.848 28.371-.996.25-.54-1.871-.996.25-.535-1.875-1 .254-.535-1.875-1 .25-.27-.938-.996.25-.57-1.992 1.121-1.054 2.668-.668-1.933-6.778 1.476-1.375 1.68-1.195.27.937.995-.25 1.075 3.746 1.996-.5.27.938 2.995-.754.266.938 2-.504.266.937 1-.25.27.938 1-.254 1.632 5.722-.844.793.649 2.27-.844.793.652 2.289-1.12 1.055-9.298 2.336Zm0 0" style="stroke:none;fill-rule:nonzero;fill:#fff;fill-opacity:1"/><path d="m28.23 15.52-.27-.938-.995.25-.27-.937-1.996.503-.27-.937-2.995.754-.27-.938-1.996.5-1.07-3.746-1 .25-.27-.937-1.996.504.266.937-1 .25 2.41 8.434-.996.25-.27-.938-2.996.754.399 1.406.402 1.407 1-.254.27.937.995-.25.536 1.875 1-.254.535 1.875 1-.25.535 1.871 1-.25.535 1.875.266.938 8.992-2.262 1-.25-.805-2.812 1-.25-.8-2.809.996-.254-1.872-6.558Zm0 0" style="stroke:none;fill-rule:nonzero;fill:#fff;fill-opacity:1"/><path d="m14.098 11.035 1-.25 3.21 11.242-1 .254ZM14.828 9.848l2-.5.266.933-1.996.504ZM17.094 10.277l1-.25 2.41 8.434-1 .25Zm0 0" style="stroke:none;fill-rule:nonzero;fill:#000;fill-opacity:1"/><path d="m19.164 13.777 2-.5.266.938-1.996.5ZM21.703 15.148l1-.25.8 2.813-1 .25Zm0 0" style="stroke:none;fill-rule:nonzero;fill:#000;fill-opacity:1"/><path d="m21.43 14.215 3-.754.265.937-2.996.754ZM24.965 15.332l.996-.254.805 2.813-1 .25Zm0 0" style="stroke:none;fill-rule:nonzero;fill:#000;fill-opacity:1"/><path d="m24.695 14.398 2-.5.266.934-1.996.504ZM26.965 14.832l.996-.25.27.938-1 .25ZM28.234 15.516l1-.25 1.871 6.558-1 .25ZM29.105 22.324l1-.25.801 2.809-.996.254ZM28.91 25.39l.996-.25.805 2.81-1 .253Zm0 0" style="stroke:none;fill-rule:nonzero;fill:#000;fill-opacity:1"/><path d="m20.45 29.523 8.991-2.257.27.933-8.992 2.262ZM15.508 19.715l1-.25.265.937-.996.25ZM12.242 19.535l3-.754.266.938-2.996.754ZM12.512 20.473l1-.25.535 1.875-1 .25Zm0 0" style="stroke:none;fill-rule:nonzero;fill:#000;fill-opacity:1"/><path d="m14.043 22.098 1-.254.27.937-1 .254ZM15.313 22.781l1-.25.535 1.875-1 .25ZM16.848 24.402l1-.254.535 1.875-1 .25ZM18.383 26.023l.996-.253.539 1.875-1 .25ZM19.918 27.645l.996-.25.535 1.875-.996.25Zm0 0" style="stroke:none;fill-rule:nonzero;fill:#000;fill-opacity:1"/><\/svg>';
  if (!isOnLoad) {
    setCursorFromSVGFile(stringSVG, document.body, rgbColors[currentColor]);
  }
  setInputCursorFromTheme(rgbColors[currentColor]);
  setLinkCursorFromSVGFile(stringLinkSVG, rgbColors[currentColor])
}

function setInputCursorFromTheme(color) {
  let size = "15";
  let y = "15";
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="30">
      <text y="##Y" fill="${color}" font-size="##SIZE" font-family="monospace">█</text>
    </svg>`;
  let encodedSVG = encodeURIComponent(svg.replace("##Y", y).replace("##SIZE", size).trim());
  let dataURL = `url("data:image/svg+xml,${encodedSVG}"), auto`;
  const input = document.getElementById("search-input");
  input.style.cursor = dataURL;

  size = "15"; //smaller svg for inputs
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

// Export helpers if needed elsewhere
export { setInputCursorFromTheme, setCursorFromSVGFile, setLinkCursorFromSVGFile }; 
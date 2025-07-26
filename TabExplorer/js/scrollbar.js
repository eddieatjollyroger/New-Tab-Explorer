let isDragging = false;
let startX, startY, startScrollTop, startScrollLeft;

export function attachCustomScrollbarEvents(wrapper) {
  const content = wrapper.querySelector('.scroll-content');
  const vTrack = wrapper.querySelector('.scrollbar-track-vertical');
  const vThumb = wrapper.querySelector('.scrollbar-thumb-vertical');
  const hTrack = wrapper.querySelector('.scrollbar-track-horizontal');
  const hThumb = wrapper.querySelector('.scrollbar-thumb-horizontal');

function updateThumbs() {
  const {
    scrollTop, scrollHeight, clientHeight,
    scrollLeft, scrollWidth, clientWidth
  } = content;

  // --- Vertical Scrollbar ---
  const vRatio = clientHeight / scrollHeight;
  const vThumbHeight = Math.max(clientHeight * vRatio, 20);
  const vTop = scrollTop * vRatio;
  const vNeeded = scrollHeight > clientHeight;

  vThumb.style.height = `${vThumbHeight}px`;
  vThumb.style.top = `${vTop}px`;
  vTrack.classList.toggle('visible', vNeeded);
  vTrack.classList.toggle('hidden', !vNeeded);

  // --- Horizontal Scrollbar ---
  const hRatio = clientWidth / scrollWidth;
  const hLeft = scrollLeft * hRatio;
  const hNeeded = scrollWidth > clientWidth;

  const effectiveWidth = document.body.offsetWidth; // includes padding/borders
  const availableScrollWidth = content.clientWidth; // excludes scrollbar
  const verticalBarWidth = effectiveWidth - availableScrollWidth; //size of custom vertical bar

  console.log(effectiveWidth)
  console.log(availableScrollWidth)
  console.log(verticalBarWidth)

  let hThumbWidth = Math.max(clientWidth * hRatio, 20);
  if (vNeeded) {
    hThumbWidth += verticalBarWidth;
  }

  hThumb.style.width = `${hThumbWidth}px`;
  hThumb.style.left = `${hLeft}px`;
  hTrack.classList.toggle('visible', hNeeded);
  hTrack.classList.toggle('hidden', !hNeeded);
}

  // Drag support for vertical
  vThumb.addEventListener('mousedown', (e) => {
    isDragging = 'vertical';
    startY = e.clientY;
    startScrollTop = content.scrollTop;
    document.body.classList.add('no-select');
    e.preventDefault();
  });

  // Drag support for horizontal
  hThumb.addEventListener('mousedown', (e) => {
    isDragging = 'horizontal';
    startX = e.clientX;
    startScrollLeft = content.scrollLeft;
    document.body.classList.add('no-select');
    e.preventDefault();
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;

    if (isDragging === 'vertical') {
      const dy = e.clientY - startY;
      const ratio = content.scrollHeight / content.clientHeight;
      content.scrollTop = startScrollTop + dy * ratio;
    } else if (isDragging === 'horizontal') {
      const dx = e.clientX - startX;
      const ratio = content.scrollWidth / content.clientWidth;
      content.scrollLeft = startScrollLeft + dx * ratio;
    }
  });

  document.addEventListener('mouseup', () => {
    isDragging = false;
    document.body.classList.remove('no-select');
  });

  // Track click support (only vertical for now, you can replicate for horizontal if needed)
  vTrack.addEventListener('click', (e) => {
    if (e.target === vThumb) return;
    const rect = vThumb.getBoundingClientRect();
    const pageHeight = content.clientHeight;

    const animateScrollTo = (target) => {
      const start = content.scrollTop;
      const change = target - start;
      const duration = 200;
      const startTime = performance.now();

      function animate(time) {
        const elapsed = time - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeOut = 1 - Math.pow(1 - progress, 3);
        content.scrollTop = start + change * easeOut;
        if (progress < 1) requestAnimationFrame(animate);
      }

      requestAnimationFrame(animate);
    };

    if (e.clientY > rect.bottom) {
      animateScrollTo(content.scrollTop + pageHeight);
    } else if (e.clientY < rect.top) {
      animateScrollTo(content.scrollTop - pageHeight);
    }
  });

  // Horizontal track click support with animated scroll
  hTrack.addEventListener('click', (e) => {
    if (e.target === hThumb) return;

    const thumbRect = hThumb.getBoundingClientRect();
    const pageWidth = content.clientWidth;

    const animateScrollTo = (targetScrollLeft) => {
      const start = content.scrollLeft;
      const change = targetScrollLeft - start;
      const duration = 200;
      const startTime = performance.now();

      function animate(time) {
        const elapsed = time - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeOut = 1 - Math.pow(1 - progress, 3); // easeOutCubic
        content.scrollLeft = start + change * easeOut;
        if (progress < 1) requestAnimationFrame(animate);
      }

      requestAnimationFrame(animate);
    };

    if (e.clientX > thumbRect.right) {
      animateScrollTo(content.scrollLeft + pageWidth);
    } else if (e.clientX < thumbRect.left) {
      animateScrollTo(content.scrollLeft - pageWidth);
    }
  });

  content.addEventListener('scroll', updateThumbs);
  window.addEventListener('resize', updateThumbs);

  updateThumbs();
  return updateThumbs;
}

export function initCustomScrollbar(wrapperSelector = '.scroll-wrapper') {
  const wrapper = document.querySelector(wrapperSelector);
  if (!wrapper) return;
  const updateThumb = attachCustomScrollbarEvents(wrapper);

  window.addEventListener('load', () => {
    requestAnimationFrame(() => {
      requestAnimationFrame(updateThumb);
      setTimeout(updateThumb, 100);
    });
  });
}

/* ECHO.11 — shared accessibility widget
   Injects the same widget that index/about/privacy/accessibility carry
   inline, on pages that don't have it. Skips itself when the page
   already ships one, so there is exactly one widget everywhere.
   Same body classes + localStorage key ('a11y') as the inline version,
   so preferences follow the visitor across all pages. */
(function () {
  'use strict';
  if (document.querySelector('.a11y-widget')) return;

  var css = [
    '.a11y-widget { position: fixed; bottom: 20px; left: 20px; z-index: 9998; font-family: "Outfit", sans-serif; }',
    '.a11y-toggle { width: 50px; height: 50px; border-radius: 50%; background: var(--text, #1a1a1a); color: var(--white, #fff); border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 15px rgba(0,0,0,0.2); transition: transform 0.2s, box-shadow 0.2s; }',
    '.a11y-toggle:hover { transform: scale(1.1); }',
    '.a11y-toggle svg { width: 26px; height: 26px; }',
    '.a11y-menu { position: absolute; bottom: 60px; left: 0; background: var(--white, #fff); border: 1px solid var(--border, #e0e0e0); border-radius: 12px; padding: 1rem; min-width: 220px; box-shadow: 0 10px 40px rgba(0,0,0,0.15); display: none; }',
    '.a11y-menu.active { display: block; }',
    '.a11y-menu h4 { font-size: 0.85rem; font-weight: 600; margin: 0 0 0.75rem; color: var(--text, #1a1a1a); }',
    '.a11y-btn { width: 100%; padding: 0.6rem 0.75rem; margin-bottom: 0.4rem; background: var(--bg, #fafafa); border: 1px solid var(--border, #e0e0e0); border-radius: 6px; cursor: pointer; font-size: 0.85rem; color: var(--text, #1a1a1a); text-align: left; display: flex; align-items: center; gap: 0.6rem; transition: all 0.2s; }',
    '.a11y-btn:hover, .a11y-btn.active { background: var(--text, #1a1a1a); color: var(--white, #fff); }',
    '.a11y-btn svg { width: 18px; height: 18px; flex-shrink: 0; }',
    '.a11y-reset button { width: 100%; padding: 0.5rem; background: transparent; border: none; cursor: pointer; font-size: 0.8rem; color: var(--text-light, #666); text-decoration: underline; margin-top: 0.5rem; }',
    'body.a11y-large-text { font-size: 22px !important; }',
    'body.a11y-high-contrast { --bg: #000 !important; --text: #fff !important; --text-secondary: #fff !important; --text-light: #ccc !important; --white: #000 !important; --border: #fff !important; }',
    'body.a11y-high-contrast .a11y-toggle { background: #fff; color: #000; }',
    'body.a11y-grayscale { filter: grayscale(100%); }',
    'body.a11y-highlight-links a { background: yellow !important; color: #000 !important; padding: 2px 4px; }'
  ].join('\n');
  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  var icons = {
    person: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5c-1.5 0-2.5 1-2.5 2.5s1 2.5 2.5 2.5 2.5-1 2.5-2.5-1-2.5-2.5-2.5zM12 12c-3 0-5.5 1.5-6 4h12c-.5-2.5-3-4-6-4zM4.5 16.5h15"/></svg>',
    text: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16m-7 6h7"/></svg>',
    contrast: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/></svg>',
    gray: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4.098 19.902a3.75 3.75 0 005.304 0l6.401-6.402M6.75 21A3.75 3.75 0 013 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 003.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25c0-.621-.504-1.125-1.125-1.125h-4.072M10.5 8.197l2.88-2.88c.438-.439 1.15-.439 1.59 0l3.712 3.713c.44.44.44 1.152 0 1.59l-2.879 2.88M6.75 17.25h.008v.008H6.75v-.008z"/></svg>',
    link: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244"/></svg>'
  };

  var widget = document.createElement('div');
  widget.className = 'a11y-widget';
  widget.innerHTML =
    '<button class="a11y-toggle" id="a11yToggle" aria-label="Accessibility options" title="Accessibility">' + icons.person + '</button>' +
    '<div class="a11y-menu" id="a11yMenu">' +
      '<h4>♿ Accessibility</h4>' +
      '<button class="a11y-btn" data-mode="a11y-large-text">' + icons.text + 'Larger Text</button>' +
      '<button class="a11y-btn" data-mode="a11y-high-contrast">' + icons.contrast + 'High Contrast</button>' +
      '<button class="a11y-btn" data-mode="a11y-grayscale">' + icons.gray + 'Grayscale</button>' +
      '<button class="a11y-btn" data-mode="a11y-highlight-links">' + icons.link + 'Highlight Links</button>' +
      '<div class="a11y-reset"><button id="a11yReset">Reset All</button></div>' +
    '</div>';
  document.body.appendChild(widget);

  var toggle = widget.querySelector('#a11yToggle');
  var menu = widget.querySelector('#a11yMenu');
  var btns = widget.querySelectorAll('.a11y-btn');
  var reset = widget.querySelector('#a11yReset');

  var saved = {};
  try { saved = JSON.parse(localStorage.getItem('a11y') || '{}'); } catch (e) {}
  Object.keys(saved).forEach(function (mode) {
    if (saved[mode]) document.body.classList.add(mode);
  });
  btns.forEach(function (btn) {
    if (document.body.classList.contains(btn.dataset.mode)) btn.classList.add('active');
  });

  toggle.addEventListener('click', function () { menu.classList.toggle('active'); });
  document.addEventListener('click', function (e) {
    if (!e.target.closest('.a11y-widget')) menu.classList.remove('active');
  });
  btns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var mode = btn.dataset.mode;
      document.body.classList.toggle(mode);
      btn.classList.toggle('active');
      var current = {};
      try { current = JSON.parse(localStorage.getItem('a11y') || '{}'); } catch (e) {}
      current[mode] = document.body.classList.contains(mode);
      localStorage.setItem('a11y', JSON.stringify(current));
    });
  });
  reset.addEventListener('click', function () {
    btns.forEach(function (btn) {
      document.body.classList.remove(btn.dataset.mode);
      btn.classList.remove('active');
    });
    localStorage.removeItem('a11y');
  });
})();

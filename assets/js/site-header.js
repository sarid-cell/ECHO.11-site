/* ECHO.11 — shared header behavior
   Loaded on every page (single source of truth):
   1. Journey-ordered navigation (edit NAV below to change all pages at once)
   2. Glassmorphism surface
   3. Smart hide-on-scroll (down = hide, up = reveal)
   Progressive enhancement over the static header markup in each page —
   with JS disabled the header simply stays fixed and fully functional. */
(function () {
  'use strict';

  /* ── 1. Navigation — the conversion journey, in order ── */
  var NAV = [
    { href: 'frequency.html',      label: 'The Reset' },
    { href: 'book.html',           label: 'The Book' },
    { href: 'index.html#insights', label: 'Insights' },
    { href: 'index.html#vision',   label: 'The Vision' },
    { href: 'about.html',          label: 'About Echo.11' }
  ];

  var header    = document.querySelector('header');
  var sideMenu  = document.getElementById('sideMenu');
  var hamburger = document.getElementById('hamburger');
  if (!header) return;

  if (sideMenu && hamburger) {
    var nav = sideMenu.querySelector('nav');
    if (nav) {
      var here = (location.pathname.split('/').pop() || 'index.html');
      nav.innerHTML = NAV.map(function (item) {
        var current = item.href.split('#')[0] === here ? ' current' : '';
        return '<a href="' + item.href + '" class="menu-link' + current + '">' + item.label + '</a>';
      }).join('');
      // page scripts bound their close-toggle to the original anchors;
      // delegate clicks on the rebuilt ones through the hamburger instead
      nav.addEventListener('click', function (e) {
        if (e.target.closest('a') && sideMenu.classList.contains('active')) hamburger.click();
      });
    }
  }

  /* ── 2. Glass surface + hide-on-scroll styles ── */
  var css = [
    'header {',
    '  background: rgba(250,250,250,0.8);',
    '  -webkit-backdrop-filter: blur(12px) saturate(1.5);',
    '  backdrop-filter: blur(12px) saturate(1.5);',
    '  border-bottom: 1px solid rgba(26,26,26,0.07);',
    '  transition: transform .45s cubic-bezier(.22,.61,.36,1), opacity 1.8s ease;',
    '  will-change: transform;',
    '}',
    'header.header-hidden { transform: translateY(-100%); }',
    // dark glass only on pages that declare dark support (html.supports-dark)
    '@media (prefers-color-scheme: dark) {',
    '  html.supports-dark header { background: rgba(14,16,19,0.75); border-bottom-color: rgba(255,255,255,0.08); }',
    '}',
    '@media (prefers-reduced-motion: reduce) {',
    '  header { transition-duration: .15s, 1.8s; }',
    '}'
  ].join('\n');
  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  /* ── 3. Smart scroll: hide going down, reveal going up ── */
  var TOP_ZONE = 90;  // never hide this close to the top
  var DELTA    = 6;   // ignore micro-jitter (rubber-banding, trackpads)
  var lastY = window.scrollY, ticking = false;

  function onScroll() {
    var y = window.scrollY;
    var menuOpen = sideMenu && sideMenu.classList.contains('active');
    if (menuOpen || y < TOP_ZONE) {
      header.classList.remove('header-hidden');
    } else if (y > lastY + DELTA) {
      header.classList.add('header-hidden');
    } else if (y < lastY - DELTA) {
      header.classList.remove('header-hidden');
    }
    lastY = y;
  }

  window.addEventListener('scroll', function () {
    if (!ticking) {
      requestAnimationFrame(function () { onScroll(); ticking = false; });
      ticking = true;
    }
  }, { passive: true });
})();

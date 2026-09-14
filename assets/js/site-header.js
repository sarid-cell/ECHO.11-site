/* ECHO.11 — shared header behavior
   Loaded on every page (single source of truth):
   1. Journey-ordered navigation (edit NAV below to change all pages at once)
   2. Glassmorphism surface
   3. Smart hide-on-scroll (down = hide, up = reveal)
   Progressive enhancement over the static header markup in each page —
   with JS disabled the header simply stays fixed and fully functional. */
(function () {
  'use strict';

  /* ── 1. Navigation — the conversion journey, in order ──
     Items may carry `children`: direct links rendered as an indented
     mono sub-list, so a visitor reaches a session without the hub hop.
     hrefs are root-absolute so the same array works from /he/ too. */
  var NAV = [
    { href: '/frequencies.html',    label: 'The Sessions', children: [
        { href: '/frequency.html',  label: '10 Hz · Calm' },
        { href: '/40hz.html',       label: '40 Hz · Focus' }
      ] },
    { href: '/book.html',           label: 'The Book' },
    { href: '/index.html#insights', label: 'Insights' },
    { href: '/index.html#vision',   label: 'The Vision' },
    { href: '/about.html',          label: 'About Echo.11' }
  ];

  /* The Hebrew session pages run the same drawer, in Hebrew. They have
     no Hebrew hub or essays yet, so the two sessions lead and the rest
     of the menu points back at the English site. */
  var NAV_HE = [
    { href: '/he/teder-10hz.html', label: '10 הרץ · הרגעה' },
    { href: '/he/teder-40hz.html', label: '40 הרץ · ריכוז' },
    { href: '/frequencies.html',   label: 'The Sessions (English)' },
    { href: '/book.html',          label: 'The Book' },
    { href: '/about.html',         label: 'About Echo.11' }
  ];

  /* App teaser pinned under the links — swap for a real
     { href: 'app.html', label: 'The App' } NAV entry at launch */
  var APP_TEASER =
    '<div class="menu-app">' +
      '<span class="menu-app-title">The App ' +
        '<span class="menu-app-badge">Coming Soon</span>' +
      '</span>' +
      '<span class="menu-app-desc">Both sessions, in your pocket.</span>' +
    '</div>';

  var APP_TEASER_HE =
    '<div class="menu-app">' +
      '<span class="menu-app-title">האפליקציה ' +
        '<span class="menu-app-badge">בקרוב</span>' +
      '</span>' +
      '<span class="menu-app-desc">שני הסשנים, בכיס שלך.</span>' +
    '</div>';

  var header    = document.querySelector('header');
  var sideMenu  = document.getElementById('sideMenu');
  var hamburger = document.getElementById('hamburger');
  if (!header) return;

  if (sideMenu && hamburger) {
    var nav = sideMenu.querySelector('nav');
    if (nav) {
      var here = location.pathname.replace(/\/$/, '/index.html');
      function isHere(href) { return href.split('#')[0] === here; }
      var isHebrew = document.documentElement.lang === 'he';
      var items = isHebrew ? NAV_HE : NAV;
      var teaser = isHebrew ? APP_TEASER_HE : APP_TEASER;
      nav.innerHTML = '<ul class="menu-list">' + items.map(function (item) {
        var link = '<a href="' + item.href + '" class="menu-link' +
                   (isHere(item.href) ? ' current' : '') + '">' + item.label + '</a>';
        var sub = '';
        if (item.children) {
          sub = '<ul class="menu-sublist">' + item.children.map(function (child) {
            return '<li><a href="' + child.href + '" class="menu-sublink' +
                   (isHere(child.href) ? ' current' : '') + '">' + child.label + '</a></li>';
          }).join('') + '</ul>';
        }
        return '<li>' + link + sub + '</li>';
      }).join('') + '</ul>' + teaser;
      // page scripts bound their close-toggle to the original anchors;
      // delegate clicks on the rebuilt ones through the hamburger instead
      nav.addEventListener('click', function (e) {
        if (e.target.closest('a') && sideMenu.classList.contains('active')) hamburger.click();
      });
    }
  }

  /* ── 2. Header surface + hide-on-scroll styles ──
     Over a hero the bar is transparent, so nothing scrolls visibly
     through it; past the hero it becomes the opaque page ground with
     its hairline. Pages without a hero keep the opaque bar from the
     first pixel. */
  var css = [
    'header {',
    '  background: var(--bg, #fafafa);',
    '  border-bottom: 1px solid rgba(26,26,26,0.07);',
    '  transition: transform .45s cubic-bezier(.22,.61,.36,1),',
    '              background-color .35s ease, border-color .35s ease, opacity 1.8s ease;',
    '  will-change: transform;',
    '}',
    'header.header-hidden { transform: translateY(-100%); }',
    'header.over-hero:not(.scrolled) {',
    '  background: transparent;',
    '  border-bottom-color: transparent;',
    '  -webkit-backdrop-filter: none;',
    '  backdrop-filter: none;',
    '}',
    // anchor targets clear the fixed bar instead of hiding behind it
    'html { scroll-padding-top: calc(var(--header-h, 78px) + 1rem); }',
    '@media (max-width: 768px) { html { --header-h: 67px; } }',
    '@media (prefers-reduced-motion: reduce) {',
    '  html { scroll-behavior: auto; }',
    '  header { transition: none; }',
    '}',
    // dark glass follows Quiet Mode (data-theme is set before first paint
    // by the bootstrap script in every page head)
    'html[data-theme="dark"] header { background: var(--bg, #0e1013); border-bottom-color: rgba(255,255,255,0.08); }',
    'html[data-theme="dark"] header.over-hero:not(.scrolled) { background: transparent; border-bottom-color: transparent; }',
    '@media (prefers-reduced-motion: reduce) {',
    '  header { transition-duration: .15s, 1.8s; }',
    '}',
    // ── menu list + the direct session links nested under The Sessions ──
    '.side-menu nav .menu-list,',
    '.side-menu nav .menu-sublist { list-style: none; margin: 0; padding: 0; }',
    '.side-menu nav .menu-list { display: flex; flex-direction: column; gap: 2rem; }',
    '.side-menu nav .menu-list > li { display: flex; flex-direction: column; }',
    '.side-menu nav .menu-sublist { margin-top: 1.1rem; padding-left: 1.1rem;',
    '  border-left: 1px solid rgba(26,26,26,0.12); display: flex; flex-direction: column; gap: 0.3rem; }',
    '.side-menu nav .menu-sublink {',
    "  font-family: 'IBM Plex Mono', ui-monospace, monospace;",
    '  font-size: 0.72rem; letter-spacing: 0.14em; text-transform: uppercase;',
    '  font-weight: 400; color: #595959; text-decoration: none;',
    '  display: inline-flex; align-items: center; padding: 0.35rem 0; min-height: 44px;',
    '}',
    '.side-menu nav .menu-sublink:hover,',
    '.side-menu nav .menu-sublink:focus-visible { color: #1a1a1a; }',
    '.side-menu nav .menu-sublink.current { color: #1a1a1a; font-weight: 500; }',
    'html[data-theme="dark"] .side-menu nav .menu-sublist { border-left-color: rgba(255,255,255,0.16); }',
    'html[data-theme="dark"] .side-menu nav .menu-sublink { color: rgba(255,255,255,0.62); }',
    'html[data-theme="dark"] .side-menu nav .menu-sublink:hover,',
    'html[data-theme="dark"] .side-menu nav .menu-sublink:focus-visible,',
    'html[data-theme="dark"] .side-menu nav .menu-sublink.current { color: #fff; }',
    'body.a11y-high-contrast .side-menu nav .menu-sublink { color: #1a1a1a !important; }'
  ].join('\n');
  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  /* ── 3. Transparent over the hero, opaque past it ──
     An IntersectionObserver on the hero, not a scroll listener: the
     browser reports the crossing itself, so there is no per-frame work
     and no threshold to keep in sync with the hero's height. */
  /* Opt-in, not automatic: a transparent bar puts the ink logo straight
     onto the hero image, and the session-page plates have dark regions
     at the top where it measures under 4.5:1. A page marks its hero
     data-hero="light" only when the whole strip under the bar is light. */
  var hero = document.querySelector('.hero[data-hero="light"]');
  if (hero && 'IntersectionObserver' in window) {
    header.classList.add('over-hero');
    // Shrink the observation box down by the bar's own height, so the
    // hero stops intersecting exactly when its last pixel slides under
    // the bar — the moment the bar needs a background.
    var mark = function () {
      var h = Math.round(header.getBoundingClientRect().height) || 78;
      document.documentElement.style.setProperty('--header-h', h + 'px');
      return h;
    };
    var heroObs = new IntersectionObserver(function (entries) {
      header.classList.toggle('scrolled', !entries[0].isIntersecting);
    }, { rootMargin: '-' + mark() + 'px 0px 0px 0px', threshold: 0 });
    heroObs.observe(hero);
  }

  /* ── 4. Smart scroll: hide going down, reveal going up ── */
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

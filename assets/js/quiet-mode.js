/* ECHO.11 — Quiet Mode behavior
   The theme itself is resolved before first paint by the inline
   bootstrap in each page's <head>. This script adds the interactive
   layer: the sun/moon toggle next to the clock, the 1s crossfade on
   toggle, persistence, and live system-preference tracking while the
   user hasn't made a manual choice. */
(function () {
  'use strict';

  var KEY = 'echo11_theme';
  var root = document.documentElement;

  function stored() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }

  function apply(theme, fade) {
    if (fade) {
      root.classList.add('theme-fade');
      setTimeout(function () { root.classList.remove('theme-fade'); }, 1100);
    }
    root.setAttribute('data-theme', theme);
    // keep the browser chrome color in sync
    var meta = document.querySelector('meta[name="theme-color"]:not([media])');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'theme-color';
      document.head.appendChild(meta);
    }
    meta.content = theme === 'dark' ? '#0e1013' : '#fafafa';
  }

  /* sun/moon toggle, next to the live clock */
  var headerRight = document.querySelector('.header-right');
  if (headerRight) {
    var btn = document.createElement('button');
    btn.className = 'quiet-toggle';
    btn.setAttribute('aria-label', 'Toggle quiet mode (dark theme)');
    btn.innerHTML =
      '<svg class="icon-moon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" aria-hidden="true">' +
      '<path stroke-linecap="round" stroke-linejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"/></svg>' +
      '<svg class="icon-sun" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" aria-hidden="true">' +
      '<path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"/></svg>';
    headerRight.insertBefore(btn, headerRight.firstChild);

    btn.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem(KEY, next); } catch (e) {}
      apply(next, true);
    });
  }

  /* no manual choice yet: follow live system-preference changes */
  var mq = window.matchMedia('(prefers-color-scheme: dark)');
  if (mq.addEventListener) {
    mq.addEventListener('change', function () {
      if (!stored()) apply(mq.matches ? 'dark' : 'light', true);
    });
  }
})();

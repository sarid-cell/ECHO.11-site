/* ECHO.11 — homepage glass: pointer tilt + glare, and word-by-word headlines.
   Fine pointers only for the tilt; nothing runs for prefers-reduced-motion. */
(function () {
  'use strict';
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  /* Headlines marked .split get one span per word; the page's own
     reveal observer adds .visible, and CSS staggers the words in. */
  document.querySelectorAll('.split').forEach(function (el) {
    var words = el.textContent.trim().split(/\s+/);
    el.innerHTML = words.map(function (w, i) {
      return '<span class="w" style="--w:' + i + '">' + w.replace(/[&<>]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]; }) + '</span>';
    }).join(' ');
  });

  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  var MAX = 7; /* degrees */
  document.querySelectorAll('.tilt').forEach(function (el) {
    var raf = 0, px = 0, py = 0;
    function apply() {
      raf = 0;
      var r = el.getBoundingClientRect();
      var x = (px - r.left) / r.width, y = (py - r.top) / r.height;
      el.style.setProperty('--ry', ((x - 0.5) * 2 * MAX).toFixed(2) + 'deg');
      el.style.setProperty('--rx', ((0.5 - y) * 2 * MAX).toFixed(2) + 'deg');
      el.style.setProperty('--mx', (x * 100).toFixed(1) + '%');
      el.style.setProperty('--my', (y * 100).toFixed(1) + '%');
    }
    el.addEventListener('pointermove', function (e) {
      px = e.clientX; py = e.clientY; el.classList.add('is-tilting');
      if (!raf) raf = requestAnimationFrame(apply);
    });
    el.addEventListener('pointerleave', function () {
      el.classList.remove('is-tilting');
      el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg');
    });
  });
})();

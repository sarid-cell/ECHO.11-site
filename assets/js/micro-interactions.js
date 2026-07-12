/* ECHO.11 — magnetic buttons
   Primary action buttons drift a few pixels toward the cursor while
   hovered and ease home on leave (the .magnetic transition in
   micro-interactions.css smooths every step, so no rAF loop is
   needed). Fine-pointer devices only; a live switch to reduced
   motion releases any held offset. */
(function () {
  'use strict';

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var finePointer   = window.matchMedia('(hover: hover) and (pointer: fine)');
  if (!finePointer.matches) return;

  var PULL = 0.22;      // fraction of cursor offset from center
  var MAGNETS = '.more-articles-btn, .edition-btn, .social-btn';

  document.querySelectorAll(MAGNETS).forEach(function (el) {
    el.classList.add('magnetic');

    el.addEventListener('pointermove', function (e) {
      if (reducedMotion.matches) return;
      var r = el.getBoundingClientRect();
      var x = (e.clientX - r.left - r.width / 2) * PULL;
      var y = (e.clientY - r.top - r.height / 2) * PULL;
      el.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px)';
    });

    el.addEventListener('pointerleave', function () {
      el.style.transform = '';
    });
  });

  if (reducedMotion.addEventListener) {
    reducedMotion.addEventListener('change', function () {
      if (reducedMotion.matches) {
        document.querySelectorAll('.magnetic').forEach(function (el) {
          el.style.transform = '';
        });
      }
    });
  }
})();

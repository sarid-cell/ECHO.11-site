/* ECHO.11 — signature "echo" ripple
   Loaded on every page. The brand motif as interaction: pointer presses
   emit expanding concentric sound-wave rings; hovering an interactive
   element emits a single soft ring from the cursor dot.
   Calm-technology rules: thin 1px monochrome strokes, low opacity,
   canvas is pointer-events:none (never intercepts clicks), the rAF loop
   only runs while rings are alive, and prefers-reduced-motion disables
   the effect entirely (live-tracked, not just at load). */
(function () {
  'use strict';

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var canHover      = window.matchMedia('(hover: hover) and (pointer: fine)');

  var canvas = null, ctx = null;
  var rings = [];            // { x, y, born, delay, duration, maxRadius, alpha }
  var rafId = null;
  var dpr = 1;

  /* ── canvas lifecycle ── */
  function ensureCanvas() {
    if (canvas) return;
    canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    // below the a11y widget (9998) and cursor dot (9999)
    canvas.style.cssText =
      'position:fixed;inset:0;width:100%;height:100%;' +
      'pointer-events:none;z-index:9990;';
    document.body.appendChild(canvas);
    ctx = canvas.getContext('2d');
    resize();
    window.addEventListener('resize', resize);
  }

  function resize() {
    if (!canvas) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width  = Math.round(window.innerWidth  * dpr);
    canvas.height = Math.round(window.innerHeight * dpr);
  }

  /* ink color follows the page theme (e.g. dark pages via supports-dark) */
  function inkColor() {
    var c = getComputedStyle(document.body).color;
    var m = c.match(/\d+/g);
    return m ? m[0] + ',' + m[1] + ',' + m[2] : '26,26,26';
  }

  /* ── ring model ── */
  function spawn(x, y, opts) {
    ensureCanvas();
    rings.push({
      x: x, y: y,
      born: performance.now(),
      delay: opts.delay || 0,
      duration: opts.duration,
      maxRadius: opts.maxRadius,
      alpha: opts.alpha,
      ink: inkColor()
    });
    if (rafId === null) rafId = requestAnimationFrame(draw);
  }

  function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

  function draw(now) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    var alive = [];
    for (var i = 0; i < rings.length; i++) {
      var r = rings[i];
      var t = (now - r.born - r.delay) / r.duration;
      if (t < 0) { alive.push(r); continue; }   // stagger not started yet
      if (t >= 1) continue;
      var eased  = easeOutCubic(t);
      var radius = 4 + eased * r.maxRadius;
      ctx.beginPath();
      ctx.arc(r.x * dpr, r.y * dpr, radius * dpr, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(' + r.ink + ',' + (r.alpha * (1 - t)) + ')';
      ctx.lineWidth = dpr;                       // 1px in CSS pixels
      ctx.stroke();
      alive.push(r);
    }
    rings = alive;
    rafId = rings.length ? requestAnimationFrame(draw) : null;
  }

  /* ── emitters ── */
  function onPress(e) {
    if (reducedMotion.matches) return;
    // three staggered rings — the "echo"
    for (var i = 0; i < 3; i++) {
      spawn(e.clientX, e.clientY, {
        delay: i * 130,
        duration: 950,
        maxRadius: 110,
        alpha: 0.3 - i * 0.07
      });
    }
  }

  var lastHovered = null;
  function onHover(e) {
    if (reducedMotion.matches || !canHover.matches) return;
    var el = e.target.closest('a, button, input, select, textarea, [role="button"]');
    if (!el || el === lastHovered) { if (!el) lastHovered = null; return; }
    lastHovered = el;
    // one soft ring from the cursor dot
    spawn(e.clientX, e.clientY, { duration: 600, maxRadius: 36, alpha: 0.22 });
  }

  document.addEventListener('pointerdown', onPress, { passive: true });
  document.addEventListener('mouseover', onHover, { passive: true });

  /* honor a live switch to reduced motion: drop in-flight rings too */
  function onMotionChange() {
    if (reducedMotion.matches && canvas) {
      rings = [];
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; }
    }
  }
  if (reducedMotion.addEventListener) reducedMotion.addEventListener('change', onMotionChange);
})();

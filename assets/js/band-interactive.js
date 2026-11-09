/* ECHO.11 — interactive pieces of a band page (first used on delta.html)
   1. Feel the rhythm: a slider that redraws a wave at 0.5–4 Hz
   2. A night of sleep: cycle chips that light up one sleep cycle
   3. Moving EEG: pause / play, and paused while off screen
   4. Floating Listen pill: shown once the hero is gone
   No libraries. Animations run only while visible, never for
   prefers-reduced-motion, and every moving part has a pause. */
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasIO = 'IntersectionObserver' in window;

  function track(name, params) {
    if (window.gtag) gtag('event', name, Object.assign({ page: location.pathname }, params || {}));
  }

  function whenVisible(el, cb) {
    if (!hasIO) { cb(true); return; }
    new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { cb(e.isIntersecting); });
    }, { rootMargin: '80px 0px' }).observe(el);
  }

  /* ── 1. Feel the rhythm ── */
  var rhythm = document.querySelector('[data-rhythm]');
  if (rhythm) {
    var range = rhythm.querySelector('input[type="range"]');
    var out = rhythm.querySelector('[data-rhythm-hz]');
    var line = rhythm.querySelector('[data-rhythm-line]');
    var wave = rhythm.querySelector('.r-wave');
    var dot = rhythm.querySelector('.r-dot');
    var pauseBtn = rhythm.querySelector('.band-pause');
    var chips = rhythm.querySelectorAll('.band-chip[data-hz]');
    var W = 600, MID = 65, AMP = 48, PX_PER_S = 300, DOT_X = 36;
    var hz = parseFloat(range.value), phase = 0, last = 0, raf = 0;
    var visible = false, paused = reduce, touched = false;

    function y(x) { return MID - AMP * Math.sin(2 * Math.PI * hz * (x / PX_PER_S) - phase); }

    function draw() {
      var d = 'M0,' + y(0).toFixed(1);
      for (var x = 4; x <= W; x += 4) d += ' L' + x + ',' + y(x).toFixed(1);
      wave.setAttribute('d', d);
      dot.setAttribute('cy', y(DOT_X).toFixed(1));
    }

    function words(f) {
      var rate = f < 1 ? 'One wave every ' + (1 / f) + ' seconds.' :
                 f === 1 ? 'One wave a second.' : f + ' waves a second.';
      var note;
      if (f < 1) note = 'Under about 1 Hz, many papers call this a slow oscillation rather than delta.';
      else if (f <= 2) note = 'Inside the 0.5 to 2 Hz range a sleep lab counts toward stage N3, when the waves are also large enough.';
      else if (f < 4) note = 'Still delta, but faster than the slow waves that score stage N3.';
      else note = 'The top edge of delta. A little faster and it is theta.';
      return '<strong>' + f + ' Hz:</strong> ' + rate + ' ' + note;
    }

    function setHz(f, source) {
      hz = f;
      range.value = f;
      out.textContent = f + ' Hz';
      line.innerHTML = words(f);
      chips.forEach(function (c) { c.setAttribute('aria-pressed', String(parseFloat(c.dataset.hz) === f)); });
      draw();
      if (!touched && source) { touched = true; track('band_rhythm_interact', { source: source }); }
    }

    function frame(t) {
      if (!last) last = t;
      phase += 2 * Math.PI * hz * ((t - last) / 1000);
      phase %= 2 * Math.PI;
      last = t;
      draw();
      raf = requestAnimationFrame(frame);
    }
    function start() { if (!raf && visible && !paused) { last = 0; raf = requestAnimationFrame(frame); } }
    function stop() { if (raf) { cancelAnimationFrame(raf); raf = 0; } }

    range.addEventListener('input', function () { setHz(parseFloat(range.value), 'slider'); });
    chips.forEach(function (c) {
      c.addEventListener('click', function () { setHz(parseFloat(c.dataset.hz), 'preset'); });
    });
    if (pauseBtn) {
      if (reduce) { pauseBtn.hidden = true; }
      pauseBtn.addEventListener('click', function () {
        paused = !paused;
        pauseBtn.textContent = paused ? 'Play' : 'Pause';
        pauseBtn.setAttribute('aria-pressed', String(paused));
        paused ? stop() : start();
      });
    }
    whenVisible(rhythm, function (v) { visible = v; v ? start() : stop(); });
    setHz(hz);
  }

  /* ── 2. A night of sleep ── */
  var night = document.querySelector('[data-night]');
  if (night) {
    var nLine = night.querySelector('.n-line');
    var nCycles = night.querySelectorAll('.n-cycle');
    var nChips = night.querySelectorAll('.band-chip[data-cycle]');
    var nLive = night.querySelector('[data-night-line]');
    var nTouched = false;

    function pick(i, source) {
      nCycles.forEach(function (r) { r.classList.toggle('is-on', r.dataset.cycle === i); });
      nChips.forEach(function (c) { c.setAttribute('aria-pressed', String(c.dataset.cycle === i)); });
      var chip = night.querySelector('.band-chip[data-cycle="' + i + '"]');
      if (chip) nLive.innerHTML = chip.dataset.text;
      /* On a narrow screen the chart scrolls sideways: bring the picked cycle into view */
      var box = night.querySelector('.band-night-scroll');
      var on = night.querySelector('.n-cycle.is-on');
      if (source && box && on && box.scrollWidth > box.clientWidth) {
        var r = on.getBoundingClientRect(), b = box.getBoundingClientRect();
        box.scrollBy({ left: (r.left + r.width / 2) - (b.left + b.width / 2), behavior: reduce ? 'auto' : 'smooth' });
      }
      if (!nTouched && source) { nTouched = true; track('band_night_interact', { cycle: i }); }
    }
    nChips.forEach(function (c) { c.addEventListener('click', function () { pick(c.dataset.cycle, 'chip'); }); });
    nCycles.forEach(function (r) { r.addEventListener('click', function () { pick(r.dataset.cycle, 'chart'); }); });

    /* Draw the line in once, the first time the chart is seen */
    if (!reduce && nLine && nLine.getTotalLength && hasIO) {
      var len = Math.ceil(nLine.getTotalLength());
      nLine.style.setProperty('--len', len);
      nLine.style.strokeDasharray = len;
      nLine.style.strokeDashoffset = len;
      var io = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) { nLine.classList.add('is-drawing'); io.disconnect(); }
      }, { threshold: 0.35 });
      io.observe(night);
    }
    pick('1');
  }

  /* ── 3. Moving EEG ── */
  document.querySelectorAll('[data-eeg]').forEach(function (fig) {
    var btn = fig.querySelector('.band-pause');
    var userPaused = reduce;
    if (reduce && btn) btn.hidden = true;
    if (btn) btn.addEventListener('click', function () {
      userPaused = !userPaused;
      btn.textContent = userPaused ? 'Play' : 'Pause';
      btn.setAttribute('aria-pressed', String(userPaused));
      fig.classList.toggle('is-paused', userPaused);
    });
    whenVisible(fig, function (v) { fig.classList.toggle('is-paused', userPaused || !v); });
  });

  /* ── 4. Floating Listen pill ── */
  var pill = document.querySelector('.band-float');
  var hero = document.querySelector('.band-hero');
  if (pill && hero && hasIO) {
    var heroOut = false, blockers = 0;
    var seen = new Map();
    function update() {
      var on = heroOut && blockers === 0;
      pill.classList.toggle('is-on', on);
      pill.tabIndex = on ? 0 : -1;
      pill.setAttribute('aria-hidden', String(!on));
    }
    new IntersectionObserver(function (e) { heroOut = !e[0].isIntersecting; update(); }).observe(hero);
    var bio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { seen.set(e.target, e.isIntersecting); });
      blockers = 0; seen.forEach(function (v) { if (v) blockers++; });
      update();
    });
    document.querySelectorAll('[data-float-hide], footer').forEach(function (el) { bio.observe(el); });
    pill.addEventListener('click', function () { track('band_float_listen_click'); });
    update();
  }
})();

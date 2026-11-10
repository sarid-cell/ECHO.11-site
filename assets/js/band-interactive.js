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
    /* data-window: seconds drawn across the box; data-slow: how many times slower it plays */
    var WIN = parseFloat(rhythm.dataset.window || '2'), SLOW = parseFloat(rhythm.dataset.slow || '1');
    var GAMMA = rhythm.dataset.band === 'gamma';
    var THETA = rhythm.dataset.band === 'theta';
    var ALPHA = rhythm.dataset.band === 'alpha';
    var W = 600, MID = 65, AMP = GAMMA ? 34 : 48, PX_PER_S = W / WIN, DOT_X = 36;
    var hz = parseFloat(range.value), phase = 0, last = 0, raf = 0;
    var visible = false, paused = reduce, touched = false;
    /* Alpha only: eyes open blocks the rhythm. mix runs 0 (eyes closed) to 1 (eyes open). */
    var eyesBtn = rhythm.querySelector('[data-eyes]'), eyesLine = rhythm.querySelector('[data-eyes-line]');
    var mix = 0, mixTarget = 0;
    /* Beta only: hold "move" and sensorimotor beta drops; let go and it rebounds above baseline, then settles. */
    var BETA = rhythm.dataset.band === 'beta';
    var moveBtn = rhythm.querySelector('[data-move]'), moveLine = rhythm.querySelector('[data-move-line]');
    var env = 1, envTarget = 1, settleT = 0;

    function y(x) {
      var t = x / PX_PER_S, a = 2 * Math.PI * hz * t - phase;
      if (BETA) return MID - env * AMP * 0.72 * (0.82 * Math.sin(a) + 0.26 * Math.sin(1.53 * a + 0.7));
      if (!ALPHA || mix === 0) return MID - AMP * Math.sin(a);
      /* Eyes open: a small, faster, irregular trace (beta-range ripples) */
      var k = phase / hz, fast = 7 * Math.sin(2 * Math.PI * 19 * t - 19 * k + 1.3)
              + 5 * Math.sin(2 * Math.PI * 26 * t - 26 * k + 0.4)
              + 4 * Math.sin(2 * Math.PI * 33 * t - 33 * k + 2.1);
      return MID - ((1 - mix * 0.85) * AMP * Math.sin(a) + mix * fast);
    }

    function draw() {
      var d = 'M0,' + y(0).toFixed(1);
      for (var x = 4; x <= W; x += 4) d += ' L' + x + ',' + y(x).toFixed(1);
      wave.setAttribute('d', d);
      dot.setAttribute('cy', y(DOT_X).toFixed(1));
    }

    function wordsGamma(f) {
      var note;
      if (f <= 30) note = 'The bottom edge of gamma. A little slower and it is beta.';
      else if (f === 40) note = 'The rate most experiments use.';
      else if (f < 100) note = 'Mid gamma. On a scalp EEG, jaw and eye muscles make signal in this range too.';
      else note = 'The upper edge most often given for gamma.';
      return '<strong>' + f + ' Hz:</strong> ' + f + ' waves a second. ' + note;
    }
    function words(f) {
      if (GAMMA) return wordsGamma(f);
      if (BETA) {
        var bn = f <= 13 ? 'The bottom edge of beta. A little slower and it is alpha.'
               : f >= 30 ? 'The top edge most often given for beta. Faster than this is gamma.'
               : 'Inside beta, the everyday rhythm of being awake.';
        return '<strong>' + f + ' Hz:</strong> ' + f + ' waves a second. ' + bn;
      }
      if (ALPHA) {
        var an = f <= 8 ? 'The bottom edge of alpha. A little slower and it is theta.'
               : f >= 13 ? 'The top edge of alpha. A little faster and it is beta.'
               : f === 10 ? 'The middle of alpha, close to where most adults peak.' : 'Inside alpha, the eyes-closed resting rhythm.';
        return '<strong>' + f + ' Hz:</strong> ' + f + ' waves a second. ' + an;
      }
      if (THETA) {
        var tn = f <= 4 ? 'The bottom edge of theta. A little slower and it is delta, the deep-sleep band.'
               : f >= 8 ? 'The top edge of theta. A little faster and it is alpha, the calm, eyes-closed rhythm.'
               : f === 6 ? 'The middle of theta.' : 'Inside theta, the drowsy in-between band.';
        return '<strong>' + f + ' Hz:</strong> ' + f + ' waves a second. ' + tn;
      }
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
      if (BETA && env !== envTarget) {
        env += (envTarget - env) * Math.min(1, (t - last) / 220);
        if (Math.abs(envTarget - env) < 0.005) env = envTarget;
      }
      if (mix !== mixTarget) {
        var step = (t - last) / 450;
        mix = mixTarget > mix ? Math.min(mixTarget, mix + step) : Math.max(mixTarget, mix - step);
      }
      phase += 2 * Math.PI * hz * ((t - last) / 1000) / SLOW;
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
    if (eyesBtn) {
      var eyesTouched = false;
      eyesBtn.addEventListener('click', function () {
        var open = eyesBtn.getAttribute('aria-pressed') !== 'true';
        eyesBtn.setAttribute('aria-pressed', String(open));
        eyesBtn.textContent = open ? 'Close your eyes' : 'Open your eyes';
        rhythm.classList.toggle('is-eyes-open', open);
        mixTarget = open ? 1 : 0;
        if (paused || !raf) { mix = mixTarget; draw(); }
        if (eyesLine) eyesLine.innerHTML = open
          ? '<strong>Eyes open:</strong> the big, even wave breaks up into small, faster activity. Clinicians call this alpha blocking.'
          : '<strong>Eyes closed:</strong> a large, regular wave over the back of the head. This is what Hans Berger saw in 1929.';
        if (!eyesTouched) { eyesTouched = true; track('band_eyes_interact', { state: open ? 'open' : 'closed' }); }
      });
    }
    if (moveBtn) {
      var moving = false, moveTouched = false;
      var LINES = {
        rest: '<strong>At rest:</strong> steady beta over the motor areas of the brain.',
        move: '<strong>Moving:</strong> beta drops while a movement is planned and made.',
        rebound: '<strong>Just stopped:</strong> beta overshoots above where it started, then settles. This is the beta rebound.'
      };
      function setEnv(v) { envTarget = v; if (paused || !raf) { env = v; draw(); } }
      function press(e) {
        if (moving) return;
        if (e && e.type === 'pointerdown') { try { moveBtn.setPointerCapture(e.pointerId); } catch (x) {} }
        moving = true; clearTimeout(settleT);
        moveBtn.setAttribute('aria-pressed', 'true'); rhythm.classList.add('is-moving');
        setEnv(0.28); if (moveLine) moveLine.innerHTML = LINES.move;
        if (!moveTouched) { moveTouched = true; track('band_move_interact', {}); }
      }
      function release() {
        if (!moving) return;
        moving = false;
        moveBtn.setAttribute('aria-pressed', 'false'); rhythm.classList.remove('is-moving');
        setEnv(1.55); if (moveLine) moveLine.innerHTML = LINES.rebound;
        settleT = setTimeout(function () { setEnv(1); if (moveLine) moveLine.innerHTML = LINES.rest; }, 1600);
      }
      moveBtn.addEventListener('pointerdown', press);
      ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(function (ev) { moveBtn.addEventListener(ev, release); });
      moveBtn.addEventListener('keydown', function (e) { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); press(); } });
      moveBtn.addEventListener('keyup', function (e) { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); release(); } });
      moveBtn.addEventListener('contextmenu', function (e) { e.preventDefault(); });
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

/* ── 5. Source previews and the table of contents ── */
(function () {
  'use strict';
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* Hover or focus a source number: show the reference it points to */
  var tip = null;
  function showTip(a) {
    var li = document.getElementById(a.hash.slice(1));
    if (!li) return;
    if (!tip) { tip = document.createElement('div'); tip.className = 'band-ref-tip'; tip.setAttribute('role', 'tooltip'); document.body.appendChild(tip); }
    var text = li.textContent.replace(/\s+/g, ' ').trim();
    tip.textContent = text.length > 170 ? text.slice(0, 167) + '…' : text;
    tip.hidden = false;
    var r = a.getBoundingClientRect();
    var left = Math.min(window.scrollX + r.left - 12, window.scrollX + document.documentElement.clientWidth - tip.offsetWidth - 16);
    tip.style.left = Math.max(window.scrollX + 12, left) + 'px';
    tip.style.top = (window.scrollY + r.bottom + 10) + 'px';
  }
  function hideTip() { if (tip) tip.hidden = true; }
  document.querySelectorAll('.band-page--editorial .band-ref a').forEach(function (a) {
    if (finePointer) { a.addEventListener('mouseenter', function () { showTip(a); }); a.addEventListener('mouseleave', hideTip); }
    a.addEventListener('focus', function () { showTip(a); });
    a.addEventListener('blur', hideTip);
  });
  addEventListener('scroll', hideTip, { passive: true });

  /* Table of contents: mark the section being read */
  var links = Array.prototype.slice.call(document.querySelectorAll('.band-toc a'));
  if (!links.length) return;
  var heads = links.map(function (a) { return document.getElementById(a.hash.slice(1)); });
  var ticking = false, current = -1;
  function mark() {
    ticking = false;
    var line = window.innerHeight * 0.35, idx = 0;
    for (var i = 0; i < heads.length; i++) { if (heads[i] && heads[i].getBoundingClientRect().top < line) idx = i; }
    if (idx === current) return;
    current = idx;
    links.forEach(function (a, i) { a.classList.toggle('is-current', i === idx); if (i === idx) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
  }
  addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(mark); } }, { passive: true });
  mark();
})();

/* ── 6. Folds and reveals ── */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* A source link or a #hash that points inside a closed fold opens it first */
  function openFor(id) {
    var el = id && document.getElementById(id);
    if (!el) return;
    var d = el.closest('details');
    while (d) { d.open = true; d = d.parentElement && d.parentElement.closest('details'); }
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (a) openFor(a.hash.slice(1));
  });
  if (location.hash) openFor(location.hash.slice(1));
  addEventListener('hashchange', function () { openFor(location.hash.slice(1)); });
  document.querySelectorAll('details.band-more').forEach(function (d) {
    d.addEventListener('toggle', function () {
      if (d.open && window.gtag) gtag('event', 'band_fold_open', { label: d.querySelector('.band-more-label').textContent, page: location.pathname });
    });
  });

  /* Reveal: only things still below the fold, so nothing on screen ever blinks */
  if (reduce || !('IntersectionObserver' in window)) return;
  var body = document.querySelector('.band-page--editorial .essay-body');
  if (!body) return;
  var fold = window.innerHeight;
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -8% 0px' });

  function below(el) { return el.getBoundingClientRect().top > fold; }

  body.querySelectorAll(':scope > h2').forEach(function (h) {
    if (!below(h)) return;
    var i = 0;
    /* One wrapper, so the words stay one grid item beside the number */
    var wrap = document.createElement('span'); wrap.className = 'h-text';
    while (h.firstChild) wrap.appendChild(h.firstChild);
    h.appendChild(wrap);
    Array.prototype.slice.call(wrap.childNodes).forEach(function (n) {
      if (n.nodeType !== 3) return;
      var frag = document.createDocumentFragment();
      n.textContent.split(/(\s+)/).forEach(function (part) {
        if (!part) return;
        if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
        var s = document.createElement('span'); s.className = 'w'; s.style.setProperty('--i', i++); s.textContent = part; frag.appendChild(s);
      });
      n.replaceWith(frag);
    });
    h.classList.add('rv-words'); io.observe(h);
  });

  /* Swipe-row cards are skipped: they sit off to the side, not below the fold */
  var groups = '.band-glance tr, .band-facts li, .band-stages:not(.band-stages--three) > .band-stage, .band-verdict-cell';
  body.querySelectorAll(groups).forEach(function (el) {
    if (!below(el)) return;
    var sibs = Array.prototype.indexOf.call(el.parentElement.children, el);
    el.style.setProperty('--d', (sibs % 4) * 90 + 'ms');
    el.classList.add('rv'); io.observe(el);
  });
  body.querySelectorAll(':scope > p, :scope > figure, :scope > h3, :scope > details, :scope > .band-scroll, :scope > a.band-listen, :scope > .band-shelf, :scope > .band-faq').forEach(function (el) {
    if (!below(el)) return;
    el.classList.add('rv'); io.observe(el);
  });
})();

/* ── 7. Tabs: pick one panel of several (theta's three faces) ── */
(function () {
  'use strict';
  document.querySelectorAll('[data-faces]').forEach(function (box) {
    var chips = box.querySelectorAll('.band-chip[data-face]');
    var panels = box.querySelectorAll('[data-face-panel]');
    var touched = false;
    chips.forEach(function (c) {
      c.addEventListener('click', function () {
        chips.forEach(function (x) { x.setAttribute('aria-pressed', String(x === c)); });
        panels.forEach(function (pn) { pn.hidden = pn.dataset.facePanel !== c.dataset.face; });
        if (!touched && window.gtag) { touched = true; gtag('event', 'band_faces_interact', { face: c.dataset.face, page: location.pathname }); }
      });
    });
  });
})();

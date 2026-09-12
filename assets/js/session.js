/* ECHO.11 frequency session engine — shared by every frequency page.
   Each page declares one config object before this script loads:

   window.ECHO_SESSION = {
     id: "10hz",                     // short slug for storage/analytics keys
     label: "The 11-Minute Reset",   // session name (Media Session title)
     band: "Alpha",                  // brainwave band name
     beatHz: 10,                     // perceived beat frequency
     leftHz: 200,                    // left-ear carrier tone (Hz)
     rightHz: 210,                   // right-ear carrier tone (Hz)
     durationMin: 11,                // session length in minutes
     loop: false,                    // initial state of the Loop toggle
     ogImage: "assets/images/10hz-og.jpg", // Media Session artwork (optional)
     strings: { ... }                // UI copy overrides (optional, see STRINGS)
   };

   Everything else (aria labels, timer, analytics dimensions) is derived.
   `strings` exists so a translated page can run this same engine rather
   than fork it; anything it leaves out falls back to the English below. */
(function () {
'use strict';
var cfg = Object.assign({
    id: 'session',
    label: 'ECHO.11 Session',
    band: '',
    beatHz: 10,
    leftHz: 200,
    rightHz: 210,
    durationMin: 11,
    loop: false,
    ogImage: ''
}, window.ECHO_SESSION || {});

var STRINGS = Object.assign({
    play:       'Play the '  + cfg.beatHz + 'Hz session',
    pause:      'Pause the ' + cfg.beatHz + 'Hz session',
    active:     'Session active',
    paused:     'Paused — press play to continue',
    complete:   'Session complete.',
    cycles:     function (n) { return n + ' continuous cycles'; },
    sessionsToday: function (n) { return n + ' sessions today'; }
}, cfg.strings || {});
cfg.playLabel  = STRINGS.play;
cfg.pauseLabel = STRINGS.pause;

// Menu
const hamburger = document.getElementById('hamburger');
const sideMenu  = document.getElementById('sideMenu');
const menuOverlay = document.getElementById('menuOverlay');
function toggleMenu() {
    const isOpen = sideMenu.classList.contains('active');
    hamburger.classList.toggle('active');
    sideMenu.classList.toggle('active');
    menuOverlay.classList.toggle('active');
    hamburger.setAttribute('aria-expanded', !isOpen);
    sideMenu.setAttribute('aria-hidden', isOpen);
    if (isOpen) { sideMenu.setAttribute('inert', ''); } else { sideMenu.removeAttribute('inert'); }
    document.body.style.overflow = isOpen ? '' : 'hidden';
}
hamburger.addEventListener('click', toggleMenu);
menuOverlay.addEventListener('click', toggleMenu);
document.querySelectorAll('.menu-link').forEach(l => l.addEventListener('click', () => {
    if (sideMenu.classList.contains('active')) toggleMenu();
}));
document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && sideMenu.classList.contains('active')) toggleMenu();
});

// Clock — only on pages that still render one in the header
const clockEl = document.getElementById('clock');
if (clockEl) {
    const updateClock = () => {
        const now = new Date();
        clockEl.textContent = [now.getHours(),now.getMinutes(),now.getSeconds()]
            .map(n=>String(n).padStart(2,'0')).join(':');
    };
    setInterval(updateClock, 1000); updateClock();
}

// Cursor
const dot = document.querySelector('.cursor-dot');
if (dot && window.innerWidth > 768) {
    document.addEventListener('mousemove', e => {
        dot.style.left = e.clientX+'px'; dot.style.top = e.clientY+'px';
    });
    document.querySelectorAll('a,button').forEach(el => {
        el.addEventListener('mouseenter', ()=>dot.classList.add('hover'));
        el.addEventListener('mouseleave', ()=>dot.classList.remove('hover'));
    });
}

// Reveal
const obs = new IntersectionObserver(entries => {
    entries.forEach(e => { if(e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.1 });
document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
window.addEventListener('load', () => {
    document.querySelectorAll('.reveal').forEach(el => {
        if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add('visible');
    });
});

// Fallback so off-screen sections aren't left at opacity:0 for crawlers/non-scrolling renders
setTimeout(() => document.querySelectorAll('.reveal').forEach(el => el.classList.add('visible')), 2500);

// ── BINAURAL AUDIO ENGINE ──
let audioCtx, oscL, oscR, gainL, gainR, analyser, isPlaying = false;
const FADE_IN = 1.5, FADE_OUT = 0.9, LEVEL = 0.2;

function startAudio() {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const merger = audioCtx.createChannelMerger(2);
    merger.connect(audioCtx.destination);
    const t0 = audioCtx.currentTime;

    oscL = audioCtx.createOscillator(); oscL.type = 'sine';
    oscL.frequency.value = cfg.leftHz;
    gainL = audioCtx.createGain();
    gainL.gain.setValueAtTime(0.0001, t0);
    gainL.gain.exponentialRampToValueAtTime(LEVEL, t0 + FADE_IN);
    oscL.connect(gainL); gainL.connect(merger, 0, 0);

    oscR = audioCtx.createOscillator(); oscR.type = 'sine';
    oscR.frequency.value = cfg.rightHz; // left + beat Hz
    gainR = audioCtx.createGain();
    gainR.gain.setValueAtTime(0.0001, t0);
    gainR.gain.exponentialRampToValueAtTime(LEVEL, t0 + FADE_IN);
    oscR.connect(gainR); gainR.connect(merger, 0, 1);

    // analysis tap: both ears mixed to mono — the summed wave
    // physically contains the 10Hz beat the brain perceives
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 2048;
    gainL.connect(analyser); gainR.connect(analyser);

    oscL.start(); oscR.start();
    startWave();
}

function stopAudio() {
    // fade out, then release — no hard click
    const ctx = audioCtx, l = oscL, r = oscR, gl = gainL, gr = gainR;
    oscL = oscR = audioCtx = gainL = gainR = analyser = null;
    stopWave();
    if (!ctx) return;
    const t0 = ctx.currentTime;
    [gl, gr].forEach(g => {
        g.gain.cancelScheduledValues(t0);
        g.gain.setValueAtTime(Math.max(g.gain.value, 0.0001), t0);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + FADE_OUT);
    });
    setTimeout(() => {
        try { l.stop(); r.stop(); ctx.close(); } catch (e) {}
    }, FADE_OUT * 1000 + 100);
}

// ── LIVE WAVEFORM ──
// Two thin rings around the timer, displaced by the real audio
// signal. The rAF loop only runs while a session plays; on pause
// the last frame freezes and the canvas fades out via CSS.
const waveCanvas = document.getElementById('waveCanvas');
const waveCtx = waveCanvas.getContext('2d');
const reducedMotionQ = window.matchMedia('(prefers-reduced-motion: reduce)');
let waveRaf = null, waveSamples = null, waveRot = 0;
const WAVE_POINTS = 180;

function startWave() {
    if (reducedMotionQ.matches || waveRaf !== null) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    waveCanvas.width  = waveCanvas.offsetWidth  * dpr;
    waveCanvas.height = waveCanvas.offsetHeight * dpr;
    waveSamples = new Float32Array(2048);
    waveRaf = requestAnimationFrame(drawWave);
}

function stopWave() {
    if (waveRaf !== null) { cancelAnimationFrame(waveRaf); waveRaf = null; }
}

function drawWave() {
    waveRaf = null;
    if (!analyser) return;
    analyser.getFloatTimeDomainData(waveSamples);

    const w = waveCanvas.width, h = waveCanvas.height;
    const cx = w / 2, cy = h / 2;
    // sit just outside the 200px timer ring (r=90 of 200 ≈ 0.45)
    const baseR = Math.min(w, h) * 0.36;
    const amp   = Math.min(w, h) * 0.055;
    const accent = getComputedStyle(waveCanvas).color;

    waveCtx.clearRect(0, 0, w, h);
    waveCtx.lineWidth = Math.min(window.devicePixelRatio || 1, 2);
    waveCtx.strokeStyle = accent;

    // two layers, counter-rotating slowly, for gentle depth
    for (let layer = 0; layer < 2; layer++) {
        const dir = layer === 0 ? 1 : -1;
        waveCtx.globalAlpha = layer === 0 ? 0.4 : 0.18;
        waveCtx.beginPath();
        for (let i = 0; i <= WAVE_POINTS; i++) {
            const frac  = (i % WAVE_POINTS) / WAVE_POINTS;
            const angle = frac * Math.PI * 2 + waveRot * dir;
            const s = waveSamples[Math.floor(frac * waveSamples.length)];
            const r = baseR + layer * amp * 0.5 + s * amp * 2;
            const x = cx + Math.cos(angle) * r;
            const y = cy + Math.sin(angle) * r;
            i === 0 ? waveCtx.moveTo(x, y) : waveCtx.lineTo(x, y);
        }
        waveCtx.closePath();
        waveCtx.stroke();
    }
    waveCtx.globalAlpha = 1;
    waveRot += 0.0007;
    waveRaf = requestAnimationFrame(drawWave);
}

// a live switch to reduced motion stops the loop mid-session
if (reducedMotionQ.addEventListener) {
    reducedMotionQ.addEventListener('change', () => {
        if (reducedMotionQ.matches) stopWave();
        else if (isPlaying) startWave();
    });
}

// ── TIMER ──
const TOTAL = cfg.durationMin * 60;
const CIRC  = 2 * Math.PI * 90; // r=90
let remaining = TOTAL, timerInt = null;
const ring = document.getElementById('timerRing');
ring.style.strokeDasharray = CIRC;
ring.style.strokeDashoffset = 0;

function fmt(s) { return `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`; }
function updateRing() { ring.style.strokeDashoffset = CIRC * (1 - (TOTAL-remaining)/TOTAL); }

const playBtn  = document.getElementById('playBtn');
const timerWrap = document.querySelector('.timer-wrap');
const iconPlay = document.getElementById('iconPlay');
const iconPause= document.getElementById('iconPause');
const stateEl  = document.getElementById('stateText');
const timerEl  = document.getElementById('timerDisplay');

// state text swaps with a soft cross-fade instead of snapping
function setState(text) {
    stateEl.style.opacity = '0';
    setTimeout(() => {
        stateEl.textContent = text;
        stateEl.style.opacity = '1';
    }, 500);
}

// focus mode: the page recedes while the session plays
function enterFocus() { document.body.classList.add('session-active'); }
function exitFocus()  { document.body.classList.remove('session-active'); }

let sessionCounted = false; // count once per full session, not on every resume

// ── FUNNEL EVENTS ──
// The player is the whole product, so the drop-off points are worth
// measuring: how many see the headphone gate, how many pass it, how
// far into the session people actually get, and where they leave.
const PROGRESS_MINUTES = [1, 3, 5, 8];
let playedSeconds = 0;     // seconds of real playback this session
let progressFired = [];    // minute milestones already reported
let stopReported = false;  // one stop per interruption, reset on resume

function ev(name, params) {
    if (typeof gtag === 'function') gtag('event', name, params || {});
}
function evDims(extra) {
    return Object.assign({ hz: String(cfg.beatHz), id: cfg.id }, extra || {});
}
function reportProgress() {
    PROGRESS_MINUTES.forEach(function (m) {
        if (playedSeconds >= m * 60 && progressFired.indexOf(m) === -1) {
            progressFired.push(m);
            ev('frequency_progress', evDims({ minute: m }));
        }
    });
}
// Reasons: 'pause' (deliberate), 'hidden' (tab or app switched away),
// 'pagehide' (navigating away or closing). Beacon transport so the
// request survives the page going away.
function reportStop(reason) {
    if (stopReported || playedSeconds === 0) return;
    stopReported = true;
    ev('frequency_stop', evDims({
        seconds_played: playedSeconds,
        reason: reason,
        transport_type: 'beacon'
    }));
}

document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && isPlaying) reportStop('hidden');
});
window.addEventListener('pagehide', () => {
    if (isPlaying) reportStop('pagehide');
});

// ── LOOP ──
// With Loop on, the countdown restarts seamlessly at 0 — the audio
// graph never stops, so there is no gap or click — and the Session
// Complete modal waits until the user presses Stop (the play button).
let loopOn = false, completedCycles = 0, pendingComplete = false;
const loopToggle = document.getElementById('loopToggle');
function setLoop(on) {
    loopOn = on;
    if (loopToggle) loopToggle.setAttribute('aria-pressed', String(on));
}
if (loopToggle) {
    loopToggle.addEventListener('click', () => setLoop(!loopOn));
}
setLoop(!!cfg.loop);

function endSession() {
    clearInterval(timerInt); stopAudio();
    isPlaying = false; sessionCounted = false;
    // natural end: the finishing cycle isn't yet in completedCycles.
    // loop Stop: it is, and the in-progress partial cycle doesn't count.
    const cycles = pendingComplete ? completedCycles : completedCycles + 1;
    completedCycles = 0; pendingComplete = false;
    exitFocus();
    iconPlay.style.display = 'block'; iconPause.style.display = 'none';
    playBtn.classList.remove('playing'); timerWrap.classList.remove('playing');
    playBtn.setAttribute('aria-label', cfg.playLabel);
    setState(STRINGS.complete);
    remaining = TOTAL; timerEl.textContent = fmt(TOTAL); updateRing();
    if (typeof gtag==='function') gtag('event','frequency_complete',{duration: TOTAL * cycles, hz: String(cfg.beatHz), id: cfg.id});
    const sessionsRow = document.querySelector('.sessions-row');
    const metaParts = [];
    if (cycles > 1) metaParts.push(STRINGS.cycles(cycles));
    if (!sessionsRow.hidden) metaParts.push(STRINGS.sessionsToday(document.getElementById('sessionsNum').textContent));
    document.getElementById('completeMeta').textContent = metaParts.join(' · ');
    openModal(completeModal);
    if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'none';
}

function beginSession() {
    startAudio();
    timerInt = setInterval(() => {
        remaining--;
        playedSeconds++;
        reportProgress();
        timerEl.textContent = fmt(remaining);
        updateRing();
        if (remaining <= 0) {
            if (loopOn) {
                // seamless restart: audio keeps running, only the
                // countdown resets; the complete modal waits for Stop
                completedCycles++; pendingComplete = true;
                remaining = TOTAL;
                timerEl.textContent = fmt(remaining); updateRing();
            } else {
                endSession();
            }
        }
    }, 1000);
    isPlaying = true;
    iconPlay.style.display = 'none'; iconPause.style.display = 'block';
    playBtn.classList.add('playing'); timerWrap.classList.add('playing');
    playBtn.setAttribute('aria-label', cfg.pauseLabel);
    enterFocus();
    setState(STRINGS.active);
    stopReported = false;
    if (!sessionCounted) {
        // fresh session, not a resume — a start counted on every resume
        // would inflate the gate_confirmed -> start conversion
        sessionCounted = true;
        playedSeconds = 0; progressFired = [];
        increment();
        ev('frequency_start', evDims());
    }
    if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
            title: cfg.label,
            artist: 'ECHO.11',
            album: cfg.beatHz + 'Hz · ' + cfg.band,
            artwork: cfg.ogImage ? [{ src: cfg.ogImage, sizes: '1200x800', type: 'image/jpeg' }] : []
        });
        navigator.mediaSession.playbackState = 'playing';
    }
}

function pauseSession() {
    clearInterval(timerInt); stopAudio();
    isPlaying = false;
    reportStop('pause');
    exitFocus();
    iconPlay.style.display = 'block'; iconPause.style.display = 'none';
    playBtn.classList.remove('playing'); timerWrap.classList.remove('playing');
    playBtn.setAttribute('aria-label', cfg.playLabel);
    setState(STRINGS.paused);
    if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused';
}

playBtn.addEventListener('click', () => {
    if (!isPlaying) {
        if (sessionStorage.getItem('echo11_headphone_ack')) {
            beginSession();
        } else {
            ev('gate_shown', evDims());
            openModal(headphoneModal);
        }
    } else if (pendingComplete) {
        // a looped session has already run at least one full cycle:
        // this press is the Stop the complete modal was waiting for
        endSession();
    } else {
        pauseSession();
    }
});

// Media Session — surfaces play/pause on the lock screen,
// notification shade, and Bluetooth headphone buttons, and helps
// supporting browsers keep the session alive while the tab isn't
// in the foreground (answers "can't do anything else while it
// plays" — this is what a real music/podcast app does too).
if ('mediaSession' in navigator) {
    navigator.mediaSession.setActionHandler('play', () => {
        if (!isPlaying && sessionStorage.getItem('echo11_headphone_ack')) beginSession();
    });
    navigator.mediaSession.setActionHandler('pause', () => {
        if (!isPlaying) return;
        if (pendingComplete) endSession(); else pauseSession();
    });
}

// Play button — glass porthole tilt + light sheen. Desktop
// fine-pointer only; touch gets the CSS idle drift instead
// (mirrors the book cover's 3D tilt on book.html).
(function () {
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches &&
        matchMedia('(hover: hover) and (pointer: fine)').matches) {
        const MAX_DEG = 10;
        let raf = null, tx = 0, ty = 0, cx = 0, cy = 0;

        function frame() {
            cx += (tx - cx) * 0.16;
            cy += (ty - cy) * 0.16;
            playBtn.style.transform = 'rotateX(' + cy.toFixed(3) + 'deg) rotateY(' + cx.toFixed(3) + 'deg)';
            raf = (Math.abs(tx - cx) > 0.01 || Math.abs(ty - cy) > 0.01)
                ? requestAnimationFrame(frame) : null;
        }

        playBtn.addEventListener('pointermove', (e) => {
            const r = playBtn.getBoundingClientRect();
            const px = (e.clientX - r.left) / r.width;
            const py = (e.clientY - r.top) / r.height;
            tx = (px - 0.5) * MAX_DEG * 2;
            ty = -(py - 0.5) * MAX_DEG * 2;
            playBtn.classList.add('tracking');
            playBtn.style.setProperty('--shx', (px * 100).toFixed(1) + '%');
            playBtn.style.setProperty('--shy', (py * 100).toFixed(1) + '%');
            playBtn.style.setProperty('--sheen', 0.55);
            if (raf === null) raf = requestAnimationFrame(frame);
        });

        playBtn.addEventListener('pointerleave', () => {
            if (raf !== null) { cancelAnimationFrame(raf); raf = null; }
            tx = ty = cx = cy = 0;
            playBtn.classList.remove('tracking');
            playBtn.style.transform = '';
            playBtn.style.setProperty('--sheen', 0);
        });
    }
})();

// ── MODALS ──
const headphoneModal = document.getElementById('headphoneModal');
const completeModal  = document.getElementById('completeModal');
let lastFocusedEl = null;

function getFocusable(modal) {
    return Array.from(modal.querySelectorAll('button, a[href]')).filter(el => el.offsetParent !== null);
}
function openModal(modal) {
    lastFocusedEl = document.activeElement;
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    const focusable = getFocusable(modal);
    if (focusable[0]) focusable[0].focus();
}
function closeModal(modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
    if (lastFocusedEl) lastFocusedEl.focus();
}

// single tap: the gate acknowledges and starts the session in one press
document.getElementById('headphoneConfirm').addEventListener('click', () => {
    sessionStorage.setItem('echo11_headphone_ack', '1');
    ev('gate_confirmed', evDims());
    closeModal(headphoneModal);
    beginSession();
});
document.getElementById('completeClose').addEventListener('click', () => closeModal(completeModal));
[headphoneModal, completeModal].forEach(m => {
    m.addEventListener('click', e => { if (e.target === m) closeModal(m); });
});
document.addEventListener('keydown', e => {
    const activeModal = [headphoneModal, completeModal].find(m => m.classList.contains('active'));
    if (!activeModal) return;
    if (e.key === 'Escape') { closeModal(activeModal); return; }
    if (e.key !== 'Tab') return;
    const focusable = getFocusable(activeModal);
    if (!focusable.length) return;
    const first = focusable[0], last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
});

// ── SESSIONS COUNTER ──
const SUPABASE_URL      = 'https://nomtmlidkuhkllniaytu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vbXRtbGlka3Voa2xsbmlheXR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1ODUzMzIsImV4cCI6MjA5NjE2MTMzMn0.LO7mdpCI_8dmDFdnvQA7fQoSts_yqksKgnLUt6O11_U';
const TODAY = new Date().toISOString().split('T')[0];

function localCount() {
    const d = JSON.parse(localStorage.getItem('echo11_freq')||'{}');
    return d[TODAY] || 0;
}
function localIncrement() {
    const d = JSON.parse(localStorage.getItem('echo11_freq')||'{}');
    d[TODAY] = (d[TODAY]||0) + 1;
    localStorage.setItem('echo11_freq', JSON.stringify(d));
    return d[TODAY];
}

async function getCount() {
    try {
        const r = await fetch(`${SUPABASE_URL}/rest/v1/frequency_sessions?date=eq.${TODAY}&select=count`,
            { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` }});
        const d = await r.json();
        if (d && d[0]) return d[0].count;
    } catch(e){}
    return localCount();
}

// zero (or a failed fetch) reads as "nobody is here" — the row starts
// hidden in the markup and only appears once a real count exists,
// so a dash is never rendered
function renderCount(n) {
    const row = document.querySelector('.sessions-row');
    if (n > 0) {
        document.getElementById('sessionsNum').textContent = n;
        row.hidden = false;
    } else {
        row.hidden = true;
    }
}

async function increment() {
    renderCount(localIncrement());
    try {
        const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/increment_session_count`, {
            method: 'POST',
            headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json' },
            body: JSON.stringify({ p_date: TODAY })
        });
        const serverCount = await r.json();
        if (typeof serverCount === 'number') renderCount(serverCount);
    } catch(e){}
}

getCount().then(renderCount);
})();

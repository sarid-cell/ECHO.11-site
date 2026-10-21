/* ECHO.11 — YouTube facade (single source of truth)
   Every <button class="yt-facade" data-yt="ID"> becomes a youtube-nocookie
   player only when clicked (a native <button>, so Enter and Space work too).
   The iframe title comes from the button's aria-label ("Play … (YouTube)").
   If a video has no maxresdefault thumbnail, fall back to hqdefault.
   Links with data-yt-out report a youtube_outbound event when clicked. */
(function () {
  'use strict';

  function fallbackThumb(img) {
    var b = img.closest('.yt-facade');
    if (!b || img.dataset.fallback) return;
    img.dataset.fallback = '1';
    var s = b.querySelector('source');
    if (s) s.remove();
    img.src = 'https://i.ytimg.com/vi/' + b.dataset.yt + '/hqdefault.jpg';
  }

  function play(b) {
    var f = document.createElement('iframe');
    f.className = 'yt-frame';
    f.src = 'https://www.youtube-nocookie.com/embed/' + b.dataset.yt + '?autoplay=1&rel=0';
    f.title = (b.getAttribute('aria-label') || 'YouTube video').replace(/^Play /, '').replace(/ \(YouTube\)$/, '');
    f.allow = 'autoplay; encrypted-media; picture-in-picture';
    f.allowFullscreen = true;
    b.replaceWith(f);
    if (window.gtag) gtag('event', 'youtube_embed_play', { video_id: b.dataset.yt, page: location.pathname });
  }

  /* Links marked data-yt-out="<placement>" go to YouTube; report which spot sent the visitor */
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[data-yt-out]');
    if (a && window.gtag) gtag('event', 'youtube_outbound', { placement: a.dataset.ytOut, link_url: a.href, page: location.pathname });
  });

  document.querySelectorAll('.yt-facade[data-yt]').forEach(function (b) {
    var img = b.querySelector('.yt-thumb');
    if (img) {
      /* maxresdefault is missing → 404 → error; YouTube's 120×90 grey stub is the other tell */
      img.addEventListener('error', function () { fallbackThumb(img); });
      img.addEventListener('load', function () { if (img.naturalWidth && img.naturalWidth <= 120) fallbackThumb(img); });
      if (img.complete && (img.naturalWidth === 0 || img.naturalWidth <= 120) && img.currentSrc) fallbackThumb(img);
    }
    b.addEventListener('click', function () { play(b); });
  });
})();

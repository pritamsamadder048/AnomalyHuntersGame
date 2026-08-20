/* ==========================================================================
   Anomaly Hunters - presentation navigation
   Keyboard paging, progress bar, slide counter, active dot on the rail.
   No dependencies. Degrades to plain scrolling if JS is off.
   ========================================================================== */

(function () {
  'use strict';

  var slides   = Array.prototype.slice.call(document.querySelectorAll('.slide'));
  var progress = document.querySelector('.progress');
  var current  = document.querySelector('.counter b');
  var total    = document.querySelector('.counter i');
  var dots     = Array.prototype.slice.call(document.querySelectorAll('.rail a'));

  if (!slides.length) { return; }

  var index  = 0;   // slide currently filling the viewport
  var target = 0;   // slide we are paging toward
  var navTimer = null;
  var pad = function (n) { return String(n).padStart(2, '0'); };

  if (total) { total.textContent = pad(slides.length); }

  /* --- which slide is on screen ----------------------------------------- */

  function setActive(i) {
    index = Math.max(0, Math.min(slides.length - 1, i));
    /* Only resync the paging target when we are NOT mid-jump. Without this,
       two quick arrow presses compound: the second one reads an index the
       smooth scroll has already moved past and skips several slides. */
    if (navTimer === null) { target = index; }
    if (current) { current.textContent = pad(index + 1); }
    dots.forEach(function (dot, d) {
      dot.setAttribute('aria-current', d === index ? 'true' : 'false');
    });
  }

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) { setActive(slides.indexOf(entry.target)); }
    });
  }, { threshold: 0.55 });

  slides.forEach(function (slide) { observer.observe(slide); });

  /* --- progress bar ------------------------------------------------------ */

  function drawProgress() {
    if (!progress) { return; }
    var max = document.documentElement.scrollHeight - window.innerHeight;
    var pct = max > 0 ? (window.scrollY / max) * 100 : 0;
    progress.style.width = pct + '%';
  }

  var ticking = false;
  window.addEventListener('scroll', function () {
    if (ticking) { return; }
    ticking = true;
    window.requestAnimationFrame(function () { drawProgress(); ticking = false; });
  }, { passive: true });

  drawProgress();

  /* --- paging ------------------------------------------------------------ */

  function goTo(i) {
    target = Math.max(0, Math.min(slides.length - 1, i));
    slides[target].scrollIntoView({ behavior: 'smooth', block: 'start' });

    if (navTimer !== null) { window.clearTimeout(navTimer); }
    navTimer = window.setTimeout(function () { navTimer = null; }, 550);
  }

  function step(delta) { goTo(target + delta); }

  document.addEventListener('keydown', function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey) { return; }
    /* A held-down arrow key must not fling through the deck: swallow the
       auto-repeat while a jump is still animating. */
    if (e.repeat && navTimer !== null) { e.preventDefault(); return; }

    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
      case 'PageDown':
      case ' ':
        e.preventDefault();
        step(1);
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
      case 'PageUp':
        e.preventDefault();
        step(-1);
        break;
      case 'Home':
        e.preventDefault();
        goTo(0);
        break;
      case 'End':
        e.preventDefault();
        goTo(slides.length - 1);
        break;
      default:
        break;
    }
  });

  /* Rail dots page rather than jump, so the counter stays in step. */
  dots.forEach(function (dot, d) {
    dot.addEventListener('click', function (e) { e.preventDefault(); goTo(d); });
  });

  setActive(0);
}());

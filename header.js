// Sticky header that slides away while scrolling down and returns on scroll up,
// so the works get the whole screen but the nav is one flick away.
(function () {
  const header = document.querySelector(".site-header");
  if (!header) return;

  const THRESHOLD = 8; // px of travel before toggling, so small jitters don't flicker
  let lastY = window.scrollY;
  let ticking = false;

  function update() {
    ticking = false;
    // The video modal locks page scroll; leave the header as it is meanwhile
    if (document.body.classList.contains("modal-open")) {
      lastY = window.scrollY;
      return;
    }
    const y = Math.max(0, window.scrollY);
    if (y <= header.offsetHeight) {
      header.classList.remove("is-hidden");
      lastY = y;
      return;
    }
    const delta = y - lastY;
    if (Math.abs(delta) < THRESHOLD) return;
    header.classList.toggle("is-hidden", delta > 0);
    lastY = y;
  }

  window.addEventListener("scroll", function () {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  }, { passive: true });

  // Keyboard users tabbing into the nav should always see it
  header.addEventListener("focusin", function () { header.classList.remove("is-hidden"); });
})();

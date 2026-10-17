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

// Counts every way into the request page as contact_click, tagged with where it was pressed.
// The video modal's button is counted in script.js, where the current work is known.
(function () {
  if (/\/contact(\.html)?$/.test(location.pathname)) return;

  document.addEventListener("click", function (e) {
    const link = e.target.closest("a[href]");
    if (!link || link.id === "modal-contact") return;
    if (!/\/contact(\.html)?$/.test(new URL(link.href, location.href).pathname)) return;
    if (typeof window.gtag !== "function") return;

    let where = "other";
    if (link.closest(".site-header")) where = "nav";
    else if (link.classList.contains("cta-button")) where = "cta";
    else if (link.classList.contains("work-button-primary")) where = "work_page";
    const params = { link_location: where };
    const title = document.querySelector(".work-title");
    if (title) params.work_title = title.textContent;
    window.gtag("event", "contact_click", params);
  });
})();

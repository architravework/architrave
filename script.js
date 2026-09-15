(function () {
  var ROW1_COUNT = 3;

  function renderGrid() {
    const container = document.getElementById("grid");
    container.innerHTML = "";
    works.forEach(function (work, i) {
      const card = document.createElement("div");
      card.className = "card";
      card.dataset.youtubeId = work.youtubeId;

      const img = document.createElement("img");
      img.src = work.thumbnail;
      img.alt = work.title;
      img.loading = "lazy";
      card.appendChild(img);

      if (work.credit) {
        const credit = document.createElement("div");
        credit.className = "card-credit";
        credit.textContent = work.credit;
        card.appendChild(credit);
      }

      card.addEventListener("click", function (e) {
        if (!openCards.has(card)) {
          e.preventDefault();
          openRow(groupOf(card));
          return;
        }
        openModal(work.youtubeId, work.title, work.description);
      });

      card.tabIndex = 0;
      card.setAttribute("role", "button");
      card.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openModal(work.youtubeId, work.title, work.description); }
      });

      container.appendChild(card);
    });

    initStackedCards(container, ROW1_COUNT);
  }

  // Row 1 starts full-size (matching the previous always-full behavior).
  // From then on, every row - including row 1 - shares one rule: only
  // one ROW (all 3 of its cards together) is ever "open" (full size)
  // at a time. Hovering/focusing any card in a row opens that whole
  // row and closes whatever row was open before; leaving the grid,
  // scrolling, or hovering a different row closes it again. Collapsed
  // cards are a thin cropped strip (object-fit: cover naturally shows
  // just the vertical center once the box is short).
  var openCards = new Set();
  var rows = [];

  function groupOf(card) {
    return rows.filter(function (row) { return row.indexOf(card) !== -1; })[0] || [card];
  }

  function sizeCard(card) {
    var fullH = card.getBoundingClientRect().width * 9 / 16;
    card.style.setProperty("--full-h", fullH + "px");
    if (!card.classList.contains("open")) {
      card.style.height = (fullH * 0.16) + "px";
    }
  }

  function closeAll() {
    openCards.forEach(function (c) { c.classList.remove("open"); });
    openCards.clear();
  }

  function openRow(row) {
    if (row.every(function (c) { return openCards.has(c); }) && openCards.size === row.length) return;
    closeAll();
    row.forEach(function (c) {
      c.classList.add("open");
      openCards.add(c);
    });
  }

  function initStackedCards(container, row1Count) {
    var cards = Array.prototype.slice.call(container.querySelectorAll(".card"));
    cards.forEach(sizeCard);

    for (var i = 0; i < cards.length; i += row1Count) {
      rows.push(cards.slice(i, i + row1Count));
    }

    openRow(rows[0]);

    cards.forEach(function (card) {
      card.addEventListener("mouseenter", function () { openRow(groupOf(card)); });
      card.addEventListener("focus", function () { openRow(groupOf(card)); });
    });

    container.addEventListener("mouseleave", closeAll);
    container.addEventListener("focusout", function (e) {
      if (!container.contains(e.relatedTarget)) closeAll();
    });

    window.addEventListener("scroll", closeAll, { passive: true });
    window.addEventListener("resize", function () { cards.forEach(sizeCard); });
  }

  function openModal(youtubeId, title, description) {
    const modal = document.getElementById("modal");
    const iframe = document.getElementById("modal-iframe");
    const descriptionEl = document.getElementById("modal-description");
    iframe.src = "https://www.youtube.com/embed/" + youtubeId + "?autoplay=1";
    iframe.title = title;
    descriptionEl.textContent = description || "";
    modal.classList.remove("hidden");
  }

  function closeModal() {
    const modal = document.getElementById("modal");
    const iframe = document.getElementById("modal-iframe");
    const descriptionEl = document.getElementById("modal-description");
    iframe.src = "";
    descriptionEl.textContent = "";
    modal.classList.add("hidden");
  }

  function initModal() {
    document.getElementById("modal-close").addEventListener("click", closeModal);
    document.querySelector(".modal-backdrop").addEventListener("click", closeModal);
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeModal();
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    renderGrid();
    initModal();
  });
})();

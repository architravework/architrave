(function () {
  const UP_NEXT_COUNT = 3;
  const ROLE_LABELS = {
    editing: "編集",
    director: "監督",
    animation: "アニメーション",
    illustration: "イラスト"
  };
  // Display order for filter buttons and modal badges. Every work includes editing,
  // so the editing button doubles as "show all" and is selected by default.
  const ROLE_ORDER = Object.keys(ROLE_LABELS);

  const cards = [];
  // Work indices in the order currently shown; the modal's prev/next/up-next follow it
  let order = works.map(function (_, index) { return index; });
  let currentPos = -1;

  function hasRole(work, role) {
    return (work.roles || []).indexOf(role) >= 0;
  }

  function renderGrid() {
    const container = document.getElementById("grid");
    container.innerHTML = "";
    works.forEach(function (work, index) {
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

      card.addEventListener("click", function () {
        openModal(order.indexOf(index));
      });

      card.tabIndex = 0;
      card.setAttribute("role", "button");
      card.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openModal(order.indexOf(index)); }
      });

      cards.push(card);
      container.appendChild(card);
    });
  }

  function renderRoleFilter() {
    const bar = document.getElementById("role-filter");
    const options = ROLE_ORDER.map(function (role) { return [role, ROLE_LABELS[role]]; });
    options.forEach(function (option) {
      const button = document.createElement("button");
      button.className = "role-filter-button";
      button.textContent = option[1];
      button.setAttribute("aria-pressed", option[0] === "editing" ? "true" : "false");
      button.addEventListener("click", function () {
        bar.querySelectorAll("button").forEach(function (b) { b.setAttribute("aria-pressed", "false"); });
        button.setAttribute("aria-pressed", "true");
        applyRoleFilter(option[0]);
      });
      bar.appendChild(button);
    });
  }

  // Moves works with the chosen role to the front and dims the rest, keeping every work on the page
  function applyRoleFilter(role) {
    const all = works.map(function (_, index) { return index; });
    const matching = all.filter(function (index) { return !role || hasRole(works[index], role); });
    const rest = all.filter(function (index) { return matching.indexOf(index) < 0; });
    order = matching.concat(rest);

    const container = document.getElementById("grid");
    order.forEach(function (index) {
      cards[index].classList.toggle("is-dimmed", rest.indexOf(index) >= 0);
      container.appendChild(cards[index]);
    });

    const bar = document.getElementById("role-filter");
    if (bar.getBoundingClientRect().top < 0) bar.scrollIntoView({ behavior: "smooth" });
  }

  function wrapPos(pos) {
    return (pos + order.length) % order.length;
  }

  function renderUpNext() {
    const list = document.getElementById("modal-up-next-list");
    list.innerHTML = "";
    for (let i = 1; i <= UP_NEXT_COUNT; i++) {
      const pos = wrapPos(currentPos + i);
      const work = works[order[pos]];
      const item = document.createElement("button");
      item.className = "up-next-item";
      item.setAttribute("aria-label", work.title);

      const img = document.createElement("img");
      img.src = work.thumbnail;
      img.alt = "";
      item.appendChild(img);

      const title = document.createElement("span");
      title.className = "up-next-title";
      title.textContent = work.title;
      item.appendChild(title);

      item.addEventListener("click", function () { openModal(pos); });
      list.appendChild(item);
    }
  }

  function openModal(pos) {
    currentPos = wrapPos(pos);
    const work = works[order[currentPos]];
    const modal = document.getElementById("modal");
    const iframe = document.getElementById("modal-iframe");
    const descriptionEl = document.getElementById("modal-description");
    iframe.src = "https://www.youtube.com/embed/" + work.youtubeId + "?autoplay=1";
    iframe.title = work.title;
    document.getElementById("modal-title").textContent = work.title;
    const rolesEl = document.getElementById("modal-roles");
    rolesEl.innerHTML = "";
    ROLE_ORDER.filter(function (role) { return hasRole(work, role); }).forEach(function (role) {
      const badge = document.createElement("span");
      badge.className = "role-badge";
      badge.textContent = ROLE_LABELS[role];
      rolesEl.appendChild(badge);
    });
    document.getElementById("modal-position").textContent = (currentPos + 1) + " / " + order.length;
    descriptionEl.textContent = work.description || "";
    descriptionEl.scrollTop = 0;
    renderUpNext();
    document.querySelector(".modal-content").scrollTop = 0;
    modal.classList.remove("hidden");
  }

  function closeModal() {
    const modal = document.getElementById("modal");
    const iframe = document.getElementById("modal-iframe");
    const descriptionEl = document.getElementById("modal-description");
    iframe.src = "";
    descriptionEl.textContent = "";
    modal.classList.add("hidden");
    // Leave the grid scrolled to the last work watched, so browsing continues from there
    const card = cards[order[currentPos]];
    if (card) {
      card.scrollIntoView({ block: "nearest" });
      card.focus({ preventScroll: true });
    }
    currentPos = -1;
  }

  function initModal() {
    document.getElementById("modal-close").addEventListener("click", closeModal);
    document.querySelector(".modal-backdrop").addEventListener("click", closeModal);
    document.getElementById("modal-prev").addEventListener("click", function () { openModal(currentPos - 1); });
    document.getElementById("modal-next").addEventListener("click", function () { openModal(currentPos + 1); });
    document.addEventListener("keydown", function (e) {
      if (currentPos < 0) return;
      if (e.key === "Escape") closeModal();
      if (e.key === "ArrowLeft") openModal(currentPos - 1);
      if (e.key === "ArrowRight") openModal(currentPos + 1);
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    renderGrid();
    renderRoleFilter();
    initModal();
  });
})();

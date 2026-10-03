// Loads the YouTube IFrame API once and runs every queued callback when it is ready (shared with game.js)
(function () {
  const callbacks = [];
  let requested = false;
  window.whenYouTubeReady = function (callback) {
    if (window.YT && window.YT.Player) { callback(); return; }
    callbacks.push(callback);
    if (requested) return;
    requested = true;
    window.onYouTubeIframeAPIReady = function () {
      callbacks.splice(0).forEach(function (cb) { cb(); });
    };
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(script);
  };
})();

(function () {
  const UP_NEXT_COUNT = 5;
  const AUTOPLAY_SECONDS = 5;
  const HASH_PREFIX = "#work-";
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

  // YouTube player attached to the modal iframe; once ready, videos switch without reloading the iframe
  let player = null;
  let playerReady = false;
  let autoplayTimer = null;

  function track(name, params) {
    if (typeof window.gtag === "function") window.gtag("event", name, params || {});
  }

  function hasRole(work, role) {
    return (work.roles || []).indexOf(role) >= 0;
  }

  function workUrl(work) {
    // The work page carries per-work OGP/SEO data, so sharing it previews correctly
    return new URL("work/" + work.youtubeId + "/", location.href).href;
  }

  function renderGrid() {
    const container = document.getElementById("grid");
    container.innerHTML = "";
    works.forEach(function (work, index) {
      const card = document.createElement("a");
      card.className = "card";
      card.href = "work/" + work.youtubeId + "/";
      card.dataset.youtubeId = work.youtubeId;

      const img = document.createElement("img");
      img.src = work.thumbnail;
      img.alt = work.title;
      img.loading = "lazy";
      card.classList.add("is-loading");
      const loaded = function () { card.classList.remove("is-loading"); };
      img.addEventListener("load", loaded);
      img.addEventListener("error", loaded);
      card.appendChild(img);

      // Hover/focus overlay: what the work is and what was done on it
      const info = document.createElement("div");
      info.className = "card-info";
      info.setAttribute("aria-hidden", "true"); // the img alt already names the work
      const title = document.createElement("span");
      title.className = "card-title";
      title.textContent = work.title;
      info.appendChild(title);
      const roles = ROLE_ORDER.filter(function (role) { return hasRole(work, role); });
      if (roles.length) {
        const roleText = document.createElement("span");
        roleText.className = "card-roles";
        roleText.textContent = roles.map(function (role) { return ROLE_LABELS[role]; }).join(" / ");
        info.appendChild(roleText);
      }
      card.appendChild(info);

      card.addEventListener("click", function (e) {
        if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return; // open-in-new-tab goes to the work page
        e.preventDefault();
        openModal(order.indexOf(index));
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

      item.addEventListener("click", function () {
        track("up_next_click", { work_title: work.title });
        openModal(pos);
      });
      list.appendChild(item);
    }
  }

  // Works that are editing-only are pitched as editing requests; the rest as production requests
  function renderContactLink(work) {
    const editingOnly = (work.roles || []).every(function (role) { return role === "editing"; });
    const kind = editingOnly ? "映像編集" : "映像制作";
    const link = document.getElementById("modal-contact");
    link.textContent = "この作品のような" + kind + "を相談する";
    // The request page shows this work as the reference and pre-fills the mail with it
    link.href = "contact?ref=" + encodeURIComponent(work.youtubeId);
  }

  function renderDescription(work) {
    const descriptionEl = document.getElementById("modal-description");
    const toggle = document.getElementById("modal-description-toggle");
    descriptionEl.textContent = work.description || "";
    descriptionEl.classList.add("is-collapsed");
    descriptionEl.scrollTop = 0;
    toggle.textContent = "もっと見る";
    toggle.setAttribute("aria-expanded", "false");
    // Only offer the toggle when the collapsed text is actually cut off
    toggle.hidden = descriptionEl.scrollHeight <= descriptionEl.clientHeight + 2;
  }

  function loadVideo(work) {
    if (player && playerReady) {
      player.loadVideoById(work.youtubeId);
      return;
    }
    const iframe = document.getElementById("modal-iframe");
    iframe.src = "https://www.youtube.com/embed/" + work.youtubeId +
      "?autoplay=1&rel=0&playsinline=1&enablejsapi=1&origin=" + encodeURIComponent(location.origin);
    if (!player) {
      window.whenYouTubeReady(function () {
        if (player) return;
        player = new YT.Player(iframe, {
          events: {
            onReady: function () { playerReady = true; },
            onStateChange: onPlayerStateChange
          }
        });
      });
    }
  }

  function onPlayerStateChange(e) {
    if (currentPos < 0) return;
    if (e.data === YT.PlayerState.ENDED) startAutoplay();
    if (e.data === YT.PlayerState.PLAYING) cancelAutoplay();
  }

  // After a video ends, show the next work over the player and play it after a short countdown
  function startAutoplay() {
    cancelAutoplay();
    const next = works[order[wrapPos(currentPos + 1)]];
    const box = document.getElementById("autoplay-next");
    document.getElementById("autoplay-thumb").src = next.thumbnail;
    document.getElementById("autoplay-title").textContent = next.title;
    let remaining = AUTOPLAY_SECONDS;
    const countEl = document.getElementById("autoplay-count");
    countEl.textContent = remaining;
    box.hidden = false;
    // Restart the ring animation from the beginning
    box.classList.remove("is-counting");
    void box.offsetWidth;
    box.classList.add("is-counting");
    autoplayTimer = setInterval(function () {
      remaining -= 1;
      countEl.textContent = remaining;
      if (remaining <= 0) {
        cancelAutoplay();
        track("autoplay_next", { work_title: next.title });
        openModal(currentPos + 1);
      }
    }, 1000);
  }

  function cancelAutoplay() {
    clearInterval(autoplayTimer);
    autoplayTimer = null;
    const box = document.getElementById("autoplay-next");
    box.hidden = true;
    box.classList.remove("is-counting");
  }

  function openModal(pos) {
    cancelAutoplay();
    currentPos = wrapPos(pos);
    const work = works[order[currentPos]];
    const modal = document.getElementById("modal");
    const wasClosed = modal.classList.contains("hidden");
    loadVideo(work);
    document.getElementById("modal-iframe").title = work.title;
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
    renderContactLink(work);
    document.getElementById("modal-share-label").textContent = "リンクをコピー";
    modal.classList.remove("hidden");
    document.body.classList.add("modal-open");
    renderDescription(work);
    renderUpNext();
    document.querySelector(".modal-content").scrollTop = 0;
    // Move keyboard focus into the dialog when it opens; arrow keys keep working from there
    if (wasClosed) document.getElementById("modal-close").focus({ preventScroll: true });
    history.replaceState(null, "", HASH_PREFIX + work.youtubeId);
    track("work_view", { work_title: work.title });
  }

  function closeModal() {
    cancelAutoplay();
    const modal = document.getElementById("modal");
    if (player && playerReady) player.stopVideo();
    else document.getElementById("modal-iframe").src = "";
    document.getElementById("modal-description").textContent = "";
    modal.classList.add("hidden");
    document.body.classList.remove("modal-open");
    history.replaceState(null, "", location.pathname + location.search);
    // Leave the grid scrolled to the last work watched, so browsing continues from there
    const card = cards[order[currentPos]];
    if (card) {
      card.scrollIntoView({ block: "nearest" });
      card.focus({ preventScroll: true });
    }
    currentPos = -1;
  }

  function copyShareLink() {
    const work = works[order[currentPos]];
    const button = document.getElementById("modal-share");
    const url = workUrl(work);
    const done = function () { document.getElementById("modal-share-label").textContent = "コピーしました"; };
    track("share_link", { work_title: work.title });
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(done, function () { window.prompt("この作品のリンク", url); });
    } else {
      window.prompt("この作品のリンク", url);
    }
  }

  // Opens the work named in the URL hash (e.g. #work-vo3qug1HFXs), so a single work can be shared
  function openFromHash() {
    if (location.hash.indexOf(HASH_PREFIX) !== 0) return;
    const id = location.hash.slice(HASH_PREFIX.length);
    const index = works.findIndex(function (work) { return work.youtubeId === id; });
    if (index >= 0) openModal(order.indexOf(index));
  }

  function initModal() {
    document.getElementById("modal-close").addEventListener("click", closeModal);
    document.querySelector(".modal-backdrop").addEventListener("click", closeModal);
    document.getElementById("modal-prev").addEventListener("click", function () { openModal(currentPos - 1); });
    document.getElementById("modal-next").addEventListener("click", function () { openModal(currentPos + 1); });
    document.getElementById("autoplay-now").addEventListener("click", function () {
      track("autoplay_next", { work_title: works[order[wrapPos(currentPos + 1)]].title });
      openModal(currentPos + 1);
    });
    document.getElementById("autoplay-cancel").addEventListener("click", cancelAutoplay);
    document.getElementById("modal-share").addEventListener("click", copyShareLink);
    document.getElementById("modal-contact").addEventListener("click", function () {
      track("contact_click", { work_title: works[order[currentPos]].title });
    });
    document.getElementById("modal-description-toggle").addEventListener("click", function () {
      const descriptionEl = document.getElementById("modal-description");
      const collapsed = descriptionEl.classList.toggle("is-collapsed");
      this.textContent = collapsed ? "もっと見る" : "閉じる";
      this.setAttribute("aria-expanded", collapsed ? "false" : "true");
    });
    document.addEventListener("keydown", function (e) {
      if (currentPos < 0) return;
      if (e.key === "Escape") closeModal();
      if (e.key === "ArrowLeft") openModal(currentPos - 1);
      if (e.key === "ArrowRight") openModal(currentPos + 1);
    });
    window.addEventListener("hashchange", openFromHash);
  }

  document.addEventListener("DOMContentLoaded", function () {
    renderGrid();
    renderRoleFilter();
    initModal();
    openFromHash();
  });
})();

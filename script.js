(function () {
  function renderGrid() {
    const container = document.getElementById("grid");
    container.innerHTML = "";
    works.forEach(function (work) {
      const card = document.createElement("div");
      card.className = "card";
      card.dataset.youtubeId = work.youtubeId;

      const img = document.createElement("img");
      img.src = work.thumbnail;
      img.alt = work.title;
      img.loading = "lazy";
      card.appendChild(img);

      card.addEventListener("click", function () {
        openModal(work.youtubeId, work.title);
      });

      card.tabIndex = 0;
      card.setAttribute("role", "button");
      card.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openModal(work.youtubeId, work.title); }
      });

      container.appendChild(card);
    });
  }

  function openModal(youtubeId, title) {
    const modal = document.getElementById("modal");
    const iframe = document.getElementById("modal-iframe");
    iframe.src = "https://www.youtube.com/embed/" + youtubeId + "?autoplay=1";
    iframe.title = title;
    modal.classList.remove("hidden");
  }

  function closeModal() {
    const modal = document.getElementById("modal");
    const iframe = document.getElementById("modal-iframe");
    iframe.src = "";
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

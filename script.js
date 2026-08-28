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

      if (work.credit) {
        const credit = document.createElement("div");
        credit.className = "card-credit";
        credit.textContent = work.credit;
        card.appendChild(credit);
      }

      card.addEventListener("click", function () {
        openModal(work.youtubeId, work.title, work.description);
      });

      card.tabIndex = 0;
      card.setAttribute("role", "button");
      card.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openModal(work.youtubeId, work.title, work.description); }
      });

      container.appendChild(card);
    });
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

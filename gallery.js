(function () {
  function renderGallery() {
    const container = document.getElementById("grid");
    container.innerHTML = "";
    galleryWorks.forEach(function (work) {
      const card = document.createElement("div");
      card.className = "card";

      const img = document.createElement("img");
      img.src = work.image;
      img.alt = work.title;
      img.loading = "lazy";
      card.appendChild(img);

      card.addEventListener("click", function () {
        openImageModal(work.image, work.title);
      });

      card.tabIndex = 0;
      card.setAttribute("role", "button");
      card.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openImageModal(work.image, work.title); }
      });

      container.appendChild(card);
    });
  }

  function openImageModal(image, title) {
    const modal = document.getElementById("modal");
    const img = document.getElementById("modal-image");
    img.src = image;
    img.alt = title;
    modal.classList.remove("hidden");
  }

  function closeModal() {
    const modal = document.getElementById("modal");
    const img = document.getElementById("modal-image");
    img.src = "";
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
    renderGallery();
    initModal();
  });
})();

(function () {
  const CATEGORIES = [
    { key: "work", label: "お仕事イラスト" },
    { key: "practice", label: "イラスト練習" }
  ];

  function renderGallery() {
    const root = document.getElementById("gallery");
    root.innerHTML = "";
    CATEGORIES.forEach(function (cat) {
      const works = galleryWorks.filter(function (w) { return w.category === cat.key; });
      if (!works.length) return;
      const section = document.createElement("section");
      section.className = "gallery-section";
      section.setAttribute("aria-labelledby", "gallery-title-" + cat.key);
      const heading = document.createElement("h2");
      heading.id = "gallery-title-" + cat.key;
      heading.className = "gallery-title";
      heading.textContent = cat.label;
      const grid = document.createElement("div");
      grid.className = "grid";
      section.appendChild(heading);
      section.appendChild(grid);
      root.appendChild(section);
      renderGrid(grid, works);
    });
  }

  function renderGrid(container, works) {
    works.forEach(function (work) {
      const card = document.createElement("div");
      card.className = "card";

      const img = document.createElement("img");
      img.src = work.image;
      img.alt = work.title;
      img.loading = "lazy";
      card.appendChild(img);

      card.addEventListener("click", function () {
        openImageModal(work.fullImage, work.title);
      });

      card.tabIndex = 0;
      card.setAttribute("role", "button");
      card.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openImageModal(work.fullImage, work.title); }
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

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
      card.appendChild(img);

      card.addEventListener("click", function () {
        openModal(work.youtubeId);
      });

      container.appendChild(card);
    });
  }

  document.addEventListener("DOMContentLoaded", renderGrid);

  window.renderGrid = renderGrid;
})();

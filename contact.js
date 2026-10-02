// Shows the work the visitor came from (contact.html?ref=<youtubeId>) as the reference,
// with a ready-to-send message draft that goes out by mail app, Gmail, or copy
(function () {
  const EMAIL = "architrave12345@gmail.com";
  const id = new URLSearchParams(location.search).get("ref");
  if (!id || typeof works === "undefined") return;
  const work = works.find(function (w) { return w.youtubeId === id; });
  if (!work) return;

  function track(name) {
    if (typeof window.gtag === "function") window.gtag("event", name, { work_title: work.title });
  }

  const workPath = "index.html#work-" + work.youtubeId;
  document.getElementById("contact-ref-link").href = workPath;
  const thumb = document.getElementById("contact-ref-thumb");
  thumb.src = work.thumbnail;
  thumb.alt = work.title;
  document.getElementById("contact-ref-title").textContent = work.title;
  document.getElementById("contact-ref").hidden = false;
  document.getElementById("contact-ref-jump").hidden = false;
  // The draft below carries the address, so the generic mail line is hidden to avoid two entry points
  document.querySelector(".contact").classList.add("has-ref");

  const editingOnly = (work.roles || []).every(function (role) { return role === "editing"; });
  const kind = editingOnly ? "映像編集" : "映像制作";
  const workUrl = new URL("./", location.href).href + "#work-" + work.youtubeId;
  const subject = "【ご相談】" + kind + "（参考：" + work.title + "）";
  const draft = document.getElementById("contact-draft");
  draft.value = "「" + work.title + "」を参考に、" + kind + "のご相談です。\n" + workUrl +
    "\n\nご依頼内容：\n納期：\nご予算：\n";

  // Links are rebuilt from the draft as typed, so additions go out with the message
  function updateLinks() {
    const su = encodeURIComponent(subject);
    const body = encodeURIComponent(draft.value);
    const mailHref = "mailto:" + EMAIL + "?subject=" + su + "&body=" + body;
    document.getElementById("contact-send-mail").href = mailHref;
    document.getElementById("contact-send-gmail").href =
      "https://mail.google.com/mail/?view=cm&fs=1&to=" + encodeURIComponent(EMAIL) + "&su=" + su + "&body=" + body;
    document.querySelectorAll('.contact-mail a[href^="mailto:"]').forEach(function (link) { link.href = mailHref; });
  }
  draft.addEventListener("input", updateLinks);
  updateLinks();

  document.getElementById("contact-send-mail").addEventListener("click", function () { track("contact_send_mail"); });
  document.getElementById("contact-send-gmail").addEventListener("click", function () { track("contact_send_gmail"); });
  document.getElementById("contact-copy").addEventListener("click", function () {
    const button = this;
    const text = "件名：" + subject + "\n\n" + draft.value;
    track("contact_copy");
    const done = function () { button.textContent = "コピーしました"; };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, function () { draft.select(); });
    } else {
      draft.select();
    }
  });
})();

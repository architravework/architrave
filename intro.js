(function () {
  var overlay = document.getElementById('intro');
  if (!overlay) return;
  if (sessionStorage.getItem('architrave_intro_seen') === '1') {
    overlay.remove();
    return;
  }

  var phrases = [
    { text: '色彩と', accent: false },
    { text: 'エモーションで、', accent: true },
    { text: '心に残る', accent: false },
    { text: '一瞬を。', accent: true }
  ];
  var textEl = document.getElementById('intro-text');
  var i = 0;
  var timer = null;

  function showNext() {
    if (i >= phrases.length) {
      finish();
      return;
    }
    var phrase = phrases[i];
    textEl.textContent = phrase.text;
    textEl.classList.remove('intro-pop', 'intro-accent');
    void textEl.offsetWidth;
    textEl.classList.toggle('intro-accent', phrase.accent);
    textEl.classList.add('intro-pop');
    i++;
    timer = setTimeout(showNext, 750);
  }

  function finish() {
    clearTimeout(timer);
    overlay.classList.add('intro-hidden');
    sessionStorage.setItem('architrave_intro_seen', '1');
    setTimeout(function () { overlay.remove(); }, 500);
  }

  overlay.addEventListener('click', finish);
  showNext();
})();

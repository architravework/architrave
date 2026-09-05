(function () {
  var canvas = document.getElementById('game-canvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var overlay = document.getElementById('game-overlay');
  var scoreEl = document.getElementById('game-score');

  var W = canvas.width;
  var H = canvas.height;

  var videoQueue = ['nVs1prnygiE'].concat(
    typeof works !== 'undefined' ? works.map(function (w) { return w.youtubeId; }) : []
  );
  var videoIndex = 0;
  var ytPlayer = null;

  function playNextVideo() {
    videoIndex = (videoIndex + 1) % videoQueue.length;
    ytPlayer.loadVideoById(videoQueue[videoIndex]);
  }

  function onPlayerStateChange(e) {
    if (e.data === YT.PlayerState.ENDED) playNextVideo();
  }

  function initYouTubePlayer() {
    ytPlayer = new YT.Player('game-bg-player', {
      events: { onStateChange: onPlayerStateChange }
    });
  }

  if (window.YT && window.YT.Player) {
    initYouTubePlayer();
  } else {
    window.onYouTubeIframeAPIReady = initYouTubePlayer;
    var ytScript = document.createElement('script');
    ytScript.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(ytScript);
  }

  var BRICK_ROWS = 10;
  var BRICK_COLS = 8;
  var BRICK_PADDING = 6;
  var BRICK_TOP = 45;
  var BRICK_WIDTH = (W - BRICK_PADDING * (BRICK_COLS + 1)) / BRICK_COLS;
  var BRICK_HEIGHT = 24;
  var BRICK_COLOR = '#ffffff';
  var PADDLE_COLOR = '#ffffff';
  var ACCENT_COLOR = '#ea265c';

  var PADDLE_WIDTH = 120;
  var PADDLE_HEIGHT = 15;
  var BALL_RADIUS = 9;
  var BASE_SPEED = 3.9;

  var state = 'idle';
  var score = 0;
  var paddle, ball, bricks;
  var prevPaddleX = null;

  function resetPaddleAndBall() {
    paddle = { x: (W - PADDLE_WIDTH) / 2, y: H - 36 };
    ball = { x: W / 2, y: H - 51, dx: BASE_SPEED, dy: -BASE_SPEED };
    prevPaddleX = null;
  }

  function buildBricks() {
    bricks = [];
    for (var r = 0; r < BRICK_ROWS; r++) {
      for (var c = 0; c < BRICK_COLS; c++) {
        bricks.push({
          x: BRICK_PADDING + c * (BRICK_WIDTH + BRICK_PADDING),
          y: BRICK_TOP + r * (BRICK_HEIGHT + BRICK_PADDING),
          alive: true
        });
      }
    }
  }

  function resetGame() {
    score = 0;
    scoreEl.textContent = score;
    resetPaddleAndBall();
    buildBricks();
  }

  function setPaddleFromClientX(clientX) {
    var rect = canvas.getBoundingClientRect();
    var scale = W / rect.width;
    var x = (clientX - rect.left) * scale - PADDLE_WIDTH / 2;
    paddle.x = Math.max(0, Math.min(W - PADDLE_WIDTH, x));
  }

  canvas.addEventListener('mousemove', function (e) {
    if (state === 'playing') setPaddleFromClientX(e.clientX);
  });
  canvas.addEventListener('touchmove', function (e) {
    if (state === 'playing' && e.touches[0]) {
      setPaddleFromClientX(e.touches[0].clientX);
      e.preventDefault();
    }
  }, { passive: false });

  document.addEventListener('keydown', function (e) {
    if (state !== 'playing') return;
    if (e.key === 'ArrowLeft') paddle.x = Math.max(0, paddle.x - 36);
    if (e.key === 'ArrowRight') paddle.x = Math.min(W - PADDLE_WIDTH, paddle.x + 36);
  });

  function startGame() {
    resetGame();
    state = 'playing';
    overlay.classList.add('hidden');
  }

  overlay.addEventListener('click', function (e) {
    if (state === 'idle') startGame();
  });

  function update() {
    if (state !== 'playing') return;

    if (prevPaddleX === null) prevPaddleX = paddle.x;
    var paddleVelocity = paddle.x - prevPaddleX;
    prevPaddleX = paddle.x;

    ball.x += ball.dx;
    ball.y += ball.dy;

    if (ball.x - BALL_RADIUS < 0 || ball.x + BALL_RADIUS > W) ball.dx *= -1;
    if (ball.y - BALL_RADIUS < 0) ball.dy *= -1;

    if (
      ball.y + BALL_RADIUS > paddle.y &&
      ball.y + BALL_RADIUS < paddle.y + PADDLE_HEIGHT + 9 &&
      ball.x > paddle.x &&
      ball.x < paddle.x + PADDLE_WIDTH &&
      ball.dy > 0
    ) {
      var hitPos = (ball.x - (paddle.x + PADDLE_WIDTH / 2)) / (PADDLE_WIDTH / 2);
      var newDx = hitPos * 5.25;
      if (Math.abs(newDx) < 1.5) newDx = newDx < 0 ? -1.5 : 1.5;
      var speedMultiplier = 1 + Math.min(Math.abs(paddleVelocity) / 20, 1.5);
      ball.dx = newDx * speedMultiplier;
      ball.dy = -BASE_SPEED * speedMultiplier;
    }

    if (ball.y - BALL_RADIUS > H) {
      resetPaddleAndBall();
    }

    for (var i = 0; i < bricks.length; i++) {
      var b = bricks[i];
      if (!b.alive) continue;
      if (
        ball.x + BALL_RADIUS > b.x &&
        ball.x - BALL_RADIUS < b.x + BRICK_WIDTH &&
        ball.y + BALL_RADIUS > b.y &&
        ball.y - BALL_RADIUS < b.y + BRICK_HEIGHT
      ) {
        b.alive = false;
        ball.dy *= -1;
        score += 10;
        scoreEl.textContent = score;
        break;
      }
    }

    if (bricks.every(function (b) { return !b.alive; })) {
      buildBricks();
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    ctx.fillStyle = BRICK_COLOR;
    bricks.forEach(function (b) {
      if (!b.alive) return;
      ctx.fillRect(b.x, b.y, BRICK_WIDTH, BRICK_HEIGHT);
    });

    ctx.fillStyle = PADDLE_COLOR;
    ctx.fillRect(paddle.x, paddle.y, PADDLE_WIDTH, PADDLE_HEIGHT);

    ctx.beginPath();
    ctx.arc(ball.x, ball.y, BALL_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = ACCENT_COLOR;
    ctx.fill();
  }

  function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
  }

  resetGame();
  draw();
  requestAnimationFrame(loop);
})();

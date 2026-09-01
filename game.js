(function () {
  var canvas = document.getElementById('game-canvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var overlay = document.getElementById('game-overlay');
  var messageEl = document.getElementById('game-message');
  var buttonEl = document.getElementById('game-button');
  var scoreEl = document.getElementById('game-score');
  var livesEl = document.getElementById('game-lives');

  var W = canvas.width;
  var H = canvas.height;

  var BRICK_ROWS = 5;
  var BRICK_COLS = 8;
  var BRICK_PADDING = 4;
  var BRICK_TOP = 30;
  var BRICK_WIDTH = (W - BRICK_PADDING * (BRICK_COLS + 1)) / BRICK_COLS;
  var BRICK_HEIGHT = 16;
  var BRICK_COLORS = ['#ea265c', '#f06791', '#111111', '#555555', '#f06791'];

  var PADDLE_WIDTH = 80;
  var PADDLE_HEIGHT = 10;
  var BALL_RADIUS = 6;

  var state = 'idle';
  var score = 0;
  var lives = 3;
  var paddle, ball, bricks;

  function resetPaddleAndBall() {
    paddle = { x: (W - PADDLE_WIDTH) / 2, y: H - 24 };
    ball = { x: W / 2, y: H - 34, dx: 2.6, dy: -2.6 };
  }

  function buildBricks() {
    bricks = [];
    for (var r = 0; r < BRICK_ROWS; r++) {
      for (var c = 0; c < BRICK_COLS; c++) {
        bricks.push({
          x: BRICK_PADDING + c * (BRICK_WIDTH + BRICK_PADDING),
          y: BRICK_TOP + r * (BRICK_HEIGHT + BRICK_PADDING),
          alive: true,
          color: BRICK_COLORS[r % BRICK_COLORS.length]
        });
      }
    }
  }

  function resetGame() {
    score = 0;
    lives = 3;
    scoreEl.textContent = score;
    livesEl.textContent = lives;
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
    if (e.key === 'ArrowLeft') paddle.x = Math.max(0, paddle.x - 24);
    if (e.key === 'ArrowRight') paddle.x = Math.min(W - PADDLE_WIDTH, paddle.x + 24);
  });

  function startGame() {
    resetGame();
    state = 'playing';
    overlay.classList.add('hidden');
  }

  function endGame(won) {
    state = won ? 'won' : 'lost';
    messageEl.textContent = won ? 'クリア！ 🎉' : 'ゲームオーバー';
    buttonEl.textContent = 'もう一度';
    overlay.classList.remove('hidden');
  }

  overlay.addEventListener('click', function (e) {
    if (state === 'idle' || state === 'won' || state === 'lost') startGame();
  });

  function update() {
    if (state !== 'playing') return;

    ball.x += ball.dx;
    ball.y += ball.dy;

    if (ball.x - BALL_RADIUS < 0 || ball.x + BALL_RADIUS > W) ball.dx *= -1;
    if (ball.y - BALL_RADIUS < 0) ball.dy *= -1;

    if (
      ball.y + BALL_RADIUS > paddle.y &&
      ball.y + BALL_RADIUS < paddle.y + PADDLE_HEIGHT + 6 &&
      ball.x > paddle.x &&
      ball.x < paddle.x + PADDLE_WIDTH &&
      ball.dy > 0
    ) {
      ball.dy *= -1;
      var hitPos = (ball.x - (paddle.x + PADDLE_WIDTH / 2)) / (PADDLE_WIDTH / 2);
      var newDx = hitPos * 3.5;
      if (Math.abs(newDx) < 1) newDx = newDx < 0 ? -1 : 1;
      ball.dx = newDx;
    }

    if (ball.y - BALL_RADIUS > H) {
      lives -= 1;
      livesEl.textContent = lives;
      if (lives <= 0) {
        endGame(false);
        return;
      }
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
      endGame(true);
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    ctx.fillStyle = '#eee';
    for (var x = 0; x < W; x += 22) {
      for (var y = 0; y < H; y += 22) {
        ctx.beginPath();
        ctx.arc(x, y, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    bricks.forEach(function (b) {
      if (!b.alive) return;
      ctx.fillStyle = b.color;
      ctx.fillRect(b.x, b.y, BRICK_WIDTH, BRICK_HEIGHT);
    });

    ctx.fillStyle = '#111';
    ctx.fillRect(paddle.x, paddle.y, PADDLE_WIDTH, PADDLE_HEIGHT);

    ctx.beginPath();
    ctx.arc(ball.x, ball.y, BALL_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = '#ea265c';
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

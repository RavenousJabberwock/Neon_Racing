/* ===== input.js — Keyboard + Touch controls (Outrun) ===== */
var Input = (function () {
  var keys = {};
  var touchState = { left: false, right: false, accel: true };
  var isTouchDevice = false;
  var touchNitroTimer = 0;

  /* ---------- Keyboard ---------- */
  document.addEventListener('keydown', function (e) {
    keys[e.key] = true;
    keys[e.code] = true;

    var S = Game.S;

    /* Reset attract timer on any key */
    if (typeof GameLoop.resetAttractTimer === 'function') {
      GameLoop.resetAttractTimer();
    }

    /* Exit attract mode if active */
    if (S.attractActive && S.state === 'PLAY') {
      S.attractActive = false;
    }

    if (S.state === 'MENU') {
      S.state = 'PLAY';
      CP.sound.click();
      return;
    }
    if (S.state === 'GAMEOVER') {
      GameLoop.restart();
      return;
    }
  });
  document.addEventListener('keyup', function (e) {
    keys[e.key] = false;
    keys[e.code] = false;
  });

  /* ---------- Touch ---------- */
  var touchCanvas = Game.canvas || document.getElementById('c');
  touchCanvas.addEventListener('touchstart', function (e) {
    e.preventDefault();
    isTouchDevice = true;

    if (typeof GameLoop.resetAttractTimer === 'function') {
      GameLoop.resetAttractTimer();
    }

    var S = Game.S;

    /* Exit attract mode */
    if (S.attractActive && S.state === 'PLAY') {
      S.attractActive = false;
    }

    if (S.state === 'MENU') {
      S.state = 'PLAY';
      CP.sound.click();
      return;
    }
    if (S.state === 'GAMEOVER') {
      GameLoop.restart();
      return;
    }

    handleTouches(e.touches);

    /* Double-tap for nitro */
    var now = Date.now();
    if (now - (Input._lastTap || 0) < 320) {
      S.nitroActive = S.nitro > 0;
      touchNitroTimer = 2.0; /* auto-off after 2s on touch */
    }
    Input._lastTap = now;
  }, { passive: false });

  touchCanvas.addEventListener('touchmove', function (e) {
    e.preventDefault();
    handleTouches(e.touches);
  }, { passive: false });

  touchCanvas.addEventListener('touchend', function (e) {
    e.preventDefault();
    if (e.touches.length === 0) {
      touchState.left = false; touchState.right = false;
    } else {
      handleTouches(e.touches);
    }
  }, { passive: false });

  /* Mouse click for desktop start */
  touchCanvas.addEventListener('click', function () {
    if (typeof GameLoop.resetAttractTimer === 'function') {
      GameLoop.resetAttractTimer();
    }

    var S = Game.S;

    if (S.attractActive && S.state === 'PLAY') {
      S.attractActive = false;
    }

    if (S.state === 'MENU') {
      S.state = 'PLAY';
      CP.sound.click();
    } else if (S.state === 'GAMEOVER') {
      GameLoop.restart();
    }
  });

  function handleTouches(touches) {
    touchState.left = false; touchState.right = false;
    var w = touchCanvas.width;
    for (var i = 0; i < touches.length; i++) {
      var rect = touchCanvas.getBoundingClientRect();
      var tx = (touches[i].clientX - rect.left) / rect.width * w;
      if (tx < w * 0.4) touchState.left = true;
      else if (tx > w * 0.6) touchState.right = true;
    }
  }

  /* ---------- Per-frame input polling ---------- */
  function poll(dt) {
    var S = Game.S, C = Game.C;

    /* Skip player input in attract mode */
    if (S.attractActive && S.state === 'PLAY') return;

    if (S.state !== 'PLAY') return;

    /* Acceleration */
    var accelInput = keys['ArrowUp'] || keys['w'] || keys['W'] || keys['KeyW'];
    if (isTouchDevice) accelInput = true;

    var brakeInput = keys['ArrowDown'] || keys['s'] || keys['S'] || keys['KeyS'];

    /* Steering */
    var steerLeft = keys['ArrowLeft'] || keys['a'] || keys['A'] || keys['KeyA'] || touchState.left;
    var steerRight = keys['ArrowRight'] || keys['d'] || keys['D'] || keys['KeyD'] || touchState.right;

    /* Nitro — space/N key or touch double-tap toggles on, auto-off when drained */
    if (keys[' '] || keys['n'] || keys['N'] || keys['Space']) {
      if (S.nitro > 0) S.nitroActive = true;
    } else if (!isTouchDevice) {
      /* Desktop: release key to stop nitro */
      S.nitroActive = false;
    }
    /* Touch: nitro turns off automatically when depleted or after 2s burst */
    if (isTouchDevice && S.nitroActive) {
      touchNitroTimer -= dt;
      if (touchNitroTimer <= 0) S.nitroActive = false;
    }
    if (S.nitro <= 0) S.nitroActive = false;

    /* Set flags for Car.update() to process */
    S.accelerating = accelInput;
    S.braking = brakeInput;
    S.steerAngle = 0;
    if (steerLeft) S.steerAngle = -C.STEER_SPEED;
    if (steerRight) S.steerAngle = C.STEER_SPEED;
  }

  return { poll: poll, keys: keys, _lastTap: 0 };
})();

/* ===== game.js — Main game loop, attract mode, state machine ===== */
var GameLoop = (function () {
  var C = Game.C, S = Game.S;
  var lastTime = 0;
  var attractTimer = 0;
  var ATTRACT_IDLE_TIME = 8; // seconds of inactivity before attract starts

  /* ---------- Restart ---------- */
  function restart() {
    S.state = 'PLAY';
    S.speed = 0; S.distance = 0; S.score = 0;
    S.playerX = 0; S.scrollOffset = 0;
    S.curveAmount = 0; S.curveTarget = 0;
    S.hillAmount = 0; S.hillTarget = 0;
    S.traffic = []; S.powerups = [];
    S.combo = 0; S.comboTimer = 0; S.bestCombo = 0;
    S.nitro = C.NITRO_MAX; S.nitroActive = false;
    S.shieldActive = false; S.shieldTimer = 0;
    S.magnetActive = false; S.magnetTimer = 0;
    S.slowField = false; S.slowTimer = 0;
    S.currentBiome = 0; S.biomeT = 0;
    S.milestone = 0; S.powerupTimer = 0;
    S.nitroFlames = []; S.dyingTimer = 0;
    S.exhaustParticles = []; S.speedLines = []; S.sparkParticles = [];
    S.nearMissWoosh = [];
    S.screenShake.intensity = 0; S.screenShake.timer = 0;
    S.attractActive = false;
    S.accelerating = false;
    S.braking = false;
    S.steerAngle = 0;
    S.headlightsOn = false;
    attractTimer = 0;
    CP.sound.click();
  }

  /* ---------- Attract Mode — CPU plays itself ---------- */
  function updateAttract(dt) {
    S.attractActive = true;

    /* Reset acceleration and braking first */
    S.braking = false;

    /* CPU acceleration — pulse acceleration for varied speed */
    S.accelerating = true;

    /* CPU steering — weave gently, follow curves */
    S.attractSteerTimer -= dt;
    if (S.attractSteerTimer <= 0) {
      S.attractSteerDir = (Math.random() - 0.5) * 2;
      S.attractSteerTimer = 0.5 + Math.random() * 1.5;
    }

    /* Steer toward center of road, with some wandering */
    var centerPull = -S.playerX * 1.5;
    var wander = S.attractSteerDir * 0.8;
    S.steerAngle = Math.max(-C.STEER_SPEED, Math.min(C.STEER_SPEED, centerPull + wander));

    /* CPU nitro — use when available and speed is decent */
    if (S.nitro > 50 && S.speed > 200) {
      S.nitroActive = true;
    } else if (S.nitro < 10) {
      S.nitroActive = false;
    }

    /* CPU brake near traffic */
    var nearTraffic = false;
    for (var i = 0; i < S.traffic.length; i++) {
      var t = S.traffic[i];
      if (t.z < 15 && t.z > 2 && Math.abs(t.lane - S.playerX) < 0.3) {
        S.braking = true;
        nearTraffic = true;
        S.steerAngle += (t.lane > S.playerX ? -1 : 1) * 0.5;
        break;
      }
    }
    if (!nearTraffic) S.braking = false;

    /* If speed is very low, always accelerate */
    if (S.speed < 30) S.accelerating = true;
  }

  /* ---------- Update ---------- */
  function update(dt) {
    /* Update environment always */
    Renderer.updateTimeOfDay(dt);
    Renderer.updateWeather(dt);
    Renderer.updateRain(dt);
    Renderer.updateFog(dt);

    /* Sync headlights flag based on TOD — before Car.update() uses it */
    var todColor = Game.getTODColor();
    S.headlightsOn = todColor.ambientLight < 0.5;

    if (S.state === 'MENU') {
      /* Track idle time for attract mode */
      attractTimer += dt;
      if (attractTimer > ATTRACT_IDLE_TIME && !S.attractActive) {
        /* Start attract mode by entering play state with CPU control */
        S.state = 'PLAY';
        S.speed = 0; S.distance = 0; S.score = 0;
        S.playerX = 0; S.scrollOffset = 0;
        S.curveAmount = 0; S.curveTarget = 0;
        S.traffic = []; S.powerups = [];
        S.nitro = C.NITRO_MAX; S.nitroActive = false;
        S.attractActive = true;
        S.attractSteerDir = 0;
        S.attractSteerTimer = 0.5;
      }

      /* Menu background — slow road scroll (Road.update() handles scroll via speed) */
      S.speed = 60;
      Road.update(dt);
      Traffic.spawn(dt);
      Traffic.update(dt);
      return;
    }

    if (S.state !== 'PLAY' && S.state !== 'DYING') return;

    if (S.state === 'DYING') {
      S.dyingTimer -= dt;
      S.speed = Math.max(0, S.speed - 400 * dt);
      if (S.dyingTimer <= 0) {
        S.state = 'GAMEOVER';
        if (S.score > S.highScore) S.highScore = S.score;
        try { CP.storage.set('raceHigh', S.highScore); } catch (e) {}
        CP.sound.gameover();
        /* Start attract timer for gameover screen too */
        attractTimer = 0;
      }
      return;
    }

    /* Attract mode update */
    if (S.attractActive) {
      updateAttract(dt);
    }

    /* Score */
    var speedBonus = S.speed > 200 ? 2 : 1;
    S.score += Math.floor(S.speed * 0.01 * speedBonus);

    /* Road curves, hills, scroll, distance */
    Road.update(dt);

    /* Car physics (speed, nitro, steering, curve drift, off-road) */
    /* Note: curve drift is handled inside Car.update() via C.CURVE_DRIFT_FACTOR */
    Car.update(dt);

    /* Effects */
    Effects.update(dt);

    /* Traffic & power-ups */
    Traffic.spawn(dt);
    Traffic.update(dt);
    Traffic.spawnPowerups(dt);

    /* Milestones */
    var mDist = Math.floor(S.distance);
    if (mDist > 0 && mDist >= (S.milestone + 1) * 500) {
      S.milestone = Math.floor(mDist / 500);
      HUD.showMilestone('🏁 ' + (S.milestone * 500) + 'm!');
      S.score += 100 * S.milestone;
      CP.sound.powerup();
    }

    Renderer.updateClouds(dt);
  }

  /* ---------- Render ---------- */
  function render(dt) {
    var ctx = Game.ctx, canvas = Game.canvas;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    /* Sky & environment */
    Renderer.drawSky();
    Renderer.drawSun();
    Renderer.renderClouds();
    Renderer.drawMountains();

    /* Rain (behind road) */
    Renderer.renderRain();

    /* Screen shake wrapper */
    Effects.applyShake(ctx);

    /* Road */
    Road.render();

    /* Headlights — draw in all visual states */
    if (S.state === 'PLAY' || S.state === 'DYING' || S.state === 'MENU' || S.state === 'GAMEOVER') {
      Renderer.drawHeadlights();
    }

    /* Roadside objects & billboards */
    Renderer.drawRoadsideObjects();
    Renderer.drawBillboards();

    /* Traffic & power-ups */
    Traffic.render();

    /* Player car — show in all visual states */
    Car.render();

    /* Effects */
    Effects.render();

    /* Fog (over everything) */
    Renderer.renderFog();

    /* Restore shake */
    Effects.endShake(ctx);

    /* HUD */
    if (S.state === 'PLAY' || S.state === 'DYING') {
      HUD.update(dt);
      HUD.render();
    }
    if (S.state === 'DYING') {
      HUD.drawDeathFlash(S);
    }

    /* Attract mode indicator */
    if (S.attractActive) {
      var pulseAlpha = 0.3 + Math.sin(Date.now() * 0.004) * 0.2;
      ctx.fillStyle = 'rgba(170,136,255,' + pulseAlpha.toFixed(2) + ')';
      ctx.font = '12px Arial, sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.fillText('⚡ ATTRACT MODE — press any key to play', canvas.width / 2, 8);
    } else if (S.state === 'MENU' && attractTimer > 3) {
      /* Show hint that attract is coming */
      var hintAlpha = 0.2 + Math.sin(Date.now() * 0.003) * 0.1;
      ctx.fillStyle = 'rgba(170,136,255,' + hintAlpha.toFixed(2) + ')';
      ctx.font = '10px Arial, sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.fillText('idle — demo starting soon...', canvas.width / 2, canvas.height - 20);
    }

    /* Overlays */
    if (S.state === 'MENU') {
      HUD.drawMenu();
    }
    if (S.state === 'GAMEOVER') {
      HUD.drawGameOver();
    }
  }

  /* ---------- Main Loop ---------- */
  function loop(now) {
    var dt = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;

    Input.poll(dt);
    update(dt);
    render(dt);

    CP.particles.update(dt); CP.particles.render(Game.ctx);
    CP.float.update(dt); CP.float.render(Game.ctx);
    CP.shake.update(dt);
    requestAnimationFrame(loop);
  }

  /* ---------- Reset attract timer on any input ---------- */
  function resetAttractTimer() {
    attractTimer = 0;
    /* If attract was active and player interacts, turn it off */
    if (S.attractActive && S.state === 'PLAY') {
      S.attractActive = false;
    }
  }

  /* ---------- Init ---------- */
  function init() {
    try {
      var saved = CP.storage.get('raceHigh', 0);
      if (saved && !isNaN(saved)) S.highScore = parseInt(saved, 10);
    } catch (e) {}

    /* Ensure canvas is sized before first frame */
    if (Game.canvas && (Game.canvas.width === 0 || Game.canvas.height === 0)) {
      Game.resize();
    }

    /* Expose attract reset for input.js */
    GameLoop.resetAttractTimer = resetAttractTimer;

    lastTime = performance.now();
    requestAnimationFrame(loop);
  }

  /* Wrap the loop in error handling to catch and log startup crashes */
  var _origLoop = loop;
  loop = function safeLoop(now) {
    try {
      _origLoop(now);
    } catch (e) {
      console.error('[Outrun Racer] Error:', e.message);
      /* Keep the game running despite errors */
      lastTime = lastTime || performance.now();
      requestAnimationFrame(loop);
    }
  };

  return { init: init, restart: restart, resetAttractTimer: resetAttractTimer };
})();

/* Safe startup — catch and log any init failures */
try {
  GameLoop.init();
} catch (initErr) {
  console.error('[Outrun Racer] Init failed:', initErr.message);
  // Show a fallback message on canvas
  var _canvas = document.getElementById('c');
  if (_canvas) {
    var _ctx = _canvas.getContext('2d');
    _ctx.fillStyle = '#0a0030';
    _ctx.fillRect(0, 0, _canvas.width, _canvas.height);
    _ctx.fillStyle = '#ff2d78';
    _ctx.font = '24px Arial, sans-serif';
    _ctx.textAlign = 'center';
    _ctx.fillText('⚠️ Game failed to load', _canvas.width/2, _canvas.height/2);
    _ctx.fillStyle = '#aa88ff';
    _ctx.font = '14px Arial, sans-serif';
    _ctx.fillText('Check console for details', _canvas.width/2, _canvas.height/2 + 30);
  }
}

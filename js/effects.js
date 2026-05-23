/* ===== effects.js — Visual effects: exhaust, sparks, speed lines, nitro flames, screen shake, near-miss ===== */
var Effects = (function () {

  var shakeApplied = false;

  /* ================================================================
   *  EXHAUST
   * ================================================================ */
  function spawnExhaust() {
    var S = Game.S, C = Game.C;
    var cx = Game.canvas.width / 2 + S.playerX * getPlayerRoadHalfWidth();
    var cy = Game.canvas.height - C.CAR_BOTTOM_MARGIN + C.CAR_H / 2;
    var count = S.accelerating ? 3 : 1;
    for (var i = 0; i < count; i++) {
      S.exhaustParticles.push({
        x: cx + (Math.random() - 0.5) * 14,
        y: cy + Math.random() * 4,
        vx: (Math.random() - 0.5) * 25,
        vy: 18 + Math.random() * 30,
        life: 0.3 + Math.random() * 0.35,
        maxLife: 0.65,
        size: 2.5 + Math.random() * 3.5
      });
    }
  }

  function updateExhaust(dt) {
    var arr = Game.S.exhaustParticles;
    for (var i = arr.length - 1; i >= 0; i--) {
      var p = arr[i];
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.life -= dt; p.size *= 0.96;
      if (p.life <= 0) arr.splice(i, 1);
    }
  }

  function renderExhaust() {
    var ctx = Game.ctx, arr = Game.S.exhaustParticles;
    for (var i = 0; i < arr.length; i++) {
      var p = arr[i], alpha = Math.max(0, p.life / p.maxLife) * 0.5;
      ctx.fillStyle = 'rgba(140,140,160,' + alpha.toFixed(2) + ')';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
    }
  }

  /* ================================================================
   *  NITRO FLAMES
   * ================================================================ */
  function spawnNitroFlames() {
    var S = Game.S, C = Game.C;
    var cx = Game.canvas.width / 2 + S.playerX * getPlayerRoadHalfWidth();
    var cy = Game.canvas.height - C.CAR_BOTTOM_MARGIN + C.CAR_H / 2 + 2;
    for (var i = 0; i < 4; i++) {
      var colors = ['#ff0066', '#ff2d78', '#00e5ff', '#aa44ff'];
      S.nitroFlames.push({
        x: cx + (Math.random() - 0.5) * 16,
        y: cy,
        vx: (Math.random() - 0.5) * 30,
        vy: 40 + Math.random() * 60,
        life: 0.15 + Math.random() * 0.2,
        maxLife: 0.35,
        size: 3 + Math.random() * 5,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }
  }

  function updateNitroFlames(dt) {
    var arr = Game.S.nitroFlames;
    for (var i = arr.length - 1; i >= 0; i--) {
      var p = arr[i];
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.life -= dt; p.size *= 0.94;
      if (p.life <= 0) arr.splice(i, 1);
    }
  }

  function renderNitroFlames() {
    var ctx = Game.ctx, arr = Game.S.nitroFlames;
    for (var i = 0; i < arr.length; i++) {
      var p = arr[i], alpha = Math.max(0, p.life / p.maxLife) * 0.85;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  /* ================================================================
   *  SPEED LINES — Neon
   * ================================================================ */
  function updateSpeedLines(dt) {
    var S = Game.S, canvas = Game.canvas;
    var ratio = S.speed / Game.C.MAX_SPEED;
    var spd = S.nitroActive ? ratio + 0.3 : ratio;
    if (spd > 0.4) {
      var count = Math.floor((spd - 0.4) * 12);
      for (var i = 0; i < count; i++) {
        S.speedLines.push({
          x: Math.random() * canvas.width,
          y: Game.horizonY() + Math.random() * (canvas.height - Game.horizonY()),
          length: 25 + spd * 70,
          life: 0.06 + Math.random() * 0.12,
          maxLife: 0.18,
        });
      }
    }
    var arr = S.speedLines;
    for (var j = arr.length - 1; j >= 0; j--) {
      arr[j].life -= dt;
      if (arr[j].life <= 0) arr.splice(j, 1);
    }
  }

  function renderSpeedLines() {
    var ctx = Game.ctx, arr = Game.S.speedLines;
    var nitro = Game.S.nitroActive;
    for (var i = 0; i < arr.length; i++) {
      var l = arr[i], alpha = (l.life / l.maxLife) * 0.4;
      ctx.strokeStyle = nitro
        ? 'rgba(0,229,255,' + alpha.toFixed(2) + ')'
        : 'rgba(255,45,120,' + alpha.toFixed(2) + ')';
      ctx.lineWidth = nitro ? 2 : 1;
      ctx.beginPath(); ctx.moveTo(l.x, l.y); ctx.lineTo(l.x + l.length, l.y); ctx.stroke();
    }
  }

  /* ================================================================
   *  SPARKS
   * ================================================================ */
  function spawnSparks(x, y, n) {
    var arr = Game.S.sparkParticles;
    for (var i = 0; i < n; i++) {
      var angle = Math.random() * Math.PI * 2;
      var spd = 100 + Math.random() * 280;
      arr.push({
        x: x, y: y,
        vx: Math.cos(angle) * spd, vy: Math.sin(angle) * spd - 150,
        life: 0.4 + Math.random() * 0.6, maxLife: 1.0,
        size: 1.2 + Math.random() * 3,
        color: Math.random() > 0.3 ? '#ff6600' : '#ffcc00',
      });
    }
  }

  function updateSparks(dt) {
    var arr = Game.S.sparkParticles;
    for (var i = arr.length - 1; i >= 0; i--) {
      var p = arr[i];
      p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 400 * dt;
      p.life -= dt;
      if (p.life <= 0) arr.splice(i, 1);
    }
  }

  function renderSparks() {
    var ctx = Game.ctx, arr = Game.S.sparkParticles;
    for (var i = 0; i < arr.length; i++) {
      var p = arr[i], alpha = Math.max(0, p.life / p.maxLife);
      ctx.globalAlpha = alpha; ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.size, p.size);
    }
    ctx.globalAlpha = 1;
  }

  /* ================================================================
   *  SCREEN SHAKE
   * ================================================================ */
  function triggerShake(intensity, duration) {
    var sh = Game.S.screenShake; sh.intensity = intensity; sh.duration = duration; sh.timer = duration;
  }

  function applyShake(ctx) {
    var sh = Game.S.screenShake; shakeApplied = false;
    if (sh.timer <= 0) return;
    var progress = Math.max(0, sh.timer / sh.duration);
    var mag = sh.intensity * progress;
    ctx.save(); ctx.translate((Math.random()-.5)*mag*2, (Math.random()-.5)*mag*2);
    shakeApplied = true;
  }

  function endShake(ctx) { if (shakeApplied) { ctx.restore(); shakeApplied = false; } }

  /* ================================================================
   *  NEAR-MISS
   * ================================================================ */
  function spawnNearMissWoosh() {
    Game.S.nearMissFlash = 1.0;
    Game.S.nearMissWoosh.push({ life: 0.35, maxLife: 0.35 });
  }

  function updateNearMiss(dt) {
    var S = Game.S;
    if (S.nearMissFlash > 0) S.nearMissFlash = Math.max(0, S.nearMissFlash - dt * 3.5);
    var arr = S.nearMissWoosh;
    for (var i = arr.length - 1; i >= 0; i--) { arr[i].life -= dt; if (arr[i].life <= 0) arr.splice(i, 1); }
  }

  function renderNearMiss() {
    var S = Game.S, ctx = Game.ctx, canvas = Game.canvas;
    if (S.nearMissFlash <= 0) return;
    ctx.fillStyle = 'rgba(0,200,255,' + (S.nearMissFlash * 0.14).toFixed(3) + ')';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (var i = 0; i < S.nearMissWoosh.length; i++) {
      var w = S.nearMissWoosh[i], alpha = (w.life / w.maxLife) * 0.6;
      ctx.strokeStyle = 'rgba(0,210,255,' + alpha.toFixed(2) + ')'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(0, canvas.height * 0.25); ctx.lineTo(canvas.width * 0.18, canvas.height * 0.72); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(canvas.width, canvas.height * 0.25); ctx.lineTo(canvas.width * 0.82, canvas.height * 0.72); ctx.stroke();
    }
    ctx.lineWidth = 1;
  }

  /* ================================================================
   *  SHIELD EFFECT
   * ================================================================ */
  function renderShield() {
    if (!Game.S.shieldActive) return;
    var S = Game.S, C = Game.C, ctx = Game.ctx, canvas = Game.canvas;
    var cx = canvas.width / 2 + S.playerX * getPlayerRoadHalfWidth();
    var cy = canvas.height - C.CAR_BOTTOM_MARGIN;
    var r = C.CAR_W * 0.7;
    var pulse = 0.4 + Math.sin(Date.now() * 0.008) * 0.15;
    var grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    grad.addColorStop(0, 'rgba(0,229,255,0)');
    grad.addColorStop(0.7, 'rgba(0,229,255,' + (pulse * 0.15).toFixed(2) + ')');
    grad.addColorStop(1, 'rgba(0,229,255,' + (pulse * 0.35).toFixed(2) + ')');
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
    ctx.shadowColor = '#00e5ff';
    ctx.shadowBlur = 10;
    ctx.strokeStyle = 'rgba(0,229,255,' + (pulse * 0.6).toFixed(2) + ')';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
    ctx.shadowBlur = 0;
  }

  /* ================================================================
   *  HELPERS
   * ================================================================ */
  function getPlayerRoadHalfWidth() { return (Game.C.ROAD_BASE_WIDTH / Game.playerZ()) / 2; }

  /* ================================================================
   *  COMBINED UPDATE / RENDER
   * ================================================================ */
  function update(dt) {
    var S = Game.S;
    if (S.state === 'PLAY' && S.speed > 10) spawnExhaust();
    if (S.state === 'PLAY' && S.nitroActive) spawnNitroFlames();
    updateExhaust(dt); updateNitroFlames(dt);
    if (S.state === 'PLAY') updateSpeedLines(dt);
    updateSparks(dt); updateNearMiss(dt);
    // Power-up timers
    if (S.shieldActive) { S.shieldTimer -= dt; if (S.shieldTimer <= 0) S.shieldActive = false; }
    if (S.magnetActive) { S.magnetTimer -= dt; if (S.magnetTimer <= 0) S.magnetActive = false; }
    if (S.slowField)    { S.slowTimer -= dt;   if (S.slowTimer <= 0) S.slowField = false; }
    // Combo timer
    if (S.combo > 0) { S.comboTimer -= dt; if (S.comboTimer <= 0) { S.combo = 0; } }
    // Screen shake timer
    if (S.screenShake.timer > 0) S.screenShake.timer -= dt;
  }

  function render() {
    renderSpeedLines(); renderExhaust(); renderNitroFlames();
    renderSparks(); renderNearMiss(); renderShield();
  }

  return {
    update: update, render: render,
    spawnSparks: spawnSparks, triggerShake: triggerShake,
    applyShake: applyShake, endShake: endShake,
    spawnNearMissWoosh: spawnNearMissWoosh,
    getPlayerRoadHalfWidth: getPlayerRoadHalfWidth,
  };
})();

/* ===== traffic.js — Traffic cars + power-up orbs: spawning, collision, near-miss combos ===== */
var Traffic = (function () {

  /* ================================================================
   *  SPAWN TRAFFIC
   * ================================================================ */
  function spawn(dt) {
    var S = Game.S, C = Game.C;
    S.spawnTimer += dt;
    var interval = Math.max(0.45, 1.6 - (S.speed / C.MAX_SPEED) * 0.9);
    if (S.spawnTimer < interval) return;
    S.spawnTimer = 0;

    /* Bias traffic away from player lane so it doesn't spawn on top of the player */
    var lane;
    do { lane = (Math.random() - 0.5) * 1.1; } while (Math.abs(lane - S.playerX) < 0.35);

    var colorIdx = Math.floor(Math.random() * C.TRAFFIC_COLORS.length);
    var baseSpd = 0.25 + Math.random() * 0.45;

    S.traffic.push({
      z: C.TRAFFIC_SPAWN_Z,
      lane: lane,
      colorIdx: colorIdx,
      speed: baseSpd,
      scored: false,
      nearMissed: false,
    });
  }

  /* ================================================================
   *  SPAWN POWER-UPS
   * ================================================================ */
  function spawnPowerups(dt) {
    var S = Game.S, C = Game.C;
    S.powerupTimer += dt;
    var interval = S.powerupTimer < C.POWERUP_SPAWN_INTERVAL * 0.5
      ? C.POWERUP_SPAWN_INTERVAL * 0.5  /* First powerup appears faster */
      : C.POWERUP_SPAWN_INTERVAL;
    if (S.powerupTimer < interval) return;
    S.powerupTimer = 0;

    var lane = (Math.random() - 0.5) * 0.7;
    var type = C.POWERUP_TYPES[Math.floor(Math.random() * C.POWERUP_TYPES.length)];
    S.powerups.push({ z: C.TRAFFIC_SPAWN_Z, lane: lane, type: type, pulse: 0 });
  }

  /* ================================================================
   *  UPDATE
   * ================================================================ */
  function update(dt) {
    var S = Game.S, C = Game.C, pZ = Game.playerZ();

    /* ── Traffic ────────────────────────────────── */
    for (var i = S.traffic.length - 1; i >= 0; i--) {
      var t = S.traffic[i];
      var spdMul = S.slowField ? 0.4 : 1;
      var relSpeed = S.speed * C.TRAFFIC_SPEED_FACTOR * (1 - t.speed) * spdMul;
      t.z -= relSpeed * dt;

      if (t.z < C.TRAFFIC_REMOVE_Z) { S.traffic.splice(i, 1); continue; }

      /* Magnet pushes traffic aside */
      if (S.magnetActive) {
        var latDist = t.lane - S.playerX;
        if (Math.abs(latDist) < 0.5 && t.z < 30) {
          t.lane += (latDist > 0 ? 1 : -1) * dt * 2;
        }
      }

      /* Scoring */
      if (!t.scored && t.z < pZ) {
        t.scored = true;
        S.score++;
        S.combo++;
        S.comboTimer = 2.5;
        if (S.combo > S.bestCombo) S.bestCombo = S.combo;

        /* Combo bonuses */
        if (S.combo >= 5) {
          var bonus = Math.floor(S.combo / 5) * 2;
          S.score += bonus;
          CP.float.show(Game.canvas.width / 2, Game.canvas.height * 0.25,
            'x' + S.combo + ' COMBO! +' + bonus, '#ffd740');
        }
        CP.sound.coin();
        if (S.score % 10 === 0) CP.sound.powerup();
      }

      /* Collision */
      var zDist = Math.abs(t.z - pZ);
      var latD = Math.abs(t.lane - S.playerX);

      if (zDist < C.COLLISION_Z_RANGE && latD < C.COLLISION_THRESHOLD) {
        if (S.shieldActive) {
          /* Shield absorbs hit */
          S.shieldActive = false;
          S.traffic.splice(i, 1);
          Effects.spawnSparks(
            Game.canvas.width / 2 + S.playerX * Effects.getPlayerRoadHalfWidth(),
            Game.canvas.height - C.CAR_BOTTOM_MARGIN, 15);
          CP.float.show(Game.canvas.width / 2, Game.canvas.height * 0.4, 'SHIELD BLOCK!', '#00ccff');
          CP.sound.hit();
          continue;
        }
        handleCrash();
        break;
      }

      /* Near-miss — triggers when passing close alongside OR behind */
      if (!t.nearMissed && zDist < C.COLLISION_Z_RANGE * 2.5) {
        if (latD < C.NEAR_MISS_THRESHOLD && latD >= C.COLLISION_THRESHOLD) {
          t.nearMissed = true;
          var nmBonus = 3 + S.combo;
          S.score += nmBonus;
          S.combo++;
          S.comboTimer = 3;
          if (S.combo > S.bestCombo) S.bestCombo = S.combo;
          Effects.spawnNearMissWoosh();
          CP.sound.powerup();
          CP.float.show(Game.canvas.width / 2, Game.canvas.height / 2,
            '+' + nmBonus + ' NEAR MISS!', '#00ddff');
        }
      }
    }

    /* ── Power-ups ──────────────────────────────── */
    for (var j = S.powerups.length - 1; j >= 0; j--) {
      var pu = S.powerups[j];
      pu.z -= S.speed * C.TRAFFIC_SPEED_FACTOR * dt;
      pu.pulse += dt * 4;

      if (pu.z < C.TRAFFIC_REMOVE_Z) { S.powerups.splice(j, 1); continue; }

      /* Collection */
      var pzDist = Math.abs(pu.z - pZ);
      var platD = Math.abs(pu.lane - S.playerX);
      if (pzDist < C.COLLISION_Z_RANGE * 1.8 && platD < 0.35) {
        collectPowerup(pu.type);
        S.powerups.splice(j, 1);
      }
    }
  }

  /* ================================================================
   *  POWER-UP COLLECTION
   * ================================================================ */
  function collectPowerup(type) {
    var S = Game.S;
    CP.sound.powerup();
    var msg = '', color = '#ffd740';
    switch (type) {
      case 'nitro':
        S.nitro = Math.min(Game.C.NITRO_MAX, S.nitro + 50);
        msg = '⚡ NITRO +50'; color = '#44ccff';
        break;
      case 'shield':
        S.shieldActive = true; S.shieldTimer = 8;
        msg = '🛡 SHIELD'; color = '#00ccff';
        break;
      case 'magnet':
        S.magnetActive = true; S.magnetTimer = 6;
        msg = '🧲 MAGNET'; color = '#ff44aa';
        break;
      case 'slow':
        S.slowField = true; S.slowTimer = 5;
        msg = '❄ SLOW FIELD'; color = '#88ddff';
        break;
    }
    CP.float.show(Game.canvas.width / 2, Game.canvas.height * 0.35, msg, color);
    CP.particles.spawn(
      Game.canvas.width / 2 + S.playerX * Effects.getPlayerRoadHalfWidth(),
      Game.canvas.height - Game.C.CAR_BOTTOM_MARGIN, color, 20);
  }

  /* ================================================================
   *  CRASH
   * ================================================================ */
  function handleCrash() {
    var S = Game.S, C = Game.C, canvas = Game.canvas;
    S.state = 'DYING'; S.dyingTimer = C.DYING_DURATION;
    var carX = canvas.width / 2 + S.playerX * Effects.getPlayerRoadHalfWidth();
    var carY = canvas.height - C.CAR_BOTTOM_MARGIN;
    Effects.spawnSparks(carX, carY, 45);
    Effects.triggerShake(16, 0.6);
    CP.sound.hit(); CP.sound.die();
    CP.particles.spawn(carX, carY, '#ff6600', 30);
    if (S.score > S.highScore) { S.highScore = S.score; CP.storage.set('raceHigh', S.highScore); }
  }

  /* ================================================================
   *  RENDER — traffic cars + power-ups
   * ================================================================ */
  function render() {
    var ctx = Game.ctx, canvas = Game.canvas, S = Game.S, C = Game.C;
    var hY = Game.horizonY();

    /* Sort far-to-near */
    var allItems = [];
    for (var a = 0; a < S.traffic.length; a++) allItems.push({ type: 'traffic', data: S.traffic[a] });
    for (var b = 0; b < S.powerups.length; b++) allItems.push({ type: 'powerup', data: S.powerups[b] });
    allItems.sort(function (x, y) { return y.data.z - x.data.z; });

    for (var i = 0; i < allItems.length; i++) {
      var item = allItems[i];
      if (item.data.z <= 0) continue;

      var screenY = Road.zToScreenY(item.data.z);
      if (screenY < hY || screenY >= canvas.height) continue;

      var data = Road.getScanline(screenY);
      if (!data) continue;

      var scale = C.TRAFFIC_SCALE / item.data.z;
      var sx = data.cx + item.data.lane * data.halfRoad;

      if (item.type === 'traffic') {
        renderTrafficCar(ctx, sx, screenY, scale, item.data);
      } else {
        renderPowerupOrb(ctx, sx, screenY, scale, item.data);
      }
    }
  }

  function renderTrafficCar(ctx, sx, screenY, scale, t) {
    var colors = Game.C.TRAFFIC_COLORS[t.colorIdx];
    var carW = scale;
    var carH = scale * (colors.type === 'van' ? 0.75 : 0.55);
    if (sx + carW/2 < 0 || sx - carW/2 > Game.canvas.width) return;

    ctx.save(); ctx.translate(sx, screenY);

    /* Shadow */
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(0, carH/2, carW/2 + 3, Math.max(1, carH * 0.15), 0, 0, Math.PI * 2);
    ctx.fill();

    /* Body */
    ctx.fillStyle = colors.body;
    ctx.fillRect(-carW/2, -carH/2, carW, carH);

    /* Accent / roof */
    ctx.fillStyle = colors.accent;
    ctx.fillRect(-carW/2 + 2, -carH/2 + 1, carW - 4, carH * 0.35);

    /* Windshield */
    if (carW > 10) {
      ctx.fillStyle = colors.win;
      ctx.fillRect(-carW/2 + 4, -carH/2 + 2, carW - 8, carH * 0.25);
    }

    /* Tail-lights — neon red glow */
    if (carW > 6) {
      ctx.shadowColor = '#ff0066';
      ctx.shadowBlur = 8;
      ctx.fillStyle = '#ff0066';
      var lw = Math.max(1, carW * 0.13), lh = Math.max(1, carH * 0.15);
      ctx.fillRect(-carW/2 + 1, carH/2 - lh - 1, lw, lh);
      ctx.fillRect( carW/2 - lw - 1, carH/2 - lh - 1, lw, lh);
      ctx.shadowBlur = 0;
    }

    /* Headlights glow — neon yellow when headlights on */
    if (carW > 12) {
      var hlGlow = Game.S.headlightsOn ? 8 : 0;
      ctx.shadowColor = '#ffee44';
      ctx.shadowBlur = hlGlow;
      ctx.fillStyle = Game.S.headlightsOn ? '#ffffaa' : '#ffcc66';
      ctx.fillRect(-carW/2 + 2, -carH/2 - 1, 6, 3);
      ctx.fillRect( carW/2 - 8, -carH/2 - 1, 6, 3);
      ctx.shadowBlur = 0;
    }

    ctx.restore();
  }

  function renderPowerupOrb(ctx, sx, screenY, scale, pu) {
    var r = Math.max(4, scale * 0.2);
    var pulse = 1 + Math.sin(pu.pulse) * 0.2;
    r *= pulse;

    var colors = { nitro: '#44ccff', shield: '#00ff88', magnet: '#ff44aa', slow: '#88ddff' };
    var icons = { nitro: '⚡', shield: '🛡', magnet: '🧲', slow: '❄' };
    var color = colors[pu.type] || '#ffd740';

    /* Glow */
    var glow = ctx.createRadialGradient(sx, screenY, 0, sx, screenY, r * 3);
    glow.addColorStop(0, color);
    glow.addColorStop(1, 'transparent');
    ctx.globalAlpha = 0.2;
    ctx.fillStyle = glow;
    ctx.fillRect(sx - r * 3, screenY - r * 3, r * 6, r * 6);
    ctx.globalAlpha = 1;

    /* Orb */
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 8;
    ctx.beginPath(); ctx.arc(sx, screenY, r, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;

    /* Icon */
    if (r > 6) {
      ctx.font = Math.floor(r * 1.2) + 'px sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(icons[pu.type] || '?', sx, screenY);
    }
  }

  return { spawn: spawn, spawnPowerups: spawnPowerups, update: update, render: render };
})();

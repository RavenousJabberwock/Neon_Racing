/* ===== renderer.js — Outrun Environment: neon sky, time-of-day, weather, headlights, roadside ===== */
var Renderer = (function () {

  /* ================================================================
   *  SKY — Outrun gradient with time-of-day blending
   * ================================================================ */
  function drawSky() {
    var ctx = Game.ctx, canvas = Game.canvas, hY = Game.horizonY();
    var todColor = Game.getTODColor();

    var grad = ctx.createLinearGradient(0, 0, 0, hY + 20);
    grad.addColorStop(0, todColor.skyTop);
    grad.addColorStop(0.5, Game.lerpColor(todColor.skyTop, todColor.skyBot, 0.5));
    grad.addColorStop(1, todColor.skyBot);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, hY + 20);

    /* Outrun sun/moon glow band at horizon */
    var glowGrad = ctx.createLinearGradient(0, hY - 60, 0, hY + 10);
    glowGrad.addColorStop(0, 'rgba(255,45,120,0)');
    glowGrad.addColorStop(0.5, 'rgba(255,45,120,0.15)');
    glowGrad.addColorStop(1, 'rgba(255,45,120,0)');
    ctx.fillStyle = glowGrad;
    ctx.fillRect(0, hY - 60, canvas.width, 70);

    /* Stars at night */
    var isNight = Game.S.tod > 0.6 || Game.S.tod < 0.1;
    if (isNight) {
      ctx.fillStyle = '#ffffff';
      for (var i = 0; i < 60; i++) {
        var starX = ((i * 137.5 + 42) % canvas.width);
        var starY = ((i * 89.3 + 17) % (hY * 0.85));
        var starR = 0.5 + (i % 4) * 0.5;
        var twinkle = 0.5 + Math.sin(Date.now() * 0.002 + i * 1.7) * 0.5;
        ctx.globalAlpha = twinkle * (0.3 + (i % 6) * 0.1);
        ctx.beginPath(); ctx.arc(starX, starY, starR, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
  }

  /* ================================================================
   *  SUN / MOON — Outrun-style radiant orb
   * ================================================================ */
  function drawSun() {
    var ctx = Game.ctx, canvas = Game.canvas, hY = Game.horizonY();
    var todColor = Game.getTODColor();
    var sx = canvas.width * 0.72, sy = hY * 0.35, r = 35;
    var isNight = Game.S.tod > 0.6 || Game.S.tod < 0.1;

    if (isNight) {
      /* Neon moon — cyan glow */
      ctx.shadowColor = '#00e5ff';
      ctx.shadowBlur = 30;
      ctx.fillStyle = '#cceeff';
      ctx.beginPath(); ctx.arc(sx, sy, r * 0.65, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;

      /* Moon crescent */
      ctx.fillStyle = Game.getTODColor().skyTop;
      ctx.beginPath(); ctx.arc(sx + r * 0.2, sy - r * 0.1, r * 0.5, 0, Math.PI * 2); ctx.fill();
      return;
    }

    /* Outer glow — Outrun pink/cyan */
    var glow = ctx.createRadialGradient(sx, sy, 0, sx, sy, r * 4);
    glow.addColorStop(0, 'rgba(255,45,120,0.5)');
    glow.addColorStop(0.3, 'rgba(255,45,120,0.15)');
    glow.addColorStop(0.6, 'rgba(0,229,255,0.05)');
    glow.addColorStop(1, 'rgba(0,229,255,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(sx - r * 4, sy - r * 4, r * 8, r * 8);

    /* Disc */
    var disc = ctx.createRadialGradient(sx, sy, 0, sx, sy, r);
    disc.addColorStop(0, '#fff8e0');
    disc.addColorStop(0.4, '#ffcc44');
    disc.addColorStop(0.8, '#ff66aa');
    disc.addColorStop(1, '#ff2d78');
    ctx.fillStyle = disc;
    ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI * 2); ctx.fill();

    /* Outrun horizontal line through sun */
    ctx.fillStyle = 'rgba(255,45,120,0.08)';
    ctx.fillRect(0, sy, canvas.width, 1);
  }

  /* ================================================================
   *  CLOUDS — floating with neon tint
   * ================================================================ */
  function initClouds() {
    if (Game.S.clouds.length > 0) return;
    for (var i = 0; i < 6; i++) {
      Game.S.clouds.push({
        x: Math.random() * Game.canvas.width * 1.4 - Game.canvas.width * 0.2,
        y: 10 + Math.random() * (Game.horizonY() * 0.5),
        w: 60 + Math.random() * 100,
        h: 18 + Math.random() * 25,
        speed: 8 + Math.random() * 15,
      });
    }
  }

  function updateClouds(dt) {
    initClouds();
    var clouds = Game.S.clouds, canvas = Game.canvas;
    var drift = Game.S.curveAmount * -2;
    for (var i = 0; i < clouds.length; i++) {
      var c = clouds[i];
      c.x += (c.speed + drift) * dt;
      if (c.x > canvas.width + c.w) c.x = -c.w;
      if (c.x < -c.w * 2) c.x = canvas.width + c.w;
    }
  }

  function renderClouds() {
    var ctx = Game.ctx, clouds = Game.S.clouds;
    var todColor = Game.getTODColor();
    for (var i = 0; i < clouds.length; i++) {
      var c = clouds[i];
      /* Neon-tinted clouds */
      var alpha = 0.06 + todColor.ambientLight * 0.08;
      ctx.fillStyle = 'rgba(255,45,120,' + alpha.toFixed(3) + ')';
      ctx.beginPath();
      ctx.ellipse(c.x, c.y, c.w / 2, c.h / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(c.x - c.w * 0.25, c.y + 3, c.w * 0.3, c.h * 0.35, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(c.x + c.w * 0.22, c.y + 2, c.w * 0.35, c.h * 0.4, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /* ================================================================
   *  MOUNTAINS — Outrun silhouettes
   * ================================================================ */
  function drawMountains() {
    var ctx = Game.ctx, canvas = Game.canvas, S = Game.S, hY = Game.horizonY();
    var biome = Game.getBiome();
    var bCur = biome.current || C.BIOMES[0] || { mtn1: '#120030', mtn2: '#1e0050' };
    var bNxt = biome.next || C.BIOMES[0] || { mtn1: '#120030', mtn2: '#1e0050' };
    var bT = isFinite(biome.t) ? biome.t : 0;
    var mtnL = Game.lerpColor(bCur.mtn2, bNxt.mtn2, bT);
    var mtnD = Game.lerpColor(bCur.mtn1, bNxt.mtn1, bT);
    var px = S.curveAmount * -6;

    /* Far layer — lighter */
    ctx.fillStyle = Game.lerpColor(mtnL, '#3322aa', 0.3);
    ctx.beginPath(); ctx.moveTo(0, hY);
    var farPts = [0.10,-25, 0.20,-48, 0.35,-32, 0.50,-55, 0.65,-38, 0.80,-58, 0.90,-25, 1.00,0];
    for (var i = 0; i < farPts.length; i += 2) ctx.lineTo(canvas.width * farPts[i] + px * 0.5, hY + farPts[i+1]);
    ctx.lineTo(canvas.width, hY + 5); ctx.lineTo(0, hY + 5); ctx.closePath(); ctx.fill();

    /* Near layer — darker with neon edge */
    ctx.fillStyle = mtnD;
    ctx.beginPath(); ctx.moveTo(0, hY);
    var nearPts = [0.08,-30, 0.15,-60, 0.22,-42, 0.30,-78, 0.38,-52, 0.45,-82, 0.52,-62, 0.58,-92, 0.65,-56, 0.72,-70, 0.80,-46, 0.88,-62, 0.95,-35, 1.00,0];
    for (var j = 0; j < nearPts.length; j += 2) ctx.lineTo(canvas.width * nearPts[j] + px, hY + nearPts[j+1]);
    ctx.lineTo(canvas.width, hY + 5); ctx.lineTo(0, hY + 5); ctx.closePath(); ctx.fill();

    /* Neon edge highlight on mountains */
    ctx.strokeStyle = 'rgba(255,45,120,0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, hY);
    for (var k = 0; k < nearPts.length; k += 2) ctx.lineTo(canvas.width * nearPts[k] + px, hY + nearPts[k+1]);
    ctx.stroke();
  }

  /* ================================================================
   *  HEADLIGHTS — car light beams projecting onto road
   * ================================================================ */
  function drawHeadlights() {
    var S = Game.S, C = Game.C, ctx = Game.ctx, canvas = Game.canvas;
    var hY = Game.horizonY();
    var todColor = Game.getTODColor();

    /* Headlights state already set in Game.update() */
    if (!S.headlightsOn) return;

    var cx = canvas.width / 2 + S.playerX * Effects.getPlayerRoadHalfWidth();
    var cy = canvas.height - C.CAR_BOTTOM_MARGIN;

    /* Left headlight beam */
    var gradL = ctx.createRadialGradient(cx - 15, cy - 20, 5, cx - 30, cy - 120, canvas.height * 0.5);
    gradL.addColorStop(0, 'rgba(255,255,200,0.12)');
    gradL.addColorStop(0.3, 'rgba(255,255,200,0.06)');
    gradL.addColorStop(1, 'rgba(255,255,200,0)');

    ctx.fillStyle = gradL;
    ctx.beginPath();
    ctx.moveTo(cx - 18, cy - 18);
    ctx.lineTo(cx - 100, 0);
    ctx.lineTo(cx + 20, 0);
    ctx.lineTo(cx - 6, cy - 18);
    ctx.closePath();
    ctx.fill();

    /* Right headlight beam */
    var gradR = ctx.createRadialGradient(cx + 15, cy - 20, 5, cx + 30, cy - 120, canvas.height * 0.5);
    gradR.addColorStop(0, 'rgba(255,255,200,0.12)');
    gradR.addColorStop(0.3, 'rgba(255,255,200,0.06)');
    gradR.addColorStop(1, 'rgba(255,255,200,0)');

    ctx.fillStyle = gradR;
    ctx.beginPath();
    ctx.moveTo(cx + 6, cy - 18);
    ctx.lineTo(cx - 20, 0);
    ctx.lineTo(cx + 100, 0);
    ctx.lineTo(cx + 18, cy - 18);
    ctx.closePath();
    ctx.fill();

    /* Ambient road glow near car */
    var roadGlow = ctx.createRadialGradient(cx, cy, 10, cx, cy + 100, canvas.height * 0.2);
    roadGlow.addColorStop(0, 'rgba(255,255,200,0.06)');
    roadGlow.addColorStop(0.5, 'rgba(255,255,200,0.02)');
    roadGlow.addColorStop(1, 'rgba(255,255,200,0)');
    ctx.fillStyle = roadGlow;
    ctx.fillRect(0, hY, canvas.width, canvas.height - hY);
  }

  /* ================================================================
   *  RAIN — particle system
   * ================================================================ */
  function updateRain(dt) {
    var S = Game.S, canvas = Game.canvas;
    if (S.weather !== 'rain') {
      S.rainDrops.length = 0;
      return;
    }

    /* Spawn */
    var target = 120;
    while (S.rainDrops.length < target) {
      S.rainDrops.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        speed: 300 + Math.random() * 400,
        length: 8 + Math.random() * 12,
        opacity: 0.2 + Math.random() * 0.3,
      });
    }

    for (var i = S.rainDrops.length - 1; i >= 0; i--) {
      var r = S.rainDrops[i];
      r.y += r.speed * dt;
      r.x -= 60 * dt; /* wind */
      if (r.y > canvas.height) {
        r.y = -r.length;
        r.x = Math.random() * canvas.width;
      }
    }
  }

  function renderRain() {
    var S = Game.S, ctx = Game.ctx, canvas = Game.canvas;
    if (S.weather !== 'rain') return;

    for (var i = 0; i < S.rainDrops.length; i++) {
      var r = S.rainDrops[i];
      ctx.strokeStyle = 'rgba(150,180,255,' + r.opacity.toFixed(2) + ')';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(r.x, r.y);
      ctx.lineTo(r.x - 3, r.y + r.length);
      ctx.stroke();
    }
  }

  /* ================================================================
   *  FOG — overlay
   * ================================================================ */
  function updateFog(dt) {
    var S = Game.S;
    if (S.weather === 'fog') {
      S.fogAmount = Math.min(0.35, S.fogAmount + dt * 0.1);
    } else {
      S.fogAmount = Math.max(0, S.fogAmount - dt * 0.1);
    }
  }

  function renderFog() {
    if (Game.S.fogAmount <= 0) return;
    var ctx = Game.ctx, canvas = Game.canvas;
    ctx.fillStyle = 'rgba(255,200,255,' + Game.S.fogAmount.toFixed(2) + ')';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  /* ================================================================
   *  ROADSIDE OBJECTS — Outrun neon trees/posts
   * ================================================================ */
  function drawRoadsideObjects() {
    var ctx = Game.ctx, canvas = Game.canvas, S = Game.S, C = Game.C;
    var hY = Game.horizonY();
    var interval = 16, zStart = 4, zEnd = 150;

    for (var baseZ = zStart; baseZ < zEnd; baseZ += interval) {
      var scrollFactor = C.TREE_SCROLL;
      var z = ((baseZ - S.scrollOffset * scrollFactor) % (zEnd - zStart));
      if (z < 0 || !isFinite(z)) z += (zEnd - zStart);
      if (!isFinite(z)) z = baseZ;
      z += zStart;

      var screenY = Road.zToScreenY(z);
      if (screenY < hY + 3 || screenY > canvas.height - 15) continue;

      var data = Road.getScanline(Math.floor(screenY));
      if (!data) continue;

      var scale = C.TRAFFIC_SCALE / z;
      var postH = scale * 1.8;
      var postW = Math.max(1, scale * 0.09);
      var foliageR = scale * 0.5;

      var lx = data.cx - data.halfRoad - scale * 0.4;
      var rx = data.cx + data.halfRoad + scale * 0.4;

      /* Neon-outline style trees */
      drawNeonTree(ctx, lx, screenY, postW, postH, foliageR, scale);
      drawNeonTree(ctx, rx, screenY, postW, postH, foliageR, scale);

      /* Neon road posts */
      if (Math.floor(baseZ / interval) % 3 === 0 && scale > 3) {
        drawNeonPost(ctx, lx + scale * 0.15, screenY, scale);
      }
    }
  }

  function drawNeonTree(ctx, x, baseY, trunkW, trunkH, leafR, scale) {
    /* Glowing trunk */
    ctx.fillStyle = '#441155';
    ctx.fillRect(x - trunkW / 2, baseY - trunkH, trunkW, trunkH);

    if (scale > 3) {
      /* Neon pink foliage */
      ctx.shadowColor = '#ff2d78';
      ctx.shadowBlur = 8;
      ctx.fillStyle = '#1a0030';
      ctx.beginPath();
      ctx.arc(x, baseY - trunkH - leafR * 0.5, leafR, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#2a0050';
      ctx.beginPath();
      ctx.arc(x + leafR * 0.3, baseY - trunkH - leafR * 0.2, leafR * 0.7, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      /* Neon edge */
      if (scale > 8) {
        ctx.strokeStyle = 'rgba(170,68,255,0.15)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(x, baseY - trunkH - leafR * 0.5, leafR, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }

  function drawNeonPost(ctx, x, baseY, scale) {
    var h = scale * 0.8, w = Math.max(1, scale * 0.04);
    ctx.fillStyle = '#442266';
    ctx.fillRect(x - w / 2, baseY - h, w, h);
    if (scale > 6) {
      ctx.shadowColor = '#00e5ff';
      ctx.shadowBlur = 12;
      ctx.fillStyle = '#00e5ff';
      ctx.beginPath(); ctx.arc(x, baseY - h, scale * 0.06, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  /* ================================================================
   *  BILLBOARDS — neon signs
   * ================================================================ */
  function drawBillboards() {
    var ctx = Game.ctx, canvas = Game.canvas, S = Game.S, C = Game.C;
    var hY = Game.horizonY();
    var interval = 80, zStart = 20, zEnd = 150;
    var signs = ['NEON', 'TURBO', 'SPEED', 'DREAM', 'WAVE', 'FAST'];

    for (var baseZ = zStart; baseZ < zEnd; baseZ += interval) {
      var z = ((baseZ - S.scrollOffset * C.TREE_SCROLL * 0.8) % (zEnd - zStart));
      if (z < 0 || !isFinite(z)) z += (zEnd - zStart);
      if (!isFinite(z)) z = baseZ;
      z += zStart;

      var screenY = Road.zToScreenY(z);
      if (screenY < hY + 10 || screenY > canvas.height - 40) continue;

      var data = Road.getScanline(Math.floor(screenY));
      if (!data) continue;

      var scale = C.TRAFFIC_SCALE / z;
      if (scale < 8) continue;

      var bx = data.cx + data.halfRoad + scale * 0.65;
      var bw = scale * 0.6, bh = scale * 0.3;
      var by = screenY - scale * 1.2;

      /* Post */
      ctx.fillStyle = '#332266';
      ctx.fillRect(bx - 1, by + bh, 2, screenY - by - bh);

      /* Neon board */
      ctx.shadowColor = '#ff2d78';
      ctx.shadowBlur = 10;
      ctx.fillStyle = '#0a0030';
      ctx.fillRect(bx - bw / 2, by, bw, bh);
      ctx.shadowBlur = 0;
      ctx.strokeStyle = '#ff2d78';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(bx - bw / 2, by, bw, bh);

      /* Neon text */
      var idx = Math.floor(baseZ / interval) % signs.length;
      ctx.shadowColor = '#00e5ff';
      ctx.shadowBlur = 6;
      ctx.fillStyle = '#00e5ff';
      ctx.font = 'bold ' + Math.floor(bh * 0.6) + 'px sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(signs[idx], bx, by + bh / 2);
      ctx.shadowBlur = 0;
    }
  }

  /* ================================================================
   *  WEATHER — update cycle
   * ================================================================ */
  function updateWeather(dt) {
    var S = Game.S, C = Game.C;
    S.weatherTimer += dt;
    if (S.weatherTimer > 20 + Math.random() * 15) {
      S.weatherTimer = 0;
      var newWeather = C.WEATHER_TYPES[Math.floor(Math.random() * C.WEATHER_TYPES.length)];
      S.weather = newWeather;
    }
  }

  /* ================================================================
   *  TIME-OF-DAY — update cycle
   * ================================================================ */
  function updateTimeOfDay(dt) {
    var S = Game.S, C = Game.C;
    S.todTimer += dt;
    var cycleTime = C.TOD_CYCLE;
    S.tod = (S.todTimer % cycleTime) / cycleTime;
  }

  /* ================================================================
   *  MENU SCREEN — Outrun style
   * ================================================================ */
  function drawMenu() {
    var ctx = Game.ctx, canvas = Game.canvas;

    /* Dark neon band */
    ctx.fillStyle = 'rgba(10,0,48,0.7)';
    ctx.fillRect(0, canvas.height * 0.18, canvas.width, canvas.height * 0.50);

    /* Grid lines — Outrun aesthetic */
    ctx.strokeStyle = 'rgba(255,45,120,0.05)';
    ctx.lineWidth = 1;
    for (var i = 0; i < canvas.width; i += 40) {
      ctx.beginPath(); ctx.moveTo(i, canvas.height * 0.18); ctx.lineTo(i, canvas.height * 0.68); ctx.stroke();
    }
    for (var j = canvas.height * 0.18; j < canvas.height * 0.68; j += 40) {
      ctx.beginPath(); ctx.moveTo(0, j); ctx.lineTo(canvas.width, j); ctx.stroke();
    }

    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';

    /* Title — Outrun neon glow */
    ctx.shadowColor = '#ff2d78';
    ctx.shadowBlur = 30;
    ctx.font = 'bold 42px Arial, sans-serif';
    ctx.fillStyle = '#ff2d78';
    ctx.fillText('NEON ROAD', canvas.width / 2, canvas.height * 0.28);

    ctx.shadowColor = '#00e5ff';
    ctx.shadowBlur = 20;
    ctx.font = 'bold 20px Arial, sans-serif';
    ctx.fillStyle = '#00e5ff';
    ctx.fillText('OUTRUN RACER', canvas.width / 2, canvas.height * 0.28 + 44);
    ctx.shadowBlur = 0;

    /* Controls */
    ctx.font = '14px Arial, sans-serif';
    ctx.fillStyle = '#aa88ff';
    ctx.fillText('↑ ↓ ← → or WASD to drive', canvas.width / 2, canvas.height * 0.46);
    ctx.fillText('SPACE / N for NITRO boost', canvas.width / 2, canvas.height * 0.46 + 22);
    ctx.fillText('Tap or click to start', canvas.width / 2, canvas.height * 0.46 + 44);

    /* Features — purple */
    ctx.font = '11px Arial, sans-serif';
    ctx.fillStyle = '#8866cc';
    ctx.fillText('🌙 Real-time Day/Night Cycle • Weather • Neon FX', canvas.width / 2, canvas.height * 0.56);

    /* High-score */
    if (Game.S.highScore > 0) {
      ctx.font = 'bold 15px Arial, sans-serif';
      ctx.fillStyle = '#ffd740';
      ctx.fillText('🏆 Best: ' + Game.S.highScore, canvas.width / 2, canvas.height * 0.62);
    }

    /* Pulsing start */
    var pulse = 0.4 + Math.sin(Date.now() * 0.003) * 0.4;
    ctx.globalAlpha = pulse;
    ctx.shadowColor = '#00e5ff';
    ctx.shadowBlur = 15;
    ctx.font = 'bold 18px Arial, sans-serif';
    ctx.fillStyle = '#00e5ff';
    ctx.fillText('▶ PRESS ANY KEY ◀', canvas.width / 2, canvas.height * 0.70);
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  }

  return {
    drawSky: drawSky, drawSun: drawSun,
    drawMountains: drawMountains, drawRoadsideObjects: drawRoadsideObjects,
    drawBillboards: drawBillboards, drawMenu: drawMenu,
    drawHeadlights: drawHeadlights,
    updateClouds: updateClouds, renderClouds: renderClouds,
    updateRain: updateRain, renderRain: renderRain,
    updateFog: updateFog, renderFog: renderFog,
    updateWeather: updateWeather, updateTimeOfDay: updateTimeOfDay,
  };
})();

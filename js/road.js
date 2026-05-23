/* ===== road.js — Pseudo-3D road with FAST scrolling, 2-lane markers, hill undulation ===== */
var Road = (function () {

  var scanlineData = {};

  /* =
   *  UPDATE — scroll offset, curves, hills
   * = */
  function update(dt) {
    var S = Game.S, C = Game.C;

    /* ★ Road scroll — FAST, visible movement */
    S.scrollOffset += S.speed * dt;
    S.distance += S.speed * dt * 0.01;

    /* Smooth curve transitions */
    S.curveTimer -= dt;
    if (S.curveTimer <= 0) {
      S.curveTarget = (Math.random() - 0.5) * 5;
      S.curveTimer = 1.5 + Math.random() * 3;
    }
    S.curveAmount += (S.curveTarget - S.curveAmount) * dt * 1.4;

    /* Hill undulations */
    S.hillTimer -= dt;
    if (S.hillTimer <= 0) {
      S.hillTarget = (Math.random() - 0.5) * 40;
      S.hillTimer = 2 + Math.random() * 3;
    }
    S.hillAmount += (S.hillTarget - S.hillAmount) * dt * 0.8;

    /* Biome tracking — robust numeric guard */
    var numBiomes = C.BIOMES.length;
    var biomeIdx = Math.floor(S.distance / C.BIOME_DISTANCE);
    // Guard against NaN/Infinity
    if (!isFinite(biomeIdx)) biomeIdx = 0;
    biomeIdx = biomeIdx % numBiomes;
    if (biomeIdx < 0) biomeIdx += numBiomes;

    if (biomeIdx !== S.currentBiome && biomeIdx >= 0 && biomeIdx < numBiomes) {
      var biomeData = C.BIOMES[biomeIdx];
      if (biomeData) {
        S.currentBiome = biomeIdx;
        CP.float.show(Game.canvas.width / 2, Game.canvas.height * 0.2,
          biomeData.name + ' Zone', '#ffd740');
      }
    }
  }

  /* =
   *  RENDER — scanline drawing with ★ fixed scroll speed
   * = */
  function render() {
    var ctx = Game.ctx, canvas = Game.canvas, C = Game.C, S = Game.S;
    var hY = Game.horizonY();
    var biome = Game.getBiome();

    /* Biome-blended colours — safe fallback if biome data is missing */
    var bCur = biome.current || C.BIOMES[0] || { grass1: '#0a0020', grass2: '#150040' };
    var bNxt = biome.next || C.BIOMES[0] || { grass1: '#0a0020', grass2: '#150040' };
    var bT = isFinite(biome.t) ? biome.t : 0;
    var grass1 = Game.lerpColor(bCur.grass1, bNxt.grass1, bT);
    var grass2 = Game.lerpColor(bCur.grass2, bNxt.grass2, bT);

    scanlineData = {};
    var curveAccum = 0;
    var hillAccum = 0;

    for (var y = canvas.height - 1; y >= hY; y--) {
      var dy = y - hY;
      if (dy <= 0) break;

      var z = C.CAMERA_HEIGHT / dy;
      var roadW = C.ROAD_BASE_WIDTH / z;
      var halfRoad = roadW / 2;

      /* Curve offset */
      curveAccum += S.curveAmount / z * 0.9;
      /* Hill offset */
      hillAccum = Math.sin(z * 0.03 + S.distance * 0.003) * S.hillAmount * (1 - dy / (canvas.height - hY));
      var cx = canvas.width / 2 + curveAccum;
      var adjustedY = y + hillAccum;

      scanlineData[y] = { cx: cx, halfRoad: halfRoad, z: z, adjustedY: adjustedY };

      /* ★ FIXED: scroll factor increased from 0.08 to 0.35 */
      var seg = Math.floor((z * 10 + S.scrollOffset * C.SCROLL_FACTOR) / C.SEGMENT_LENGTH);
      var isLight = seg % 2 === 0;

      /* Grass */
      ctx.fillStyle = isLight ? grass1 : grass2;
      ctx.fillRect(0, y, canvas.width, 1);

      /* Rumble strips — neon outrun */
      var rumbleW = Math.max(2, roadW * 0.04);
      ctx.fillStyle = isLight ? C.RUMBLE_RED : C.RUMBLE_WHITE;
      ctx.fillRect(cx - halfRoad - rumbleW, y, rumbleW, 1);
      ctx.fillRect(cx + halfRoad, y, rumbleW, 1);

      /* Road surface */
      ctx.fillStyle = isLight ? C.ROAD_LIGHT : C.ROAD_DARK;
      ctx.fillRect(cx - halfRoad, y, roadW, 1);

      /* Edge lines */
      var lineW = Math.max(1, roadW * 0.012);
      ctx.fillStyle = C.EDGE_LINE;
      ctx.fillRect(cx - halfRoad, y, lineW, 1);
      ctx.fillRect(cx + halfRoad - lineW, y, lineW, 1);

      /* ★ Lane dashes — neon glow */
      if (isLight) {
        ctx.fillStyle = C.LANE_LINE;
        ctx.shadowColor = '#ff4488';
        ctx.shadowBlur = 4;
        var dashW = Math.max(1, lineW * 0.9);
        ctx.fillRect(cx - dashW / 2, y, dashW, 1);
        ctx.shadowBlur = 0;
      }
    }
  }

  /* =
   *  PROJECTION HELPERS
   * = */
  function getScanline(screenY) { return scanlineData[Math.floor(screenY)] || null; }

  function zToScreenY(z) {
    if (z <= 0) return Game.canvas.height + 100;
    return Game.horizonY() + Game.C.CAMERA_HEIGHT / z;
  }

  return { update: update, render: render, getScanline: getScanline, zToScreenY: zToScreenY };
})();
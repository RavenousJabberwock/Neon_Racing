/* ===== config.js — Game constants, state & canvas ===== */
var Game = (function () {

  var canvas = document.getElementById('c');
  var ctx    = canvas.getContext('2d');

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  /* Expose canvas for other modules */
  function getCanvas() { return canvas; }
  function getCtx() { return ctx; }

  /* ================================================================
   *  C — CONSTANTS
   * ================================================================ */
  var C = {
    /* Camera & road geometry */
    CAMERA_HEIGHT:   1500,
    ROAD_BASE_WIDTH: 2200,
    SEGMENT_LENGTH:  5,
    SCROLL_FACTOR:   0.35,
    TREE_SCROLL:     0.06,

    /* Player car */
    CAR_W: 60,
    CAR_H: 38,
    CAR_BOTTOM_MARGIN: 90,

    /* Physics */
    MAX_SPEED:         380,
    ACCELERATION:      130,
    BRAKE_FORCE:       250,
    DECELERATION:      40,
    STEER_SPEED:       2.8,
    CURVE_DRIFT_FACTOR: 0.30,
    CENTER_FORCE:      0.6,

    /* Nitro */
    NITRO_MAX:          100,
    NITRO_REGEN:        6,
    NITRO_DRAIN:        30,
    NITRO_SPEED_BONUS:  180,
    NITRO_ACCEL_BONUS:  200,

    /* Traffic */
    TRAFFIC_SPAWN_Z:      160,
    TRAFFIC_REMOVE_Z:     1.2,
    TRAFFIC_SPEED_FACTOR: 0.18,
    NEAR_MISS_THRESHOLD:  0.40,
    COLLISION_THRESHOLD:  0.10,
    COLLISION_Z_RANGE:    1.0,
    TRAFFIC_SCALE:        220,

    /* Power-ups */
    POWERUP_SPAWN_INTERVAL: 8,
    POWERUP_TYPES: ['nitro', 'shield', 'magnet', 'slow'],

    DYING_DURATION: 1.2,

    /* Outrun colour palette — retro-wave / synthwave */
    PINK:         '#ff2d78',
    CYAN:         '#00e5ff',
    PURPLE:       '#aa44ff',
    HOT_PINK:     '#ff0066',
    NEON_BLUE:    '#00ccff',
    DARK_BG:      '#0a0030',
    DARK_PURPLE:  '#1a0040',
    LIGHT_PINK:   '#ff77aa',

    /* Road colours — Outrun night aesthetic */
    ROAD_DARK:       '#1a1a2e',
    ROAD_LIGHT:      '#2a2a4e',
    GRASS_DARK:      '#0a0020',
    GRASS_LIGHT:     '#150040',
    RUMBLE_RED:      '#ff0066',
    RUMBLE_WHITE:    '#ff77aa',
    EDGE_LINE:       '#ff4488',
    LANE_LINE:       'rgba(255,68,136,0.6)',

    /* Sky — Outrun sunset gradient */
    SKY_TOP:         '#0a0030',
    SKY_MID:         '#1a0050',
    SKY_BOTTOM:      '#ff2d78',
    MOUNTAIN_DARK:   '#120030',
    MOUNTAIN_LIGHT:  '#1e0050',

    /* Traffic car colour variations — neon */
    TRAFFIC_COLORS: [
      { body: '#ff0066', accent: '#cc0055', win: '#0a0030', type: 'car' },
      { body: '#00e5ff', accent: '#00b8d4', win: '#0a0030', type: 'car' },
      { body: '#aa44ff', accent: '#8833cc', win: '#0a0030', type: 'car' },
      { body: '#ffcc00', accent: '#d4aa00', win: '#0a0030', type: 'car' },
      { body: '#00ff88', accent: '#00cc6a', win: '#0a0030', type: 'car' },
      { body: '#ff66aa', accent: '#cc4488', win: '#0a0030', type: 'car' },
      { body: '#ff8800', accent: '#cc6600', win: '#222', type: 'van'  },
      { body: '#00ffff', accent: '#00cccc', win: '#0a0030', type: 'car' },
      { body: '#ff4488', accent: '#cc2266', win: '#0a0030', type: 'sports' },
      { body: '#ffee00', accent: '#ccbb00', win: '#111', type: 'sports' },
    ],

    /* Time-of-day cycle times (seconds) */
    TOD_DAWN:    30,
    TOD_DAY:     60,
    TOD_DUSK:    90,
    TOD_NIGHT:   120,
    TOD_CYCLE:   120,

    /* Weather types */
    WEATHER_TYPES: ['clear', 'clear', 'clear', 'rain', 'clear', 'clear', 'fog', 'clear'],

    /* Biomes — Outrun style */
    BIOMES: [
      { grass1: '#0a0020', grass2: '#150040', sky1: '#0a0030', sky2: '#1a0050', sky3: '#ff2d78', mtn1: '#120030', mtn2: '#1e0050', name: 'Neon City' },
      { grass1: '#150020', grass2: '#200040', sky1: '#050520', sky2: '#1a0a40', sky3: '#00e5ff', mtn1: '#0f0028', mtn2: '#1a0038', name: 'Synthwave' },
      { grass1: '#0a0025', grass2: '#180040', sky1: '#000010', sky2: '#0a0020', sky3: '#aa44ff', mtn1: '#080020', mtn2: '#100030', name: 'Dark Night' },
      { grass1: '#100028', grass2: '#200048', sky1: '#0a0030', sky2: '#200050', sky3: '#ff77aa', mtn1: '#120028', mtn2: '#1c0040', name: 'Retro Wave' },
    ],
    BIOME_DISTANCE: 600,
  };

  /* ================================================================
   *  S — MUTABLE STATE
   * ================================================================ */
  var S = {
    state:          'MENU',
    score:          0,
    highScore:      CP.storage.get('raceHigh', 0),
    speed:          0,
    scrollOffset:   0,
    playerX:        0,
    steerAngle:     0,
    distance:       0,
    curveAmount:    0,
    curveTarget:    0,
    curveTimer:     0,
    hillAmount:     0,
    hillTarget:     0,
    hillTimer:      0,
    spawnTimer:     0,
    dyingTimer:     0,
    accelerating:   false,
    braking:        false,
    isMobile:       false,
    nearMissFlash:  0,
    combo:          0,
    comboTimer:     0,
    bestCombo:      0,
    nitro:          100,
    nitroActive:    false,
    shieldActive:   false,
    shieldTimer:    0,
    magnetActive:   false,
    magnetTimer:    0,
    slowField:      false,
    slowTimer:      0,
    currentBiome:   0,
    biomeT:         0,
    milestone:      0,
    traffic:        [],
    powerups:       [],
    powerupTimer:   0,
    exhaustParticles: [],
    speedLines:       [],
    sparkParticles:   [],
    nearMissWoosh:    [],
    nitroFlames:      [],
    clouds:           [],
    screenShake: { intensity: 0, duration: 0, timer: 0 },

    /* Time-of-day (0-1, 0=dawn, 0.25=day, 0.5=dusk, 0.75=night) */
    tod: 0.48,
    todTimer: 0,

    /* Weather */
    weather: 'clear',
    weatherTimer: 0,
    rainDrops: [],
    fogAmount: 0,

    /* Attract mode */
    attractActive: false,
    attractTimer: 0,
    attractTargetSpeed: 0,
    attractSteerDir: 0,
    attractSteerTimer: 0,

    /* Headlight state */
    headlightsOn: false,
  };

  function reset() {
    S.speed = 0; S.scrollOffset = 0; S.playerX = 0; S.steerAngle = 0;
    S.distance = 0; S.score = 0; S.curveAmount = 0; S.curveTarget = 0;
    S.curveTimer = 0; S.hillAmount = 0; S.hillTarget = 0; S.hillTimer = 0;
    S.spawnTimer = 0; S.dyingTimer = 0; S.nearMissFlash = 0;
    S.combo = 0; S.comboTimer = 0; S.bestCombo = 0;
    S.nitro = C.NITRO_MAX; S.nitroActive = false;
    S.shieldActive = false; S.shieldTimer = 0;
    S.magnetActive = false; S.magnetTimer = 0;
    S.slowField = false; S.slowTimer = 0;
    S.currentBiome = 0; S.biomeT = 0; S.milestone = 0;
    S.powerupTimer = 0;
    S.accelerating = false; S.braking = false;
    S.traffic.length = 0; S.powerups.length = 0;
    S.exhaustParticles.length = 0; S.speedLines.length = 0;
    S.sparkParticles.length = 0; S.nearMissWoosh.length = 0;
    S.nitroFlames.length = 0;
    S.screenShake.intensity = 0; S.screenShake.timer = 0;
    S.headlightsOn = false;
  }

  function horizonY() {
    var h = canvas.height;
    if (!h || h < 50) h = window.innerHeight || 600;
    return Math.floor(h * 0.36);
  }
  function playerZ() {
    var h = canvas.height;
    if (!h || h < 50) h = window.innerHeight || 600;
    var denom = h - C.CAR_BOTTOM_MARGIN - horizonY();
    if (denom <= 0) denom = 200;
    return C.CAMERA_HEIGHT / denom;
  }

  /* Biome blending */
  function getBiome() {
    var numBiomes = C.BIOMES.length;
    if (numBiomes === 0) {
      return { current: null, next: null, t: 0 };
    }
    var idx = Math.floor(S.distance / C.BIOME_DISTANCE) % numBiomes;
    var nextIdx = (idx + 1) % numBiomes;
    var t = (S.distance % C.BIOME_DISTANCE) / C.BIOME_DISTANCE;
    t = Math.min(1, t * 2);
    return {
      current: C.BIOMES[idx] || C.BIOMES[0],
      next: C.BIOMES[nextIdx] || C.BIOMES[0],
      t: t
    };
  }

  function lerpColor(a, b, t) {
    if (!a || !b || typeof a !== 'string' || typeof b !== 'string' || a.length < 7 || b.length < 7) return '#0a0030';
    var ar = parseInt(a.slice(1,3),16), ag = parseInt(a.slice(3,5),16), ab = parseInt(a.slice(5,7),16);
    var br = parseInt(b.slice(1,3),16), bg = parseInt(b.slice(3,5),16), bb = parseInt(b.slice(5,7),16);
    if (isNaN(ar+ag+ab+br+bg+bb)) return '#0a0030';
    var r = Math.round(ar + (br-ar)*t), g = Math.round(ag + (bg-ag)*t), bv = Math.round(ab + (bb-ab)*t);
    return '#' + ((1<<24)+(r<<16)+(g<<8)+bv).toString(16).slice(1);
  }

  /* Time-of-day helpers */
  function getTODColor() {
    var t = S.tod;
    // 0=dawn, 0.25=day, 0.5=dusk, 0.75=night
    var skyTop, skyBot, sunColor, ambientLight;

    if (t < 0.125) { // Dawn transition
      var p = t / 0.125;
      skyTop = lerpColor('#0a0030', '#1a2050', p);
      skyBot = lerpColor('#ff4488', '#4a8aff', p);
      sunColor = { r: 255, g: 200, b: 100 };
      ambientLight = 0.3 + p * 0.5;
    } else if (t < 0.375) { // Day
      var p = (t - 0.125) / 0.25;
      skyTop = lerpColor('#1a2050', '#2233aa', p);
      skyBot = lerpColor('#4a8aff', '#88bbff', p);
      sunColor = { r: 255, g: 235, b: 150 };
      ambientLight = 0.8;
    } else if (t < 0.625) { // Dusk
      var p = (t - 0.375) / 0.25;
      skyTop = lerpColor('#2233aa', '#1a0050', p);
      skyBot = lerpColor('#88bbff', '#ff2d78', p);
      sunColor = { r: 255, g: 150 + p * 50, b: 80 + p * 20 };
      ambientLight = 0.8 - p * 0.4;
    } else { // Night
      var p = (t - 0.625) / 0.375;
      skyTop = lerpColor('#1a0050', '#0a0030', p);
      skyBot = lerpColor('#ff2d78', '#0a0020', p);
      sunColor = { r: 200 - p * 50, g: 100 - p * 50, b: 80 - p * 30 };
      ambientLight = 0.4 - p * 0.35;
    }

    return { skyTop: skyTop, skyBot: skyBot, sunColor: sunColor, ambientLight: Math.max(0.05, ambientLight) };
  }

  return {
    canvas: canvas, ctx: ctx, resize: resize, getCanvas: getCanvas, getCtx: getCtx,
    C: C, S: S, reset: reset,
    horizonY: horizonY, playerZ: playerZ,
    getBiome: getBiome, lerpColor: lerpColor,
    getTODColor: getTODColor,
  };
})();

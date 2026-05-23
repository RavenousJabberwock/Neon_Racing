/* ===== car.js — Player car with Outrun neon style, headlights, retro sprite ===== */
var Car = (function () {

  /* ================================================================
   *  UPDATE — physics, nitro
   * ================================================================ */
  function update(dt) {
    var S = Game.S, C = Game.C;

    var maxSpd = C.MAX_SPEED + (S.nitroActive ? C.NITRO_SPEED_BONUS : 0);
    var accel  = C.ACCELERATION + (S.nitroActive ? C.NITRO_ACCEL_BONUS : 0);

    if (S.accelerating) {
      S.speed = Math.min(maxSpd, S.speed + accel * dt);
    } else if (S.braking) {
      S.speed = Math.max(0, S.speed - C.BRAKE_FORCE * dt);
    } else {
      S.speed = Math.max(0, S.speed - C.DECELERATION * dt);
    }

    if (S.nitroActive) {
      S.nitro = Math.max(0, S.nitro - C.NITRO_DRAIN * dt);
      if (S.nitro <= 0) S.nitroActive = false;
    } else {
      S.nitro = Math.min(C.NITRO_MAX, S.nitro + C.NITRO_REGEN * dt);
    }

    /* Steering input */
    S.playerX += S.steerAngle * (S.speed / C.MAX_SPEED) * dt;

    /* Curve drift — reduced factor keeps car from sliding too much */
    S.playerX += S.curveAmount * (S.speed / C.MAX_SPEED) * C.CURVE_DRIFT_FACTOR * dt;

    /* Gentle centering force — pulls car back to center when not steering */
    if (Math.abs(S.steerAngle) < 0.5) {
      S.playerX -= S.playerX * C.CENTER_FORCE * dt;
    }

    S.playerX = Math.max(-0.9, Math.min(0.9, S.playerX));

    if (Math.abs(S.playerX) > 0.82) {
      S.speed = Math.max(0, S.speed - 120 * dt);
    }
  }

  /* ================================================================
   *  RENDER — Outrun neon car sprite with headlights
   * ================================================================ */
  function render() {
    var ctx = Game.ctx, canvas = Game.canvas, C = Game.C, S = Game.S;
    var halfRoad = Effects.getPlayerRoadHalfWidth();
    var cx = canvas.width / 2 + S.playerX * halfRoad;
    var cy = canvas.height - C.CAR_BOTTOM_MARGIN;
    var w = C.CAR_W, h = C.CAR_H;
    var tilt = -S.steerAngle * 0.035;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(tilt);

    /* Neon glow under car */
    var glowColor = S.nitroActive ? '#00e5ff' : '#ff2d78';
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = S.nitroActive ? 20 : 8;

    /* Shadow */
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    ctx.ellipse(0, h / 2 + 5, w / 2 + 6, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    /* Wheels — dark rims with neon edge */
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#0a0030';
    var wW = 7, wH = 12;
    ctx.fillRect(-w/2 - 3, -h/2 + 2, wW, wH);
    ctx.fillRect( w/2 - 4, -h/2 + 2, wW, wH);
    ctx.fillRect(-w/2 - 3, h/2 - wH - 2, wW, wH);
    ctx.fillRect( w/2 - 4, h/2 - wH - 2, wW, wH);

    /* Wheel rims */
    ctx.fillStyle = '#ff2d78';
    ctx.fillRect(-w/2 - 1, -h/2 + 4, 3, 8);
    ctx.fillRect( w/2 - 2, -h/2 + 4, 3, 8);
    ctx.fillRect(-w/2 - 1, h/2 - wH, 3, 8);
    ctx.fillRect( w/2 - 2, h/2 - wH, 3, 8);

    /* Body — Outrun gradient */
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 10;
    var grad = ctx.createLinearGradient(-w / 2, 0, w / 2, 0);
    var carColor = S.nitroActive ? '#0044aa' : '#cc0044';
    var carHighlight = S.nitroActive ? '#00aaff' : '#ff2277';
    var carShadow = S.nitroActive ? '#002266' : '#880022';
    grad.addColorStop(0,   carShadow);
    grad.addColorStop(0.2, carColor);
    grad.addColorStop(0.45,carHighlight);
    grad.addColorStop(0.55,carHighlight);
    grad.addColorStop(0.8, carColor);
    grad.addColorStop(1,   carShadow);
    ctx.fillStyle = grad;
    roundRect(ctx, -w/2, -h/2, w, h, 7);
    ctx.fill();
    ctx.shadowBlur = 0;

    /* Body neon outline */
    ctx.strokeStyle = 'rgba(255,45,120,0.2)';
    ctx.lineWidth = 1;
    roundRect(ctx, -w/2, -h/2, w, h, 7);
    ctx.stroke();

    /* Top reflection */
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fillRect(-w/2 + 4, -h/2 + 2, w - 8, h / 3);

    /* Windshield */
    ctx.fillStyle = '#0a0030';
    ctx.beginPath();
    ctx.moveTo(-w/2 + 9,  -h/2 + 3);
    ctx.lineTo( w/2 - 9,  -h/2 + 3);
    ctx.lineTo( w/2 - 13, -h/2 + 16);
    ctx.lineTo(-w/2 + 13, -h/2 + 16);
    ctx.closePath(); ctx.fill();

    /* Windshield glare — cyan */
    ctx.fillStyle = 'rgba(0,229,255,0.18)';
    ctx.beginPath();
    ctx.moveTo(-w/2 + 11, -h/2 + 4);
    ctx.lineTo(-w/2 + 24, -h/2 + 4);
    ctx.lineTo(-w/2 + 20, -h/2 + 13);
    ctx.lineTo(-w/2 + 13, -h/2 + 13);
    ctx.closePath(); ctx.fill();

    /* Headlights — bright neon */
    var headlightsOn = S.headlightsOn;
    ctx.shadowColor = headlightsOn ? '#ffee44' : '#ffaa44';
    ctx.shadowBlur = headlightsOn ? 15 : 4;
    ctx.fillStyle = headlightsOn ? '#ffffaa' : '#ffcc66';
    ctx.fillRect(-w/2 + 3, -h/2, 9, 5);
    ctx.fillRect( w/2 - 12, -h/2, 9, 5);
    ctx.shadowBlur = 0;

    /* Brake lights — neon red */
    var brakeOn = S.braking || S.speed < 10;
    ctx.fillStyle = brakeOn ? '#ff0066' : '#440022';
    if (brakeOn) { ctx.shadowColor = '#ff0066'; ctx.shadowBlur = 12; }
    ctx.fillRect(-w/2 + 3,  h/2 - 6, 10, 6);
    ctx.fillRect( w/2 - 13, h/2 - 6, 10, 6);
    ctx.shadowBlur = 0;

    /* Brake glow */
    if (brakeOn) {
      ctx.fillStyle = 'rgba(255,0,102,0.2)';
      ctx.beginPath(); ctx.arc(-w/2 + 8, h/2, 12, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc( w/2 - 8, h/2, 12, 0, Math.PI * 2); ctx.fill();
    }

    /* Racing stripe — neon pink */
    ctx.fillStyle = 'rgba(255,45,120,0.15)';
    ctx.fillRect(-2, -h/2, 4, h);

    /* Shield visual */
    if (S.shieldActive) {
      var pulse = 0.3 + Math.sin(Date.now() * 0.01) * 0.15;
      ctx.strokeStyle = 'rgba(0,229,255,' + pulse.toFixed(2) + ')';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(0, 0, w * 0.68, 0, Math.PI * 2); ctx.stroke();
    }

    ctx.restore();

    /* Nitro glow under car */
    if (S.nitroActive) {
      ctx.fillStyle = 'rgba(0,229,255,0.12)';
      ctx.beginPath(); ctx.ellipse(cx, cy + h/2 + 4, w/2 + 10, 14, 0, 0, Math.PI * 2); ctx.fill();
    }
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + h - r);
    ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  return { update: update, render: render };
})();

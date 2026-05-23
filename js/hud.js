/* ===== hud.js — HUD overlay: score, speed, distance, nitro gauge, combo, game-over ===== */
var HUD = (function () {
  var C = Game.C, S = Game.S;

  /* ---------- helpers ---------- */
  function outlinedText(ctx, txt, x, y, sz, fill, stroke) {
    ctx.font = 'bold ' + sz + 'px Arial, sans-serif';
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.lineWidth = 3; ctx.strokeStyle = stroke || '#000';
    ctx.strokeText(txt, x, y);
    ctx.fillStyle = fill;
    ctx.fillText(txt, x, y);
  }

  function centeredText(ctx, txt, x, y, sz, fill) {
    ctx.font = 'bold ' + sz + 'px Arial, sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = fill;
    ctx.fillText(txt, x, y);
  }

  /* ---------- NITRO GAUGE — Neon style ---------- */
  function drawNitroGauge() {
    var ctx = Game.ctx, canvas = Game.canvas;
    var gx = 12, gy = canvas.height - 30, gw = 120, gh = 14;
    var pct = S.nitro / C.NITRO_MAX;

    /* Background */
    ctx.fillStyle = 'rgba(10,0,48,0.6)';
    ctx.fillRect(gx - 2, gy - 2, gw + 4, gh + 4);

    /* Neon border */
    ctx.strokeStyle = 'rgba(255,45,120,0.4)';
    ctx.lineWidth = 1;
    ctx.strokeRect(gx - 2, gy - 2, gw + 4, gh + 4);

    /* Fill — cyan/pink gradient */
    var grad = ctx.createLinearGradient(gx, 0, gx + gw, 0);
    grad.addColorStop(0, '#ff2d78');
    grad.addColorStop(0.5, '#aa44ff');
    grad.addColorStop(1, '#00e5ff');
    ctx.shadowColor = '#00e5ff';
    ctx.shadowBlur = S.nitroActive ? 8 : 0;
    ctx.fillStyle = grad;
    ctx.fillRect(gx, gy, gw * pct, gh);
    ctx.shadowBlur = 0;

    /* Label */
    ctx.font = 'bold 10px Arial, sans-serif';
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillStyle = S.nitroActive ? '#00e5ff' : '#aa88ff';
    ctx.fillText('NITRO', gx + 3, gy + gh / 2 + 1);

    /* Pulsing when active */
    if (S.nitroActive && pct > 0) {
      ctx.shadowColor = '#00e5ff';
      ctx.shadowBlur = 15;
      ctx.strokeStyle = 'rgba(0,229,255,0.4)';
      ctx.lineWidth = 2;
      ctx.strokeRect(gx - 4, gy - 4, gw + 8, gh + 8);
      ctx.shadowBlur = 0;
    }
  }

  /* ---------- SPEED DISPLAY — Neon ---------- */
  function drawSpeed() {
    var ctx = Game.ctx, canvas = Game.canvas;
    var kmh = Math.floor(S.speed * 1.6);
    var x = canvas.width - 12, y = canvas.height - 18;

    ctx.textAlign = 'right'; ctx.textBaseline = 'bottom';
    ctx.font = 'bold 28px Arial, sans-serif';
    ctx.shadowBlur = 6;

    if (S.nitroActive) {
      ctx.shadowColor = '#00e5ff';
      ctx.fillStyle = '#00e5ff';
    } else if (kmh > 400) {
      ctx.shadowColor = '#ff0066';
      ctx.fillStyle = '#ff0066';
    } else {
      ctx.shadowColor = '#ff2d78';
      ctx.fillStyle = '#ff2d78';
    }
    ctx.fillText(kmh, x, y);
    ctx.shadowBlur = 0;

    ctx.font = '10px Arial, sans-serif';
    ctx.fillStyle = '#aa88ff';
    ctx.fillText('KM/H', x, y + 12);
  }

  /* ---------- SCORE — Neon ---------- */
  function drawScore() {
    var ctx = Game.ctx;
    ctx.shadowColor = '#ff2d78';
    ctx.shadowBlur = 6;
    ctx.font = 'bold 16px Arial, sans-serif';
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillStyle = '#ff2d78';
    ctx.fillText('SCORE: ' + S.score, 12, 10);
    /* Distance */
    ctx.shadowColor = '#aa44ff';
    ctx.shadowBlur = 4;
    ctx.font = 'bold 13px Arial, sans-serif';
    ctx.fillStyle = '#aa44ff';
    ctx.fillText(Math.floor(S.distance) + 'm', 12, 32);
    ctx.shadowBlur = 0;
  }

  /* ---------- COMBO COUNTER — Neon ---------- */
  function drawCombo() {
    if (S.combo < 2) return;
    var ctx = Game.ctx, canvas = Game.canvas;
    var alpha = Math.min(1, S.comboTimer / 0.8);
    ctx.globalAlpha = alpha;

    var text = 'x' + S.combo + ' COMBO';
    if (S.combo >= 10) text += ' 🔥';
    else if (S.combo >= 5) text += ' ⚡';

    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    var sz = Math.min(22, 14 + S.combo);
    ctx.font = 'bold ' + sz + 'px Arial, sans-serif';

    var neonColor = S.combo >= 10 ? '#ff0066' : S.combo >= 5 ? '#ff8800' : '#00e5ff';
    ctx.shadowColor = neonColor;
    ctx.shadowBlur = 10;
    ctx.fillStyle = neonColor;
    ctx.fillText(text, canvas.width / 2, 65);
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  }

  /* ---------- POWER-UP INDICATORS ---------- */
  function drawPowerUpIndicators() {
    var ctx = Game.ctx, canvas = Game.canvas;
    var y = 56, shown = 0;

    if (S.shieldActive) {
      ctx.fillStyle = '#00aaff'; ctx.font = 'bold 11px Arial, sans-serif';
      ctx.textAlign = 'right'; ctx.textBaseline = 'top';
      ctx.fillText('🛡 SHIELD ' + S.shieldTimer.toFixed(1) + 's', canvas.width - 12, y);
      shown++;
    }
    if (S.magnetActive) {
      ctx.fillStyle = '#ff66ff'; ctx.font = 'bold 11px Arial, sans-serif';
      ctx.textAlign = 'right'; ctx.textBaseline = 'top';
      ctx.fillText('🧲 MAGNET ' + S.magnetTimer.toFixed(1) + 's', canvas.width - 12, y + shown * 16);
      shown++;
    }
    if (S.slowField) {
      ctx.fillStyle = '#66ff66'; ctx.font = 'bold 11px Arial, sans-serif';
      ctx.textAlign = 'right'; ctx.textBaseline = 'top';
      ctx.fillText('🐌 SLOW ' + S.slowTimer.toFixed(1) + 's', canvas.width - 12, y + shown * 16);
    }
  }

  /* ---------- MILESTONE FLASH ---------- */
  var milestoneText = '', milestoneTimer = 0;

  function showMilestone(text) {
    milestoneText = text;
    milestoneTimer = 2.0;
  }

  function drawMilestone() {
    if (milestoneTimer <= 0) return;
    var ctx = Game.ctx, canvas = Game.canvas;
    var alpha = Math.min(1, milestoneTimer / 0.5);
    ctx.globalAlpha = alpha;
    var bounce = 1 + Math.sin(milestoneTimer * 8) * 0.05;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = 'bold ' + Math.floor(20 * bounce) + 'px Arial, sans-serif';
    ctx.lineWidth = 3; ctx.strokeStyle = '#000';
    ctx.strokeText(milestoneText, canvas.width / 2, canvas.height * 0.35);
    ctx.fillStyle = '#ffd740';
    ctx.fillText(milestoneText, canvas.width / 2, canvas.height * 0.35);
    ctx.globalAlpha = 1;
  }

  /* ---------- GAME OVER — Neon Outrun ---------- */
  function drawGameOver() {
    var ctx = Game.ctx, canvas = Game.canvas;

    /* Dim overlay with grid */
    ctx.fillStyle = 'rgba(10,0,48,0.75)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    /* Grid lines */
    ctx.strokeStyle = 'rgba(255,45,120,0.04)';
    ctx.lineWidth = 1;
    for (var i = 0; i < canvas.width; i += 40) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); ctx.stroke();
    }
    for (var j = 0; j < canvas.height; j += 40) {
      ctx.beginPath(); ctx.moveTo(0, j); ctx.lineTo(canvas.width, j); ctx.stroke();
    }

    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    var cy = canvas.height * 0.35;

    /* Title — neon pink */
    ctx.shadowColor = '#ff0066';
    ctx.shadowBlur = 25;
    ctx.font = 'bold 36px Arial, sans-serif';
    ctx.fillStyle = '#ff0066';
    ctx.fillText('GAME OVER', canvas.width / 2, cy);
    ctx.shadowBlur = 0;

    /* Stats */
    ctx.font = '16px Arial, sans-serif';
    ctx.fillStyle = '#aa88ff';
    ctx.fillText('Score: ' + S.score, canvas.width / 2, cy + 50);
    ctx.fillText('Distance: ' + Math.floor(S.distance) + 'm', canvas.width / 2, cy + 75);
    ctx.fillText('Best Combo: x' + S.bestCombo, canvas.width / 2, cy + 100);

    /* Rank — neon */
    var rank = 'Rookie';
    if (S.score >= 5000) rank = 'Street Legend 🏆';
    else if (S.score >= 3000) rank = 'Speed Demon 🔥';
    else if (S.score >= 1500) rank = 'Road Warrior ⚡';
    else if (S.score >= 500) rank = 'Cruiser 🚗';
    ctx.shadowColor = '#ff8800';
    ctx.shadowBlur = 10;
    ctx.font = 'bold 18px Arial, sans-serif';
    ctx.fillStyle = '#ff8800';
    ctx.fillText(rank, canvas.width / 2, cy + 135);
    ctx.shadowBlur = 0;

    /* High-score */
    if (S.score >= S.highScore) {
      ctx.shadowColor = '#ffd740';
      ctx.shadowBlur = 12;
      ctx.font = 'bold 14px Arial, sans-serif';
      ctx.fillStyle = '#ffd740';
      ctx.fillText('★ NEW HIGH SCORE! ★', canvas.width / 2, cy + 165);
      ctx.shadowBlur = 0;
    }

    /* Restart — pulsing cyan */
    var pulse = 0.4 + Math.sin(Date.now() * 0.003) * 0.4;
    ctx.globalAlpha = pulse;
    ctx.shadowColor = '#00e5ff';
    ctx.shadowBlur = 12;
    ctx.font = 'bold 16px Arial, sans-serif';
    ctx.fillStyle = '#00e5ff';
    ctx.fillText('PRESS ANY KEY TO RESTART', canvas.width / 2, cy + 200);
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  }

  /* ---------- DEATH FLASH ---------- */
  function drawDeathFlash(S) {
    var ctx = Game.ctx, canvas = Game.canvas;
    var a = S.dyingTimer / C.DYING_DURATION;
    ctx.fillStyle = 'rgba(255,0,0,' + (a * 0.35) + ')';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  /* ---------- HUD entry points ---------- */
  function update(dt) {
    /* Decrement milestone timer here, not in render() */
    if (milestoneTimer > 0) milestoneTimer -= dt;
  }

  function render() {
    drawScore();
    drawSpeed();
    drawNitroGauge();
    drawCombo();
    drawPowerUpIndicators();
    drawMilestone();
  }

  return {
    update: update, render: render,
    drawGameOver: drawGameOver, drawDeathFlash: drawDeathFlash,
    drawMenu: Renderer.drawMenu,
    showMilestone: showMilestone,
  };
})();

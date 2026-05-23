/* ==========================================================
   CP SDK Polyfill – Standalone fallback for game templates
   Provides no-op / lightweight implementations of all CP APIs
   so games can run outside the platform environment.
   ========================================================== */

if (typeof CP === 'undefined') {
    window.CP = {};

    /* ---- Audio Context (lazy init) ---- */
    let _audioCtx = null;
    function getAudioCtx() {
        if (!_audioCtx) {
            try { _audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
            catch (e) { _audioCtx = null; }
        }
        return _audioCtx;
    }

    /**
     * Play a simple tone/beep as sound effect placeholder.
     * @param {number} freq  - frequency in Hz
     * @param {number} dur   - duration in seconds
     * @param {string} type  - oscillator type
     * @param {number} vol   - volume 0-1
     */
    function playTone(freq, dur, type, vol) {
        const ctx = getAudioCtx();
        if (!ctx) return;
        try {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = type || 'square';
            osc.frequency.value = freq || 440;
            gain.gain.setValueAtTime(vol || 0.08, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (dur || 0.1));
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + (dur || 0.1));
        } catch (e) { /* silent fail */ }
    }

    /* ---- CP.sound ---- */
    CP.sound = {
        click:   function() { playTone(600, 0.06, 'square', 0.06); },
        jump:    function() { playTone(500, 0.12, 'square', 0.08); },
        coin:    function() { playTone(880, 0.1, 'square', 0.07); setTimeout(function(){ playTone(1100, 0.12, 'square', 0.07); }, 80); },
        hit:     function() { playTone(200, 0.15, 'sawtooth', 0.1); },
        die:     function() { playTone(300, 0.2, 'sawtooth', 0.1); setTimeout(function(){ playTone(200, 0.25, 'sawtooth', 0.1); }, 200); },
        shoot:   function() { playTone(300, 0.08, 'sawtooth', 0.06); },
        powerup: function() { playTone(600, 0.08, 'square', 0.06); setTimeout(function(){ playTone(800, 0.08, 'square', 0.06); }, 80); setTimeout(function(){ playTone(1000, 0.12, 'square', 0.06); }, 160); },
        gameover:function() { playTone(400, 0.15, 'sawtooth', 0.08); setTimeout(function(){ playTone(300, 0.15, 'sawtooth', 0.08); }, 150); setTimeout(function(){ playTone(200, 0.3, 'sawtooth', 0.08); }, 300); },
        hurt:    function() { playTone(250, 0.12, 'sawtooth', 0.08); }
    };

    /* ---- CP.storage (localStorage wrapper) ---- */
    CP.storage = {
        get: function(key, defaultVal) {
            try {
                var v = localStorage.getItem('cpg_' + key);
                if (v === null) return defaultVal !== undefined ? defaultVal : null;
                try { return JSON.parse(v); } catch(e) { return v; }
            } catch (e) { return defaultVal !== undefined ? defaultVal : null; }
        },
        set: function(key, value) {
            try { localStorage.setItem('cpg_' + key, JSON.stringify(value)); } catch(e) {}
        }
    };

    /* ---- CP.particles (lightweight canvas particle system) ---- */
    CP.particles = (function() {
        var particles = [];

        return {
            spawn: function(x, y, color, count) {
                count = count || 8;
                for (var i = 0; i < count; i++) {
                    var angle = Math.random() * Math.PI * 2;
                    var speed = 40 + Math.random() * 120;
                    particles.push({
                        x: x, y: y,
                        vx: Math.cos(angle) * speed,
                        vy: Math.sin(angle) * speed,
                        life: 0.4 + Math.random() * 0.5,
                        maxLife: 0.4 + Math.random() * 0.5,
                        color: color || '#FFF',
                        size: 2 + Math.random() * 4
                    });
                }
            },
            update: function(dt) {
                for (var i = particles.length - 1; i >= 0; i--) {
                    var p = particles[i];
                    p.x += p.vx * dt;
                    p.y += p.vy * dt;
                    p.vy += 200 * dt; // gravity
                    p.life -= dt;
                    if (p.life <= 0) particles.splice(i, 1);
                }
            },
            render: function(ctx) {
                particles.forEach(function(p) {
                    var alpha = Math.max(0, p.life / p.maxLife);
                    ctx.globalAlpha = alpha;
                    ctx.fillStyle = p.color;
                    ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
                });
                ctx.globalAlpha = 1;
            }
        };
    })();

    /* ---- CP.float (floating text system) ---- */
    CP.float = (function() {
        var floats = [];

        return {
            show: function(x, y, text, color) {
                floats.push({
                    x: x, y: y,
                    text: String(text),
                    color: color || '#FFF',
                    life: 1.0,
                    maxLife: 1.0,
                    vy: -60
                });
            },
            update: function(dt) {
                for (var i = floats.length - 1; i >= 0; i--) {
                    var f = floats[i];
                    f.y += f.vy * dt;
                    f.life -= dt;
                    if (f.life <= 0) floats.splice(i, 1);
                }
            },
            render: function(ctx) {
                floats.forEach(function(f) {
                    var alpha = Math.max(0, f.life / f.maxLife);
                    ctx.globalAlpha = alpha;
                    ctx.fillStyle = f.color;
                    ctx.font = 'bold 16px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText(f.text, f.x, f.y);
                });
                ctx.globalAlpha = 1;
                ctx.textAlign = 'left';
            }
        };
    })();

    /* ---- CP.shake (screen shake system) ---- */
    CP.shake = (function() {
        var intensity = 0;
        var duration = 0;
        var timer = 0;
        var offsetX = 0;
        var offsetY = 0;
        var active = false; // tracks whether save() was called

        return {
            trigger: function(int, dur) {
                var newInt = int || 5;
                var newDur = dur || 0.2;
                // If already shaking, blend: use max intensity, extend timer but cap total
                if (timer > 0) {
                    intensity = Math.min(Math.max(intensity, newInt), 20);
                    timer = Math.min(timer + newDur * 0.3, newDur * 1.5);
                    duration = timer;
                } else {
                    intensity = newInt;
                    duration = newDur;
                    timer = newDur;
                }
            },
            /** Force-stop all shake immediately */
            stop: function() {
                timer = 0;
                intensity = 0;
                offsetX = 0;
                offsetY = 0;
            },
            update: function(dt) {
                if (timer > 0) {
                    timer -= dt;
                    if (timer <= 0) {
                        timer = 0;
                        offsetX = 0;
                        offsetY = 0;
                    } else {
                        var factor = timer / duration;
                        offsetX = (Math.random() - 0.5) * 2 * intensity * factor;
                        offsetY = (Math.random() - 0.5) * 2 * intensity * factor;
                    }
                }
            },
            apply: function(ctx, dt) {
                // Update timer each frame
                if (typeof dt === 'number' && dt > 0) {
                    CP.shake.update(dt);
                }
                // Always save so end() can always restore
                ctx.save();
                active = true;
                if (timer > 0) {
                    ctx.translate(offsetX, offsetY);
                }
            },
            end: function(ctx) {
                // Always restore to match the save() in apply()
                if (active) {
                    ctx.restore();
                    active = false;
                }
            }
        };
    })();

    /* ---- CP.input (tilt / action input for mobile) ---- */
    CP.input = {
        x: 0.5,     // 0 = full left, 0.5 = center, 1 = full right
        action: false
    };
}

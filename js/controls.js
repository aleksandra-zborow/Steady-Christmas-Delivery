// ============================================================
// controls.js – klawiatura + sterowanie dotykowe (joystick, przycisk ataku)
// Reszta gry pyta tylko o Controls.getMove() i Controls.consumeAttack().
// ============================================================

const Controls = {
  keys: {},            // które klawisze są teraz wciśnięte
  joy: { x: 0, y: 0 }, // wychylenie joysticka (-1..1)
  attackQueued: false,
  touchMode: false,    // true, gdy ostatnio sterowano dotykiem (joystick / przycisk ataku); klawiatura przełącza z powrotem na false
  active: false,       // sterowanie działa tylko w trakcie rozgrywki (żeby nie blokować klawiszy w menu)

  // Kierunek ruchu jako wektor {x,y} o długości max 1
  getMove() {
    const k = this.keys;
    let x = (k.ArrowRight || k.KeyD ? 1 : 0) - (k.ArrowLeft || k.KeyA ? 1 : 0) + this.joy.x;
    let y = (k.ArrowDown || k.KeyS ? 1 : 0) - (k.ArrowUp || k.KeyW ? 1 : 0) + this.joy.y;
    const len = Math.hypot(x, y);
    if (len > 1) { x /= len; y /= len; } // ruch po skosie nie jest szybszy
    return { x, y };
  },

  // Zwraca true raz na każde wciśnięcie ataku
  consumeAttack() { const a = this.attackQueued; this.attackQueued = false; return a; },

  reset() { this.keys = {}; this.joy = { x: 0, y: 0 }; this.attackQueued = false; },

  init() {
    window.addEventListener('keydown', e => {
      if (!this.active) return;
      this.touchMode = false;
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault(); // bez przewijania strony
      if (e.code === 'Space' && !e.repeat) this.attackQueued = true;
      this.keys[e.code] = true;
    });
    window.addEventListener('keyup', e => { this.keys[e.code] = false; });
    window.addEventListener('blur', () => { this.keys = {}; });

    // --- Joystick dotykowy ---
    const joy = document.getElementById('joystick'), stick = document.getElementById('stick');
    const setStick = (e) => {
      const r = joy.getBoundingClientRect();
      let dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
      let dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
      const len = Math.hypot(dx, dy);
      if (len > 1) { dx /= len; dy /= len; }
      stick.style.transform = `translate(${dx * 35}px, ${dy * 35}px)`;
      this.joy = len < 0.2 ? { x: 0, y: 0 } : { x: dx, y: dy }; // mała martwa strefa
    };
    const releaseStick = () => { this.joy = { x: 0, y: 0 }; stick.style.transform = ''; };
    joy.addEventListener('pointerdown', e => { this.touchMode = true; joy.setPointerCapture(e.pointerId); setStick(e); });
    joy.addEventListener('pointermove', e => { if (joy.hasPointerCapture(e.pointerId)) setStick(e); });
    joy.addEventListener('pointerup', releaseStick);
    joy.addEventListener('pointercancel', releaseStick);

    // --- Przycisk ataku ---
    document.getElementById('btn-attack').addEventListener('pointerdown', e => { e.preventDefault(); this.touchMode = true; if (this.active) this.attackQueued = true; });
  },
};

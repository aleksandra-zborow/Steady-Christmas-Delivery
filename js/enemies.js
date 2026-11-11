// ============================================================
// enemies.js – przeciwnicy: jedna klasa, różne typy (parametry w CONFIG.ENEMY_TYPES).
// AI: stoją, dopóki gracz nie podejdzie (aggro), potem gonią i przy utknięciu obchodzą przeszkodę.
// ============================================================
const ENEMY_DEATH_TIME = 0.45;

class Enemy {
  constructor(typeId, tileX, tileY) {
    const c = ENEMY_TYPES[typeId];
    this.typeId = typeId; this.cfg = c; this.isBoss = false;
    this.x = tileX * TILE + TILE / 2; this.y = tileY * TILE + TILE / 2;
    this.w = c.hitbox; this.h = c.hitbox; this.radius = c.radius;
    this.maxHp = c.hp; this.hp = c.hp;
    this.alive = true; this.dying = 0; this.scored = false;   // scored = punkty za pokonanie już naliczone
    this.state = 'idle';                                       // 'idle' | 'chase'
    this.stun = 0; this.knock = { x: 0, y: 0 }; this.flash = 0;
    this.time = Math.random() * 10; this.ramp = 0; this.detour = 0; this.side = 1;
  }

  get removed() { return !this.alive && this.dying <= 0; }

  update(dt, player, map) {
    this.time += dt; this.flash = Math.max(0, this.flash - dt);
    if (!this.alive) { this.dying = Math.max(0, this.dying - dt); return; }
    if (this.stun > 0) {                                        // odrzut po trafieniu
      this.stun -= dt; moveEntity(this, this.knock.x * dt, this.knock.y * dt, map);
      this.knock.x *= 0.9; this.knock.y *= 0.9; return;
    }
    const dx = player.x - this.x, dy = player.y - this.y, d = Math.hypot(dx, dy) || 1;
    if (this.state === 'idle' && d < this.cfg.aggro) this.state = 'chase';
    else if (this.state === 'chase' && d > this.cfg.aggro * 2.2) { this.state = 'idle'; this.ramp = 0; }
    if (this.state !== 'chase') return;

    if (this.cfg.rampUp) this.ramp = Math.min(1, this.ramp + dt / 5);   // Deadline: im dłużej goni, tym szybszy
    const step = this.cfg.speed * (1 + 0.6 * this.ramp) * dt;
    let vx = dx / d, vy = dy / d;
    if (this.cfg.zigzag) { const z = Math.sin(this.time * 7) * 0.9; const px = -vy, py = vx; vx += px * z; vy += py * z; } // Bug biega zygzakiem
    this.detour = Math.max(0, this.detour - dt);
    if (this.detour > 0) { const px = -vy * this.side, py = vx * this.side; vx = vx * 0.3 + px; vy = vy * 0.3 + py; } // obejście przeszkody
    const l = Math.hypot(vx, vy) || 1; vx /= l; vy /= l;
    const bx = this.x, by = this.y;
    moveEntity(this, vx * step, vy * step, map);
    if (Math.hypot(this.x - bx, this.y - by) < step * 0.3 && this.detour <= 0) { this.detour = 0.6; this.side = Math.random() < 0.5 ? 1 : -1; }
  }

  takeHit(damage, dirX, dirY) {
    if (!this.alive) return;
    this.hp -= damage; this.flash = 0.12; this.ramp = 0;
    this.stun = 0.2; this.knock = { x: dirX * 220, y: dirY * 220 };
    if (this.hp <= 0) { this.hp = 0; this.alive = false; this.dying = ENEMY_DEATH_TIME; }
  }

  draw(ctx, sprites) {
    const img = sprites.enemies[this.cfg.sprite];
    const moving = this.state === 'chase' && this.stun <= 0 && this.alive;
    const wob = Math.sin(this.time * (moving ? 10 : 3));
    if (this.alive) drawShadow(ctx, this.x, this.y + 11, this.radius);
    ctx.save(); ctx.translate(Math.round(this.x), Math.round(this.y - 3));
    if (!this.alive) { const t = this.dying / ENEMY_DEATH_TIME; ctx.globalAlpha = t; ctx.scale(t, t); ctx.rotate((1 - t) * 3); } // animacja pokonania
    else { ctx.rotate(wob * (moving ? 0.12 : 0.03)); if (moving) ctx.translate(0, -Math.abs(wob) * 2); }                       // animacja ruchu
    ctx.drawImage(img, -16, -16);
    if (this.flash > 0 && this.alive) { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.7; ctx.drawImage(img, -16, -16); }
    ctx.restore();
    if (this.alive && this.hp < this.maxHp) {                                  // pasek życia
      const bw = 24, bx = this.x - bw / 2, by = this.y - 24;
      ctx.fillStyle = '#17203a'; ctx.fillRect(bx - 1, by - 1, bw + 2, 5);
      ctx.fillStyle = '#e8394a'; ctx.fillRect(bx, by, bw * (this.hp / this.maxHp), 3);
    }
  }
}

// ============================================================
// boss.js – The Big Deadline. Trzy ataki, każdy poprzedzony widocznym sygnałem (telegraph):
//   1. SZARŻA  – czerwony pas pokazuje kierunek, potem boss pędzi
//   2. BURZA PAPIERÓW – pulsujący pierścień, potem pociski we wszystkie strony
//   3. UDERZENIE ZEGARA – czerwone koło na ziemi, uciekaj poza nie przed uderzeniem
// Parametry: BOSS w config.js. Stany: dormant -> idle -> tele_* -> (charging) -> recover -> idle
// ============================================================
class Boss {
  constructor(tileX, tileY) {
    const B = BOSS;
    this.isBoss = true; this.typeId = 'boss'; this.cfg = { name: B.name, tier: 'boss' };
    this.x = tileX * TILE + TILE / 2; this.y = tileY * TILE + TILE / 2;
    this.w = B.hitbox; this.h = B.hitbox; this.radius = B.radius;
    this.maxHp = B.hp; this.hp = B.hp;
    this.alive = true; this.dying = 0; this.scored = false;
    this.state = 'dormant'; this.timer = 0; this.teleTotal = 1; this.lastAttack = '';
    this.dir = { x: 0, y: 1 }; this.flash = 0; this.time = 0; this.stun = 0; this.explodeT = 0;
  }

  get removed() { return !this.alive && this.dying <= 0; }
  get enraged() { return this.hp <= this.maxHp * BOSS.enrageAt; }
  get contactDamage() { return this.state === 'charging' ? BOSS.charge.damage : 1; }
  get awake() { return this.state !== 'dormant'; }

  wake() { if (this.state === 'dormant') { this.state = 'idle'; this.timer = 1.0; } }

  chooseAttack() {
    const options = ['charge', 'storm', 'slam'].filter(a => a !== this.lastAttack);
    const a = options[Math.floor(Math.random() * options.length)];
    this.lastAttack = a;
    this.teleTotal = BOSS[a].telegraph * (this.enraged ? 0.75 : 1);   // wściekły boss ostrzega krócej
    this.timer = this.teleTotal; this.state = 'tele_' + a;
  }

  update(dt, player, map, game) {
    this.time += dt; this.flash = Math.max(0, this.flash - dt);
    if (!this.alive) {                                               // efektowna śmierć: wybuchy papierów
      this.dying = Math.max(0, this.dying - dt); this.explodeT -= dt;
      if (this.dying > 0 && this.explodeT <= 0) { this.explodeT = 0.12; game.effects.burst(this.x + (Math.random() - .5) * 60, this.y + (Math.random() - .5) * 50, ['#fff', '#ffd34d', '#d6283a', '#bfe8ff'], 8, 120); }
      return;
    }
    if (this.state === 'dormant') return;
    const dx = player.x - this.x, dy = player.y - this.y, d = Math.hypot(dx, dy) || 1;
    const speedMul = this.enraged ? 1.2 : 1;
    switch (this.state) {
      case 'idle':
        if (d > 70) moveEntity(this, dx / d * BOSS.speed * speedMul * dt, dy / d * BOSS.speed * speedMul * dt, map);
        this.timer -= dt; if (this.timer <= 0) this.chooseAttack();
        break;
      case 'tele_charge':
        this.timer -= dt;
        if (this.timer > this.teleTotal * 0.4) this.dir = { x: dx / d, y: dy / d };   // celuje, potem kierunek się blokuje
        if (this.timer <= 0) { this.state = 'charging'; this.timer = BOSS.charge.duration; }
        break;
      case 'charging': {
        this.timer -= dt; const step = BOSS.charge.speed * dt, bx = this.x, by = this.y;
        moveEntity(this, this.dir.x * step, this.dir.y * step, map);
        if (Math.hypot(this.x - bx, this.y - by) < step * 0.3) this.timer = 0;       // uderzył w ścianę
        if (this.timer <= 0) { this.state = 'recover'; this.timer = BOSS.charge.recover; game.shake(3, 0.2); }
        break;
      }
      case 'recover':                                                                // chwila słabości – dobry moment na atak
        this.timer -= dt; if (this.timer <= 0) { this.state = 'idle'; this.timer = BOSS.idleTime.min + Math.random() * (BOSS.idleTime.max - BOSS.idleTime.min); }
        break;
      case 'tele_storm':
        this.timer -= dt;
        if (this.timer <= 0) {
          const n = this.enraged ? BOSS.storm.enragedCount : BOSS.storm.count, ph = Math.random() * Math.PI * 2;
          for (let i = 0; i < n; i++) { const a = ph + i * Math.PI * 2 / n; game.addProjectile(this.x, this.y, Math.cos(a) * BOSS.storm.speed, Math.sin(a) * BOSS.storm.speed, BOSS.storm.damage); }
          this.state = 'recover'; this.timer = 0.5;
        }
        break;
      case 'tele_slam':
        this.timer -= dt;
        if (this.timer <= 0) {
          game.effects.burst(this.x, this.y, ['#fff', '#ffd34d', '#bfe8ff'], 18, 160); game.shake(6, 0.3);
          if (Math.hypot(player.x - this.x, player.y - this.y) < BOSS.slam.radius) game.hurtPlayer(BOSS.slam.damage);
          this.state = 'recover'; this.timer = 0.6;
        }
        break;
    }
  }

  takeHit(damage) {
    if (!this.alive) return;
    this.wake(); this.hp -= damage; this.flash = 0.1;
    if (this.hp <= 0) { this.hp = 0; this.alive = false; this.dying = 1.4; this.explodeT = 0; }
  }

  // Sygnały ostrzegawcze rysowane na ziemi (pod postaciami)
  drawGround(ctx) {
    if (!this.alive) return;
    const pulse = 0.25 + 0.15 * Math.sin(this.time * 18), prog = 1 - this.timer / this.teleTotal;
    if (this.state === 'tele_charge') {
      ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(Math.atan2(this.dir.y, this.dir.x));
      ctx.fillStyle = `rgba(255,60,60,${pulse})`; ctx.fillRect(0, -22, BOSS.charge.speed * BOSS.charge.duration, 44); ctx.restore();
    } else if (this.state === 'tele_storm') {
      ctx.strokeStyle = `rgba(255,220,80,${0.5 + pulse})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(this.x, this.y, 40 + prog * 16, 0, Math.PI * 2); ctx.stroke();
    } else if (this.state === 'tele_slam') {
      ctx.fillStyle = `rgba(255,60,60,${pulse * 0.6})`; ctx.beginPath(); ctx.arc(this.x, this.y, BOSS.slam.radius, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(this.x, this.y, BOSS.slam.radius * prog, 0, Math.PI * 2); ctx.stroke();
    }
  }

  draw(ctx, sprites) {
    if (this.removed) return;
    const img = this.enraged ? sprites.bossEnraged : sprites.boss;
    const bob = Math.sin(this.time * 3) * 2, tele = this.state.startsWith('tele_');
    if (this.alive) drawShadow(ctx, this.x, this.y + 30, 34);
    ctx.save(); ctx.translate(Math.round(this.x), Math.round(this.y - 12 + bob));
    if (!this.alive) { ctx.globalAlpha = Math.min(1, this.dying / 0.5); ctx.translate((Math.random() - .5) * 4, 0); }
    else if (tele) ctx.translate((Math.random() - .5) * 2, 0);                  // drży przed atakiem
    ctx.drawImage(img, -48, -48);
    if ((this.flash > 0 || (tele && Math.floor(this.time * 14) % 2)) && this.alive) { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.5; ctx.drawImage(img, -48, -48); }
    ctx.restore();
    if (this.alive && tele) {                                                    // wykrzyknik nad głową
      ctx.fillStyle = '#d6283a'; ctx.fillRect(Math.round(this.x) - 3, Math.round(this.y) - 78, 6, 14); ctx.fillRect(Math.round(this.x) - 3, Math.round(this.y) - 61, 6, 5);
    }
  }
}

// ============================================================
// game.js – pętla gry, poziomy, kamera, prezenty, punktacja w akcji
// Stany: 'menu' | 'intro' | 'playing' | 'transition' | 'levelend' | 'dying' | 'end'
// Czas rozgrywki (elapsed) liczy się TYLKO w stanie 'playing' – menu i ekrany pośrednie go nie zwiększają.
// ============================================================
class Game {
  constructor(canvas, ui) {
    this.canvas = canvas; this.ui = ui; this.ctx = canvas.getContext('2d');
    this.sprites = createSprites(); this.effects = new Effects();
    this.state = 'menu'; this.characterId = CHARACTERS[0].id; this.run = null; this.lastRun = null;
    this.viewW = 512; this.viewH = CONFIG.view.height; this.cam = { x: 0, y: 0 };
    this.shakeT = 0; this.shakeMag = 0; this.pending = null; this.hintCd = 0; this.time = 0; this.elapsed = 0;
    this.flakes = Array.from({ length: 60 }, () => ({ x: Math.random(), y: Math.random(), s: 12 + Math.random() * 26, r: Math.random() < 0.3 ? 2 : 1 }));
    this.buildLevel(0);
    this.last = performance.now();
    requestAnimationFrame(t => this.frame(t));
  }

  // ---------- Rozmiar widoku (różne proporcje ekranu) ----------
  resize(stageW, stageH) {
    const V = CONFIG.view, aspect = stageW / Math.max(1, stageH);
    if (aspect < 1) { this.viewW = V.minWidth; this.viewH = Math.min(448, Math.max(V.height, Math.round(V.minWidth / aspect / 2) * 2)); } // telefon pionowo
    else { this.viewH = V.height; this.viewW = Math.min(V.maxWidth, Math.max(V.minWidth, Math.round(V.height * aspect / 2) * 2)); }
    this.canvas.width = this.viewW; this.canvas.height = this.viewH;   // zmiana rozmiaru czyści ustawienia canvasu
    this.ctx.imageSmoothingEnabled = false;
    const scale = Math.min(stageW / this.viewW, stageH / this.viewH);
    this.canvas.style.width = Math.floor(this.viewW * scale) + 'px'; this.canvas.style.height = Math.floor(this.viewH * scale) + 'px';
  }

  // ---------- Poziomy ----------
  // Buduje poziom: mapę, tło, gracza, przeciwników, prezenty, sanie, bossa
  buildLevel(i) {
    this.levelIndex = i; this.level = LEVELS[i]; const L = this.level;
    this.map = buildMap(L); this.ground = this.renderGround();
    this.player = new Player(L.playerStart.x, L.playerStart.y, this.characterId); // nowy gracz = pełne życie na starcie poziomu
    this.enemies = L.enemies.map(e => new Enemy(e.type, e.x, e.y));
    this.boss = L.boss ? new Boss(L.boss.x, L.boss.y) : null;
    if (this.boss) this.enemies.push(this.boss);
    this.gifts = L.gifts.map((g, k) => ({ x: g.x * TILE + 16, y: g.y * TILE + 16, collected: false, variant: k % 3 }));
    this.heals = L.heals.map(h => ({ x: h.x * TILE + 16, y: h.y * TILE + 16, used: false }));
    this.exit = { x: L.exit.x * TILE + 16, y: L.exit.y * TILE + 16 };
    this.projectiles = []; this.effects.clear();
    this.delivered = 0; this.collected = 0; this.totalGifts = L.gifts.length;
    this.bossDefeated = false; this.pending = null; this.shakeT = 0;
    this.snap();
  }

  renderGround() {
    const c = document.createElement('canvas'); c.width = this.map.width; c.height = this.map.height;
    const g = c.getContext('2d'), S = this.sprites, G = S.ground[this.level.theme];
    for (let y = 0; y < this.map.rows; y++) for (let x = 0; x < this.map.cols; x++) {
      const ch = this.map.tiles[y][x], id = (TILE_DEFS[ch] || TILE_DEFS['.']).id, v = x * 7 + y * 13;
      g.drawImage(id === 'path' ? G.path[v % G.path.length] : G.base[v % G.base.length], x * TILE, y * TILE); // najpierw podłoże
      if (id !== 'ground' && id !== 'path' && S.tiles[id]) g.drawImage(S.tiles[id], x * TILE, y * TILE);       // potem obiekt
    }
    const s = this.level.playerStart;   // znacznik miejsca startu
    g.strokeStyle = 'rgba(214,40,58,.6)'; g.lineWidth = 2; g.setLineDash([4, 3]); g.beginPath(); g.arc(s.x * TILE + 16, s.y * TILE + 16, 13, 0, Math.PI * 2); g.stroke();
    return c;
  }

  // ---------- Przebieg gry ----------
  beginRun(characterId) {
    this.characterId = characterId; this.run = Scoring.newRun(characterId); this.elapsed = 0;
    this.buildLevel(0); Scoring.startLevel(this.run, this.level.name);
    this.state = 'intro'; Controls.active = false;
  }
  startPlay() {            // po kliknięciu "Zaczynamy" na ekranie intro
    this.state = 'playing'; Controls.reset(); Controls.active = true;
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    this.ui.hudShow(true); this.ui.setBoss(0, 1, false);
    this.ui.toast(`Poziom ${this.levelIndex + 1}: ${this.level.name}`);
  }
  nextLevel() {
    this.buildLevel(this.levelIndex + 1); Scoring.startLevel(this.run, this.level.name);
    this.startPlay();
  }
  finishRun(completedAll) {
    Scoring.finalize(this.run, completedAll); this.lastRun = this.run;
    this.state = 'end'; Controls.active = false; this.ui.hudShow(false); this.ui.setBoss(0, 1, false); this.ui.showEnd(this.run);
  }
  later(seconds, fn) { this.state = 'transition'; Controls.active = false; this.pending = { t: seconds, fn }; }   // krótka pauza na efekty

  shake(mag, t) { this.shakeMag = mag; this.shakeT = t; }
  addProjectile(x, y, vx, vy, dmg) { this.projectiles.push(new Projectile(x, y, vx, vy, dmg)); }

  // Obrażenia gracza: odejmuje HP, nalicza karę punktową (raz za każde utracone HP), efekty
  hurtPlayer(dmg) {
    const p = this.player, lost = p.hurt(dmg);
    if (lost > 0) {
      Scoring.damage(this.run.levels[this.run.levels.length - 1], lost);
      this.effects.burst(p.x, p.y, ['#e8394a', '#ffffff'], 10, 110); this.effects.text(p.x, p.y - 16, `-${lost} HP`, '#ff8a8a');
      this.shake(4, 0.25);
      if (p.hp <= 0) { this.effects.burst(p.x, p.y, ['#ffffff', '#e8394a'], 20, 140); this.later(0.9, () => this.finishRun(false)); this.ui.toast('Ups… Ekipa Steady musi spróbować ponownie.'); }
    }
    return lost;
  }

  frame(t) {
    const dt = Math.min(0.05, (t - this.last) / 1000); this.last = t; this.time += dt;
    if (this.state === 'playing') this.update(dt);
    else if (this.state === 'transition') this.updateTransition(dt);
    this.draw();
    requestAnimationFrame(tt => this.frame(tt));
  }

  updateTransition(dt) {
    this.effects.update(dt); this.shakeT = Math.max(0, this.shakeT - dt);
    for (const e of this.enemies) if (e.update) e.update(dt, this.player, this.map, this);
    if (this.pending && (this.pending.t -= dt) <= 0) { const fn = this.pending.fn; this.pending = null; fn(); }
  }

  update(dt) {
    const p = this.player, lv = this.run.levels[this.run.levels.length - 1];
    this.elapsed += dt; lv.seconds += dt; this.run.timeSeconds = this.elapsed; this.hintCd = Math.max(0, this.hintCd - dt);
    p.update(dt, Controls.getMove(), this.map);

    // Atak
    if (Controls.consumeAttack() && p.tryAttack()) {
      const hits = playerAttack(p, this.enemies);
      for (const h of hits) this.effects.burst(h.x, h.y, ['#ffffff', '#bfe8ff', '#ffd34d'], 6, 90);
      if (hits.length) this.shake(1.5, 0.08);
    }
    // Boss budzi się, gdy gracz wejdzie na arenę
    if (this.boss && !this.boss.awake && this.boss.alive && Math.hypot(p.x - this.boss.x, p.y - this.boss.y) < CONFIG.arenaTriggerRadius) {
      this.boss.wake(); this.ui.toast('The Big Deadline się budzi!'); this.shake(5, 0.4);
    }
    for (const e of this.enemies) e.update(dt, p, this.map, this);
    this.separateEnemies(dt);
    if (this.boss) this.ui.setBoss(this.boss.hp, this.boss.maxHp, this.boss.awake && (this.boss.alive || this.boss.dying > 0));

    // Pokonani przeciwnicy -> punkty (dokładnie raz: flaga scored)
    for (const e of this.enemies) {
      if (!e.alive && !e.scored) {
        e.scored = true; let pts;
        if (e.isBoss) { pts = Scoring.bossDefeated(lv); this.bossDefeated = true; this.ui.toast('The Big Deadline pokonany! Zanieś prezenty do sań.'); this.shake(6, 0.5); }
        else pts = Scoring.enemyDefeated(lv, e.cfg.tier);
        this.effects.text(e.x, e.y - 20, `+${pts}`, '#ffd34d'); this.effects.burst(e.x, e.y, ['#ffffff', '#bfe8ff', '#6fb7e8'], 12, 100);
      }
    }
    // Pociski bossa
    for (const pr of this.projectiles) if (pr.update(dt, this.map, p)) { pr.dead = true; this.hurtPlayer(pr.damage); }
    this.projectiles = this.projectiles.filter(pr => !pr.dead);
    if (this.state !== 'playing') return;                          // gracz mógł zginąć od pocisku
    // Kontakt z przeciwnikami
    for (const e of this.enemies) {
      if (!e.alive || e.stun > 0 || (e.isBoss && !e.awake)) continue;
      if (Math.hypot(e.x - p.x, e.y - p.y) < e.radius + 9) {
        const dmg = this.hurtPlayer(e.isBoss ? e.contactDamage : e.cfg.damage);
        if (dmg > 0 && !e.isBoss) { const dx = e.x - p.x, dy = e.y - p.y, l = Math.hypot(dx, dy) || 1; e.stun = 0.4; e.knock = { x: dx / l * 190, y: dy / l * 190 }; }
        if (this.state !== 'playing') return;
      }
    }
    this.enemies = this.enemies.filter(e => !e.removed || e.isBoss);   // boss zostaje w tablicy (prosty warunek ukończenia poziomu)
    this.collect(p);
    this.effects.update(dt); this.shakeT = Math.max(0, this.shakeT - dt);
    this.snapCam();
    this.ui.updateHud({ hp: p.hp, maxHp: p.maxHp, score: Scoring.liveTotal(this.run), gifts: this.collected, total: this.totalGifts, time: this.elapsed, level: `Poziom ${this.levelIndex + 1}/${LEVELS.length}` });
  }

  // Zbieranie prezentów, pierniczków i dostawa do sań
  collect(p) {
    const lv = this.run.levels[this.run.levels.length - 1];
    for (const g of this.gifts) {
      if (g.collected || Math.hypot(g.x - p.x, g.y - p.y) > CONFIG.player.pickupRadius) continue;
      g.collected = true; p.carried++; this.collected++;           // każdy prezent można zebrać tylko raz
      this.effects.burst(g.x, g.y, ['#ffd34d', '#ffffff', '#e8394a'], 14, 100); this.effects.text(g.x, g.y - 14, 'Prezent!', '#ffd34d');
      this.ui.toast(`Prezent odzyskany! (${this.collected}/${this.totalGifts})`);
    }
    for (const h of this.heals) {
      if (h.used || Math.hypot(h.x - p.x, h.y - p.y) > 20 || p.hp >= p.maxHp) continue;
      h.used = true; p.heal(CONFIG.healAmount);
      this.effects.burst(h.x, h.y, ['#8ee04a', '#ffffff'], 8, 70); this.effects.text(h.x, h.y - 14, '+1 HP', '#8ee04a');
    }
    if (Math.hypot(this.exit.x - p.x, this.exit.y - p.y) < CONFIG.exitRadius) {
      if (p.carried > 0) {                                          // dostawa: punkty naliczane przy dostarczeniu, raz za prezent
        const n = p.carried, pts = Scoring.giftsDelivered(lv, n); p.carried = 0; this.delivered += n;
        this.effects.burst(this.exit.x, this.exit.y - 10, ['#ffd34d', '#ffffff', '#e8394a', '#2f9e5a'], 20, 130); this.effects.text(this.exit.x, this.exit.y - 24, `+${pts}`, '#ffd34d');
        this.ui.toast(`Dostarczono prezenty: ${this.delivered}/${this.totalGifts}`);
      }
      const giftsDone = this.delivered >= this.totalGifts, bossDone = !this.level.boss || this.bossDefeated;
      if (giftsDone && bossDone) this.completeLevel();
      else if (this.hintCd <= 0) {
        this.hintCd = 3; this.ui.toast(!giftsDone ? `Brakuje prezentów: ${this.totalGifts - this.delivered}` : 'Najpierw pokonaj The Big Deadline!');
      }
    }
  }

  completeLevel() {
    const lv = this.run.levels[this.run.levels.length - 1];
    const pts = Scoring.levelCompleted(lv);                         // +500, raz (po ukończeniu stan przechodzi na 'transition')
    this.effects.text(this.player.x, this.player.y - 24, `Poziom! +${pts}`, '#8ee04a'); this.effects.burst(this.player.x, this.player.y, ['#ffd34d', '#8ee04a', '#fff'], 24, 150);
    const last = this.levelIndex >= LEVELS.length - 1;
    this.later(0.7, () => {
      if (last) this.finishRun(true);
      else { this.state = 'levelend'; Controls.active = false; this.ui.hudShow(false); this.ui.showLevelEnd(this.run, this.levelIndex, LEVELS[this.levelIndex + 1]); }
    });
  }

  // Delikatne odpychanie przeciwników od siebie (żeby nie zlewały się w jedną plamę)
  separateEnemies(dt) {
    const list = this.enemies.filter(e => e.alive && !e.isBoss);
    for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) {
      const a = list[i], b = list[j], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy);
      if (d > 0 && d < 16) { const k = (16 - d) * 4 * dt / d; moveEntity(a, -dx * k, -dy * k, this.map); moveEntity(b, dx * k, dy * k, this.map); }
    }
  }

  // ---------- Kamera ----------
  snapCam() {
    const p = this.player, mw = this.map.width, mh = this.map.height;
    this.cam.x = mw <= this.viewW ? (mw - this.viewW) / 2 : Math.max(0, Math.min(mw - this.viewW, p.x - this.viewW / 2));
    this.cam.y = mh <= this.viewH ? (mh - this.viewH) / 2 : Math.max(0, Math.min(mh - this.viewH, p.y - this.viewH / 2));
  }
  snap() { this.snapCam(); }

  // ---------- Rysowanie ----------
  draw() {
    const ctx = this.ctx, vw = this.viewW, vh = this.viewH;
    if (this.state === 'intro' || this.state === 'menu') this.snapCam();
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, vw, vh);
    let cx = Math.round(this.cam.x), cy = Math.round(this.cam.y);
    if (this.shakeT > 0) { cx += Math.round((Math.random() - 0.5) * this.shakeMag * 2); cy += Math.round((Math.random() - 0.5) * this.shakeMag * 2); }
    ctx.save(); ctx.translate(-cx, -cy);
    ctx.drawImage(this.ground, 0, 0);
    if (this.boss) this.boss.drawGround(ctx);

    // Sanie (punkt dostawy): pulsują, gdy gracz niesie prezenty
    const carrying = this.player.carried > 0, pulse = Math.sin(this.time * 5);
    if (carrying) { ctx.strokeStyle = `rgba(255,211,77,${0.6 + pulse * 0.3})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(this.exit.x, this.exit.y, CONFIG.exitRadius - 4 + pulse * 2, 0, Math.PI * 2); ctx.stroke(); }
    drawShadow(ctx, this.exit.x, this.exit.y + 12, 14); drawSprite(ctx, this.sprites.sleigh, this.exit.x, this.exit.y);
    for (const h of this.heals) if (!h.used) drawSprite(ctx, this.sprites.heal, h.x, h.y + Math.sin(this.time * 3 + h.x) * 1.5);
    for (const g of this.gifts) if (!g.collected) { drawShadow(ctx, g.x, g.y + 9, 9); drawSprite(ctx, this.sprites.gifts[g.variant], g.x, g.y + Math.sin(this.time * 4 + g.x) * 2); }

    const ents = [...this.enemies, this.player].sort((a, b) => a.y - b.y);   // przeciwnicy i gracz wg pozycji y
    for (const e of ents) e.draw(ctx, this.sprites);
    for (const pr of this.projectiles) pr.draw(ctx, this.sprites);
    drawAttackEffect(ctx, this.player);
    this.effects.draw(ctx);
    ctx.restore();

    // Śnieg (nad wszystkim, w układzie ekranu)
    ctx.fillStyle = 'rgba(255,255,255,.85)';
    const dens = this.level.theme === 'office' ? 0.4 : 1, n = Math.floor(this.flakes.length * dens);
    for (let i = 0; i < n; i++) {
      const f = this.flakes[i]; f.y += f.s * 0.016 / vh; f.x += Math.sin(this.time + f.s) * 0.0004; if (f.y > 1) { f.y = 0; f.x = Math.random(); }
      ctx.fillRect(Math.round(f.x * vw), Math.round(f.y * vh), f.r, f.r);
    }
    if (this.state === 'playing') this.drawArrow(ctx, cx, cy);
  }

  // Strzałka wskazująca następny cel (najbliższy prezent -> sanie -> boss)
  drawArrow(ctx, cx, cy) {
    const p = this.player; let t = null, best = 1e9;
    for (const g of this.gifts) if (!g.collected) { const d = Math.hypot(g.x - p.x, g.y - p.y); if (d < best) { best = d; t = g; } }
    if (!t) t = (this.level.boss && !this.bossDefeated && this.boss) ? this.boss : this.exit;
    const dx = t.x - p.x, dy = t.y - p.y, d = Math.hypot(dx, dy);
    if (d < 110) return;
    const a = Math.atan2(dy, dx), sx = p.x - cx + Math.cos(a) * 34, sy = p.y - cy + Math.sin(a) * 34;
    ctx.save(); ctx.translate(sx, sy); ctx.rotate(a); ctx.globalAlpha = 0.85;
    ctx.fillStyle = '#ffd34d'; ctx.strokeStyle = '#17203a'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(7, 0); ctx.lineTo(-4, -5); ctx.lineTo(-4, 5); ctx.closePath(); ctx.stroke(); ctx.fill(); ctx.restore();
  }
}

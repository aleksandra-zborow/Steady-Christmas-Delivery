// ============================================================
// combat.js – atak gracza (z automatycznym celowaniem), pociski, efekt cięcia
// ============================================================

// Atak: obraca gracza w stronę najbliższego wroga w zasięgu i rani wszystkich przed nim. Zwraca listę trafionych.
function playerAttack(player, enemies) {
  const R = CONFIG.player.attackRange;
  let best = null, bestD = 1e9;
  for (const e of enemies) {
    if (!e.alive) continue;
    const d = Math.hypot(e.x - player.x, e.y - player.y) - e.radius;
    if (d <= R && d < bestD) { best = e; bestD = d; }
  }
  if (best) { const dx = best.x - player.x, dy = best.y - player.y, l = Math.hypot(dx, dy) || 1; player.facing = { x: dx / l, y: dy / l }; }
  const fl = Math.hypot(player.facing.x, player.facing.y) || 1, fx = player.facing.x / fl, fy = player.facing.y / fl;
  const hits = [];
  for (const e of enemies) {
    if (!e.alive) continue;
    const dx = e.x - player.x, dy = e.y - player.y, dist = Math.hypot(dx, dy) || 1, edge = dist - e.radius;
    if (edge > R) continue;
    const inFront = (dx * fx + dy * fy) / dist > 0.2;          // wróg jest przed graczem
    if (inFront || edge < 10) { e.takeHit(CONFIG.player.attackDamage, dx / dist, dy / dist); hits.push(e); }
  }
  return hits;
}

// Pocisk bossa (kartka papieru)
class Projectile {
  constructor(x, y, vx, vy, damage) { this.x = x; this.y = y; this.vx = vx; this.vy = vy; this.damage = damage; this.life = 5; this.dead = false; this.r = 7; this.spin = Math.random() * 6; }
  // Zwraca true, jeśli trafił gracza
  update(dt, map, player) {
    this.x += this.vx * dt; this.y += this.vy * dt; this.life -= dt; this.spin += dt * 8;
    if (this.life <= 0 || rectHitsSolid(map, this.x - 2, this.y - 2, 4, 4)) { this.dead = true; return false; }
    return Math.hypot(player.x - this.x, player.y - this.y) < this.r + 8;
  }
  draw(ctx, sprites) { ctx.save(); ctx.translate(Math.round(this.x), Math.round(this.y)); ctx.rotate(this.spin); ctx.drawImage(sprites.paper, -6, -7); ctx.restore(); }
}

// Efekt cięcia: dwa łuki (biały i złoty) przesuwające się wokół gracza
function drawAttackEffect(ctx, player) {
  if (player.attackAnim <= 0) return;
  const t = 1 - player.attackAnim / ATTACK_ANIM, a = Math.atan2(player.facing.y, player.facing.x), r = CONFIG.player.attackRange - 10;
  ctx.save(); ctx.globalAlpha = 1 - t * 0.6; ctx.lineCap = 'round';
  ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(player.x, player.y, r, a - 1.1 + t * 1.2, a - 0.1 + t * 1.2); ctx.stroke();
  ctx.strokeStyle = '#ffd34d'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(player.x, player.y, r + 4, a - 1.1 + t * 1.2, a - 0.3 + t * 1.2); ctx.stroke();
  ctx.restore();
}

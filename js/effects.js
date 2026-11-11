// ============================================================
// effects.js – cząsteczki i unoszące się napisy (efekty walki, zbierania, pokonania)
// ============================================================
class Effects {
  constructor() { this.particles = []; this.texts = []; }
  clear() { this.particles.length = 0; this.texts.length = 0; }

  // Rozprysk kolorowych punktów
  burst(x, y, colors, n = 10, speed = 90) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, s = speed * (0.4 + Math.random() * 0.8);
      this.particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0.5 + Math.random() * 0.3, color: colors[i % colors.length], size: 2 + (Math.random() * 2 | 0) });
    }
  }
  // Unoszący się napis (np. "+50")
  text(x, y, str, color = '#ffffff') { this.texts.push({ x, y, str, color, life: 1.0 }); }

  update(dt) {
    for (const p of this.particles) { p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.92; p.vy *= 0.92; p.life -= dt; }
    for (const t of this.texts) { t.y -= 24 * dt; t.life -= dt; }
    this.particles = this.particles.filter(p => p.life > 0);
    this.texts = this.texts.filter(t => t.life > 0);
  }

  draw(ctx) {
    for (const p of this.particles) { ctx.globalAlpha = Math.min(1, p.life * 2); ctx.fillStyle = p.color; ctx.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size); }
    ctx.globalAlpha = 1;
    ctx.font = 'bold 10px "Trebuchet MS", sans-serif'; ctx.textAlign = 'center'; ctx.lineWidth = 3; ctx.strokeStyle = '#17203a';
    for (const t of this.texts) { ctx.globalAlpha = Math.min(1, t.life * 2); ctx.strokeText(t.str, Math.round(t.x), Math.round(t.y)); ctx.fillStyle = t.color; ctx.fillText(t.str, Math.round(t.x), Math.round(t.y)); }
    ctx.globalAlpha = 1;
  }
}

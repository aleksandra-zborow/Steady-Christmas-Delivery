// ============================================================
// player.js – bohater: ruch, życie, atak, animacje. Statystyki WSPÓLNE (CONFIG.player);
// characterId wpływa wyłącznie na wygląd (sprite).
// ============================================================
const ATTACK_ANIM = 0.2; // czas animacji ataku (s)

class Player {
  constructor(tileX, tileY, characterId) {
    const P = CONFIG.player;
    this.characterId = characterId;
    this.x = tileX * TILE + TILE / 2; this.y = tileY * TILE + TILE / 2; // pozycja = środek
    this.w = P.hitbox; this.h = P.hitbox;
    this.maxHp = P.maxHp; this.hp = P.maxHp;
    this.facing = { x: 0, y: 1 };
    this.invuln = 0; this.cooldown = 0; this.attackAnim = 0; this.hurtAnim = 0;
    this.walkTime = 0; this.moving = false;
    this.carried = 0;      // prezenty zebrane, ale jeszcze niedostarczone
  }

  update(dt, move, map) {
    this.moving = !!(move.x || move.y);
    if (this.moving) {
      this.facing = { x: move.x, y: move.y };
      moveEntity(this, move.x * CONFIG.player.speed * dt, move.y * CONFIG.player.speed * dt, map);
      this.walkTime += dt;
    }
    this.invuln = Math.max(0, this.invuln - dt); this.cooldown = Math.max(0, this.cooldown - dt);
    this.attackAnim = Math.max(0, this.attackAnim - dt); this.hurtAnim = Math.max(0, this.hurtAnim - dt);
  }

  tryAttack() {
    if (this.cooldown > 0) return false;
    this.cooldown = CONFIG.player.attackCooldown; this.attackAnim = ATTACK_ANIM;
    return true;
  }

  // Zwraca faktycznie utracone HP (0 w czasie nietykalności)
  hurt(amount) {
    if (this.invuln > 0 || this.hp <= 0) return 0;
    const lost = Math.min(amount, this.hp);
    this.hp -= lost; this.invuln = CONFIG.player.invuln; this.hurtAnim = 0.3;
    return lost;
  }
  heal(n) { const before = this.hp; this.hp = Math.min(this.maxHp, this.hp + n); return this.hp - before; }

  draw(ctx, sprites) {
    if (this.hp > 0 && this.invuln > 0 && Math.floor(this.invuln * 12) % 2) return; // miganie po trafieniu
    const look = sprites.characters[this.characterId];
    const goingUp = Math.abs(this.facing.y) > Math.abs(this.facing.x) && this.facing.y < 0;
    const frame = this.moving ? [0, 1, 0, 2][Math.floor(this.walkTime * 9) % 4] : 0; // cykl chodu
    const img = (goingUp ? look.back : look.front)[frame];
    const flip = this.facing.x < 0 && Math.abs(this.facing.x) >= Math.abs(this.facing.y); // w lewo = odbicie lustrzane
    const lunge = (this.attackAnim / ATTACK_ANIM) * 3;                                    // wypad do przodu przy ataku
    const bob = this.moving && frame ? -1 : 0;
    drawShadow(ctx, this.x, this.y + 13, 10);
    drawSprite(ctx, img, this.x + this.facing.x * lunge, this.y + bob - 2 + this.facing.y * lunge, flip);
  }
}

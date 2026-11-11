// ============================================================
// config.js – WSZYSTKIE parametry rozgrywki w jednym miejscu
// (punktacja jest osobno w scoring.js)
// ============================================================

const TILE = 32; // rozmiar kafelka w pikselach

const CONFIG = {
  // Widok kamery (w pikselach "gry"; canvas jest potem skalowany do ekranu)
  view: { height: 288, minWidth: 256, maxWidth: 576 },

  // Ola, Kasia i reszta: WSPÓLNE statystyki dla wszystkich 11 postaci
  player: {
    maxHp: 5,            // punkty życia
    speed: 118,          // prędkość (px/s)
    hitbox: 18,          // rozmiar hitboxa (px)
    invuln: 1.0,         // sekundy nietykalności po trafieniu
    attackCooldown: 0.32,// przerwa między atakami (s)
    attackRange: 52,     // zasięg ataku liczony od krawędzi przeciwnika (px)
    attackDamage: 1,     // obrażenia jednego trafienia
    pickupRadius: 22,    // z jakiej odległości zbieramy prezenty
  },
  healAmount: 1,         // ile HP leczy pierniczek
  exitRadius: 30,        // odległość od sań, z której dostarczamy prezenty
  arenaTriggerRadius: 230, // gdy gracz zbliży się tak do bossa, boss się budzi
};

// Typy przeciwników. tier: 'normal' / 'hard' -> ile punktów (patrz SCORING w scoring.js)
// aggro = od jakiej odległości zaczyna gonić gracza; rampUp = z czasem przyspiesza (presja Deadline'u)
const ENEMY_TYPES = {
  snowman:   { name: 'Bałwan',            sprite: 'snowman',   hp: 3, speed: 48, damage: 1, tier: 'normal', hitbox: 22, radius: 13, aggro: 140 },
  icelet:    { name: 'Lodowy stworek',    sprite: 'icelet',    hp: 2, speed: 78, damage: 1, tier: 'normal', hitbox: 16, radius: 10, aggro: 150 },
  bug:       { name: 'Bug',               sprite: 'bug',       hp: 2, speed: 88, damage: 1, tier: 'normal', hitbox: 16, radius: 10, aggro: 150, zigzag: true },
  deadline:  { name: 'Deadline',          sprite: 'deadline',  hp: 4, speed: 50, damage: 1, tier: 'hard',   hitbox: 20, radius: 12, aggro: 170, rampUp: true },
  frostman:  { name: 'Mroźny bałwan',     sprite: 'frostman',  hp: 6, speed: 56, damage: 2, tier: 'hard',   hitbox: 22, radius: 13, aggro: 150 },
  alpha:     { name: 'Lodowy alfa',       sprite: 'alpha',     hp: 4, speed: 96, damage: 1, tier: 'hard',   hitbox: 16, radius: 10, aggro: 160 },
  deadlineX: { name: 'Wielki Deadline',   sprite: 'deadlineX', hp: 7, speed: 56, damage: 1, tier: 'hard',   hitbox: 20, radius: 12, aggro: 180, rampUp: true },
};

// Boss: The Big Deadline. Trzy ataki, każdy z sygnałem ostrzegawczym (telegraph, w sekundach)
const BOSS = {
  name: 'The Big Deadline',
  hp: 36, speed: 34, hitbox: 50, radius: 34,
  enrageAt: 0.5,                                   // poniżej 50% HP: szybsze ataki i więcej papierów
  idleTime: { min: 1.1, max: 1.8 },                // przerwa między atakami
  charge: { telegraph: 0.9, speed: 250, duration: 0.55, recover: 0.7, damage: 2 }, // szarża w stronę gracza
  storm:  { telegraph: 0.8, count: 8, enragedCount: 12, speed: 105, damage: 1 },   // pierścień papierów
  slam:   { telegraph: 1.0, radius: 92, damage: 1 },                               // uderzenie zegara w ziemię
};
// Łagodniejszy boss, gdy gracz steruje joystickiem (desktop i klawiatura: bez zmian)
const BOSS_TOUCH = {
  hpMul: 0.8,   // 36 HP -> 29 HP (około -19%)
  idleMul: 1.3, // przerwy między atakami +30%: 1.1-1.8 s -> 1.43-2.34 s
};

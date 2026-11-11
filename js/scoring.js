// ============================================================
// scoring.js – punktacja (wartości do łatwego strojenia na górze pliku)
// Wszystko liczone lokalnie, w pamięci gry. Każda akcja jest naliczana tylko raz
// (flagi `scored` na wrogach, odbiór prezentu i ukończenie poziomu pilnuje game.js).
// ============================================================
const SCORING = {
  enemy: { normal: 50, hard: 100 }, // pokonanie przeciwnika (tylko gdy naprawdę pokonany)
  gift: 250,                        // za KAŻDY dostarczony prezent
  levelComplete: 500,               // ukończenie poziomu
  boss: 1000,                       // pokonanie The Big Deadline
  damagePerHp: 40,                  // kara za każdy utracony punkt życia
  // Bonus czasu = max(0, base - sekundy * perSecond); tylko gdy ukończono wszystkie poziomy.
  // Przy tych wartościach bonus zanika po ok. 8 minutach (500 s) i nie przebija punktów za walkę i prezenty.
  timeBonus: { base: 1000, perSecond: 2 },
};

const Scoring = {
  newRun(characterId) {
    return { characterId, levels: [], timeSeconds: 0, timeBonus: 0, total: 0, completedAll: false, finished: false };
  },
  // Nowy wpis podsumowania dla poziomu
  startLevel(run, name) {
    const l = { name, kills: 0, killPoints: 0, gifts: 0, giftPoints: 0, levelPoints: 0, bossPoints: 0, hpLost: 0, penalty: 0, completed: false, seconds: 0 };
    run.levels.push(l); return l;
  },
  enemyDefeated(l, tier) { const p = SCORING.enemy[tier]; l.kills++; l.killPoints += p; return p; },
  giftsDelivered(l, n)   { l.gifts += n; l.giftPoints += n * SCORING.gift; return n * SCORING.gift; },
  levelCompleted(l)      { l.completed = true; l.levelPoints = SCORING.levelComplete; return SCORING.levelComplete; },
  bossDefeated(l)        { l.bossPoints = SCORING.boss; return SCORING.boss; },
  damage(l, hp)          { l.hpLost += hp; l.penalty += hp * SCORING.damagePerHp; },

  levelScore(l) { return l.killPoints + l.giftPoints + l.levelPoints + l.bossPoints - l.penalty; },
  // Wynik "na żywo" (bez bonusu czasu, nigdy poniżej zera)
  liveTotal(run) { return Math.max(0, run.levels.reduce((s, l) => s + this.levelScore(l), 0)); },

  // Zamyka rozgrywkę: liczy bonus czasu i wynik końcowy
  finalize(run, completedAll) {
    run.completedAll = completedAll;
    run.timeBonus = completedAll ? Math.max(0, Math.round(SCORING.timeBonus.base - run.timeSeconds * SCORING.timeBonus.perSecond)) : 0;
    run.total = Math.max(0, run.levels.reduce((s, l) => s + this.levelScore(l), 0) + run.timeBonus);
    run.finished = true;
    return run.total;
  },

  // Zestawienie do ekranów podsumowania
  summary(run) {
    const s = { kills: 0, gifts: 0, hpLost: 0, killPts: 0, giftPts: 0, levelPts: 0, bossPts: 0, penalty: 0, levelsCompleted: 0 };
    for (const l of run.levels) {
      s.kills += l.kills; s.gifts += l.gifts; s.hpLost += l.hpLost; s.killPts += l.killPoints; s.giftPts += l.giftPoints;
      s.levelPts += l.levelPoints; s.bossPts += l.bossPoints; s.penalty += l.penalty; if (l.completed) s.levelsCompleted++;
    }
    s.timeBonus = run.timeBonus; s.seconds = run.timeSeconds; s.completedAll = run.completedAll;
    s.total = run.finished ? run.total : this.liveTotal(run);
    s.perLevel = run.levels.map(l => ({ name: l.name, score: this.levelScore(l), kills: l.kills, gifts: l.gifts, hpLost: l.hpLost, completed: l.completed }));
    return s;
  },
};

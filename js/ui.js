// ============================================================
// ui.js – ekrany (start, fabuła, wybór postaci, intro, podsumowania), HUD, komunikaty
// Gra rozmawia z interfejsem wyłącznie przez obiekt UI (game.js nie dotyka HTML-a bezpośrednio).
// ============================================================
const $ = id => document.getElementById(id);
const formatTime = sec => Math.floor(sec / 60) + ':' + String(Math.floor(sec % 60)).padStart(2, '0'); // 75 -> 1:15

const UI = {
  screens: ['start', 'story', 'select', 'intro', 'levelend', 'end', 'last'],
  current: 'start', prev: 'start', selectedId: CHARACTERS[0].id, toastTimer: null, hudCache: {},

  // Pokazuje jeden ekran (show(null) = ukrywa wszystkie, czyli widać grę)
  show(name) {
    for (const s of this.screens) $('scr-' + s).classList.toggle('hidden', s !== name);
    document.body.classList.toggle('in-game', !name);
    this.current = name;
  },

  toast(text, ms = 2400) {
    const t = $('toast'); t.textContent = text; t.classList.remove('hidden');
    clearTimeout(this.toastTimer); this.toastTimer = setTimeout(() => t.classList.add('hidden'), ms);
  },

  hudShow(on) { $('hud').classList.toggle('hidden', !on); $('touch').classList.toggle('hidden', !on); if (!on) $('toast').classList.add('hidden'); },

  // Odświeża HUD tylko tam, gdzie wartość się zmieniła (mniej pracy dla DOM)
  updateHud(d) {
    const c = this.hudCache, set = (id, v) => { if (c[id] !== v) { c[id] = v; $(id).textContent = v; } };
    if (c.hp !== d.hp || c.maxHp !== d.maxHp) {
      c.hp = d.hp; c.maxHp = d.maxHp;
      $('hud-hp').innerHTML = Array.from({ length: d.maxHp }, (_, i) => `<span class="${i < d.hp ? 'heart-full' : 'heart-empty'}">&#9829;</span>`).join('');
    }
    set('hud-score', 'Punkty: ' + d.score); set('hud-gifts', `Prezenty: ${d.gifts}/${d.total}`);
    set('hud-time', formatTime(d.time)); set('hud-level', d.level);
  },

  setBoss(hp, max, visible) {
    $('boss-bar').classList.toggle('hidden', !visible);
    if (visible) $('boss-fill').style.width = Math.max(0, hp / max * 100) + '%';
  },

  // ----- Wybór postaci: 11 kart z podglądem sprite'a i imieniem -----
  buildSelect(sprites) {
    const grid = $('char-grid');
    for (const ch of CHARACTERS) {
      const btn = document.createElement('button');
      btn.className = 'char'; btn.type = 'button'; btn.dataset.id = ch.id;
      const cv = document.createElement('canvas'); cv.width = cv.height = 96;
      const g = cv.getContext('2d'); g.imageSmoothingEnabled = false; g.drawImage(sprites.characters[ch.id].front[0], 0, 0, 96, 96);
      const label = document.createElement('span'); label.textContent = ch.name;
      btn.append(cv, label);
      btn.addEventListener('click', () => this.select(ch.id));
      grid.append(btn);
    }
    this.select(this.selectedId);
  },
  select(id) {
    this.selectedId = id;
    for (const b of $('char-grid').children) b.setAttribute('aria-pressed', String(b.dataset.id === id));
    $('selected-name').textContent = CHARACTERS.find(c => c.id === id).name;
  },

  // ----- Intro poziomu -----
  showIntro(level, idx, total) {
    $('intro-num').textContent = `Poziom ${idx + 1} z ${total}`;
    $('intro-name').textContent = level.name; $('intro-sub').textContent = level.subtitle;
    $('intro-story').textContent = level.story; $('intro-goal').textContent = 'Cel: ' + level.goal;
    this.show('intro');
  },

  // ----- Podsumowania -----
  summaryHtml(run) {
    const s = Scoring.summary(run), plus = n => (n >= 0 ? '+' : '−') + Math.abs(n);
    const rows = s.perLevel.map((l, i) => `<tr><td>${i + 1}. ${l.name}${l.completed ? '' : ' (nieukończony)'}</td><td>${l.kills}</td><td>${l.gifts}</td><td>${l.hpLost}</td><td><b>${l.score}</b></td></tr>`).join('');
    return `
      <div class="sum-grid">
        <span>Czas rozgrywki</span><b>${formatTime(s.seconds)}</b>
        <span>Pokonani przeciwnicy</span><b>${s.kills}</b>
        <span>Dostarczone prezenty</span><b>${s.gifts}</b>
        <span>Utracone punkty życia</span><b>${s.hpLost}</b>
        <span>Ukończone poziomy</span><b>${s.levelsCompleted}/${LEVELS.length}</b>
        <span>Wszystkie poziomy ukończone</span><b>${s.completedAll ? 'Tak' : 'Nie'}</b>
      </div>
      <table class="sum-table"><tr><th>Poziom</th><th>Wrogowie</th><th>Prezenty</th><th>−HP</th><th>Wynik</th></tr>${rows}</table>
      <div class="sum-break">Przeciwnicy ${plus(s.killPts)} · Prezenty ${plus(s.giftPts)} · Poziomy ${plus(s.levelPts)} · Boss ${plus(s.bossPts)} · Obrażenia ${plus(-s.penalty)}${run.finished ? ` · Bonus czasu ${plus(s.timeBonus)}` : ''}</div>`;
  },

  showLevelEnd(run, idx, next) {
    const l = run.levels[idx], s = Scoring.summary(run);
    $('le-title').textContent = `Poziom ${idx + 1} ukończony!`;
    $('le-summary').innerHTML = `
      <div class="sum-grid">
        <span>Pokonani przeciwnicy</span><b>${l.kills}</b>
        <span>Dostarczone prezenty</span><b>${l.gifts}</b>
        <span>Utracone punkty życia</span><b>${l.hpLost}</b>
        <span>Czas na poziomie</span><b>${formatTime(l.seconds)}</b>
        <span>Wynik poziomu</span><b>${Scoring.levelScore(l)}</b>
        <span>Łączny wynik</span><b>${s.total}</b>
      </div>`;
    $('le-next').innerHTML = `<b>Następny: Poziom ${idx + 2} – ${next.name}</b><br>${next.story}<br><i>Cel: ${next.goal}</i>`;
    this.show('levelend');
  },

  showEnd(run) {
    const won = run.completedAll;
    $('end-title').textContent = won ? 'Prezenty dostarczone!' : 'Koniec gry';
    $('end-text').textContent = won ? 'Wesołych Świąt od całej ekipy Steady! The Big Deadline pokonany.' : 'Tym razem się nie udało. Spróbuj jeszcze raz!';
    $('end-score').textContent = run.total;
    $('end-summary').innerHTML = this.summaryHtml(run);
    $('btn-last-start').classList.remove('hidden'); $('btn-last-select').classList.remove('hidden');
    this.show('end');
  },

  showLast(game) {
    if (!game.lastRun) return;
    this.prev = this.current;
    $('last-score').textContent = game.lastRun.total;
    $('last-summary').innerHTML = this.summaryHtml(game.lastRun);
    this.show('last');
  },
};

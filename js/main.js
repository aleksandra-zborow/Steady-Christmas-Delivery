// ============================================================
// main.js – start aplikacji: łączy ekrany (UI) z grą (Game)
// Flow: start -> fabuła -> wybór postaci -> intro 1. poziomu -> gra -> podsumowanie -> ... -> ekran końcowy
// ============================================================
Controls.init();
const game = new Game($('game'), UI);
UI.buildSelect(game.sprites);

// Skalowanie canvasu do kontenera (osadzenie na landing page = po prostu wstawienie #stage w element o określonym rozmiarze)
function fit() { const r = $('stage').getBoundingClientRect(); if (r.width && r.height) game.resize(r.width, r.height); }
if (window.ResizeObserver) new ResizeObserver(fit).observe($('stage')); else window.addEventListener('resize', fit);
fit();
if (matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window) document.body.classList.add('touch'); // pokaż sterowanie dotykowe

const beginRun = id => { game.beginRun(id); UI.showIntro(game.level, 0, LEVELS.length); };

$('btn-start').addEventListener('click', () => UI.show('story'));
$('btn-story').addEventListener('click', () => UI.show('select'));
$('btn-select-back').addEventListener('click', () => UI.show('start'));
$('btn-confirm').addEventListener('click', () => beginRun(UI.selectedId));
$('btn-intro-go').addEventListener('click', () => { UI.show(null); game.startPlay(); });
$('btn-next').addEventListener('click', () => { UI.show(null); game.nextLevel(); });
$('btn-again').addEventListener('click', () => beginRun(game.characterId));   // ta sama postać, od poziomu 1
$('btn-change').addEventListener('click', () => UI.show('select'));            // powrót do wyboru postaci
$('btn-last-start').addEventListener('click', () => UI.showLast(game));
$('btn-last-select').addEventListener('click', () => UI.showLast(game));
$('btn-last-back').addEventListener('click', () => UI.show(UI.prev));

// Po ukończeniu pierwszej gry pokazujemy przyciski "Ostatni wynik"
UI.show('start');

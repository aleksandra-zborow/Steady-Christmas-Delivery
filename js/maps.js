// ============================================================
// maps.js – kafelki, trzy ręcznie zaprojektowane poziomy i kolizje
// Każdy poziom to napisy: 1 znak = 1 kafelek 32x32 px (legenda: TILE_DEFS).
// Pozycje (x, y) prezentów, wrogów itd. podajemy w kafelkach.
// ============================================================

// Legenda kafelków. solid = blokuje ruch. '.' to podłoże zależne od motywu poziomu
// (śnieg / podłoga biura / górski śnieg), '=' to ścieżka / wykładzina / szlak.
const TILE_DEFS = {
  '.': { id: 'ground',   solid: false }, '=': { id: 'path',     solid: false },
  'T': { id: 'tree',     solid: true  }, 'X': { id: 'xtree',    solid: true  }, // choinka / ubrana choinka
  'R': { id: 'rock',     solid: true  }, 'D': { id: 'drift',    solid: true  }, // kamień / zaspa
  'I': { id: 'ice',      solid: false },                                       // lód (dekoracja, można chodzić)
  'M': { id: 'wall',     solid: true  }, 'k': { id: 'desk',     solid: true  }, // biuro: ściana, biurko
  'a': { id: 'cabinet',  solid: true  }, 'q': { id: 'chair',    solid: true  }, // szafka, krzesło
  'x': { id: 'xdesk',    solid: true  }, 'n': { id: 'docs',     solid: false }, // biurko z choinką, dokumenty
  'K': { id: 'cliff',    solid: true  }, 'J': { id: 'iceblock', solid: true  }, // góra: skała, blok lodu
  'S': { id: 'summit',   solid: false },                                       // płyta szczytu (arena bossa)
};

// Zamienia poziom na mapę z gotową tablicą kolizji
function buildMap(level) {
  const tiles = level.rows;
  const solid = tiles.map(row => [...row].map(ch => (TILE_DEFS[ch] || TILE_DEFS['.']).solid));
  return { tiles, solid, cols: tiles[0].length, rows: tiles.length, width: tiles[0].length * TILE, height: tiles.length * TILE };
}

// Czy prostokąt (x,y = lewy górny róg) dotyka przeszkody lub wychodzi poza mapę?
function rectHitsSolid(map, x, y, w, h) {
  const c0 = Math.floor(x / TILE), c1 = Math.floor((x + w - 1) / TILE);
  const r0 = Math.floor(y / TILE), r1 = Math.floor((y + h - 1) / TILE);
  for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) {
    if (r < 0 || c < 0 || r >= map.rows || c >= map.cols) return true; // granica mapy
    if (map.solid[r][c]) return true;
  }
  return false;
}

// Przesuwa obiekt (x,y = środek; w,h = hitbox) osobno w osi X i Y – dzięki temu "ślizga się" po ścianach.
function moveEntity(e, dx, dy, map) {
  if (dx && !rectHitsSolid(map, e.x + dx - e.w / 2, e.y - e.h / 2, e.w, e.h)) e.x += dx;
  if (dy && !rectHitsSolid(map, e.x - e.w / 2, e.y + dy - e.h / 2, e.w, e.h)) e.y += dy;
}

// ---------------- POZIOMY ----------------
const LEVELS = [
  {
    id: 1, name: "Snowy Woods", subtitle: "Zaśnieżony las", theme: 'forest',
    story: "Paczki rozsypały się po lesie, a między choinkami czają się bałwany i lodowe stworki.",
    goal: "Zbierz 3 prezenty i zanieś je do sań na końcu ścieżki.",
    rows: [
      'TXTXTTXTXTXXTTXTTTTTTXTTXXTTTTTTTXXT',
      'TTTTTTTTTTTTTTTXTTXTXTTTTTTTTTTTTTXT',
      'TT..RT......I......R..............TT',
      'TT.TDTD.......T................===XT',
      'XX.........RR.TT..D..R..I......===XT',
      'XT.D...I..T.T..T..TT....R......==.TT',
      'XTR...X..T..TT.................==.TT',
      'TT.R..XX.....D.T...............==TTT',
      'TT.D..T...........==========...==.TX',
      'XT....X...T.DT....==========...==.TT',
      'TT...D............==....T.==...==.XT',
      'TT.I.TTX..........==....R.==...==.TT',
      'TTT....R..........==....X.==.T.==.TX',
      'TT...T............==..T.T.==.I.==.TT',
      'TT........==========......==.X.==.XT',
      'XX........=========..X....==...==.TX',
      'TX........==.........R.I..=======.XX',
      'XT........==T.......I.I...======..XT',
      'TX....R...==R....................XTT',
      'TX........==...R...T.R............TT',
      'TT.=========........X.............XX',
      'TT.========...D.........T.......TRTX',
      'XTTXTXTTTTTTXTTTTTTTTTTTTTTXXTTTTTTT',
      'TTTTTTTTTTTTXTTTTTXTTTTTTTTXXXTTXTTT',
    ],
    playerStart: { x: 3, y: 20 },
    exit: { x: 33, y: 3 },                       // sanie – punkt dostawy prezentów
    gifts: [{ x: 7, y: 15 }, { x: 22, y: 7 }, { x: 28, y: 19 }],
    heals: [{ x: 14, y: 15 }, { x: 29, y: 10 }],   // pierniczki leczące 1 HP
    enemies: [
      { type: 'snowman', x: 14, y: 17 },
      { type: 'snowman', x: 21, y: 10 },
      { type: 'snowman', x: 27, y: 13 },
      { type: 'icelet', x: 8, y: 9 },
      { type: 'icelet', x: 24, y: 19 },
      { type: 'icelet', x: 30, y: 6 },
    ],
    boss: null,
  },
  {
    id: 2, name: "The Frozen Office", subtitle: "Zamrożone biuro Steady", theme: 'office',
    story: "W biurze zamarzły systemy. Bugi i Deadline'y krążą między biurkami.",
    goal: "Odzyskaj 4 prezenty z biura i zanieś je do sań na końcu korytarza.",
    rows: [
      'MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM',
      'M.aa.......a.M.aa.......aIM.aa.n.....a.M',
      'M..kI.n..n...Mnnk..k..k...M.....k..k...M',
      'Mn.q.........M..q..q..q...M.I...q..q..nM',
      'M..............I.n.....................M',
      'M....................I.................M',
      'M..k..k..k..nM..k..x..k...M..x..k......M',
      'M..q..q..q...M..q..q..q...M.nq..q......M',
      'M.n..I....n..M....n......nM............M',
      'MMMMM..MMMMMMMMMMM..MMMMMMMMMMMM..MMMMMM',
      'M=====I===a=======================a====M',
      'M=================I====================M',
      'M======================================M',
      'M===I=====I===========a=====I==========M',
      'MMMMM..MMMMMMMMMMM..MMMMMMMMMMMM..MMMMMM',
      'M....I....n..M..n.........M....n..II...M',
      'M..k..k..x.I.M..x..k..k...M..x..k..x...M',
      'MI.q..q..q...M.nq.Iq..q...M..q..q..q...M',
      'M....................n....n...n........M',
      'M.................n....................M',
      'Mn.....I.....M..x..x..k...M..x.....k...M',
      'MnI.....n....M.Iq..q.Iq.I.MI.q.....qIn.M',
      'M.aa...I...a.M.aa..n....a.M.aa.......aIM',
      'MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM',
    ],
    playerStart: { x: 2, y: 11 },
    exit: { x: 37, y: 11 },                       // sanie – punkt dostawy prezentów
    gifts: [{ x: 10, y: 4 }, { x: 24, y: 4 }, { x: 4, y: 19 }, { x: 33, y: 20 }],
    heals: [{ x: 14, y: 11 }, { x: 26, y: 12 }],   // pierniczki leczące 1 HP
    enemies: [
      { type: 'bug', x: 7, y: 4 },
      { type: 'bug', x: 30, y: 3 },
      { type: 'bug', x: 10, y: 19 },
      { type: 'deadline', x: 20, y: 11 },
      { type: 'deadline', x: 30, y: 12 },
      { type: 'snowman', x: 24, y: 19 },
      { type: 'icelet', x: 36, y: 6 },
      { type: 'icelet', x: 5, y: 20 },
    ],
    boss: null,
  },
  {
    id: 3, name: "Deadline Mountain", subtitle: "Ośnieżona góra", theme: 'mountain',
    story: "Ostatnie paczki leżą na zboczach, a na szczycie czeka The Big Deadline.",
    goal: "Zbierz 4 prezenty, pokonaj bossa i dostarcz paczki do sań na szczycie.",
    rows: [
      'KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK',
      'KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK',
      'KKKKKKKKXSSSSSSSSSSSSSSXKKKKKKKK',
      'KKKKKKKKSSSSSSSSSSSSSSSSKKKKKKKK',
      'KKKKKKKKSSSSSSSSSSSSSSSSKKKKKKKK',
      'KKKKKKKKSSSSSSSSSSSSSSSSKKKKKKKK',
      'KKKKKKKKSSSSSSSSSSSSSSSSKKKKKKKK',
      'KKKKKKKKSSSSSSSSSSSSSSSSKKKKKKKK',
      'KKKKKKKKXSSSSSSSSSSSSSSXKKKKKKKK',
      'KKKKKKKKKKKKKK.==.KKKKKKKKKKKKKK',
      'KKI............==============XKK',
      'KK......I...I..==============.KK',
      'KKKKKKKKKKKKKKKKKKKKKKKKKK.==.KK',
      'KKKKKKKKKKKKKKKKKKKKKKKKKKD==.KK',
      'KK....T.......T............==.KK',
      'KKR==========================RKK',
      'KKJ=========================..KK',
      'KK.==......................D..KK',
      'KK.==.KKKKKKKKKKKKKKKKKKKKKKKKKK',
      'KK.==JKKKKKKKKKKKKKKKKKKKKKKKKKK',
      'KK.==.....T.T.D........TT.....KK',
      'KK.==========================TKK',
      'KKX==========================.KK',
      'KK.DT......................==.KK',
      'KKKKKKKKKKKKKKKKKKKKKKKKKK.==.KK',
      'KKKKKKKKKKKKKKKKKKKKKKKKKK.==IKK',
      'KK........T......T.T.....X.==.KK',
      'KK.....I..................T==.KK',
      'KK.==========================.KK',
      'KK.=========================J.KK',
      'KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK',
      'KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK',
    ],
    playerStart: { x: 3, y: 28 },
    exit: { x: 16, y: 2 },                       // sanie – punkt dostawy prezentów
    gifts: [{ x: 14, y: 27 }, { x: 20, y: 21 }, { x: 10, y: 15 }, { x: 5, y: 11 }],
    heals: [{ x: 6, y: 22 }, { x: 22, y: 16 }, { x: 16, y: 11 }],   // pierniczki leczące 1 HP
    enemies: [
      { type: 'frostman', x: 15, y: 26 },
      { type: 'alpha', x: 22, y: 28 },
      { type: 'alpha', x: 25, y: 22 },
      { type: 'frostman', x: 12, y: 22 },
      { type: 'deadlineX', x: 7, y: 21 },
      { type: 'alpha', x: 8, y: 16 },
      { type: 'frostman', x: 20, y: 16 },
      { type: 'deadlineX', x: 24, y: 15 },
      { type: 'alpha', x: 10, y: 10 },
      { type: 'frostman', x: 22, y: 11 },
    ],
    boss: { x: 16, y: 5 },
  },
];

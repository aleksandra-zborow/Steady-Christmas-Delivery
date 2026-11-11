// ============================================================
// sprites.js – grafiki pixel art generowane w kodzie (brak plików do ładowania -> działa z dysku)
// Postacie, przeciwnicy i prezenty to siatki znaków 16x16 (1 znak = 1 piksel, powiększone 2x do 32x32).
// Duże kafelki i boss są rysowane prostymi prostokątami/elipsami.
// Żeby podmienić grafikę na własne PNG, wystarczy zmienić createSprites() tak, by zwracała obrazki.
// ============================================================

const PALETTE = {
  o: '#2b2140', // kontur (dodawany automatycznie)
  r: '#d9531e', s: '#f6c9a0', k: '#1b1b2b', e: '#d6283a', w: '#ffffff', u: '#3b5ba5', n: '#6b4226', y: '#ffd34d', q: '#ff8a1f',
  G: '#2f8a4f', g: '#1f5c3a', h: '#5fb36a',
  a: '#d6283a', c: '#d6283a', f: '#ffffff', b: '#a07f60', // czapka, kurtka, szalik, zarost – nadpisywane per postać
  i: '#bfe8ff', j: '#6fb7e8', m: '#2f6fb3',               // lód
  p: '#8ee04a', d: '#2f6a1f',                             // bug
  N: '#c07a3a',                                           // piernik
};

// ---------- Postać: składanie siatki z fryzury, czapki i klatki chodu ----------
const _E = '................';
// Twarz i boki głowy (rzędy 5-8) zależnie od fryzury
const FACE = {
  bare:     ['....ssssssss....', '....ssksskss....', '....ssssssss....', '.....ssssss.....'], // łysy / buzz cut
  short:    ['...rssssssssr...', '...rssksskssr...', '...rssssssssr...', '.....ssssss.....'], // krótkie / grzywka
  shoulder: ['...rrssssssrr...', '...rrskssksrr...', '...rrssssssrr...', '...rr.ssss.rr...'], // do ramion / długie
};
// Nogi: klatka 0 = stoi, 1 i 2 = krok lewą / prawą nogą (animacja chodu)
const LEGS = [
  ['....uuu..uuu....', '...nnnn..nnnn...', '...nnnn..nnnn...'],
  ['....uuu..uuu....', '...nnnn..nnnn...', '...nnnn.........'],
  ['....uuu..uuu....', '...nnnn..nnnn...', '.........nnnn...'],
];

function characterRows(ch, back, frame) {
  const style = ch.hairStyle, long = style === 'long';
  // rzędy 1-4: czapka albo czubek głowy
  let top;
  if (ch.hat)                    top = ['......wwww......', '.....aaaaaa.....', '....aaaaaaaa....', '....wwwwwwww....'];
  else if (style === 'bald')     top = [_E, '.....ssssss.....', '....ssssssss....', '....ssssssss....'];
  else if (style === 'fringe')   top = [_E, '.....rrrrrr.....', '....rrrrrrrr....', '....rrrrrrrr....']; // prosta grzywka zakrywa czoło
  else if (style === 'buzz')     top = [_E, '.....rrrrrr.....', '....rrrrrrrr....', '....rssssssr....'];
  else if (style === 'short')    top = [_E, '.....rrrrrr.....', '....rrrrrrrr....', '....rrssssrr....'];
  else                           top = [_E, '.....rrrrrr.....', '....rrrrrrrr....', '....rrrrrrrr....'];
  // rzędy 5-8: twarz (z przodu) lub włosy / łysina (z tyłu)
  const base = style === 'bald' || style === 'buzz' ? 'bare' : (style === 'short' || style === 'fringe') ? 'short' : 'shoulder';
  let face = FACE[base].slice();
  if (back) {
    const hairRow = base === 'shoulder' ? '...rrrrrrrrrr...' : base === 'short' ? '...rrrrrrrrrr...' : '....rrrrrrrr....';
    const fill = style === 'bald' ? '....ssssssss....' : hairRow;
    face = [fill, fill, fill, base === 'shoulder' ? '...rrrrrrrrrr...' : style === 'bald' ? '.....ssssss.....' : '.....rrrrrr.....'];
  } else if (ch.stubble) {
    face[2] = '....sbbbbbbs....'; face[3] = '.....sbbbbs.....';   // krótki zarost
  }
  // rzędy 9-10: szalik i kurtka (długie włosy opadają na ramiona)
  let body = ['....ccffffcc....', '...s' + 'c'.repeat(8) + 's...'];
  if (long) body = back ? ['...rrrrrrrrrr...', '...rrrrrrrrrr...'] : ['...rccffffccr...', '...r' + 'c'.repeat(8) + 'r...'];
  return [_E, ...top, ...face, ...body, '....nnnnnnnn....', '....uuuuuuuu....', ...LEGS[frame]];
}

// ---------- Przeciwnicy (16x16) ----------
const SNOWMAN = [
  '................', '.....kkkkkk.....', '.....kkkkkk.....', '....kkkkkkkk....', '....wwwwwwww....', '....wkwwwwkw....', '....wwwqqwww....', '....wwwwwwww....',
  '...eeeeeeeeee...', '.nn.wwwwwwww.nn.', '...wwwkwwwwww...', '...wwwwwwwwww...', '...wwwkwwwwww...', '...wwwwwwwwww...', '....wwwwwwww....', '................',
];
const ICELET = [   // mały lodowy stworek – kryształ z minką
  '................', '.......ii.......', '......iiii......', '.....iijjii.....', '....iijjjjii....', '...iijkjjkjii...', '...ijjjwwjjji...', '....ijjjjjji....',
  '.....mjjjjm.....', '......mmmm......', '.....m.mm.m.....', '................', '................', '................', '................', '................',
];
const BUG = [      // bug w projekcie: zielony robak z czerwonym "!"
  '................', '................', '....k......k....', '.....k....k.....', '......dppd......', '.....pwkkwp.....', '..d..pppppp..d..', '.d..dddddddd..d.',
  '...dpppeepppd...', '..d.dppppppd.d..', '.d..dppppppd..d.', '....dddddddd....', '.....dddddd.....', '................', '................', '................',
];
const DEADLINE = [ // budzik z nogami – Deadline
  '................', '..ee........ee..', '..eee......eee..', '.....eeeeee.....', '....eeeeeeee....', '...eewkwwkwee...', '...eewwwwwwee...', '...eewwkkwwee...',
  '...eewwwwwwee...', '....eeeeeeee....', '.....eeeeee.....', '.....kk..kk.....', '....kkk..kkk....', '....kk....kk....', '................', '................',
];
const TREE = [
  '................', '.......GG.......', '......GGGG......', '.....GGwGGG.....', '....GGGGGGGG....', '......GGGG......', '.....GGGwGG.....', '....GGGGGGGG....',
  '...GGhGGGGGGg...', '..GGGGGGwGGGGG..', '.GGGGGgGGGGGGGG.', '..gggggggggggg..', '.......nn.......', '.......nn.......', '......nnnn......', '................',
];
// Ubrana choinka: co któryś liść zamieniamy na bombkę (czerwoną / złotą)
const XTREE = TREE.map((row, y) => [...row].map((c, x) => (c === 'G' && (x * 3 + y * 5) % 6 === 0 ? ((x + y) % 2 ? 'e' : 'y') : c)).join(''));
const PRESENT = [
  _E, _E, _E, '.....yy..yy.....', '....y..yy..y....', '.....yyyyyy.....', '...eeeeyyeeee...', '...eeeeyyeeee...', '...yyyyyyyyyy...', '...eeeeyyeeee...', '...eeeeyyeeee...', '...eeeeyyeeee...', '...eeeeyyeeee...', _E, _E, _E,
];
const GINGER = [   // pierniczek leczący
  _E, _E, '.....NNNNNN.....', '.....NwNNwN.....', '.....NNNNNN.....', '..NNNNNNNNNNNN..', '..NNNNNwwNNNNN..', '.....NNNNNN.....', '....NNN..NNN....', '....NNN..NNN....', _E, _E, _E, _E, _E, _E,
];

// ---------- Zamiana siatki na canvas 32x32 (przezroczyste tło, ciemny kontur) ----------
function spriteFromRows(rows, outline = true, colors = {}) {
  const pal = { ...PALETTE, ...colors };
  const grid = rows.map(r => r.padEnd(16, '.').slice(0, 16).split(''));
  const out = grid.map(r => r.slice());
  if (outline) {
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      if (grid[y][x] !== '.') continue;
      const near = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => (grid[y + dy] || [])[x + dx] && grid[y + dy][x + dx] !== '.');
      if (near) out[y][x] = 'o';
    }
  }
  const c = document.createElement('canvas'); c.width = c.height = 32;
  const g = c.getContext('2d');
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const col = pal[out[y][x]];
    if (col) { g.fillStyle = col; g.fillRect(x * 2, y * 2, 2, 2); }
  }
  return c;
}

// ---------- Pomocnicze rysowanie ----------
function newCanvas(w = TILE, h = TILE) { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; }
function R(g, color, x, y, w, h) { g.fillStyle = color; g.fillRect(x, y, w, h); }
function ellipse(g, color, x, y, rx, ry) { g.fillStyle = color; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); g.fill(); }

// Kafelek podłoża z "pikselowymi" iskierkami (seed = powtarzalna losowość)
function groundTile(base, dark, light, seed) {
  const [c, g] = newCanvas(); R(g, base, 0, 0, TILE, TILE);
  let s = seed * 9301 + 49297; const rnd = () => (s = (s * 9301 + 49297) % 233280) / 233280;
  for (let i = 0; i < 6; i++) R(g, i % 2 ? dark : light, Math.floor(rnd() * 15) * 2, Math.floor(rnd() * 15) * 2, 2, 2);
  return c;
}
function officeFloor(seed) {
  const [c, g] = newCanvas(); R(g, '#b4c4d8', 0, 0, TILE, TILE);
  R(g, '#a9bbd0', 0, 0, 16, 16); R(g, '#a9bbd0', 16, 16, 16, 16);
  R(g, '#8ea2bb', 0, 0, TILE, 1); R(g, '#8ea2bb', 0, 0, 1, TILE);
  if (seed % 2) { R(g, '#ffffff', 6, 22, 2, 2); R(g, '#ffffff', 21, 7, 2, 2); }
  return c;
}
function carpet(seed) {
  const [c, g] = newCanvas(); R(g, '#4b5f8f', 0, 0, TILE, TILE);
  R(g, '#5a70a6', 0, 6, TILE, 4); R(g, '#5a70a6', 0, 22, TILE, 4);
  if (seed % 2) R(g, '#dbe8ff', 12, 14, 2, 2);
  return c;
}

// ---------- Kafelki obiektów ----------
function tileRock() { const [c, g] = newCanvas(); ellipse(g, '#2b2140', 16, 20, 14, 11); ellipse(g, '#8d98ab', 16, 19, 12, 9); ellipse(g, '#c1cad8', 12, 16, 5, 3); ellipse(g, '#fff', 17, 12, 8, 3.5); return c; }
function tileDrift() { const [c, g] = newCanvas(); ellipse(g, '#9db9d8', 16, 22, 15, 8); ellipse(g, '#fff', 15, 20, 13, 7); ellipse(g, '#d6e6f5', 19, 22, 7, 3); return c; }
function tileIce() { const [c, g] = newCanvas(); ellipse(g, 'rgba(150,210,255,.6)', 16, 17, 14, 10); ellipse(g, 'rgba(255,255,255,.7)', 11, 14, 5, 2.5); return c; }
function tileWall() { const [c, g] = newCanvas(); R(g, '#46547f', 0, 0, TILE, TILE); R(g, '#6b7bac', 0, 0, TILE, 5); R(g, '#2f3a5c', 0, 27, TILE, 5); R(g, '#ffffff', 3, 1, 8, 2); R(g, '#ffffff', 19, 2, 5, 2); R(g, '#37446b', 15, 8, 2, 18); return c; }
function tileDesk(tree) {
  const [c, g] = newCanvas(); R(g, '#8a5a33', 2, 6, 28, 20); R(g, '#a8723f', 2, 6, 28, 3); R(g, '#5a3418', 2, 25, 28, 2);
  if (tree) { ellipse(g, '#1f5c3a', 16, 14, 7, 9); ellipse(g, '#2f8a4f', 16, 13, 5, 7); R(g, '#e8394a', 13, 11, 2, 2); R(g, '#ffd34d', 18, 14, 2, 2); R(g, '#ffd34d', 14, 17, 2, 2); R(g, '#fff', 15, 5, 2, 2); }
  else { R(g, '#2b2140', 10, 8, 12, 9); R(g, '#7fd1ff', 11, 9, 10, 7); R(g, '#555', 15, 17, 2, 2); R(g, '#d9dfe8', 10, 20, 12, 3); R(g, '#d6283a', 25, 10, 4, 4); }
  return c;
}
function tileCabinet() { const [c, g] = newCanvas(); R(g, '#8c9bb5', 3, 3, 26, 26); R(g, '#b3c0d6', 3, 3, 26, 3); R(g, '#a3b1c8', 5, 8, 22, 8); R(g, '#a3b1c8', 5, 18, 22, 8); R(g, '#2b2140', 14, 11, 4, 2); R(g, '#2b2140', 14, 21, 4, 2); R(g, '#fff', 6, 3, 8, 2); return c; }
function tileChair() { const [c, g] = newCanvas(); ellipse(g, '#2b2140', 16, 18, 10, 9); ellipse(g, '#3b5ba5', 16, 17, 8, 7); R(g, '#2b2140', 8, 7, 16, 5); R(g, '#3b5ba5', 9, 8, 14, 3); return c; }
function tileDocs() { const [c, g] = newCanvas(); R(g, '#f6f6f0', 6, 8, 11, 13); R(g, '#e1e1d2', 14, 14, 12, 12); R(g, '#9aa3b5', 8, 11, 7, 1); R(g, '#9aa3b5', 8, 14, 7, 1); R(g, '#9aa3b5', 16, 18, 8, 1); R(g, '#9aa3b5', 16, 21, 6, 1); return c; }
function tileCliff() { const [c, g] = newCanvas(); R(g, '#6f7a90', 0, 0, TILE, TILE); R(g, '#5b667c', 3, 10, 11, 9); R(g, '#5b667c', 18, 17, 11, 11); R(g, '#8e99ae', 16, 8, 12, 6); R(g, '#fff', 0, 0, TILE, 6); R(g, '#fff', 6, 6, 8, 3); R(g, '#3d4660', 0, 29, TILE, 3); return c; }
function tileIceBlock() { const [c, g] = newCanvas(); R(g, '#2f6fb3', 1, 1, 30, 30); R(g, '#bfe8ff', 2, 2, 28, 28); R(g, '#e6f6ff', 2, 2, 28, 5); R(g, '#6fb7e8', 2, 25, 28, 5); R(g, '#fff', 6, 9, 3, 12); R(g, '#fff', 12, 9, 2, 5); return c; }
function tileSummit() { const [c, g] = newCanvas(); R(g, '#d5ddea', 0, 0, TILE, TILE); R(g, '#b8c4d9', 0, 0, TILE, 1); R(g, '#b8c4d9', 0, 0, 1, TILE); R(g, '#fff', 8, 8, 2, 2); R(g, '#e6c36a', 15, 15, 2, 2); return c; }

// Sanie – punkt dostawy (kolor zmienia się, gdy są prezenty do dostarczenia)
function makeSleigh() {
  const [c, g] = newCanvas(); R(g, '#ffd34d', 2, 26, 28, 2); R(g, '#ffd34d', 2, 20, 2, 8); R(g, '#ffd34d', 28, 22, 2, 6);
  R(g, '#2f9e5a', 8, 8, 9, 9); R(g, '#ffd34d', 12, 8, 1, 9); R(g, '#2f80d6', 17, 11, 8, 6); R(g, '#fff', 20, 11, 2, 6);
  R(g, '#c8283a', 5, 16, 22, 9); R(g, '#8f1f2e', 7, 18, 18, 5); R(g, '#ffd34d', 5, 16, 22, 1); R(g, '#e8394a', 12, 6, 2, 3); R(g, '#e8394a', 10, 5, 6, 2);
  return c;
}
function makePaper() { const [c, g] = newCanvas(12, 14); R(g, '#2b2140', 0, 0, 12, 14); R(g, '#fff', 1, 1, 10, 12); R(g, '#9aa3b5', 2, 4, 8, 1); R(g, '#9aa3b5', 2, 7, 8, 1); R(g, '#d6283a', 2, 10, 5, 1); return c; }

// ---------- Boss: The Big Deadline (rysowany na siatce 32x32 i powiększany 3x do 96x96) ----------
function makeBoss(enraged) {
  const [c, g] = newCanvas(32, 32);
  const line = '#2b2140';
  R(g, line, 3, 11, 26, 19); R(g, '#f3f0e6', 4, 12, 24, 17);                   // stos dokumentów (korpus)
  for (let y = 14; y < 29; y += 3) R(g, '#d3cebb', 4, y, 24, 1);               // kartki
  R(g, '#e0dccb', 2, 14, 2, 12); R(g, '#e0dccb', 28, 13, 2, 13);               // wystające papiery
  R(g, line, 11, 14, 10, 12); R(g, '#ffffff', 12, 15, 8, 10); R(g, '#c8283a', 12, 15, 8, 1); R(g, '#c8283a', 12, 24, 8, 1); // zegar
  R(g, line, 16, 16, 1, 5); R(g, line, 16, 20, 4, 1);                          // wskazówki
  R(g, '#fff', 8, 6, 5, 4); R(g, '#fff', 19, 6, 5, 4); R(g, line, 10, 7, 2, 3); R(g, line, 21, 7, 2, 3); // oczy
  R(g, line, 7, 4, 6, 1); R(g, line, 19, 4, 6, 1); R(g, line, 12, 5, 1, 1); R(g, line, 19, 5, 1, 1);     // groźne brwi
  R(g, '#d6283a', 7, 2, 18, 3); R(g, '#d6283a', 10, 0, 12, 2); R(g, '#fff', 6, 4, 20, 2); R(g, '#fff', 21, 0, 4, 3); // czapka Mikołaja
  R(g, '#d6283a', 0, 17, 3, 4); R(g, '#d6283a', 29, 17, 3, 4);                 // łapy
  R(g, '#6b4226', 8, 29, 6, 3); R(g, '#6b4226', 18, 29, 6, 3);                 // nogi
  R(g, line, 12, 27, 8, 2); R(g, '#fff', 13, 27, 1, 1); R(g, '#fff', 15, 27, 1, 1); R(g, '#fff', 17, 27, 1, 1); R(g, '#fff', 19, 27, 1, 1); // zęby
  if (enraged) { g.globalCompositeOperation = 'source-atop'; R(g, 'rgba(255,40,40,.35)', 0, 0, 32, 32); g.globalCompositeOperation = 'source-over'; }
  const [big, bg] = newCanvas(96, 96); bg.imageSmoothingEnabled = false; bg.drawImage(c, 0, 0, 96, 96);
  return big;
}

// ---------- Wszystkie grafiki naraz (tworzone raz przy starcie) ----------
function createSprites() {
  const sp = (rows, colors) => spriteFromRows(rows, true, colors);
  const S = {
    ground: {
      forest:   { base: [1, 2, 3, 4].map(i => groundTile('#eaf4fb', '#d3e4f2', '#ffffff', i)), path: [5, 6].map(i => groundTile('#cdbfae', '#b3a28d', '#e0d4c3', i)) },
      office:   { base: [1, 2].map(officeFloor), path: [1, 2].map(carpet) },
      mountain: { base: [1, 2, 3, 4].map(i => groundTile('#dde8f4', '#c5d6ea', '#ffffff', i + 10)), path: [5, 6].map(i => groundTile('#b9c4d6', '#9fadc4', '#d3dbe8', i)) },
    },
    tiles: {
      tree: sp(TREE), xtree: sp(XTREE), rock: tileRock(), drift: tileDrift(), ice: tileIce(), wall: tileWall(), desk: tileDesk(false), xdesk: tileDesk(true),
      cabinet: tileCabinet(), chair: tileChair(), docs: tileDocs(), cliff: tileCliff(), iceblock: tileIceBlock(), summit: tileSummit(),
    },
    characters: {},
    enemies: {
      snowman: sp(SNOWMAN), frostman: sp(SNOWMAN, { w: '#d4ecff', e: '#ffd34d', k: '#5a1f7a' }),
      icelet: sp(ICELET), alpha: sp(ICELET, { i: '#ffd6ff', j: '#c26bd6', m: '#6a2a8a' }),
      bug: sp(BUG), deadline: sp(DEADLINE), deadlineX: sp(DEADLINE, { e: '#b3139a' }),
    },
    gifts: [{ e: '#d6283a' }, { e: '#2f80d6' }, { e: '#2f9e5a' }].map(col => sp(PRESENT, col)),
    heal: sp(GINGER), sleigh: makeSleigh(), paper: makePaper(), boss: makeBoss(false), bossEnraged: makeBoss(true),
  };
  // 11 postaci: front i back, każda w 3 klatkach chodu
  for (const ch of CHARACTERS) {
    const colors = { r: ch.hair, a: ch.hatColor || ch.coat, c: ch.coat, f: ch.scarf };
    S.characters[ch.id] = {
      front: [0, 1, 2].map(f => spriteFromRows(characterRows(ch, false, f), true, colors)),
      back:  [0, 1, 2].map(f => spriteFromRows(characterRows(ch, true, f), true, colors)),
    };
  }
  return S;
}

// Wspólne funkcje rysowania obiektów
function drawShadow(ctx, x, y, r) { ctx.fillStyle = 'rgba(80,110,150,0.35)'; ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.45, 0, 0, Math.PI * 2); ctx.fill(); }
function drawSprite(ctx, img, cx, cy, flip = false) {
  ctx.save(); ctx.translate(Math.round(cx), Math.round(cy));
  if (flip) ctx.scale(-1, 1);
  ctx.drawImage(img, -img.width / 2, -img.height / 2); // wycentrowany
  ctx.restore();
}

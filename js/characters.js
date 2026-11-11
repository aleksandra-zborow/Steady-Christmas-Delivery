// ============================================================
// characters.js – 11 bohaterów Steady. RÓŻNIĄ SIĘ WYŁĄCZNIE WYGLĄDEM.
// Statystyki (życie, prędkość, atak) są wspólne i leżą w CONFIG.player.
// hairStyle: shoulder (do ramion) | long (długie) | short (krótkie) | buzz | fringe (prosta grzywka) | bald
// ============================================================
const CHARACTERS = [
  { id: 'kasia',    name: 'Kasia',    hairStyle: 'shoulder', hair: '#f2d16b', hat: true,  hatColor: '#2f80d6', coat: '#2f80d6', scarf: '#e8394a' },
  { id: 'daria',    name: 'Daria',    hairStyle: 'long',     hair: '#8a5a33', hat: false,                      coat: '#e0782c', scarf: '#fff3d6' },
  { id: 'asia',     name: 'Asia',     hairStyle: 'shoulder', hair: '#1f1b26', hat: true,  hatColor: '#8a4fd0', coat: '#8a4fd0', scarf: '#ffd34d' },
  { id: 'aga-o',    name: 'Aga O.',   hairStyle: 'long',     hair: '#f2d16b', hat: true,  hatColor: '#1fa39a', coat: '#1fa39a', scarf: '#ffffff' },
  { id: 'ola',      name: 'Ola',      hairStyle: 'long',     hair: '#d9531e', hat: false,                      coat: '#d6283a', scarf: '#ffffff' },
  { id: 'bartek',   name: 'Bartek',   hairStyle: 'buzz',     hair: '#4a3426', hat: false,                      coat: '#2b3f8f', scarf: '#c9d3e6' },
  { id: 'martyn',   name: 'Martyn',   hairStyle: 'fringe',   hair: '#7a4a2a', hat: false,                      coat: '#d9a21f', scarf: '#6b4226' },
  { id: 'michaela', name: 'Michaela', hairStyle: 'long',     hair: '#5c3b22', hat: true,  hatColor: '#e0589a', coat: '#e0589a', scarf: '#ffffff' },
  { id: 'iza',      name: 'Iza',      hairStyle: 'long',     hair: '#f2d16b', hat: false,                      coat: '#58b8e8', scarf: '#e8394a' },
  { id: 'mateusz',  name: 'Mateusz',  hairStyle: 'bald',     hair: '#000000', hat: false, stubble: true,       coat: '#2f9e5a', scarf: '#ffd34d' },
  { id: 'aga-m',    name: 'Aga M.',   hairStyle: 'short',    hair: '#1f1b26', hat: false,                      coat: '#8f2438', scarf: '#dfe6f2' },
];

// Los efectos que el jugador graba con su voz.
// Los opcionales, si no se graban, se fabrican a partir de otro sonido
// con un filtro distinto (y si tampoco hay, pitidos tristes de emergencia).

export const SOUNDS = [
  {
    id: 'shoot',
    name: 'Disparo',
    required: true,
    hint: 'Tu nave dispara sin parar, así que algo cortito: "pew", "piu", "fiuu"…',
    vol: 0.5,
    voices: 2,
  },
  {
    id: 'enemyShoot',
    name: 'Disparo enemigo',
    required: true,
    hint: 'Los malos también disparan. Ponles voz de malo.',
    vol: 0.5,
    voices: 3,
  },
  {
    id: 'enemyDie',
    name: 'Muerte enemigo',
    required: true,
    hint: 'Un pato explota. ¿Cómo suena eso? Tú sabrás.',
    vol: 0.8,
    voices: 4,
  },
  {
    id: 'playerDie',
    name: 'Muerte propia',
    required: true,
    hint: 'Game over. Dramático. MUY dramático.',
    vol: 1,
    voices: 1,
  },
  {
    id: 'hurt',
    name: 'Te dan',
    required: false,
    hint: 'Pierdes una vida. Un "¡ay!" de toda la vida.',
    vol: 0.9,
    voices: 2,
    fallback: { from: 'playerDie', filter: 'ardilla' },
  },
  {
    id: 'powerup',
    name: 'Power-up',
    required: false,
    hint: 'Coges un calcetín mágico. Celébralo.',
    vol: 0.9,
    voices: 2,
    fallback: { from: 'shoot', filter: 'ardilla' },
  },
  {
    id: 'bossAppear',
    name: 'Llega el jefe',
    required: false,
    hint: 'Entra El Lunes. O tu abuela. Anúncialo como en la tele.',
    vol: 1,
    voices: 1,
    fallback: { from: 'enemyShoot', filter: 'gigante' },
  },
  {
    id: 'bossDie',
    name: 'Jefe derrotado',
    required: false,
    hint: 'Victoria épica. Grítalo (o no, que son las tantas).',
    vol: 1,
    voices: 1,
    fallback: { from: 'enemyDie', filter: 'gigante' },
  },
];

export const SOUND_BY_ID = Object.fromEntries(SOUNDS.map((s) => [s.id, s]));

export const FILTERS = [
  { id: 'normal', name: 'Normal' },
  { id: 'ardilla', name: 'Ardilla' },
  { id: 'gigante', name: 'Gigante' },
  { id: 'robot', name: 'Robot' },
  { id: 'eco', name: 'Eco' },
  { id: 'reves', name: 'Al revés' },
  { id: 'caos', name: 'Caos' },
];

export const MAX_TAKES = 3;
export const MAX_SECONDS = 2.5;

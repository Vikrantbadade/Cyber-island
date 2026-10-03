// World Data Registry for Escape Island
// Master World Size: 1671 x 941 pixels
import { WORLD_OBJECTS } from './worldObjects.js';

export const WORLD_DATA = {
  worldDimensions: {
    width: 1671,
    height: 941
  },

  playerStart: {
    x: 840,
    y: 780
  },

  buildings: WORLD_OBJECTS.buildings.map(b => ({
    ...b,
    key: b.asset // backward compatibility alias
  })),

  npcs: WORLD_OBJECTS.npcs.map(n => ({
    ...n,
    key: n.asset // backward compatibility alias
  })),

  treesAndDecor: [
    { x: 440, y: 590, key: 'tile-fence' },
    { x: 560, y: 540, key: 'tile-crate' },
    { x: 770, y: 770, key: 'tile-sign' },
    { x: 830, y: 600, key: 'tile-sign' }
  ]
};

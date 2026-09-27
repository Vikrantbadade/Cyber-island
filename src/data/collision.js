// Collision Data Registry for CyberIsland: The Last Signal
// Defines collision zones separately from visual layers (World size: 1671 x 941)

export const COLLISION_DATA = [
  // Outer Ocean Water Boundaries
  { id: 'ocean_north', x: 0, y: 0, width: 1671, height: 90, name: 'Ocean Boundary North' },
  { id: 'ocean_south', x: 0, y: 880, width: 1671, height: 61, name: 'Ocean Boundary South' },
  { id: 'ocean_west', x: 0, y: 0, width: 200, height: 941, name: 'Ocean Boundary West' },
  { id: 'ocean_east', x: 1610, y: 0, width: 61, height: 941, name: 'Ocean Boundary East' },

  // Water Inlets & Bays
  { id: 'water_sw', x: 200, y: 700, width: 280, height: 200, name: 'SW Coastal Water' },
  { id: 'water_se', x: 1360, y: 740, width: 270, height: 180, name: 'SE Coastal Water' },

  // Cliff & Ridge Obstacles
  { id: 'cliff_radio', x: 650, y: 280, width: 360, height: 24, name: 'Radio Tower Ridge' },
  { id: 'cliff_aegis', x: 1100, y: 270, width: 420, height: 24, name: 'Aegis High Cliff' },
  { id: 'cliff_village_west', x: 380, y: 440, width: 24, height: 180, name: 'West Ridge' },

  // Building & Structure Colliders (matching world.js)
  { id: 'col_boat', x: 750, y: 790, width: 64, height: 40, name: 'Broken Boat Collider' },
  { id: 'col_workshop', x: 460, y: 530, width: 80, height: 60, name: 'Workshop Collider' },
  { id: 'col_master', x: 1180, y: 570, width: 80, height: 60, name: "Master's Hut Collider" },
  { id: 'col_mira', x: 1010, y: 410, width: 80, height: 60, name: "Mira's Lab Collider" },
  { id: 'col_fountain', x: 800, y: 520, width: 60, height: 50, name: 'Fountain Collider' },
  { id: 'col_house1', x: 720, y: 480, width: 60, height: 50, name: 'House 1 Collider' },
  { id: 'col_house2', x: 880, y: 480, width: 60, height: 50, name: 'House 2 Collider' },
  { id: 'col_radio', x: 800, y: 200, width: 60, height: 80, name: 'Radio Tower Collider' },
  { id: 'col_aegis', x: 1230, y: 180, width: 100, height: 80, name: 'Aegis Facility Collider' }
];

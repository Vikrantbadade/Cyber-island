// Collision Data Registry for Escape Island
// Defines collision zones: outer ocean barriers, river chasm, and elevation rock faces (World size: 1671 x 941)

export const COLLISION_DATA = [
  // =========================================================================
  // 1. OUTER OCEAN WATER (Prevents player from walking off the island)
  // =========================================================================
  // --- North Ocean ---
  { id: 'ocean_north_deep', x: 0, y: 0, width: 1671, height: 75, name: 'North Ocean Deep' },
  { id: 'ocean_nw_shallows_1', x: 0, y: 75, width: 480, height: 50, name: 'NW Ocean Shallows 1' },
  { id: 'ocean_nw_shallows_2', x: 0, y: 125, width: 320, height: 45, name: 'NW Ocean Shallows 2' },
  { id: 'ocean_nw_shallows_3', x: 0, y: 170, width: 200, height: 45, name: 'NW Ocean Shallows 3' },
  { id: 'ocean_ne_shallows_1', x: 1240, y: 75, width: 431, height: 55, name: 'NE Ocean Shallows 1' },
  { id: 'ocean_ne_shallows_2', x: 1360, y: 130, width: 311, height: 50, name: 'NE Ocean Shallows 2' },

  // --- Map Edge Barriers ---
  { id: 'world_edge_west', x: 0, y: 0, width: 60, height: 941, name: 'World Boundary West' },
  { id: 'world_edge_east', x: 1611, y: 0, width: 60, height: 941, name: 'World Boundary East' },
  { id: 'world_edge_south', x: 0, y: 895, width: 1671, height: 46, name: 'World Boundary South' },

  // --- West Coast Water & Off-Shore Rocks ---
  { id: 'ocean_west_upper', x: 0, y: 215, width: 120, height: 160, name: 'West Ocean Upper' },
  { id: 'ocean_west_mid', x: 0, y: 375, width: 160, height: 190, name: 'West Ocean Mid' },
  { id: 'ocean_west_lower', x: 0, y: 565, width: 200, height: 170, name: 'West Ocean Lower' },
  { id: 'ocean_sw_deep', x: 0, y: 735, width: 400, height: 160, name: 'SW Ocean Deep' },
  { id: 'ocean_sw_beach_corner', x: 400, y: 815, width: 160, height: 85, name: 'SW Beach Water Corner' },

  // --- South Shore Beach Waterline (Sand is open, blocks ocean) ---
  { id: 'ocean_beach_west', x: 560, y: 845, width: 180, height: 55, name: 'South Beach Waterline West' },
  { id: 'ocean_beach_center', x: 740, y: 855, width: 230, height: 45, name: 'South Beach Waterline Center' },
  { id: 'ocean_beach_east', x: 970, y: 845, width: 200, height: 55, name: 'South Beach Waterline East' },
  { id: 'ocean_se_beach_corner', x: 1170, y: 805, width: 230, height: 95, name: 'SE Beach Water Corner' },

  // --- East Coast Water & Islet Sea ---
  { id: 'ocean_se_lower', x: 1410, y: 720, width: 261, height: 180, name: 'SE Ocean Lower' },
  { id: 'ocean_se_mid', x: 1460, y: 540, width: 211, height: 180, name: 'SE Ocean Mid' },
  // South of lighthouse crossing (crossing corridor is at y:365-415, OPEN!):
  { id: 'ocean_east_islet_south', x: 1460, y: 420, width: 211, height: 120, name: 'East Islet South Water' },
  // North of lighthouse crossing:
  { id: 'ocean_east_islet_north', x: 1430, y: 215, width: 241, height: 145, name: 'East Islet North Water' },

  // --- Waterfall & River (Bridge at y:120-165 is kept OPEN) ---
  { id: 'waterfall_drop', x: 695, y: 175, width: 60, height: 90, name: 'Waterfall Plunge Pool' },
  { id: 'river_bend_1', x: 710, y: 265, width: 55, height: 70, name: 'River Bend Upper' },
  { id: 'river_bend_2', x: 735, y: 325, width: 55, height: 50, name: 'River Bend Lower' },

  // =========================================================================
  // 2. ELEVATION ROCK FACES & CLIFFS (Prevents climbing vertical rock walls)
  // =========================================================================
  
  // --- South-West Ridge Cliffs ---
  { id: 'cliff_sw_face_1', x: 240, y: 580, width: 100, height: 70, name: 'SW Ridge Cliff 1' },
  { id: 'cliff_sw_face_2', x: 340, y: 600, width: 90, height: 70, name: 'SW Ridge Cliff 2' },
  { id: 'cliff_sw_face_3', x: 430, y: 620, width: 100, height: 65, name: 'SW Ridge Cliff 3' },
  { id: 'rocks_foot_sw', x: 270, y: 650, width: 70, height: 60, name: 'SW Sea Rocks Foot' },

  // --- South-East Ridge Cliffs ---
  { id: 'cliff_se_face_1', x: 1040, y: 715, width: 100, height: 70, name: 'SE Ridge Cliff 1' },
  { id: 'cliff_se_face_2', x: 1140, y: 725, width: 100, height: 75, name: 'SE Ridge Cliff 2' },
  { id: 'cliff_se_face_3', x: 1240, y: 740, width: 100, height: 75, name: 'SE Ridge Cliff 3' },
  { id: 'cliff_se_face_4', x: 1340, y: 735, width: 80, height: 75, name: 'SE Ridge Cliff 4' },

  // --- Top-Left Plateau Rock Walls (Road up diagonal slope & bridge are OPEN) ---
  { id: 'cliff_tl_left_1', x: 220, y: 310, width: 100, height: 75, name: 'Top-Left West Cliff 1' },
  { id: 'cliff_tl_left_2', x: 320, y: 320, width: 90, height: 75, name: 'Top-Left West Cliff 2' },
  { id: 'cliff_tl_right_1', x: 540, y: 265, width: 130, height: 65, name: 'Top-Left East Cliff Face' },
  { id: 'waterfall_wall_w', x: 670, y: 175, width: 25, height: 85, name: 'Waterfall West Wall' },

  // --- Top-Right High Plateau Rock Walls (Stairs and upper road are OPEN) ---
  { id: 'waterfall_wall_e', x: 755, y: 185, width: 25, height: 85, name: 'Waterfall East Wall' },
  { id: 'cliff_tr_w_stairs', x: 780, y: 220, width: 95, height: 50, name: 'Cliff West of Stairs' },

  // *** NOTE: Wooden Stairs at x:885-925, y:215-275 are OPEN to climb ***

  { id: 'cliff_tr_e_stairs_1', x: 935, y: 220, width: 80, height: 50, name: 'Cliff East of Stairs 1' },
  { id: 'cliff_tr_e_stairs_2', x: 1015, y: 230, width: 80, height: 50, name: 'Cliff East of Stairs 2' },
  { id: 'cliff_tr_e_stairs_3', x: 1095, y: 240, width: 80, height: 50, name: 'Cliff East of Stairs 3' },
  { id: 'cliff_tr_e_stairs_4', x: 1175, y: 255, width: 80, height: 50, name: 'High Plateau South Cliff 1' },
  { id: 'cliff_tr_e_stairs_5', x: 1255, y: 265, width: 80, height: 50, name: 'High Plateau South Cliff 2' },

  // High Plateau eastern drops:
  { id: 'cliff_tr_drop_1', x: 1250, y: 355, width: 80, height: 55, name: 'High Plateau Drop 1' },
  { id: 'cliff_tr_drop_2', x: 1330, y: 360, width: 75, height: 55, name: 'High Plateau Drop 2' }
];

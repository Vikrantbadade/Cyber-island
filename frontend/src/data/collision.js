// Collision Data Registry for Escape Island (World size: 1671 x 941, matches CyberIsland_Base.png 1:1)
//
// Every zone is an axis-aligned rectangle { x, y, width, height } in world pixels (top-left origin).
// Zones TILE: neighbouring rectangles share an edge but do not overlap (edge-to-edge only).
//
// Rules this file implements:
//   * The sea is blocked all the way round the island (no walking on surf or off the map).
//   * Waterfall, plunge pool, inlet and river are blocked. The wooden bridge deck (y ~127-157) and the
//     wooden stairs (x ~888-930, y ~207-262) are deliberately left open.
//   * Mountains, cliff faces and big rock masses are blocked.
//
// Provenance:
//   * 'custom_*' = hitboxes drawn in the in-game editor (F4). Same coordinates as drawn, except custom_18, which
//     was cut back to the land part of the coast (x 1420-1490); everything east of it is sea and is already
//     covered by the sea strips, so what is blocked is unchanged.
//   * Everything else was read off the base image / F3 screenshots (+-15px). Least certain: east and
//     south-east coast, south-east cliffs, west coast cliff.
//
// Known gaps (deliberate):
//   * The tall rock wall inside the NE plateau (about x 1090-1150, y 40-230) is NOT blocked, because it is
//     unclear where the road to the Aegis bunker / radio tower passes it.
//   * The east islet with the lighthouse is sea-blocked and therefore not reachable on foot.
//   * Small boulders on the beach and the tree-covered grass patch near (960-1110, 725-790) are walkable.

export const COLLISION_DATA = [
  // =========================================================================
  // 1. SEA: NORTH AND NORTH-WEST (land begins to the right of / below each strip)
  // =========================================================================
  { id: 'sea_top_nw', x: 0, y: 0, width: 705, height: 50, name: 'North Sea (NW)' },
  { id: 'sea_nw_1', x: 0, y: 50, width: 540, height: 45, name: 'NW Coast 1' },
  { id: 'sea_nw_2', x: 0, y: 95, width: 500, height: 55, name: 'NW Coast 2 (incl. coast rock)' },
  { id: 'sea_nw_3', x: 0, y: 150, width: 335, height: 30, name: 'NW Coast 3 (incl. rocks)' },
  { id: 'sea_nw_4', x: 0, y: 180, width: 245, height: 25, name: 'NW Coast 4' },

  // =========================================================================
  // 2. SEA: WEST AND SOUTH-WEST
  // =========================================================================
  { id: 'sea_w_north', x: 0, y: 205, width: 120, height: 175, name: 'West Sea + Rocks North' },
  { id: 'sea_w_1', x: 0, y: 380, width: 170, height: 120, name: 'West Sea 1' },
  { id: 'sea_w_2', x: 0, y: 500, width: 190, height: 65, name: 'West Sea 2' },
  { id: 'sea_w_3', x: 0, y: 565, width: 200, height: 80, name: 'West Sea 3' },
  { id: 'sea_sw_rocks', x: 0, y: 645, width: 270, height: 100, name: 'SW Sea + Off-shore Rocks' },
  { id: 'sea_sw_mid', x: 270, y: 710, width: 130, height: 35, name: 'SW Sea Mid' },
  { id: 'sea_sw_deep', x: 0, y: 745, width: 400, height: 196, name: 'SW Sea Deep' },
  { id: 'sea_beach_sw_corner', x: 400, y: 815, width: 160, height: 126, name: 'SW Beach Water Corner' },

  // =========================================================================
  // 3. SEA: SOUTH BEACH WATERLINE (sand stays open)
  // =========================================================================
  { id: 'sea_beach_west', x: 560, y: 845, width: 180, height: 96, name: 'South Beach Waterline West' },
  { id: 'sea_beach_center', x: 740, y: 855, width: 230, height: 86, name: 'South Beach Waterline Center' },
  { id: 'sea_beach_east', x: 970, y: 845, width: 200, height: 96, name: 'South Beach Waterline East' },
  { id: 'sea_beach_se', x: 1170, y: 805, width: 230, height: 136, name: 'SE Beach Water Corner' },

  // =========================================================================
  // 4. SEA: SOUTH-EAST AND EAST COAST
  // =========================================================================
  { id: 'sea_se_2', x: 1400, y: 775, width: 50, height: 166, name: 'SE Sea 2' },
  { id: 'sea_se_1', x: 1450, y: 745, width: 221, height: 196, name: 'SE Sea 1' },
  { id: 'sea_e_5', x: 1520, y: 700, width: 151, height: 45, name: 'East Sea 5 (rocks)' },
  { id: 'sea_e_4', x: 1560, y: 645, width: 111, height: 55, name: 'East Sea 4' },
  { id: 'sea_e_3', x: 1500, y: 540, width: 171, height: 105, name: 'East Sea 3 (incl. rocks)' },
  { id: 'sea_e_2', x: 1475, y: 470, width: 196, height: 70, name: 'East Sea 2' },
  { id: 'sea_e_1', x: 1445, y: 265, width: 226, height: 205, name: 'East Sea 1 (channel + lighthouse islet)' },

  // =========================================================================
  // 5. SEA: NORTH-EAST (top edge of the NE plateau, then the diagonal coast)
  // =========================================================================
  { id: 'inlet_north', x: 705, y: 0, width: 85, height: 125, name: 'River Inlet North of Bridge' },
  { id: 'sea_ne_1', x: 790, y: 0, width: 65, height: 80, name: 'NE Top 1' },
  { id: 'sea_ne_2', x: 855, y: 0, width: 50, height: 60, name: 'NE Top 2' },
  { id: 'sea_ne_3', x: 905, y: 0, width: 50, height: 40, name: 'NE Top 3' },
  { id: 'sea_ne_4', x: 955, y: 0, width: 145, height: 15, name: 'NE Top 4' },
  { id: 'rock_ne_north', x: 1100, y: 0, width: 55, height: 95, name: 'North Coast Rock Pillars' },
  { id: 'sea_ne_5', x: 1155, y: 0, width: 50, height: 35, name: 'NE Top 5' },
  { id: 'sea_ne_6', x: 1205, y: 0, width: 50, height: 25, name: 'NE Top 6' },
  { id: 'sea_ne_7', x: 1255, y: 0, width: 50, height: 40, name: 'NE Top 7' },
  { id: 'sea_ne_8', x: 1305, y: 0, width: 50, height: 60, name: 'NE Top 8' },
  { id: 'sea_ne_9', x: 1355, y: 0, width: 50, height: 80, name: 'NE Top 9' },
  { id: 'sea_ne_10', x: 1405, y: 0, width: 266, height: 105, name: 'NE Top 10' },
  { id: 'sea_ne_11', x: 1445, y: 105, width: 226, height: 30, name: 'NE Coast 1' },
  { id: 'sea_ne_12', x: 1470, y: 135, width: 201, height: 30, name: 'NE Coast 2' },
  { id: 'sea_ne_13', x: 1490, y: 165, width: 181, height: 35, name: 'NE Coast 3' },
  { id: 'sea_ne_14', x: 1490, y: 200, width: 181, height: 25, name: 'NE Coast 4' },
  { id: 'sea_ne_15', x: 1520, y: 225, width: 151, height: 40, name: 'NE Coast 5' },

  // =========================================================================
  // 6. WATERFALL AND RIVER
  //    The falls are one box between the two rock walls, down to the end of the plunge pool. Below that the
  //    river runs diagonally to the SE, so it is covered with 15px-high slabs that follow it, instead of a few
  //    big boxes with dead space. The bridge deck (y ~127-157) stays open.
  // =========================================================================
  { id: 'waterfall_west_wall', x: 685, y: 160, width: 25, height: 110, name: 'Waterfall West Rock Wall' },
  { id: 'waterfall', x: 710, y: 160, width: 80, height: 120, name: 'Waterfall + Plunge Pool' },
  { id: 'waterfall_east_wall', x: 790, y: 165, width: 40, height: 130, name: 'Waterfall East Rock Wall' },
  { id: 'river_1', x: 715, y: 280, width: 75, height: 15, name: 'River 1' },
  { id: 'river_2', x: 715, y: 295, width: 100, height: 15, name: 'River 2' },
  { id: 'river_3', x: 730, y: 310, width: 115, height: 15, name: 'River 3' },
  { id: 'river_4', x: 760, y: 325, width: 115, height: 15, name: 'River 4' },
  { id: 'river_5', x: 790, y: 340, width: 110, height: 15, name: 'River 5' },
  { id: 'river_6', x: 825, y: 355, width: 100, height: 15, name: 'River 6' },
  { id: 'river_7', x: 855, y: 370, width: 80, height: 15, name: 'River 7' },
  { id: 'river_8', x: 880, y: 385, width: 60, height: 15, name: 'River 8 (end of river)' },

  // =========================================================================
  // 7. NW PLATEAU: ROCKS AND CLIFF FACES
  // =========================================================================
  // West rock mass and the cliff wall that steps up towards the road (your editor boxes):
  { id: 'custom_14', x: 120, y: 215, width: 80, height: 120, name: 'Custom 14' },
  { id: 'custom_13', x: 120, y: 335, width: 100, height: 40, name: 'Custom 13' },
  // Continues the wall between your boxes 13 and 4:
  { id: 'cliff_nw_wall_2', x: 220, y: 310, width: 105, height: 65, name: 'NW Plateau South Wall 2' },
  { id: 'custom_4', x: 325, y: 295, width: 95, height: 45, name: 'Custom 4' },
  { id: 'custom_1', x: 375, y: 260, width: 95, height: 35, name: 'Custom 1' },
  // Cliff face below the upper plateau, west of the waterfall (your editor boxes):
  { id: 'custom_12', x: 525, y: 225, width: 25, height: 30, name: 'Custom 12' },
  { id: 'custom_11', x: 550, y: 195, width: 70, height: 70, name: 'Custom 11' },
  { id: 'custom_9', x: 620, y: 160, width: 65, height: 105, name: 'Custom 9' },

  // =========================================================================
  // 8. WEST COAST CLIFF AND SOUTH-WEST RIDGE
  // =========================================================================
  { id: 'cliff_w_coast', x: 210, y: 375, width: 70, height: 205, name: 'West Coast Cliff' },
  { id: 'cliff_sw_1', x: 240, y: 580, width: 100, height: 70, name: 'SW Ridge Cliff 1' },
  { id: 'cliff_sw_2', x: 340, y: 600, width: 90, height: 70, name: 'SW Ridge Cliff 2' },
  { id: 'cliff_sw_3', x: 430, y: 620, width: 100, height: 65, name: 'SW Ridge Cliff 3' },
  { id: 'rocks_foot_sw', x: 270, y: 650, width: 70, height: 60, name: 'SW Rocks Foot' },
  { id: 'beach_boulders_w', x: 500, y: 685, width: 110, height: 65, name: 'West Beach Boulder Cluster' },
  { id: 'cliff_sw_4', x: 610, y: 640, width: 135, height: 60, name: 'Village SW Cliff' },

  // =========================================================================
  // 9. NE PLATEAU SOUTH CLIFF BAND (stairs at x ~888-930 stay open)
  // =========================================================================
  { id: 'cliff_ne_2', x: 830, y: 190, width: 30, height: 80, name: 'Cliff East of Waterfall 2' },
  { id: 'cliff_ne_3', x: 860, y: 215, width: 28, height: 55, name: 'Cliff West of Stairs' },
  // *** opening for the wooden stairs: x 888-930 ***
  { id: 'cliff_ne_4', x: 930, y: 220, width: 85, height: 50, name: 'Cliff East of Stairs 1' },
  { id: 'cliff_ne_5', x: 1015, y: 230, width: 80, height: 50, name: 'Cliff East of Stairs 2' },
  { id: 'cliff_ne_6', x: 1095, y: 240, width: 80, height: 50, name: 'Cliff East of Stairs 3' },
  { id: 'cliff_ne_7', x: 1175, y: 255, width: 80, height: 50, name: 'NE Plateau South Cliff 1' },
  { id: 'cliff_ne_8', x: 1255, y: 265, width: 80, height: 50, name: 'NE Plateau South Cliff 2' },
  // NE corner cliff band (your editor boxes; custom_18 trimmed to the land part, see header):
  { id: 'custom_16', x: 1335, y: 265, width: 95, height: 50, name: 'Custom 16' },
  { id: 'custom_17', x: 1375, y: 215, width: 55, height: 50, name: 'Custom 17' },
  { id: 'custom_18', x: 1420, y: 180, width: 70, height: 35, name: 'Custom 18' },
  { id: 'custom_1', x: 1430, y: 215, width: 85, height: 100, name: 'Custom 1' },
  // =========================================================================
  // 10. EAST AND SOUTH-EAST CLIFFS (estimated)
  // =========================================================================
  { id: 'cliff_e_drop', x: 1310, y: 400, width: 165, height: 70, name: 'East Plateau Drop' },
  { id: 'cliff_se_1', x: 1085, y: 665, width: 80, height: 70, name: 'SE Plateau Wall 1' },
  { id: 'cliff_se_2', x: 1165, y: 680, width: 80, height: 60, name: 'SE Plateau Wall 2' },
  { id: 'rocks_se_mass', x: 1285, y: 690, width: 100, height: 115, name: 'SE Rock Mass' },
  { id: 'cliff_se_4', x: 1385, y: 690, width: 115, height: 45, name: 'SE Plateau Wall 4' }
];

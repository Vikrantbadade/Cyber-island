import cv2
import numpy as np
import os
from PIL import Image

# 1. Load original pristine base map
src_path = 'public/assets/world/CyberIsland_Base.original.png'
dest_path = 'public/assets/world/CyberIsland_Base.png'

img = cv2.imread(src_path)
work_img = img.copy()

# List of precise operations for all structures where trees overlap
# (name, crop_box (x1, y1, x2, y2), tree_zone (rel_x1, rel_y1, rel_x2, rel_y2))
operations = [
    # Island Workshop (x=500, y=560)
    {
        'id': 'workshop',
        'crop': (420, 440, 580, 580),
        'tree_zone': (30, 15, 130, 125)
    },
    # Village House 3 (x=650, y=510)
    {
        'id': 'house3',
        'crop': (580, 390, 720, 540),
        'tree_zone': (25, 15, 115, 125)
    },
    # Village House 1 (x=750, y=510)
    {
        'id': 'house1',
        'crop': (680, 400, 820, 540),
        'tree_zone': (20, 15, 120, 125)
    },
    # Village House 2 (x=910, y=510)
    {
        'id': 'house2',
        'crop': (840, 390, 980, 540),
        'tree_zone': (20, 15, 125, 135)
    },
    # Dr. Mira's Lab (x=1050, y=440)
    {
        'id': 'mira_lab',
        'crop': (970, 300, 1130, 470),
        'tree_zone': (20, 20, 140, 150)
    },
    # Master's House (x=1220, y=600)
    {
        'id': 'master_hut',
        'crop': (1140, 460, 1300, 630),
        'tree_zone': (25, 25, 130, 128)
    },
    # Old Aegis Bunker (x=1260, y=150) & Radio Tower (x=1330, y=200)
    {
        'id': 'aegis_bunker',
        'crop': (1190, 15, 1380, 215),
        'tree_zone': (20, 20, 125, 125) # Bunker tree
    },
    {
        'id': 'radio_tower',
        'crop': (1190, 15, 1380, 215),
        'tree_zone': (105, 110, 175, 180) # Tower legs overlap
    },
    # Island Routing Hub (x=1400, y=620)
    {
        'id': 'network_hub',
        'crop': (1330, 470, 1470, 640),
        'tree_zone': (20, 15, 120, 150)
    },
    # Coastal Lighthouse (x=1550, y=380)
    {
        'id': 'lighthouse',
        'crop': (1480, 260, 1610, 390),
        'tree_zone': (35, 15, 125, 105)
    }
]

for op in operations:
    x1, y1, x2, y2 = op['crop']
    crop = work_img[y1:y2, x1:x2].copy()
    hsv = cv2.cvtColor(crop, cv2.COLOR_BGR2HSV)
    h, s, v = cv2.split(hsv)
    
    zx1, zy1, zx2, zy2 = op['tree_zone']
    zone = np.zeros_like(v, dtype=bool)
    zone[zy1:zy2, zx1:zx2] = True
    
    # Segment tree pixels inside the zone
    is_tree = zone & ((v < 125) | (h > 50) | ((h < 26) & (v < 145)))
    tree_mask = (is_tree.astype(np.uint8)) * 255
    tree_mask = cv2.morphologyEx(tree_mask, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7)))
    tree_mask = cv2.dilate(tree_mask, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3)))
    
    inpainted = cv2.inpaint(crop, tree_mask, 5, cv2.INPAINT_TELEA)
    work_img[y1:y2, x1:x2] = inpainted
    print(f"Cleaned trees at: {op['id']}")

# Save modified base map to public/assets/world/CyberIsland_Base.png
cv2.imwrite(dest_path, work_img)
print(f"Successfully updated {dest_path}!")

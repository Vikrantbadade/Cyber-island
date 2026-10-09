import cv2
import numpy as np
from PIL import Image
import os

img = cv2.imread('public/assets/world/CyberIsland_Base.original.png')
synth = cv2.imread('scripts/test_inpaint/pure_synth_grass.png')

os.makedirs('scripts/results_check', exist_ok=True)

tree_specs = [
    {
        'name': 'workshop',
        'bounds': (430, 440, 565, 570),
        'center': (498, 502),
        'foliage_r': (48, 42),
        'trunk': (0, 38, 26, 20),
        'surround': (400, 480, 445, 550),
    },
    {
        'name': 'house3',
        'bounds': (590, 390, 710, 530),
        'center': (648, 460),
        'foliage_r': (46, 42),
        'trunk': (0, 35, 24, 18),
        'surround': (580, 520, 630, 570),
    },
    {
        'name': 'house1',
        'bounds': (690, 400, 810, 535),
        'center': (750, 475),
        'foliage_r': (45, 42),
        'trunk': (0, 36, 22, 18),
        'surround': (760, 540, 810, 590),
    },
    {
        'name': 'house2',
        'bounds': (850, 390, 975, 535),
        'center': (912, 465),
        'foliage_r': (48, 44),
        'trunk': (0, 38, 25, 20),
        'surround': (930, 535, 980, 580),
    },
    {
        'name': 'mira_lab',
        'bounds': (980, 310, 1115, 455),
        'center': (1048, 385),
        'foliage_r': (52, 48),
        'trunk': (0, 40, 26, 20),
        'surround': (950, 440, 995, 490),
    },
    {
        'name': 'master_hut_main',
        'bounds': (1150, 470, 1270, 600),
        'center': (1210, 538),
        'foliage_r': (46, 42),
        'trunk': (0, 35, 24, 18),
        'surround': (1110, 550, 1150, 600),
    },
    {
        'name': 'master_hut_right',
        'bounds': (1200, 510, 1300, 625),
        'center': (1252, 572),
        'foliage_r': (38, 36),
        'trunk': (0, 30, 20, 16),
        'surround': (1180, 610, 1240, 650),
    },
    {
        'name': 'aegis_main',
        'bounds': (1200, 20, 1315, 145),
        'center': (1258, 80),
        'foliage_r': (46, 42),
        'trunk': (0, 35, 24, 18),
        'surround': (1220, 130, 1270, 170),
    },
    {
        'name': 'aegis_right',
        'bounds': (1260, 45, 1360, 165),
        'center': (1308, 105),
        'foliage_r': (42, 38),
        'trunk': (0, 32, 22, 16),
        'surround': (1250, 140, 1300, 180),
    },
    {
        'name': 'radio_tower_tree',
        'bounds': (1300, 110, 1395, 220),
        'center': (1348, 165),
        'foliage_r': (40, 36),
        'trunk': (0, 30, 22, 16),
        'surround': (1280, 160, 1320, 210),
    },
    {
        'name': 'network_hub_tree',
        'bounds': (1340, 475, 1455, 605),
        'center': (1392, 540),
        'foliage_r': (48, 44),
        'trunk': (0, 36, 24, 18),
        'surround': (1310, 590, 1355, 640),
    },
    {
        'name': 'lighthouse_tree',
        'bounds': (1485, 260, 1605, 385),
        'center': (1545, 328),
        'foliage_r': (46, 42),
        'trunk': (0, 36, 24, 18),
        'surround': (1510, 340, 1560, 380),
    },
]

work_img = img.copy()

for spec in tree_specs:
    x1, y1, x2, y2 = spec['bounds']
    cx, cy = spec['center']
    rx, ry = spec['foliage_r']
    tdx, tdy, trx, try_ = spec['trunk']
    sx1, sy1, sx2, sy2 = spec['surround']
    
    crop = work_img[y1:y2, x1:x2].copy()
    cw, ch = x2 - x1, y2 - y1
    
    # 1. Detect tree pixels in this crop
    hsv = cv2.cvtColor(crop, cv2.COLOR_BGR2HSV)
    h, s, v = cv2.split(hsv)
    
    # Tree features: dark values (v < 125) or deep greens (h > 55) or brown trunks (h < 30 & v < 150)
    is_tree_raw = (v < 125) | (h > 55) | ((h < 30) & (v < 150))
    
    # Restrict to tree zone (ellipse + trunk)
    zone_mask = np.zeros((ch, cw), dtype=np.uint8)
    cv2.ellipse(zone_mask, (cx - x1, cy - y1), (rx + 4, ry + 4), 0, 0, 360, 255, -1)
    cv2.ellipse(zone_mask, (cx - x1 + tdx, cy - y1 + tdy), (trx + 4, try_ + 4), 0, 0, 360, 255, -1)
    
    is_tree = is_tree_raw & (zone_mask > 0)
    raw_tree_mask = (is_tree.astype(np.uint8)) * 255
    
    # Morphological close to fill gaps inside the tree
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9))
    tree_mask = cv2.morphologyEx(raw_tree_mask, cv2.MORPH_CLOSE, kernel)
    
    # Combine with inner core of zone mask to ensure 100% of tree core is replaced
    inner_core = np.zeros((ch, cw), dtype=np.uint8)
    cv2.ellipse(inner_core, (cx - x1, cy - y1), (rx - 8, ry - 8), 0, 0, 360, 255, -1)
    cv2.ellipse(inner_core, (cx - x1 + tdx, cy - y1 + tdy), (trx - 4, try_ - 4), 0, 0, 360, 255, -1)
    tree_mask = np.maximum(tree_mask, inner_core)
    
    # Dilate 4 pixels for antialiasing coverage
    tree_mask = cv2.dilate(tree_mask, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7)))
    # Clip to zone mask bounds so it doesn't leak into unrelated areas
    tree_mask = np.minimum(tree_mask, zone_mask)
    
    # 2. Color-match synth grass to the local surrounding grass
    surround = work_img[sy1:sy2, sx1:sx2].astype(np.float32)
    s_mean, s_std = surround.mean(axis=(0,1)), surround.std(axis=(0,1))
    
    synth_crop = cv2.resize(synth, (cw, ch), interpolation=cv2.INTER_LINEAR)
    p_mean, p_std = synth_crop.mean(axis=(0,1)), synth_crop.std(axis=(0,1))
    synth_norm = (synth_crop.astype(np.float32) - p_mean) / (p_std + 1e-5)
    synth_matched = np.clip(synth_norm * s_std + s_mean, 0, 255).astype(np.uint8)
    
    # 3. Feathered mask
    inner_solid = cv2.erode(tree_mask, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7)))
    feathered = cv2.GaussianBlur(tree_mask.astype(np.float32) / 255.0, (9, 9), 2.5)
    mask_final = np.maximum(inner_solid.astype(np.float32) / 255.0, feathered)
    mask_3ch = np.dstack([mask_final, mask_final, mask_final])
    
    # Blend
    blended_crop = (synth_matched.astype(np.float32) * mask_3ch + crop.astype(np.float32) * (1.0 - mask_3ch)).astype(np.uint8)
    work_img[y1:y2, x1:x2] = blended_crop
    
    # 4. Inpaint boundary seam (radius 2)
    seam = (tree_mask > 0) & (inner_solid == 0)
    seam_full = np.zeros(work_img.shape[:2], dtype=np.uint8)
    seam_full[y1:y2, x1:x2] = seam.astype(np.uint8) * 255
    work_img = cv2.inpaint(work_img, seam_full, 2, cv2.INPAINT_TELEA)
    
    print(f"Processed tree: {spec['name']}")

# Save edited base map
cv2.imwrite('scripts/CyberIsland_Base_edited.png', work_img)
print("Saved scripts/CyberIsland_Base_edited.png successfully!")

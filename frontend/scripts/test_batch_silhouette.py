import cv2
import numpy as np
from PIL import Image
import os

img = cv2.imread('public/assets/world/CyberIsland_Base.original.png')

tests = [
    {
        'id': 'house1',
        'crop': (680, 400, 820, 540),
        'tree_zone': (20, 15, 120, 125),
        'bld': ('village_House_1_-removebg-preview.png', 750, 510, 0.25)
    },
    {
        'id': 'house2',
        'crop': (840, 390, 980, 540),
        'tree_zone': (20, 15, 125, 135),
        'bld': ('village_House_2_-removebg-preview.png', 910, 510, 0.25)
    },
    {
        'id': 'house3',
        'crop': (580, 390, 720, 540),
        'tree_zone': (25, 15, 115, 125),
        'bld': ('village_House_3_-removebg-preview.png', 650, 510, 0.25)
    },
    {
        'id': 'mira_lab',
        'crop': (970, 300, 1130, 470),
        'tree_zone': (20, 20, 140, 150),
        'bld': ('min_s_lab-removebg-preview.png', 1050, 440, 0.30)
    },
    {
        'id': 'master_hut',
        'crop': (1140, 460, 1300, 630),
        'tree_zone': (20, 15, 140, 155),
        'bld': ('master_house.png', 1220, 600, 0.30)
    },
    {
        'id': 'network_hub',
        'crop': (1330, 470, 1470, 640),
        'tree_zone': (20, 15, 120, 150),
        'bld': ('NetworkHub-removebg-preview.png', 1400, 620, 0.30)
    },
    {
        'id': 'workshop',
        'crop': (420, 440, 580, 580),
        'tree_zone': (30, 15, 130, 125),
        'bld': ('Workshop-removebg-preview.png', 500, 560, 0.25)
    }
]

for t in tests:
    x1, y1, x2, y2 = t['crop']
    crop = img[y1:y2, x1:x2].copy()
    hsv = cv2.cvtColor(crop, cv2.COLOR_BGR2HSV)
    h, s, v = cv2.split(hsv)
    
    zx1, zy1, zx2, zy2 = t['tree_zone']
    zone = np.zeros_like(v, dtype=bool)
    zone[zy1:zy2, zx1:zx2] = True
    
    is_tree = zone & ((v < 125) | (h > 50) | ((h < 26) & (v < 145)))
    tree_mask = (is_tree.astype(np.uint8)) * 255
    tree_mask = cv2.morphologyEx(tree_mask, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7)))
    tree_mask = cv2.dilate(tree_mask, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3)))
    
    inpainted = cv2.inpaint(crop, tree_mask, 5, cv2.INPAINT_TELEA)
    
    bname, bx, by, bscale = t['bld']
    bld_sprite = Image.open(os.path.join('public/assets/world', bname))
    sw, sh = int(round(bld_sprite.width * bscale)), int(round(bld_sprite.height * bscale))
    bld_res = bld_sprite.resize((sw, sh), Image.LANCZOS)
    
    inpaint_pil = Image.fromarray(cv2.cvtColor(inpainted, cv2.COLOR_BGR2RGB))
    rel_x = bx - x1
    rel_y = by - y1
    inpaint_pil.paste(bld_res, (int(round(rel_x - sw / 2)), int(round(rel_y - sh))), bld_res)
    
    tid = t['id']
    cv2.imwrite(f'scripts/test_inpaint/{tid}_sil_clean.png', inpainted)
    inpaint_pil.save(f'scripts/test_inpaint/{tid}_sil_with_bld.png')
    print(f'Done {tid}')

print('Batch testing complete!')

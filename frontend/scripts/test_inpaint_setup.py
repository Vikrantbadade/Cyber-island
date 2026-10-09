import cv2
import numpy as np
import os
from PIL import Image

base = cv2.imread('public/assets/world/CyberIsland_Base.original.png')
h_img, w_img = base.shape[:2]

# Let's write an interactive/visual mask generator for the trees in each region
# We will create masks for the tree foliage, trunk, and shadow.
os.makedirs('scripts/test_inpaint', exist_ok=True)

# For each region, we will crop, segment trees, and inpaint
# Let's inspect each crop in test_inpaint
regions = [
    ('workshop', 450, 455, 545, 565),
    ('house3', 605, 405, 695, 515),
    ('house1', 705, 415, 795, 515),
    ('house2', 860, 405, 960, 520),
    ('mira_lab', 995, 320, 1105, 445),
    ('master_hut', 1160, 470, 1290, 605),
    ('aegis_radio', 1200, 20, 1375, 205),
    ('network_hub', 1350, 480, 1455, 625),
    ('lighthouse', 1490, 260, 1610, 380),
]

for name, x1, y1, x2, y2 in regions:
    crop = base[y1:y2, x1:x2].copy()
    cv2.imwrite(f'scripts/test_inpaint/{name}_crop.png', crop)

print('Saved raw crops to scripts/test_inpaint/')

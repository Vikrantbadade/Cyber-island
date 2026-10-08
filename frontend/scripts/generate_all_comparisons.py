import os
import cv2
import numpy as np
from PIL import Image

# Load original and edited maps
orig = Image.open('public/assets/world/CyberIsland_Base.original.png').convert('RGB')
edit = Image.open('scripts/CyberIsland_Base_edited.png').convert('RGB')

# Buildings data
buildings = [
    {
        'id': 'workshop',
        'name': 'Island Workshop',
        'asset': 'Workshop-removebg-preview.png',
        'x': 500, 'y': 560, 'scale': 0.25,
        'crop': (420, 440, 580, 580)
    },
    {
        'id': 'house3',
        'name': 'Village House 3',
        'asset': 'village_House_3_-removebg-preview.png',
        'x': 650, 'y': 510, 'scale': 0.25,
        'crop': (580, 390, 720, 530)
    },
    {
        'id': 'house1',
        'name': 'Village House 1',
        'asset': 'village_House_1_-removebg-preview.png',
        'x': 750, 'y': 510, 'scale': 0.25,
        'crop': (680, 400, 820, 530)
    },
    {
        'id': 'house2',
        'name': 'Village House 2',
        'asset': 'village_House_2_-removebg-preview.png',
        'x': 910, 'y': 510, 'scale': 0.25,
        'crop': (840, 390, 980, 530)
    },
    {
        'id': 'mira_lab',
        'name': "Dr. Mira's Lab",
        'asset': 'min_s_lab-removebg-preview.png',
        'x': 1050, 'y': 440, 'scale': 0.30,
        'crop': (970, 300, 1130, 460)
    },
    {
        'id': 'master_hut',
        'name': "Master's House",
        'asset': 'master_house.png',
        'x': 1220, 'y': 600, 'scale': 0.30,
        'crop': (1140, 460, 1300, 620)
    },
    {
        'id': 'aegis_and_radio',
        'name': 'Old Aegis Bunker & Radio Tower',
        'assets': [
            ('Aegi_Facility-removebg-preview.png', 1260, 150, 0.30),
            ('RadioTower-removebg-preview.png', 1330, 200, 0.30)
        ],
        'crop': (1190, 10, 1380, 220)
    },
    {
        'id': 'network_hub',
        'name': 'Island Routing Hub',
        'asset': 'NetworkHub-removebg-preview.png',
        'x': 1400, 'y': 620, 'scale': 0.30,
        'crop': (1330, 470, 1470, 640)
    },
    {
        'id': 'lighthouse',
        'name': 'Coastal Lighthouse',
        'asset': 'Lighthouse-removebg-preview.png',
        'x': 1550, 'y': 380, 'scale': 0.35,
        'crop': (1470, 180, 1630, 400)
    }
]

os.makedirs('scripts/comparisons_final', exist_ok=True)

# Function to composite buildings onto an image
def composite_buildings(base_img, bld_list):
    comp = base_img.copy()
    for b in bld_list:
        if 'assets' in b:
            for fname, bx, by, bscale in b['assets']:
                sprite = Image.open(os.path.join('public/assets/world', fname))
                sw, sh = int(round(sprite.width * bscale)), int(round(sprite.height * bscale))
                sprite_res = sprite.resize((sw, sh), Image.LANCZOS)
                comp.paste(sprite_res, (int(round(bx - sw / 2)), int(round(by - sh))), sprite_res)
        else:
            sprite = Image.open(os.path.join('public/assets/world', b['asset']))
            sw, sh = int(round(sprite.width * b['scale'])), int(round(sprite.height * b['scale']))
            sprite_res = sprite.resize((sw, sh), Image.LANCZOS)
            comp.paste(sprite_res, (int(round(b['x'] - sw / 2)), int(round(b['y'] - sh))), sprite_res)
    return comp

orig_with_blds = composite_buildings(orig, buildings)
edit_with_blds = composite_buildings(edit, buildings)

# Save full composited maps
orig_with_blds.save('scripts/comparisons_final/full_map_original.png')
edit_with_blds.save('scripts/comparisons_final/full_map_edited.png')

for b in buildings:
    bid = b['id']
    x1, y1, x2, y2 = b['crop']
    w = x2 - x1
    h = y2 - y1
    
    # 4-panel comparison:
    # [Original Base] [Edited Base]
    # [Original In-Game] [Edited In-Game]
    panel = Image.new('RGB', (w * 2 + 10, h * 2 + 10), (30, 30, 30))
    panel.paste(orig.crop((x1, y1, x2, y2)), (0, 0))
    panel.paste(edit.crop((x1, y1, x2, y2)), (w + 10, 0))
    panel.paste(orig_with_blds.crop((x1, y1, x2, y2)), (0, h + 10))
    panel.paste(edit_with_blds.crop((x1, y1, x2, y2)), (w + 10, h + 10))
    
    out_path = f'scripts/comparisons_final/{bid}_4panel.png'
    panel.save(out_path)
    print(f"Saved {out_path}")

print("All comparisons generated!")

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont
import os

before = Image.open('scripts/full_map_screenshot.png').convert('RGB')
after = Image.open('scripts/full_map_screenshot_after.png').convert('RGB')

# Build side-by-side comparison of full map
W, H = before.size
comp_map = Image.new('RGB', (W, H * 2 + 60), (20, 24, 34))

draw = ImageDraw.Draw(comp_map)
# Add labels
draw.text((20, 10), "BEFORE: In-Game Map with Overlapping Trees Beneath Structures", fill=(255, 100, 100))
draw.text((20, H + 40), "AFTER: In-Game Map with All Overlapping Trees Cleaned Up Beneath Structures", fill=(100, 255, 150))

comp_map.paste(before, (0, 30))
comp_map.paste(after, (0, H + 60))

comp_map.save('../map_before_vs_after.png')
comp_map.save('C:/Users/rajde/.gemini/antigravity-ide/brain/a79fd497-6373-4f29-9a62-c5b48cf0e2f2/map_before_vs_after.png')

# Now create building insets grid:
buildings = [
    ("Island Workshop", (420, 440, 580, 580)),
    ("Village House 1", (680, 400, 820, 540)),
    ("Village House 2", (840, 390, 980, 540)),
    ("Village House 3", (580, 390, 720, 540)),
    ("Dr. Mira's Lab", (970, 300, 1130, 470)),
    ("Master's House", (1140, 460, 1300, 630)),
    ("Old Aegis Bunker & Tower", (1190, 15, 1380, 215)),
    ("Island Routing Hub", (1330, 470, 1470, 640)),
    ("Coastal Lighthouse", (1480, 240, 1610, 400)),
]

os.makedirs('../building_comparisons', exist_ok=True)
os.makedirs('C:/Users/rajde/.gemini/antigravity-ide/brain/a79fd497-6373-4f29-9a62-c5b48cf0e2f2/building_comparisons', exist_ok=True)

for name, (x1, y1, x2, y2) in buildings:
    w, h = x2 - x1, y2 - y1
    c_before = before.crop((x1, y1, x2, y2))
    c_after = after.crop((x1, y1, x2, y2))
    
    panel = Image.new('RGB', (w * 2 + 20, h + 40), (25, 30, 40))
    p_draw = ImageDraw.Draw(panel)
    p_draw.text((10, 8), f"{name} - BEFORE (Overlapped)", fill=(255, 120, 120))
    p_draw.text((w + 30, 8), f"{name} - AFTER (Clean Ground)", fill=(100, 255, 160))
    panel.paste(c_before, (10, 30))
    panel.paste(c_after, (w + 20, 30))
    
    safe_name = name.lower().replace(" ", "_").replace("'", "").replace("&", "and")
    out1 = f"../building_comparisons/{safe_name}_comparison.png"
    out2 = f"C:/Users/rajde/.gemini/antigravity-ide/brain/a79fd497-6373-4f29-9a62-c5b48cf0e2f2/building_comparisons/{safe_name}_comparison.png"
    panel.save(out1)
    panel.save(out2)
    print(f"Saved {safe_name} comparison")

print("All summary images generated!")

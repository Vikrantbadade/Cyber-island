import cv2
import numpy as np
from PIL import Image

# Load original base map
base = cv2.imread('public/assets/world/CyberIsland_Base.original.png')

# Define regions around each structure where trees need to be removed:
# (name, x_min, y_min, x_max, y_max)
regions = {
    'workshop': (445, 455, 545, 565),
    'house3': (610, 410, 690, 515),
    'house1': (705, 420, 795, 520),
    'house2': (860, 410, 960, 525),
    'mira_lab': (990, 320, 1105, 445),
    'master_hut': (1155, 470, 1290, 605),
    'aegis_radio': (1200, 20, 1375, 205),
    'network_hub': (1350, 480, 1455, 625),
    'lighthouse': (1490, 260, 1610, 380),
}

print("Regions defined for all 10 structures:")
for k, v in regions.items():
    print(f"  {k:15}: {v}")

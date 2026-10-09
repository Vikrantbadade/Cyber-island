import os
from PIL import Image, ImageOps
import numpy as np
from scipy.ndimage import label, find_objects

input_path = r'C:\Users\rajde\.gemini\antigravity-ide\brain\f746079e-57d7-4a1e-8991-005db34babff\player_spritesheet_1791439673095.jpg'
out_dir = r'c:\Users\rajde\OneDrive\Desktop\Cyber-island\frontend\public\assets\characters\player'
os.makedirs(out_dir, exist_ok=True)

im = Image.open(input_path).convert('RGB')
arr = np.array(im)

# 1. Identify outer background pixels (> 225 on all RGB and connected to border)
is_white = (arr[:, :, 0] > 225) & (arr[:, :, 1] > 225) & (arr[:, :, 2] > 225)
labeled_bg, num_bg = label(is_white)

edge_labels = set(labeled_bg[0, :]).union(set(labeled_bg[-1, :])).union(set(labeled_bg[:, 0])).union(set(labeled_bg[:, -1]))
if 0 in edge_labels:
    edge_labels.remove(0)

alpha = np.ones((1024, 1024), dtype=np.uint8) * 255
bg_mask = np.isin(labeled_bg, list(edge_labels))
alpha[bg_mask] = 0

rgba_arr = np.dstack((arr, alpha))
full_rgba = Image.fromarray(rgba_arr, 'RGBA')

# Find 16 sprite bounding boxes
is_fg = alpha > 0
labeled_fg, num_fg = label(is_fg)
slices = find_objects(labeled_fg)

valid_slices = []
for s in slices:
    h = s[0].stop - s[0].start
    w = s[1].stop - s[1].start
    if h > 80 and w > 40:
        valid_slices.append(s)

def get_cy_cx(s):
    cy = (s[0].start + s[0].stop) / 2
    cx = (s[1].start + s[1].stop) / 2
    return cy, cx

valid_slices.sort(key=lambda s: get_cy_cx(s)[0])
rows = []
for r in range(4):
    row_slice = valid_slices[r*4:(r+1)*4]
    row_slice.sort(key=lambda s: get_cy_cx(s)[1])
    rows.append(row_slice)

FRAME_W = 160
FRAME_H = 270

def extract_and_center_sprite(s, flip_h=False):
    crop = full_rgba.crop((s[1].start, s[0].start, s[1].stop, s[0].stop))
    c_arr = np.array(crop)
    c_is_white = (c_arr[:, :, 0] > 225) & (c_arr[:, :, 1] > 225) & (c_arr[:, :, 2] > 225)
    c_labeled, c_num = label(c_is_white)
    bottom_labels = set(c_labeled[-1, :])
    if 0 in bottom_labels:
        bottom_labels.remove(0)
    for bl in bottom_labels:
        c_arr[c_labeled == bl, 3] = 0
    crop = Image.fromarray(c_arr, 'RGBA')

    if flip_h:
        crop = ImageOps.mirror(crop)

    cw, ch = crop.size
    frame = Image.new('RGBA', (FRAME_W, FRAME_H), (0, 0, 0, 0))
    pos_x = (FRAME_W - cw) // 2
    pos_y = FRAME_H - ch - 8
    frame.paste(crop, (pos_x, pos_y), crop)
    return frame

# 4 directions, 4 frames each:
# Row 0: DOWN (facing forward)
#   Frame 0: stand, Frame 1: left step, Frame 2: stand, Frame 3: right step
down_f0 = extract_and_center_sprite(rows[0][0])
down_f1 = extract_and_center_sprite(rows[0][1])
down_f2 = extract_and_center_sprite(rows[0][0])
down_f3 = extract_and_center_sprite(rows[0][2])
down_frames = [down_f0, down_f1, down_f2, down_f3]

# Row 2 in spritesheet: RIGHT (facing RIGHT 100% consistently!)
#   rows[2][3]: stand right
#   rows[2][2]: right stride 1
#   rows[3][2]: right stride 2
right_f0 = extract_and_center_sprite(rows[2][3], flip_h=False)
right_f1 = extract_and_center_sprite(rows[2][2], flip_h=False)
right_f2 = extract_and_center_sprite(rows[2][3], flip_h=False)
right_f3 = extract_and_center_sprite(rows[3][2], flip_h=False)
right_frames = [right_f0, right_f1, right_f2, right_f3]

# Row 1 in spritesheet: LEFT (facing LEFT 100% consistently! Mirrored from right frames)
left_frames = [ImageOps.mirror(f) for f in right_frames]

# Row 3 in spritesheet: UP (facing back)
#   Frame 0: stand, Frame 1: left step, Frame 2: stand, Frame 3: right step
up_f0 = extract_and_center_sprite(rows[1][0])
up_f1 = extract_and_center_sprite(rows[1][1])
up_f2 = extract_and_center_sprite(rows[1][0])
up_f3 = extract_and_center_sprite(rows[1][2])
up_frames = [up_f0, up_f1, up_f2, up_f3]

spritesheet = Image.new('RGBA', (FRAME_W * 4, FRAME_H * 4), (0, 0, 0, 0))

# Paste Row 0: Down
for col_idx, f in enumerate(down_frames):
    spritesheet.paste(f, (col_idx * FRAME_W, 0 * FRAME_H), f)

# Paste Row 1: Left
for col_idx, f in enumerate(left_frames):
    spritesheet.paste(f, (col_idx * FRAME_W, 1 * FRAME_H), f)

# Paste Row 2: Right
for col_idx, f in enumerate(right_frames):
    spritesheet.paste(f, (col_idx * FRAME_W, 2 * FRAME_H), f)

# Paste Row 3: Up
for col_idx, f in enumerate(up_frames):
    spritesheet.paste(f, (col_idx * FRAME_W, 3 * FRAME_H), f)

spritesheet_path = os.path.join(out_dir, 'player_spritesheet.png')
spritesheet.save(spritesheet_path, 'PNG')
print(f"Saved new consistent spritesheet to {spritesheet_path}")

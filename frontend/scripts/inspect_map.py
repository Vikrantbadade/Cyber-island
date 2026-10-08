import re, os
from PIL import Image

with open('src/data/worldObjects.js', 'r') as f:
    text = f.read()

assets = {
    'BUILDING_AEGIS_FACILITY': 'Aegi_Facility-removebg-preview.png',
    'BUILDING_LIGHTHOUSE': 'Lighthouse-removebg-preview.png',
    'BUILDING_MASTER_HOUSE': 'master_house.png',
    'BUILDING_MIRA_LAB': 'min_s_lab-removebg-preview.png',
    'BUILDING_NETWORK_HUB': 'NetworkHub-removebg-preview.png',
    'BUILDING_VILLAGE_SHOP': 'VillageShop-removebg-preview.png',
    'BUILDING_WORKSHOP': 'Workshop-removebg-preview.png',
    'BUILDING_VILLAGE_HOUSE_1': 'village_House_1_-removebg-preview.png',
    'BUILDING_VILLAGE_HOUSE_2': 'village_House_2_-removebg-preview.png',
    'BUILDING_VILLAGE_HOUSE_3': 'village_House_3_-removebg-preview.png',
    'OBJECT_CYBER_TERMINAL': 'Cyber_Terminal-removebg-preview.png',
    'OBJECT_OLD_TERMINAL': 'Oldterminal-removebg-preview.png',
    'OBJECT_RADIO_TOWER': 'RadioTower-removebg-preview.png',
    'OBJECT_BROKEN_BOAT': 'broken_boat-removebg-preview.png',
}

pattern = re.compile(
    r'id:\s*[\'"](?P<id>[^\'"]+)[\'"].*?'
    r'asset:\s*[\'"](?P<asset>[^\'"]+)[\'"].*?'
    r'x:\s*(?P<x>\d+).*?'
    r'y:\s*(?P<y>\d+).*?'
    r'scale:\s*(?P<scale>[0-9\.]+)',
    re.DOTALL
)

matches = list(pattern.finditer(text))
print(f'Found {len(matches)} buildings:')
buildings_info = []
for m in matches:
    bid = m.group('id')
    asset_key = m.group('asset')
    x = int(m.group('x'))
    y = int(m.group('y'))
    scale = float(m.group('scale'))
    fname = assets.get(asset_key)
    if fname:
        im = Image.open('public/assets/world/' + fname)
        w, h = int(round(im.width * scale)), int(round(im.height * scale))
        left = int(round(x - w / 2))
        top = int(round(y - h))
        right = left + w
        bottom = top + h
        buildings_info.append({
            'id': bid, 'asset': fname, 'x': x, 'y': y, 'scale': scale,
            'box': (left, top, right, bottom), 'w': w, 'h': h
        })
        print(f'{bid:18}: x={x:4}, y={y:4}, scale={scale:4.2f} -> box: [{left:4}, {top:4}, {right:4}, {bottom:4}] ({w}x{h}) - {fname}')

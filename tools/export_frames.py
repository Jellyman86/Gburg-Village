"""Export reusable frames/strips from the canonical, already aligned atlases."""
from pathlib import Path
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
for folder in (ROOT/'assets/characters').iterdir():
    path=folder/'sheets/walk_4dir.png'
    if not path.exists():continue
    sheet=Image.open(path).convert('RGBA');assert sheet.size==(256,256),path
    (folder/'frames').mkdir(exist_ok=True);(folder/'strips').mkdir(exist_ok=True)
    for r,d in enumerate(['down','left','right','up']):
        sheet.crop((0,64*r,256,64*r+64)).save(folder/'strips'/f'{d}_walk.png')
        for c in range(4):sheet.crop((64*c,64*r,64*c+64,64*r+64)).save(folder/'frames'/f'{d}_{c}.png')
    sheet.resize((1024,1024),Image.Resampling.NEAREST).save(folder/'sprite_preview.png')
    print('Exported',folder.name)

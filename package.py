from pathlib import Path
from zipfile import ZipFile,ZIP_DEFLATED
from PIL import Image
import json,hashlib
root=Path(__file__).resolve().parent
report=(root/'TEST_RESULTS.txt').read_text(encoding='utf8')
for expected in ['No JavaScript errors','simultaneous joystick + Run','all four frames in every direction','safe hair/hat padding','network disabled','without page overflow']:
    assert expected in report,expected
for name in ['jason','connor','coco','peachy']:
    base=root/'assets/characters'/name
    assert Image.open(base/'sheets/walk_4dir.png').size==(256,256)
    assert len(list((base/'frames').glob('*.png')))==16
    assert (base/'character.json').is_file()
assert (root/'assets/maps/kentlands/map.json').is_file()
allowed={'index.html','play.html','style.css','README.txt','TEST_RESULTS.txt','preview.png','mobile-preview.png','package.py'}
files=[p for p in sorted(root.rglob('*')) if p.is_file() and (p.relative_to(root).parts[0] in {'assets','src','tools','tests'} or p.name in allowed) and '__pycache__' not in p.parts]
manifest={p.relative_to(root).as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for p in files}
(root/'manifest.sha256.json').write_text(json.dumps(manifest,indent=2),encoding='utf8')
files.append(root/'manifest.sha256.json')
out=root.parent/'FF_Village_Project.zip'
with ZipFile(out,'w',ZIP_DEFLATED) as z:
    for p in files:z.write(p,Path(root.name)/p.relative_to(root))
with ZipFile(out) as z:
    assert z.testzip() is None
    for path,digest in manifest.items():assert hashlib.sha256(z.read(root.name+'/'+path)).hexdigest()==digest
print(out, out.stat().st_size,'bytes;',len(files),'files; checksums verified')

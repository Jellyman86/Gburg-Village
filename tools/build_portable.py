"""Build one self-contained HTML game from the editable project files."""
from pathlib import Path
import json,base64
root=Path(__file__).resolve().parents[1]
html=(root/'index.html').read_text(encoding='utf8')
html=html.replace('<link rel="stylesheet" href="style.css">','<style>'+(root/'style.css').read_text(encoding='utf8')+'</style>')
paths=['assets/maps/kentlands/scene.png']+[p.relative_to(root).as_posix() for p in sorted((root/'assets/characters').glob('*/sheets/walk_4dir.png'))]
embedded={p:'data:image/png;base64,'+base64.b64encode((root/p).read_bytes()).decode() for p in paths}
html=html.replace('<script src="src/characters.js"></script>','<script>window.EMBEDDED_ASSETS='+json.dumps(embedded)+';</script><script>'+(root/'src/characters.js').read_text(encoding='utf8')+'</script>')
for p in ['map','game']:html=html.replace(f'<script src="src/{p}.js"></script>','<script>'+(root/f'src/{p}.js').read_text(encoding='utf8')+'</script>')
(root/'play.html').write_text(html,encoding='utf8')
print('Built play.html with',len(paths),'embedded assets')

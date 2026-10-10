"""Build one self-contained HTML game from the editable project files."""
from pathlib import Path
import argparse,json,base64,re
parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--output',type=Path,help='Optional output path; defaults to play.html')
args=parser.parse_args()
root=Path(__file__).resolve().parents[1]
html=(root/'index.html').read_text(encoding='utf8')
html=re.sub(r'<link rel="stylesheet" href="style\.css(?:\?[^\"]*)?">',lambda _: '<style>'+(root/'style.css').read_text(encoding='utf8')+'</style>',html)
paths=['assets/maps/kentlands/scene.png']+[p.relative_to(root).as_posix() for p in sorted((root/'assets/characters').glob('*/sheets/walk_4dir.png'))]
embedded={p:'data:image/png;base64,'+base64.b64encode((root/p).read_bytes()).decode() for p in paths}
html=html.replace('</head>','<script>window.EMBEDDED_ASSETS='+json.dumps(embedded)+';</script></head>')
for p in ['characters','map','powers','game']:
 html=re.sub(r'<script src="src/'+p+r'\.js(?:\?[^\"]*)?"></script>',lambda _,p=p: '<script>'+(root/f'src/{p}.js').read_text(encoding='utf8')+'</script>',html)
output=args.output or root/'play.html'
output.write_text(html,encoding='utf8')
print('Built',output.name,'with',len(paths),'embedded assets')

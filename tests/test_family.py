from pathlib import Path
from playwright.sync_api import sync_playwright
from PIL import Image
import hashlib, math, os, json

ROOT=Path(__file__).resolve().parents[1]
CHROME=os.environ.get('CHROME_PATH',r'C:\Program Files (x86)\Google\Chrome\Application\chrome.exe')
results=[]
def passed(message):
    results.append('PASS: '+message);print(results[-1],flush=True)
def state(page):return page.evaluate('GAME.state')
def start(page,file='index.html'):
    page.goto((ROOT/file).as_uri());page.wait_for_function('window.GAME?.ready');page.wait_for_timeout(70)
def hold(page,keys,ms):
    for k in keys:page.keyboard.down(k)
    page.wait_for_timeout(ms)
    s=state(page)
    for k in keys:page.keyboard.up(k)
    page.wait_for_timeout(60)
    return s
def delta(a,b):return math.hypot(a['x']-b['x'],a['y']-b['y'])

for name in ['jason','connor','coco','peachy']:
    folder=ROOT/'assets/characters'/name
    sheet=Image.open(folder/'sheets/walk_4dir.png').convert('RGBA');assert sheet.size==(256,256)
    hashes=[]
    for r,direction in enumerate(['down','left','right','up']):
        for c in range(4):
            frame=Image.open(folder/'frames'/f'{direction}_{c}.png').convert('RGBA')
            assert frame.size==(64,64)
            assert set(frame.getchannel('A').get_flattened_data())=={0,255}
            x0,y0,x1,y1=frame.getbbox();assert x0>=4 and y0>=4 and x1<=60 and y1==60
            assert frame.tobytes()==sheet.crop((64*c,64*r,64*c+64,64*r+64)).tobytes()
            hashes.append(hashlib.sha256(frame.tobytes()).hexdigest())
    assert len(set(hashes))==16
passed('64 unique 64x64 RGBA frames, binary transparency, sheet/PNG agreement, foot baseline60 and safe hair/hat padding')

with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=CHROME,headless=True)
    errors=[];failed=[]
    context=browser.new_context(viewport={'width':1440,'height':1000},device_scale_factor=1)
    page=context.new_page();page.on('pageerror',lambda e:errors.append(str(e)));page.on('requestfailed',lambda r:failed.append(r.url))
    start(page);assert page.locator('.character-button').count()==4
    assert not page.locator('#loading').is_visible()
    page.screenshot(path=str(ROOT/'preview.png'))
    passed('Desktop local-file game loads all four characters and the town')
    for key,direction,axis,sign in [('w','up','y',-1),('a','left','x',-1),('s','down','y',1),('d','right','x',1),('ArrowUp','up','y',-1),('ArrowLeft','left','x',-1),('ArrowDown','down','y',1),('ArrowRight','right','x',1)]:
        start(page);before=state(page)['player'];during=hold(page,[key],180)['player']
        assert (during[axis]-before[axis])*sign>12,(key,before,during)
        assert during['direction']==direction
        after=state(page)['player'];page.wait_for_timeout(100);assert delta(after,state(page)['player'])<.1
        assert not state(page)['player']['moving']
    passed('WASD and all four arrows move correctly; releasing keys stops movement')
    for i,name in enumerate(['jason','connor','coco','peachy']):
        for key,direction in [('w','up'),('a','left'),('s','down'),('d','right')]:
            start(page);page.keyboard.press(str(i+1));assert state(page)['player']['id']==name
            page.keyboard.down(key);seen=set()
            for _ in range(18):
                page.wait_for_timeout(32);s=state(page)['player'];seen.add(s['frame']);assert s['direction']==direction
            page.keyboard.up(key);assert seen=={0,1,2,3},(name,direction,seen)
        page.locator(f'[data-character="{name}"]').click();assert page.locator(f'[data-character="{name}"]').get_attribute('aria-pressed')=='true'
    passed('Every character animates all four frames in every direction; number keys and portrait selection work')
    speeds=[]
    for keys in [['d'],['Shift','d']]:
        start(page);before=state(page)['player'];during=hold(page,keys,400)['player'];speeds.append(delta(before,during))
    assert 1.45<speeds[1]/speeds[0]<1.95,speeds
    passed(f'Shift running is faster: walk {speeds[0]:.1f}px vs run {speeds[1]:.1f}px over 400ms')
    distances=[]
    for keys in [['d'],['d','w']]:
        start(page);before=state(page)['player'];during=hold(page,keys,200)['player'];distances.append(delta(before,during))
    assert .8<distances[1]/distances[0]<1.2,distances
    passed('Diagonal movement is normalized')
    start(page);page.keyboard.down('d');page.wait_for_timeout(100);page.evaluate('window.dispatchEvent(new Event("blur"))');s=state(page)['player'];page.wait_for_timeout(150);assert delta(s,state(page)['player'])<.1;page.keyboard.up('d')
    passed('Losing focus clears held movement')
    start(page);hold(page,['a'],2780);s=hold(page,['w'],1500)['player'];assert 741<s['y']<749,s
    assert not page.evaluate('GAME.blocked(GAME.state.player.x,GAME.state.player.y)')
    passed('Walking into the restaurant stops at its collision boundary')
    start(page);s=hold(page,['Shift','w'],3400);assert 278<=s['player']['y']<283,s
    assert s['player']['y']-s['camera']['y']-60>=0
    page.screenshot(path=str(ROOT/'tests/top-boundary.png'))
    hold(page,['Shift','s'],3900);s=state(page);assert 976<s['player']['y']<=980
    assert s['player']['y']-s['camera']['y']+4<=s['viewport']['height']
    passed('Central route is traversable; upper/lower bounds preserve the entire sprite including hair')
    start(page);page.keyboard.press('e');assert page.locator('#dialog-title').inner_text()=='The family meeting spot'
    s=state(page)['player'];hold(page,['d'],150);assert delta(s,state(page)['player'])<.1
    page.locator('#continue').click();hold(page,['w'],2530);assert state(page)['nearest']=='green',state(page)
    s=state(page);r=page.locator('#game').bounding_box();x=r['x']+(768-s['camera']['x'])*r['width']/s['viewport']['width'];y=r['y']+(562-15-s['camera']['y'])*r['height']/s['viewport']['height'];page.mouse.click(x,y)
    assert page.locator('#dialog-title').inner_text()=='The green & string lights'
    page.keyboard.press('Escape');assert not state(page)['dialog']
    passed('E interaction, changed landmark mouse interaction, dialog pause and Escape close work')
    # Confirm all landmarks can be reached from spawn, including routes around buildings.
    data=page.evaluate('({town:TOWN})')['town'];step=8
    def free(x,y):
        b=data['bounds'];return x-8>=b['left'] and x+8<=b['right'] and y-4>=b['top'] and y+4<=b['bottom'] and not any(x+8>o['x'] and x-8<o['x']+o['w'] and y+4>o['y'] and y-4<o['y']+o['h'] for o in data['obstacles'])
    todo=[(768,864)];seen=set(todo)
    while todo:
        x,y=todo.pop()
        for n in [(x-step,y),(x+step,y),(x,y-step),(x,y+step)]:
            if n not in seen and free(*n):seen.add(n);todo.append(n)
    for mark in data['landmarks']:assert any(math.hypot(x-mark['x'],y-mark['y'])<mark['radius'] for x,y in seen),mark
    passed('All six landmark interaction zones are reachable through the collision map')
    mobile=browser.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True,device_scale_factor=1)
    m=mobile.new_page();m.on('pageerror',lambda e:errors.append(str(e)));m.on('requestfailed',lambda r:failed.append(r.url));cdp=mobile.new_cdp_session(m)
    def send(kind,points):cdp.send('Input.dispatchTouchEvent',{'type':kind,'touchPoints':points})
    def point(locator,id,dx=0):
        r=m.locator(locator).bounding_box();return {'x':r['x']+r['width']/2+dx,'y':r['y']+r['height']/2,'id':id,'radiusX':4,'radiusY':4,'force':1}
    distances=[]
    for running in [False,True]:
        start(m);assert m.locator('#joystick').is_visible();before=state(m)['player'];points=[point('#joystick',1,42)];send('touchStart',points)
        if running:points.append(point('#run',2));send('touchStart',points)
        m.wait_for_timeout(400);s=state(m);assert s['player']['moving'];assert s['input']['touchRun']==running
        distances.append(delta(before,s['player']));send('touchEnd',[]);m.wait_for_timeout(90);after=state(m)['player'];m.wait_for_timeout(90);assert delta(after,state(m)['player'])<.1
        assert not state(m)['input']['touchRun'];assert m.evaluate('scrollY')==0
    assert 1.4<distances[1]/distances[0]<2.05,distances
    passed(f'Real browser touch events: joystick {distances[0]:.1f}px; simultaneous joystick + Run {distances[1]:.1f}px; release stops both')
    start(m);send('touchStart',[point('#joystick',1,42)]);send('touchStart',[point('#joystick',1,42),point('#run',2)]);m.wait_for_timeout(100);send('touchCancel',[]);m.wait_for_timeout(70);assert state(m)['input']['joy']=={'x':0,'y':0};assert not state(m)['input']['touchRun']
    passed('Touch cancellation clears joystick and Run without stuck input')
    start(m);m.locator('#interact').tap();assert state(m)['dialog'];assert m.locator('#dialog-title').inner_text()=='The family meeting spot';m.locator('#continue').tap();m.locator('[data-character="connor"]').tap();assert state(m)['player']['id']=='connor'
    passed('Mobile Look interaction, dialog close and character taps work')
    for w,h in [(390,844),(844,390),(320,568),(768,1024)]:
        m.set_viewport_size({'width':w,'height':h});start(m)
        for selector in ['#joystick','#run','#interact','.character-button:last-child']:
            r=m.locator(selector).bounding_box();assert r['x']>=0 and r['y']>=0 and r['x']+r['width']<=w+1 and r['y']+r['height']<=h+1,(w,h,selector,r)
        assert m.evaluate('document.documentElement.scrollWidth<=innerWidth && document.documentElement.scrollHeight<=innerHeight+1'),(w,h,m.evaluate('[document.documentElement.scrollHeight,innerHeight]'))
        if (w,h)==(390,844):m.screenshot(path=str(ROOT/'mobile-preview.png'))
        if (w,h)==(844,390):m.screenshot(path=str(ROOT/'tests/mobile-landscape.png'))
    passed('Portrait and landscape controls fit at 320x568, 390x844, 844x390 and 768x1024 without page overflow')
    context.set_offline(True);start(page,'play.html');assert page.evaluate('Object.keys(window.EMBEDDED_ASSETS).length')==5
    before=state(page)['player'];assert hold(page,['d'],150)['player']['x']>before['x']+10
    passed('Standalone play.html loads and moves with the browser network disabled')
    # Portable map data is exported from the exact configuration exercised above.
    (ROOT/'assets/maps/kentlands/map.json').write_text(json.dumps(data,indent=2),encoding='utf8')
    assert not errors,errors;assert not failed,failed
    passed('No JavaScript errors or failed asset requests in desktop or mobile tests')
    browser.close()

(ROOT/'TEST_RESULTS.txt').write_text('FAMILY WALK - VERIFICATION\n\n'+'\n'.join(results)+'\n\nEnvironment: headless installed Chrome, Playwright, Windows. Mobile checks use Chromium touch emulation, including real multi-touch events; no physical iPhone/Android or Safari device was tested.\n',encoding='utf8')
print('ALL CHECKS PASSED',flush=True)

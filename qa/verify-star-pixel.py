"""Run through E:\\browser-automation\\browser-harness-helium.cmd standard input.
Uses its existing dedicated tab. Reports are local evidence, never Git input.
"""
import base64,json,time
from pathlib import Path

ROOT=Path(r'D:\deepseekworkplace\幻想大陆HTML制作')
OUT=ROOT/'qa'
checks=[]

def evaluate(expression):
    return js(expression)

def check(name,expression):
    result=json.loads(evaluate('JSON.stringify('+expression+')'))
    checks.append({'name':name,'passed':bool(result),'result':result})
    print(name+': '+str(result))
    if not result:raise AssertionError(name)

def snap(name):
    (OUT/name).write_bytes(base64.b64decode(cdp('Page.captureScreenshot',format='png')['data']))

def settle(seconds=.25):time.sleep(seconds)

def click_button(name):
    nodes=cdp('Accessibility.getFullAXTree')['nodes']
    node=next(n for n in nodes if n.get('role',{}).get('value')=='button' and name in n.get('name',{}).get('value',''))
    q=cdp('DOM.getBoxModel',backendNodeId=node['backendDOMNodeId'])['model']['content']
    click_at_xy(sum(q[0::2])/4,sum(q[1::2])/4)

try:
    cdp('Emulation.setDeviceMetricsOverride',width=1280,height=800,deviceScaleFactor=1,mobile=False)
    cdp('Page.navigate',url='file:///D:/deepseekworkplace/幻想大陆HTML制作/幻想大陆-星兽纪.html?qa=1')
    wait_for_load();cdp('Page.bringToFront');cdp('Emulation.setFocusEmulationEnabled',enabled=True)
    evaluate("window.__qaErrors=[];addEventListener('error',e=>__qaErrors.push(e.message));addEventListener('unhandledrejection',e=>__qaErrors.push(String(e.reason)))")
    snap('star-pixel-title.png')
    click_button('开始试玩');settle(1.2)
    check('start opens intro',"__star.S.scene==='world'&&__star.S.dialogOpen")
    check('dialog does not resize or transform body',"getComputedStyle(document.body).width==='1280px'&&getComputedStyle(document.body).animationName==='none'&&document.getElementById('app').getBoundingClientRect().width===1280&&document.getElementById('app').getBoundingClientRect().y===0")
    snap('star-pixel-dialog.png')
    # Finish both introductory lines by clicking the actual dialog.
    for _ in range(4):click_at_xy(280,704);settle(.07)
    settle(.18)
    check('intro closes',"!__star.S.dialogOpen&&!__star.S.flowPending")
    evaluate("__star.enterMap('camp',{x:10.5,y:7.5});")
    settle(.2)
    point=json.loads(evaluate("JSON.stringify({x:11.3*64-__star.S.camera.x,y:6.1*64-__star.S.camera.y-30})"))
    click_at_xy(point['x'],point['y']);settle(.9)
    check('click NPC paths and opens dialog',"__star.S.dialogOpen&&document.getElementById('dlgName').textContent==='苔爷爷'&&!__star.S.player.moving&&__star.S.route.length===0")
    # Complete the two batches of the existing starter quest, with their real callbacks.
    for _ in range(6):click_at_xy(280,704);settle(.06)
    settle(.2)
    for _ in range(6):click_at_xy(280,704);settle(.06)
    settle(.2)
    check('starter quest remains intact',"!__star.S.dialogOpen&&__star.S.flags.gotStarter&&__star.S.party[0].id==='porc'&&__star.S.quest===1")
    # Input comes from pointer events, including all eight facings.
    facings=[('up',0,-1),('upright',1,-1),('right',1,0),('downright',1,1),('down',0,1),('downleft',-1,1),('left',-1,0),('upleft',-1,-1)]
    for direction,dx,dy in facings:
        evaluate("__star.enterMap('camp',{x:15.5,y:8.5});")
        point=json.loads(evaluate('JSON.stringify({x:'+str((15.5+dx)*64)+'-__star.S.camera.x,y:'+str((8.5+dy)*64)+'-__star.S.camera.y})'))
        click_at_xy(point['x'],point['y']);settle(.65)
        check('pointer facing '+direction,"__star.S.player.dir==='"+direction+"'&&Math.abs(__star.S.player.x-"+str(15.5+dx)+")<.03&&Math.abs(__star.S.player.y-"+str(8.5+dy)+")<.03")
    check('8 distinct facings with 3 poses each',"(()=>{let ds=['up','upright','right','downright','down','downleft','left','upleft'];let a=ds.flatMap(d=>[0,1,2].map(p=>__star.humanFrame('player',d,p).toDataURL()));return a.length===24&&new Set(a).size===24;})()")
    # Original CSS collision and stale callbacks each have a separate regression.
    evaluate("__star.say([{who:'旁白',portrait:'narrator',text:'打开对话时，世界和人物都应保持稳定。'}]);")
    check('dialog cancels route and walk pose',"__star.S.route.length===0&&!__star.S.player.moving&&__star.S.player.walk===0")
    evaluate('__star.closeDialog();');settle(.15)
    click_button('队伍');settle(.1)
    check('panel does not style the document body',"__star.S.panelOpen&&getComputedStyle(document.body).width==='1280px'&&getComputedStyle(document.body).padding==='0px'")
    click_button('关闭');settle(.12)
    click_button('骑乘');settle(.15)
    check('mount command works',"__star.S.riding")
    snap('star-pixel-world.png')
    click_button('下骑');settle(.1)
    position=evaluate('JSON.stringify([__star.S.player.x,__star.S.player.y])')
    cdp('Input.dispatchKeyEvent',type='keyDown',key='w',code='KeyW',windowsVirtualKeyCode=87)
    settle(.2)
    cdp('Input.dispatchKeyEvent',type='keyUp',key='w',code='KeyW',windowsVirtualKeyCode=87)
    check('WASD does not move the character',"JSON.stringify([__star.S.player.x,__star.S.player.y])==="+json.dumps(position))
    evaluate('__star.S.party[0].hp=20;__star.refresh();');click_button('星露药');settle(.15)
    check('quick potion consumes item and heals active pet',"__star.S.potions===2&&__star.S.party[0].hp>20")
    evaluate("__star.enterMap('redhill',{x:12.2,y:7.5});__star.heal();__star.startBattle({kind:'wild',species:'badger',lv:3});")
    settle(1.55)
    check('battle shows persistent top left HP SP',"__star.S.scene==='battle'&&!document.getElementById('hud').classList.contains('hide')&&document.getElementById('petHpNum').textContent.indexOf('/')>0")
    check('battle commands available',"!document.querySelector('[data-cmd=attack]').disabled&&!document.querySelector('[data-cmd=defend]').disabled&&document.querySelector('[data-cmd=ride]').disabled")
    snap('star-pixel-battle.png')
    click_button('防御');settle(.2)
    check('defense consumes turn and sets guard',"__star.S.battle.busy&&__star.S.party[0].guard===1")
    settle(2.3)
    check('defense turn resolves',"__star.S.scene==='battle'&&!__star.S.battle.busy&&__star.S.party[0].guard===0")
    evaluate("window.__savedRandom=Math.random;Math.random=()=>0;__star.S.battle.enemy.hp=1;__star.refresh();")
    click_button('捕捉');settle(3.3)
    evaluate('Math.random=window.__savedRandom;delete window.__savedRandom;')
    check('capture joins pet and consumes ring',"__star.S.party.some(p=>p.id==='badger')&&__star.S.captured.badger&&__star.S.rings===4&&__star.S.panelOpen")
    click_button('继续');settle(.25)
    check('capture result returns to exploration',"__star.S.scene==='world'&&!__star.S.panelOpen&&!__star.S.battle")
    # A real pointer route is stopped when a battle starts. Original asynchronous races:
    evaluate('__star.start();__star.talkElder();__star.closeDialog();__star.goTitle();');settle(.25)
    check('reset invalidates old dialog callback',"__star.S.scene==='title'&&!__star.S.dialogOpen&&!__star.S.flags.gotStarter&&__star.S.party.length===0")
    evaluate("__star.start();__star.S.flags.metElder=true;__star.goGate(__star.MAPS.camp.objects.find(o=>o.type==='gate'));__star.goTitle();");settle(.55)
    check('reset invalidates gate and clears black fade',"__star.S.scene==='title'&&__star.S.mapId==='camp'&&!__star.S.transition&&!document.getElementById('fade').classList.contains('on')")
    evaluate('__star.start();__star.S.flags.metElder=true;');settle(.1)
    for mapid in ['redhill','moss','geode','camp']:
        evaluate("__star.goGate({to:'"+mapid+"',spawn:__star.MAPS['"+mapid+"'].spawn});")
        settle(.52)
        check('scene transition '+mapid,"__star.S.mapId==='"+mapid+"'&&!__star.S.transition&&!document.getElementById('fade').classList.contains('on')&&document.getElementById('hudPlace').textContent===__star.MAPS['"+mapid+"'].name")
    evaluate("__star.enterMap('camp',{x:18.5,y:11.5});")
    point=json.loads(evaluate("JSON.stringify({x:19*64-__star.S.camera.x,y:12.2*64-__star.S.camera.y-30})"))
    click_at_xy(point['x'],point['y']);settle(.65)
    check('pointer gate interaction changes map',"__star.S.mapId==='redhill'&&!__star.S.transition")
    # All species and all facing frames can be visually reviewed in one bounded artifact.
    sheet=evaluate("(()=>{let cv=document.createElement('canvas');cv.width=720;cv.height=560;let c=cv.getContext('2d');c.imageSmoothingEnabled=false;c.fillStyle='#22374e';c.fillRect(0,0,720,560);Object.keys(__star.SPECIES).forEach((id,i)=>c.drawImage(__star.beastFrame(id,0),i*118+4,12,108,102));['up','upright','right','downright','down','downleft','left','upleft'].forEach((d,i)=>{for(let p=0;p<3;p++)c.drawImage(__star.humanFrame('player',d,p),i*88+8,148+p*132,60,84);});return cv.toDataURL().split(',')[1];})()")
    (OUT/'star-pixel-sprites.png').write_bytes(base64.b64decode(sheet))
    # Responsive layout uses the same page and same game state.
    evaluate("__star.enterMap('camp',{x:10.5,y:7.5});__star.S.party=[__star.makePet('porc',3)];__star.S.flags.gotStarter=true;__star.S.active=0;__star.refresh();")
    cdp('Emulation.setDeviceMetricsOverride',width=390,height=844,deviceScaleFactor=1,mobile=True)
    settle(.35)
    check('mobile has no overflow',"document.documentElement.scrollWidth===390&&document.getElementById('classicDock').getBoundingClientRect().right<=390&&document.getElementById('classicDock').getBoundingClientRect().top>400")
    check('all mobile commands remain inside viewport',"Array.from(document.querySelectorAll('#cmdMain button')).every(b=>{let r=b.getBoundingClientRect();return r.x>=0&&r.right<=390&&r.y>=0&&r.bottom<=844})")
    evaluate("__star.say([{who:'苔爷爷',portrait:'elder',text:'点击地面就能出发，伙伴会跟着你。去红丘把第一道星痕带回来吧。'}]);")
    settle(2.3)
    snap('star-pixel-mobile.png')
    check('mobile dialog stays in its own dock area',"(()=>{let a=dlgLayer.getBoundingClientRect(),b=document.getElementById('classicDock').getBoundingClientRect(),c=document.querySelector('.dock-commands').getBoundingClientRect();return a.top>=b.top&&a.bottom<=c.top&&a.right<document.querySelector('.quick-items').getBoundingClientRect().left})()")
    cdp('Emulation.setDeviceMetricsOverride',width=1000,height=760,deviceScaleFactor=1,mobile=False);settle(.2)
    check('1000px dialog does not overlap quick items',"dlgLayer.getBoundingClientRect().right<document.querySelector('.quick-items').getBoundingClientRect().left")
    cdp('Emulation.setDeviceMetricsOverride',width=320,height=740,deviceScaleFactor=1,mobile=True);settle(.2)
    check('320px HUD remains inside viewport',"Array.from(document.querySelectorAll('.status-stack,.hud-center')).every(e=>e.getBoundingClientRect().right<=320)&&document.documentElement.scrollWidth===320")
    check('no browser runtime errors',"window.__qaErrors.length===0")
finally:
    (OUT/'star-pixel-report.json').write_text(json.dumps({'checks':checks,'passed':all(c['passed'] for c in checks),'recorded_at':time.strftime('%Y-%m-%d %H:%M:%S')},ensure_ascii=False,indent=2),encoding='utf-8')
    print('Report written: qa/star-pixel-report.json')

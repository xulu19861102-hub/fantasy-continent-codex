// Execute with ego-browser nodejs via a UTF-8 module import. Uses one owned TaskSpace.
const fs=await import('node:fs/promises');
const root='D:/deepseekworkplace/幻想大陆HTML制作';
const evidence=root+'/.codex-work/argon-redraw-20261024';
const task=await taskSpace(3),page=task.page('p1'),checks=[];
const read=(fn,arg)=>arg===undefined?page.evaluate(fn):page.evaluate(fn,arg);
async function check(name,fn,arg){const result=await read(fn,arg);checks.push({name,passed:!!result});console.log(name+': '+result);if(!result)throw new Error(name);}
async function wait(fn,arg,timeout=6000){await page.waitForFunction(fn,arg,{timeout});}
async function stableCamera(){await wait(()=>{
  if(!window.__star||__star.S.scene!=='world')return true;
  const s=__star.S,m=__star.MAPS[s.mapId],r=document.getElementById('game').getBoundingClientRect(),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const x=m.pxW<=r.width?(m.pxW-r.width)/2:clamp(s.player.x*64+32-r.width/2,0,m.pxW-r.width);
  const y=m.pxH<=r.height?(m.pxH-r.height)/2:clamp(s.player.y*64-64*.35-r.height/2,0,m.pxH-r.height);
  return Math.abs(s.camera.x-x)<.5&&Math.abs(s.camera.y-y)<.5;
});}
async function shot(name){await stableCamera();await wait(()=>Number(getComputedStyle(document.getElementById('fade')).opacity)<.01);await page.screenshot({path:evidence+'/'+name+'.png'});}
async function center(selector){return read(s=>{const r=document.querySelector(s).getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2};},selector);}
async function nextDialog(){await page.click('#dlgLayer',{label:'继续阅读角色对话'});}
async function finishDialog(){
  for(let i=0;i<18;i++){
    const state=await read(()=>({dialog:__star.S.dialogOpen,pending:__star.S.flowPending}));
    if(!state.dialog&&!state.pending)return;
    if(state.dialog)await nextDialog();
    else await wait(()=>!__star.S.flowPending||__star.S.dialogOpen);
  }
  throw new Error('dialog did not finish in 18 clicks');
}
try{
  await page.cdp('Emulation.setDeviceMetricsOverride',{width:1280,height:800,deviceScaleFactor:1,mobile:false});
  await page.goto('file:///D:/deepseekworkplace/幻想大陆HTML制作/幻想大陆-星兽纪.html?qa=1');
  await page.cdp('Emulation.setFocusEmulationEnabled',{enabled:true});
  await read(()=>{window.__qaErrors=[];window.addEventListener('error',e=>__qaErrors.push(e.message));window.addEventListener('unhandledrejection',e=>__qaErrors.push(String(e.reason)));});
  await wait(()=>!!window.__star);
  await shot('argon-title');
  console.log(await page.snapshot());
  await page.click('#startBtn',{label:'开始新版像素冒险'});
  await wait(()=>__star.S.dialogOpen);
  await check('dialog preserves viewport',()=>{const r=document.getElementById('app').getBoundingClientRect();return r.width===1280&&r.height===800&&r.x===0&&r.y===0&&getComputedStyle(document.body).animationName==='none';});
  await read(()=>document.getElementById('dlgText').textContent.length>0);
  await shot('argon-dialog');
  await finishDialog();
  await read(()=>__star.enterMap('camp',{x:10.5,y:7.5}));
  const npc=await read(()=>({x:11.3*64-__star.S.camera.x,y:6.1*64-__star.S.camera.y-28}));
  await page.mouse.click(npc.x,npc.y,{label:'点击苔爷爷自动交谈'});
  await wait(()=>__star.S.dialogOpen);
  await check('pointer NPC interaction',()=>document.getElementById('dlgName').textContent==='苔爷爷'&&!__star.S.player.moving&&__star.S.route.length===0);
  await finishDialog();
  await check('starter story intact',()=>__star.S.party.length===1&&__star.S.party[0].id==='porc'&&__star.S.quest===1);
  await wait(()=>{const e=document.getElementById('petHpFill');return e.getBoundingClientRect().width/e.parentElement.getBoundingClientRect().width>.85;});
  await check('full HP SP render as filled bars',()=>['heroHpFill','heroSpFill','petHpFill','petSpFill'].every(id=>{const e=document.getElementById(id);return e.getBoundingClientRect().width/e.parentElement.getBoundingClientRect().width>.85;}));
  for(const [dir,dx,dy] of [['up',0,-1],['upright',1,-1],['right',1,0],['downright',1,1],['down',0,1],['downleft',-1,1],['left',-1,0],['upleft',-1,-1]]){
    await read(()=>__star.enterMap('camp',{x:15.5,y:8.5}));
    const point=await read(({dx,dy})=>({x:(15.5+dx)*64-__star.S.camera.x,y:(8.5+dy)*64-__star.S.camera.y}),{dx,dy});
    await page.mouse.click(point.x,point.y,{label:'验证八方向点击行走'});
    await wait(({dx,dy})=>!__star.S.route.length&&Math.abs(__star.S.player.x-15.5-dx)<.03&&Math.abs(__star.S.player.y-8.5-dy)<.03,{dx,dy});
    await check('pointer facing '+dir,d=>__star.S.player.dir===d,dir);
  }
  await check('24 unique player poses',()=>{const images=['up','upright','right','downright','down','downleft','left','upleft'].flatMap(d=>[0,1,2].map(p=>__star.humanFrame('player',d,p).toDataURL()));return images.length===24&&new Set(images).size===24;});
  // Sprite-sheet QA provides actual pixel output for independent visual inspection.
  const sheet=await read(()=>{
    const cv=document.createElement('canvas');cv.width=960;cv.height=760;const c=cv.getContext('2d');c.imageSmoothingEnabled=false;c.fillStyle='#203344';c.fillRect(0,0,cv.width,cv.height);
    const put=(im,x,y,w,h)=>{const k=Math.max(1,Math.floor(Math.min(w/im.width,h/im.height)));c.drawImage(im,x+(w-im.width*k)/2,y+(h-im.height*k)/2,im.width*k,im.height*k);};
    Object.keys(__star.SPECIES).forEach((id,i)=>put(__star.beastFrame(id,0),i*156+8,10,144,136));
    ['up','upright','right','downright','down','downleft','left','upleft'].forEach((d,i)=>[0,1,2].forEach(p=>put(__star.humanFrame('player',d,p),i*118+8,180+p*180,104,150)));
    return cv.toDataURL().split(',')[1];
  });await fs.writeFile(evidence+'/argon-sprites.png',Buffer.from(sheet,'base64'));
  await read(()=>{__star.enterMap('camp',{x:10.5,y:7.5});document.getElementById('areaBanner').classList.remove('on');});
  await shot('argon-world');
  await page.click('#btnParty',{label:'检查队伍面板交互'});
  await check('party panel and stable layout',()=>__star.S.panelOpen&&document.getElementById('app').getBoundingClientRect().width===1280);
  await shot('argon-party');await page.click('#panelClose',{label:'关闭队伍回到探索'});
  await page.click('[data-cmd=ride]',{label:'骑乘当前同行星兽'});
  await wait(()=>__star.S.riding);await check('mount available',()=>__star.S.riding);
  await page.click('[data-cmd=ride]',{label:'下骑切换步行模式'});
  const before=await read(()=>[__star.S.player.x,__star.S.player.y]);
  await page.keyboard.down('w');await page.keyboard.up('w');
  await check('WASD disabled',a=>__star.S.player.x===a[0]&&__star.S.player.y===a[1],before);
  await read(()=>{__star.S.party[0].hp=20;__star.refresh();});
  await page.click('#quickPotion',{label:'快捷用药回复星兽'});
  await check('quick potion heals and consumes',()=>__star.S.potions===2&&__star.S.party[0].hp>20);
  await read(()=>{__star.enterMap('redhill',{x:12.2,y:7.5});__star.heal();__star.startBattle({kind:'wild',species:'badger',lv:3});});
  await wait(()=>__star.S.battle&&!__star.S.battle.busy);
  await check('battle HP SP visible',()=>!document.getElementById('hud').classList.contains('hide')&&document.getElementById('petHpNum').textContent.includes('/'));
  await shot('argon-battle');
  await page.click('[data-cmd=defend]',{label:'防御并结算敌方回合'});
  await wait(()=>__star.S.battle&&!__star.S.battle.busy);
  await check('guard turn resolves',()=>__star.S.party[0].guard===0&&__star.S.party[0].hp>0);
  await read(()=>{window.__savedRandom=Math.random;Math.random=()=>0;__star.S.battle.enemy.hp=1;__star.refresh();});
  await page.click('[data-cmd=capture]',{label:'抛出藤环捕捉星兽'});
  await wait(()=>__star.S.panelOpen,undefined,9000);
  await read(()=>{Math.random=__savedRandom;delete window.__savedRandom;});
  await check('capture gameplay preserved',()=>__star.S.captured.badger&&__star.S.rings===4&&__star.S.party.some(p=>p.id==='badger'));
  await page.click('[data-continue]',{label:'结束结算继续探索'});
  await wait(()=>__star.S.scene==='world'&&!__star.S.flowPending);
  await check('battle returns to world',()=>!__star.S.battle&&!__star.S.panelOpen);
  await read(()=>{__star.start();__star.talkElder();__star.closeDialog();__star.goTitle();});
  await page.waitForTimeout(200);
  await check('dialog reset callback invalidated',()=>__star.S.scene==='title'&&!__star.S.dialogOpen&&__star.S.party.length===0);
  await read(()=>{__star.start();__star.S.flags.metElder=true;__star.goGate(__star.MAPS.camp.objects.find(o=>o.type==='gate'));__star.goTitle();});
  await page.waitForTimeout(500);
  await check('gate reset callback invalidated',()=>__star.S.scene==='title'&&__star.S.mapId==='camp'&&!document.getElementById('fade').classList.contains('on'));
  await read(()=>{__star.start();__star.S.flags.metElder=true;__star.S.flags.gotStarter=true;__star.S.party=[__star.makePet('porc',3)];});
  for(const map of ['redhill','moss','geode','camp']){
    await read(id=>__star.goGate({to:id,spawn:__star.MAPS[id].spawn}),map);
    await wait(id=>__star.S.mapId===id&&!__star.S.transition,map);
    await check('map transition '+map,id=>document.getElementById('hudPlace').textContent===__star.MAPS[id].name&&!document.getElementById('fade').classList.contains('on'),map);
    await read(()=>{document.getElementById('areaBanner').classList.remove('on');document.getElementById('toast').classList.remove('on');});
    await shot('argon-map-'+map);
  }
  await read(()=>__star.enterMap('camp',{x:18.5,y:11.5}));
  const gate=await read(()=>({x:19*64-__star.S.camera.x,y:12.2*64-__star.S.camera.y-28}));
  await page.mouse.click(gate.x,gate.y,{label:'点击传送门切换场景'});
  await wait(()=>__star.S.mapId==='redhill'&&!__star.S.transition);
  await check('pointer gate changes map',()=>__star.S.mapId==='redhill');
  await read(()=>{__star.enterMap('camp',{x:10.5,y:7.5});__star.say([{who:'苔爷爷',portrait:'elder',text:'点击地面就能出发，伙伴会跟着你。去红丘把第一道星痕带回来吧。'}]);});
  await wait(()=>document.getElementById('dlgText').textContent.endsWith('吧。'));
  for(const [width,height] of [[390,844],[320,740],[1000,760]]){
    await page.cdp('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<621});
    await wait(w=>innerWidth===w,width);
    await stableCamera();
    await check('viewport layout '+width,({width,height})=>{
      const rect=document.getElementById('classicDock').getBoundingClientRect();
      return document.documentElement.scrollWidth===width&&rect.left>=0&&rect.right<=width&&rect.bottom<=height+1&&Array.from(document.querySelectorAll('#cmdMain button')).every(b=>{const r=b.getBoundingClientRect();return r.left>=0&&r.right<=width&&r.bottom<=height+1;});
    },{width,height});
    await check('dialog avoids shortcuts '+width,()=>document.getElementById('dlgLayer').getBoundingClientRect().right<=document.querySelector('.quick-items').getBoundingClientRect().left+1);
    if(width===390)await shot('argon-mobile');
  }
  await check('no runtime errors',()=>__qaErrors.length===0);
}catch(error){
  checks.push({name:'execution completed',passed:false,error:String(error?.stack||error)});
  throw error;
}finally{
  await fs.writeFile(evidence+'/ego-verification.json',JSON.stringify({passed:checks.length>0&&checks.every(c=>c.passed),checks},null,2));
  console.log({checks:checks.length,report:evidence+'/ego-verification.json'});
}

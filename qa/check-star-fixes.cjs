// Deterministic regressions for navigation and deferred story transitions.
// DOM rectangles are fixtures; rendered layout acceptance is recorded separately by Ego.
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),html=fs.readFileSync(path.join(root,'幻想大陆-星兽纪.html'),'utf8');
function boot(){
  let clock=0,seq=0;const timers=new Map(),els=new Map();
  const context=new Proxy({},{get(o,k){if(k in o)return o[k];if(k==='getImageData')return()=>({data:new Uint8ClampedArray(36*36*4),width:36,height:36});if(k==='measureText')return()=>({width:20});if(k==='createLinearGradient'||k==='createRadialGradient')return()=>({addColorStop(){}});return()=>{};},set(o,k,v){o[k]=v;return true;}});
  function element(id=''){
    const classes=new Set(),attrs={};
    return {width:64,height:76,clientWidth:64,clientHeight:76,style:{},dataset:{},textContent:'',innerHTML:'',firstChild:{nodeValue:''},firstElementChild:{},
      classList:{add(...xs){xs.forEach(x=>classes.add(x));},remove(...xs){xs.forEach(x=>classes.delete(x));},toggle(x,on){if(on===undefined)on=!classes.has(x);on?classes.add(x):classes.delete(x);},contains:x=>classes.has(x)},
      getContext:()=>context,getBoundingClientRect:()=>id==='enemy'?{x:550,y:104,left:550,top:104,width:236,height:74.578125,bottom:178.578125,right:786}:{x:0,y:0,left:0,top:0,width:800,height:350,right:800,bottom:350},
      addEventListener(){},querySelectorAll:()=>[],querySelector:()=>element(),getAttribute:k=>attrs[k]||id,setAttribute(k,v){attrs[k]=v;},appendChild(){},remove(){}};
  }
  const get=id=>{if(!els.has(id))els.set(id,element(id));return els.get(id);};
  const document={body:element(),hidden:false,createElement:()=>element(),getElementById:get,querySelector:s=>s==='.enemy-plate'?get('enemy'):null,querySelectorAll:()=>[],addEventListener(){}};
  const sandbox={document,console,performance:{now:()=>clock},navigator:{},location:{search:'?qa=1'},URLSearchParams,Uint8ClampedArray,Map,Set,Math,Date,Promise,requestAnimationFrame:()=>0,setTimeout(fn,ms=0){const id=++seq;timers.set(id,{fn,due:clock+ms});return id;},clearTimeout:id=>timers.delete(id),setInterval:()=>++seq,clearInterval(){},addEventListener(){},devicePixelRatio:1,innerWidth:800,innerHeight:500,matchMedia:()=>({matches:false,addEventListener(){}})};
  sandbox.window=sandbox;vm.createContext(sandbox);
  for(const match of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)){
    const source=match[1].replace(/\ninit\(\);\s*\}\)\(\);/,'\nwindow.__fixTest={updateWorld,canStand,openPanelKind,closePanel,winBattle,layoutBattle,resetGame};\ninit();\n})();');
    vm.runInContext(source,sandbox,{timeout:10000});
  }
  function advance(ms){const end=clock+ms;for(;;){const item=[...timers].filter(([,v])=>v.due<=end).sort((a,b)=>a[1].due-b[1].due)[0];if(!item)break;timers.delete(item[0]);clock=item[1].due;item[1].fn();}clock=end;}
  return {...sandbox.__star,...sandbox.__fixTest,get,advance};
}
const checks=[];
function test(name,fn){try{fn();checks.push({name,passed:true});}catch(e){checks.push({name,passed:false,error:e.stack});}}
function openWorld(a){a.start();a.S.flags.metElder=true;a.S.dialogOpen=false;a.S.flowPending=false;a.S.scene='world';a.S.party=[a.makePet('porc',7)];}
function navigation(a,rows){a.MAPS.test={...a.MAPS.camp,w:12,h:8,pxW:768,pxH:512,grid:rows||Array.from({length:8},()=>Array(12).fill('.')),objects:[],wild:null};a.S.mapId='test';a.S.player.x=2.2;a.S.player.y=3.5;}
test('rapid repeat clicks progress without backward movement',()=>{
  const a=boot();openWorld(a);navigation(a);let previous=a.S.player.x;
  for(let frame=0;frame<180;frame++){if(frame%3===0)a.travel(9.5,3.5);a.updateWorld(1/60);assert(a.S.player.x>=previous-.001,'player moved back');previous=a.S.player.x;}
  assert(Math.hypot(a.S.player.x-9.5,a.S.player.y-3.5)<.03);
});
test('changed goals do not recenter a moving player',()=>{
  const a=boot();openWorld(a);navigation(a);let previous=a.S.player.x;
  for(let frame=0;frame<120;frame++){if(frame%5===0)a.travel(frame%10?11.5:10.5,3.5);a.updateWorld(1/60);assert(a.S.player.x>=previous-.001);previous=a.S.player.x;}
  a.travel(5.5,5.5);for(let frame=0;frame<180;frame++)a.updateWorld(1/60);
  assert(Math.hypot(a.S.player.x-5.5,a.S.player.y-5.5)<.03);
});
test('replanning still respects walls and character collision radius',()=>{
  const a=boot();openWorld(a);const rows=Array.from({length:8},()=>Array(12).fill('.'));
  for(let y=1;y<6;y++)rows[y][5]='#';navigation(a,rows);
  for(let frame=0;frame<480;frame++){if(frame%4===0)a.travel(9.5,3.5);a.updateWorld(1/60);assert(a.canStand(a.S.player.x,a.S.player.y),'crossed a blocked tile');}
  assert(Math.hypot(a.S.player.x-9.5,a.S.player.y-3.5)<.03);
});
test('dialogue continuation blocks panel entry until the story settles',()=>{
  const a=boot();openWorld(a);a.S.party=[];a.S.flags.metElder=false;a.talkElder();a.closeDialog();
  assert(a.S.flowPending);a.openPanelKind('party');assert(!a.S.panelOpen);
  a.advance(80);assert.equal(a.S.party.length,1);assert(a.S.dialogOpen);assert(!a.S.panelOpen);
  a.closeDialog();a.advance(80);a.openPanelKind('party');assert(a.S.panelOpen);
});
test('victory to story gap blocks panels for the entire deferred continuation',()=>{
  const a=boot();openWorld(a);a.startBattle({kind:'story',story:'snail',species:'snail',lv:4});a.winBattle('capture');a.advance(650);assert(a.S.panelOpen);
  a.closePanel();a.advance(60);assert.equal(a.S.scene,'world');assert(a.S.flowPending);
  a.openPanelKind('party');assert(!a.S.panelOpen);a.advance(180);assert(a.S.dialogOpen);assert(!a.S.panelOpen);
});
test('title reset invalidates deferred story work',()=>{
  const a=boot();openWorld(a);a.talkElder();a.closeDialog();a.goTitle();a.advance(2000);
  assert.equal(a.S.scene,'title');assert(!a.S.dialogOpen&&!a.S.panelOpen&&!a.S.flowPending);assert.equal(a.S.party.length,0);
});
test('map transition preserves a healthy mounted companion',()=>{
  const a=boot();openWorld(a);a.S.riding=true;a.goGate({to:'redhill',spawn:{x:2.5,y:12.5}});a.advance(380);
  assert.equal(a.S.mapId,'redhill');assert(a.S.riding);assert.equal(a.S.active,0);assert(!a.S.transition);
});
test('battle header controls expose their unavailable state',()=>{
  const a=boot();openWorld(a);a.startBattle({species:'lizard',lv:5});a.refresh();
  for(const id of ['btnParty','btnCodex','btnHelp']){assert(a.get(id).disabled);assert(a.get(id).title.includes('战斗中不可用'));}
});
test('battle geometry clears the recorded 800x500 plate rectangle',()=>{
  const a=boot();openWorld(a);a.startBattle({species:'lizard',lv:5});const l=a.S.battle.layout;
  assert(l.ey-84*l.enemyScale>=178.578125+13.9);assert(l.ey+6*l.enemyScale<350);
});
const failed=checks.filter(c=>!c.passed);console.log(JSON.stringify({passed:failed.length===0,checks},null,2));process.exitCode=failed.length?1:0;

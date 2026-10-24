// Bounded, deterministic contract check; actual visual/gameplay QA uses Ego Lite.
// The baseline includes the navigation fix covered by check-star-fixes.cjs (2026-10-24).
const fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto'),path=require('node:path');
const root=process.cwd(), source=fs.readFileSync(path.join(root,'幻想大陆-星兽纪.html'),'utf8');
const checks=[],failed=[];
function test(id,fn){try{fn();checks.push({id,pass:true});}catch(e){checks.push({id,pass:false,error:e.message});failed.push(id);}}
function assert(v,msg){if(!v)throw new Error(msg);}
let api;
function boot(html){
  const ctx=new Proxy({}, {get(o,k){if(k in o)return o[k];if(k==='getImageData')return()=>({data:new Uint8ClampedArray(36*36*4),width:36,height:36});if(k==='measureText')return()=>({width:20});if(k==='createLinearGradient'||k==='createRadialGradient')return()=>({addColorStop(){}});return()=>{};},set(o,k,v){o[k]=v;return true;}});
  const els=new Map();
  const element=()=>{const attrs={};return {width:64,height:76,clientWidth:64,clientHeight:76,style:{},dataset:{},classList:{add(){},remove(){},toggle(){},contains(){return false;}},firstChild:{nodeValue:''},firstElementChild:{},getContext:()=>ctx,getBoundingClientRect:()=>({width:1280,height:800,x:0,y:0}),addEventListener(){},querySelectorAll:()=>[],querySelector:()=>null,getAttribute:k=>attrs[k]??null,setAttribute(k,v){attrs[k]=String(v);},appendChild(){},remove(){}};};
  const doc={body:element(),hidden:false,createElement:()=>element(),getElementById(id){if(!els.has(id))els.set(id,element());return els.get(id);},querySelectorAll:()=>[],querySelector:()=>null,addEventListener(){}};
  const sandbox={document:doc,console,performance:{now:()=>0},navigator:{},location:{search:'?qa=1'},URLSearchParams,Uint8ClampedArray,Map,Set,Math,Date,Promise,requestAnimationFrame:()=>0,setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},addEventListener(){},devicePixelRatio:1,innerWidth:1280,innerHeight:800,matchMedia:()=>({matches:false,addEventListener(){}})};
  sandbox.window=sandbox;vm.createContext(sandbox);
  for(const match of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g))vm.runInContext(match[1],sandbox,{timeout:10000});
  return sandbox.__star;
}
test('html-structure',()=>{const ids=[...source.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert(new Set(ids).size===ids.length,'duplicate DOM ids');for(const id of ['game','hud','classicDock','dlgLayer','panelLayer','cmdMain','heroAvatar','petAvatar','heroHpFill','heroSpFill','petHpFill','petSpFill','quickPotion','quickRing'])assert(ids.includes(id),'missing '+id);});
test('runtime-initialization',()=>{api=boot(source);assert(api&&api.S&&api.S.scene==='title','QA API or title unavailable');});
test('required-commands',()=>{for(const cmd of ['attack','defend','skill','item','capture','switch','flee','ride','interact'])assert(source.includes('data-cmd="'+cmd+'"'),'missing '+cmd);});
test('no-body-component-collision',()=>{assert(!/(?:^|[}\s])\.dialog\s*\{/.test(source),'body.dialog collision');assert(!/(?:^|[}\s])\.panel\s*\{/.test(source),'body.panel collision');});
const frozen=['travel','goGate','start','goTitle','say','closeDialog','advance','makePet','startBattle','damage','heal'];
function signature(a){return {functions:Object.fromEntries(frozen.map(n=>[n,crypto.createHash('sha256').update(String(a[n]).replace(/\r\n/g,'\n')).digest('hex')])),species:JSON.parse(JSON.stringify(a.SPECIES)),mapRows:Object.fromEntries(Object.entries(a.MAPS).map(([k,m])=>[k,m.rows]))};}
if(process.argv.includes('--capture-baseline')){fs.writeFileSync(path.join(root,'qa/argon-core-baseline.json'),JSON.stringify(signature(api),null,2)+'\n');console.log('baseline captured');process.exit(0);}
test('gameplay-contract-preserved',()=>{const before=JSON.parse(fs.readFileSync(path.join(root,'qa/argon-core-baseline.json'),'utf8')),after=signature(api);for(const n of frozen)assert(before.functions[n]===after.functions[n],'behavior function changed: '+n);assert(JSON.stringify(before.species)===JSON.stringify(after.species),'species/stats/lore changed');assert(JSON.stringify(before.mapRows)===JSON.stringify(after.mapRows),'map collision layout changed');});
const report={passed:failed.length===0,checks,failed_cases:failed};fs.writeFileSync(path.join(root,'argon-check-result.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));process.exit(failed.length?1:0);

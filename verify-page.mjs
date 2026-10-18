// 话页通用验证：语法 + 运行时执行 + 几何自检
// 用法：node verify-page.mjs <页面文件> <生物绘制函数名> [--geo]
import { readFileSync } from 'node:fs';

const file = process.argv[2];
const beastFn = process.argv[3] || 'drawBeast';

const html = readFileSync(file, 'utf8');
let script = html.match(/<script>([\s\S]*?)<\/script>/)[1];

// ============ 第 1 层：语法 ============
let syntaxOk = true;
try { new Function(script); } catch (e) { syntaxOk = false; console.error('✗ 语法错误: ' + e.message); }
console.log('【语法】' + (syntaxOk ? '✓ 通过' : '✗ 失败'));
if (!syntaxOk) process.exit(1);

// ============ 第 2 层：运行时（桩化 DOM/Canvas） ============
const CALL = new RegExp('(\\b' + beastFn + '\\(ctx,[^)]*\\);)');
let beastStart = -1, beastEnd = -1, beastM = null;
if (CALL.test(script)) {
  script = script.replace(CALL, '__beastStart();$1__beastEnd();');
} else {
  console.log('【运行时】⚠ 未找到 ' + beastFn + ' 调用点，跳过几何插桩');
}

let trace = [], stack = [], M = [1, 0, 0, 1, 0, 0], curFill = '', calls = 0;
global.__beastStart = () => { beastStart = trace.length; beastM = M.slice(); };
global.__beastEnd = () => { beastEnd = trace.length; };

function mul(m, n) {
  return [m[0]*n[0]+m[2]*n[1], m[1]*n[0]+m[3]*n[1],
          m[0]*n[2]+m[2]*n[3], m[1]*n[2]+m[3]*n[3],
          m[0]*n[4]+m[2]*n[5]+m[4], m[1]*n[4]+m[3]*n[5]+m[5]];
}
const ap = (x, y) => [M[0]*x+M[2]*y+M[4], M[1]*x+M[3]*y+M[5]];
function inv(m, x, y) {
  const det = m[0]*m[3]-m[1]*m[2], dx = x-m[4], dy = y-m[5];
  return [(dx*m[3]-dy*m[2])/det, (dy*m[0]-dx*m[1])/det];
}

function makeCtx() {
  const grad = { addColorStop() {} };
  const t = {
    canvas: null,
    createLinearGradient: () => grad, createRadialGradient: () => grad,
    measureText: () => ({ width: 10 }),
    save() { stack.push(M.slice()); },
    restore() { if (stack.length) M = stack.pop(); },
    setTransform(a,b,c,d,e,f) { M = [a,b,c,d,e,f]; },
    transform(a,b,c,d,e,f) { M = mul(M,[a,b,c,d,e,f]); },
    translate(x,y) { M = mul(M,[1,0,0,1,x,y]); },
    scale(x,y) { M = mul(M,[x,0,0,y,0,0]); },
    rotate(r) { const c=Math.cos(r), s=Math.sin(r); M = mul(M,[c,s,-s,c,0,0]); },
    arc(x,y,r) { calls++; const p=ap(x,y); trace.push({op:'arc',x:p[0],y:p[1],r:r*Math.abs(M[0]),fill:curFill}); },
    ellipse(x,y,rx,ry) { calls++; const p=ap(x,y); trace.push({op:'ellipse',x:p[0],y:p[1],r:Math.max(rx,ry)*Math.abs(M[0]),fill:curFill}); },
    // 路径点也需记录，否则纯曲线绘制的部件（如腿）会漏测
    moveTo(x,y) { calls++; const p=ap(x,y); trace.push({op:'moveTo',x:p[0],y:p[1],r:0,fill:curFill}); },
    lineTo(x,y) { calls++; const p=ap(x,y); trace.push({op:'lineTo',x:p[0],y:p[1],r:0,fill:curFill}); },
    quadraticCurveTo(cx,cy,x,y) {
      calls++; const p=ap(x,y), q=ap(cx,cy);
      trace.push({op:'quad',x:p[0],y:p[1],r:0,fill:curFill,cx:q[0],cy:q[1]});
    },
    bezierCurveTo(c1x,c1y,c2x,c2y,x,y) {
      calls++; const p=ap(x,y), q1=ap(c1x,c1y), q2=ap(c2x,c2y);
      trace.push({op:'bez',x:p[0],y:p[1],r:0,fill:curFill,cx:q1[0],cy:q1[1],cx2:q2[0],cy2:q2[1]});
    },
    rect() { calls++; }, fillRect() { calls++; }, strokeRect() { calls++; },
    clip() {},
    beginPath() {}, closePath() {}, fill() {}, stroke() {}, arcTo() {},
    fillText() {}, strokeText() {}, setLineDash() {}, getImageData: () => ({ data: [] })
  };
  return new Proxy(t, {
    set(o, p, v) { if (p === 'fillStyle') curFill = typeof v === 'string' ? v : '[grad]'; o[p] = v; return true; },
    get(o, p) { return o[p]; }
  });
}

const listeners = new Map();
function makeEl(id, rect) {
  const el = {
    id, width: 0, height: 0, style: {},
    classList: { _s:new Set(), add(c){this._s.add(c);}, remove(c){this._s.delete(c);}, contains(c){return this._s.has(c);} },
    getContext: () => makeCtx(),
    getBoundingClientRect: () => rect,
    setAttribute() {}, getAttribute: () => null, appendChild() {},
    querySelector: (s) => s === 'canvas' ? makeEl(id+'-t', {width:160,height:120,left:0,top:0}) : null,
    addEventListener(t2, fn) { const k=id+':'+t2; if(!listeners.has(k)) listeners.set(k,[]); listeners.get(k).push(fn); }
  };
  Object.defineProperty(el,'textContent',{get:()=>el._t,set(v){el._t=v;}});
  Object.defineProperty(el,'innerHTML',{get:()=>el._h,set(v){el._h=v;}});
  Object.defineProperty(el,'value',{get:()=>el._v,set(v){el._v=v;}});
  return el;
}

const R = { width:800, height:500, left:0, top:0 };
const els = new Map();
global.document = {
  getElementById(id) { if(!els.has(id)) els.set(id, makeEl(id,R)); return els.get(id); },
  createElement: () => makeEl('dyn',{width:160,height:120,left:0,top:0}),
  addEventListener() {}, fonts:{load:()=>Promise.resolve()}, body: makeEl('body',R)
};
global.window = { devicePixelRatio:2, addEventListener() {}, ResizeObserver: class { observe() {} } };
global.ResizeObserver = global.window.ResizeObserver;
global.performance = { now: () => 0 };
global.requestAnimationFrame = () => 1;

try { new Function(script)(); }
catch (e) { console.error('✗ 启动失败: ' + e.message + '\n' + e.stack); process.exit(1); }
console.log('【运行时】✓ 启动成功，绘制调用 ' + calls + ' 次');

function fire(id, type, ev) { (listeners.get(id+':'+type)||[]).forEach(fn => fn(ev||{})); }
function render(tv) {
  trace = []; stack = []; M = [1,0,0,1,0,0]; curFill = ''; beastStart = beastEnd = -1;
  document.getElementById('seek')._v = tv;
  fire('seek','input',{});
  if (beastStart < 0) return null;
  return trace.slice(beastStart, beastEnd).map(p => {
    const [lx,ly] = inv(beastM, p.x, p.y);
    return { op:p.op, wx:p.x, wy:p.y, lx, ly, r:p.r/Math.abs(beastM[0]), fill:p.fill };
  });
}

// 跑完 4 幕与全部交互
const marks = [0,3,6,8.5,12,15,19,21.8,24.5];
try {
  marks.forEach(v => { document.getElementById('seek')._v=v; fire('seek','input',{}); });
  fire('stageFrame','pointermove',{clientX:400,clientY:380});
  fire('stageFrame','pointermove',{clientX:470,clientY:300});
  fire('stageFrame','pointerdown',{clientX:368,clientY:250});
  fire('stageFrame','pointerdown',{clientX:180,clientY:430});
  fire('stageFrame','pointerleave',{});
  fire('play','click',{});
  for(let i=0;i<4;i++) fire('btnStamp'+i,'click',{});
  ['fltColor','fltMono','fltBlue'].forEach(id=>fire(id,'click',{}));
  marks.forEach(v => { document.getElementById('seek')._v=v; fire('seek','input',{}); });
} catch (e) { console.error('✗ 交互失败: ' + e.message + '\n' + e.stack); process.exit(1); }
console.log('【运行时】✓ 4 幕分镜 + 7 条交互路径全部通过');

// ============ 第 3 层：几何自检 ============
if (!process.argv.includes('--geo')) { console.log('\n结论：通过（未启用几何自检）'); process.exit(0); }

console.log('\n【几何自检】画布 800×500');
const MARKS = {'第1幕 t=3':3, '第2幕 t=8.5':8.5, '第3幕 t=15':15, '第4幕 t=21.8':21.8};
let pass=0, fail=0;
function chk(ok, label, detail) {
  console.log('  ' + (ok?'✓':'✗') + ' ' + label + (detail?'  ['+detail+']':''));
  ok?pass++:fail++;
}

for (const [label, tv] of Object.entries(MARKS)) {
  console.log('【' + label + '】');
  const b = render(tv);
  if (!b || !b.length) { chk(false,'生物绘制点采集','0 个'); continue; }
  const wx=b.map(p=>p.wx), wy=b.map(p=>p.wy);
  const minX=Math.min(...wx), maxX=Math.max(...wx), minY=Math.min(...wy), maxY=Math.max(...wy);
  chk(minX>0 && maxX<800 && minY>0 && maxY<500, '生物完整落在画框内（无裁切）',
    'x['+minX.toFixed(0)+','+maxX.toFixed(0)+'] y['+minY.toFixed(0)+','+maxY.toFixed(0)+']');
  // 结构：至少存在明显的上下分布（背钟在上、腿在下）
  const ly=b.map(p=>p.ly);
  chk(Math.min(...ly) < -100, '高耸背钟位于躯干上方', '局部最低 y='+Math.min(...ly).toFixed(0));
  chk(Math.max(...ly) > -20, '腿部延伸至着地线附近', '局部最高 y='+Math.max(...ly).toFixed(0));
  const lx=b.map(p=>p.lx);
  chk(Math.max(...lx)-Math.min(...lx) > 150, '躯干横向跨度合理',
    '跨度 '+(Math.max(...lx)-Math.min(...lx)).toFixed(0));
  console.log('');
}
console.log('结果：通过 ' + pass + ' 项，失败 ' + fail + ' 项');
process.exit(fail?1:0);

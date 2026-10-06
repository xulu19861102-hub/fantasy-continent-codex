// 构建单文件分发版：把 index.html（首页）与全部生物话页打包成一个自包含 HTML。
// 用法：在本目录执行  node build-single.mjs
// 以后新增/修改话页后重跑一次即可同步更新单文件版。
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';

const OUT = '幻想大陆生灵图鉴-单文件版.html';

const shell = readFileSync('index.html', 'utf8');
const names = readdirSync('.').filter(f => f.endsWith('.html') && f !== 'index.html' && f !== OUT);
if (names.length !== 18) console.warn('注意：生物页数量为 ' + names.length + '（此前为 18），如新增话页请同步更新首页卡片。');

// 读取全部话页原文
const pages = {};
for (const n of names) pages[n] = readFileSync(n, 'utf8');

// 内嵌转义（不改变字符串值，仅防止提前终止外层 <script>）：
//   </   ->  <\/     以及     <!--  ->  <\!--
const pagesSrc =
  '/*PAGES-START*/const PAGES=' +
  JSON.stringify(pages).replace(/<\//g, '<\\/').replace(/<!--/g, '<\\!--') +
  ';/*PAGES-END*/';

// 1) 卡片链接改为打开内嵌查看器
let out = shell.replace(/href="([^"]+?\.html)"/g, (m, f) => 'href="#" data-page="' + f + '"');

// 2) 注入查看器样式
const viewerCss = `<style>
/* ---------- 话页查看器（单文件版） ---------- */
#viewer{position:fixed;inset:0;z-index:60;display:none;flex-direction:column;background:#04060d}
#viewer.open{display:flex}
.vbar{flex:none;display:flex;align-items:center;gap:12px;
  padding:calc(8px + env(safe-area-inset-top,0px)) 14px 8px;
  background:linear-gradient(180deg,rgba(10,15,36,.98),rgba(10,15,36,.88));
  border-bottom:1px solid rgba(139,233,255,.18)}
#vback{font-family:var(--mono);font-weight:700;font-size:13px;letter-spacing:.08em;color:#04060d;
  background:linear-gradient(90deg,var(--gold),var(--cyan));border:0;border-radius:999px;
  padding:8px 16px;cursor:pointer;flex:none}
#vback:active{transform:translateY(1px)}
#vtitle{font-family:var(--chunk);font-size:1.3rem;letter-spacing:.12em;color:#fdfbe8;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.vtag{margin-left:auto;font-family:var(--mono);font-size:10.5px;letter-spacing:.12em;color:var(--faint);flex:none}
@media (max-width:560px){.vtag{display:none}}
#vframe{flex:1;width:100%;border:0;background:#000}
</style>`;
out = out.replace('</head>', viewerCss + '\n</head>');

// 3) 注入查看器结构 + 内嵌数据与逻辑
const viewerHtml = `<div id="viewer" aria-hidden="true" role="dialog" aria-label="生物图鉴话页">
  <div class="vbar">
    <button id="vback" type="button">← 返回图鉴</button>
    <span id="vtitle"></span>
    <span class="vtag">全部图鉴已内嵌 · 可整文件分发</span>
  </div>
  <iframe id="vframe" title="生物图鉴话页"></iframe>
</div>`;

const viewerJs = `<script>
(function(){
'use strict';
${pagesSrc}
var v = document.getElementById('viewer'),
    frame = document.getElementById('vframe'),
    vt = document.getElementById('vtitle'),
    vb = document.getElementById('vback');
var isOpen = false, pushed = false;
function cleanup(){
  v.classList.remove('open');
  v.setAttribute('aria-hidden','true');
  frame.srcdoc = '';
  document.body.classList.remove('viewing');
}
function show(name){
  frame.srcdoc = PAGES[name] || '';
  vt.textContent = name.replace(/\\.html$/,'');
  v.classList.add('open');
  v.setAttribute('aria-hidden','false');
  document.body.classList.add('viewing');
  isOpen = true;
  if(!pushed){
    try{ history.pushState({v:true},''); pushed = true; }
    catch(e){ pushed = false; }
  }
}
/* 点击/Esc 关闭：直接清理 UI，不依赖浏览器历史；若曾压入历史则退掉，
   保证安卓返回手势随后不会误关首页 */
function closeViewer(){
  if(!isOpen) return;
  cleanup();
  isOpen = false;
  if(pushed){
    pushed = false;
    try{ history.back(); }catch(e){}
  }
}
/* 系统返回手势/按键：经 popstate 关闭 */
window.addEventListener('popstate', function(){
  if(isOpen){ cleanup(); isOpen = false; }
  pushed = false;
});
Array.prototype.forEach.call(document.querySelectorAll('[data-page]'), function(a){
  a.addEventListener('click', function(e){ e.preventDefault(); show(a.getAttribute('data-page')); });
});
vb.addEventListener('click', closeViewer);
document.addEventListener('keydown', function(e){
  if((e.key === 'Escape' || e.key === 'Esc') && isOpen) closeViewer();
});
})();
</script>`;
out = out.replace('</body>', viewerHtml + '\n' + viewerJs + '\n</body>');

writeFileSync(OUT, out, 'utf8');

/* ---------- 自校验 ---------- */
const built = readFileSync(OUT, 'utf8');

// A) 内嵌内容与原文件逐字节一致
const mP = built.match(/\/\*PAGES-START\*\/([\s\S]*?)\/\*PAGES-END\*\//);
const restored = (new Function('return ' + mP[1].replace(/^const PAGES=/, '').replace(/;$/, '')))();
let identical = true;
for (const n of names) {
  if (restored[n] !== readFileSync(n, 'utf8')) { identical = false; console.error('内嵌不一致: ' + n); }
}

// B) 链接转换完整：18 个 data-page，无残留 .html 链接
const linked = (built.match(/data-page="/g) || []).length;
const leftover = /href="[^"]*\.html"/.test(built);

// C) 全部内联脚本语法可解析（不执行）
const bodies = [...built.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
let syntaxOk = true;
for (const b of bodies) { try { new Function(b); } catch (e) { syntaxOk = false; console.error('脚本语法错误: ' + e.message); } }

console.log('生物页内嵌: ' + Object.keys(restored).length + ' / 与原文件一致: ' + identical);
console.log('卡片 data-page: ' + linked + ' / 残留文件链接: ' + leftover);
console.log('内联脚本语法: ' + (syntaxOk ? 'OK (' + bodies.length + ' 段)' : 'FAIL'));
console.log('输出: ' + OUT + ' (' + (statSync(OUT).size / 1024).toFixed(1) + ' KB)');

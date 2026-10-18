# 幻想大陆生灵图鉴 · 交接说明

> 面向下一位接手开发的人（或 AI）。本文只讲**怎么在这个项目里正确干活**，
> 以及**哪些坑已经踩过、不要再踩**。读完这一份即可直接开工。
>
> 最后更新：2026-10-18 · 本次可见版本：23 个话页 / 6 境 / 54 秒序章 / 8 分钟试玩 / 单文件版约 1.1 MB

---

## 本次新增篇与验证补充（优先于下方历史数量）

- 新增 `寻泉萤草.html`、`幽谷聆芽.html`、`诱光芽蠕.html`。第二只名字为草字头“芽”。
- 本地无未提交内容，安全快进到远端 `a05ab15` 后开始制作；仅可见原有 20 只，用户其余未上传生灵未整合。三只使用新增篇名称案号，避免占用第 19–50 话。
- 首页现为 23 张卡；林泽 5、旷野 3、幽域 3，其余与原版相同。原有 20 话与序章源文件不动。
- `build-single.mjs` 现从源首页真实链接收集话页、比较卡片数量，不再硬编码 20；支持 `--index=... --out=...`，必须从源页面重建。
- 新页使用 `qa/verify-new-creatures.cjs` 进行真实浏览器、控件、缩略图、响应式检查；使用 `qa/verify-geometry.cjs` 追踪实际 Canvas 路径，桌面与手机各 100 帧/只。**原 `verify-page.mjs --geo` 的高耸背钟与腿断言仅适用沸泉晶钟兽，不用于新三只。**
- 新页暴露 `window.__codex.seek/pause/play/state/render` 及 `?t=...&paused=1`，用于复查。`qa` 中截图与报告是本次用户要求的交付证据，仅在本地与 Library 交付包保留，不提交至仓库。
- 三只独立合集源：`extras/新增篇首页.html`；产物：`deliverables/新增三种动态图鉴-单文件版.html`。
- 完整合集内嵌 25 页（23 只＋原序章＋《星兽纪》试玩）；新增合集内嵌 3 页。本次按用户授权合并至 `main`，不另行启动部署。

## 一、这是什么

一座悬浮于夜空之海的幻想大陆「图鉴」。六境（**苍穹 / 碧海 / 林泽 / 遗迹 / 旷野 / 幽域**）各孕育虚构生灵，
每只生灵一页自包含的「**动态漫画短片 + 物种档案**」话页。

- 纯静态、**零外部依赖**（除 Google Fonts，离线自动回退），直接双击 HTML 即可运行
- 全部画面由 **原生 Canvas 2D 逐帧绘制**，不用图片、不用贴图、不引第三方库
- 另有一支 **54 秒序章动画**（同样纯 Canvas 绘制），用五幕讲完大陆与六境，可跳过
- 另有一款 **8 分钟试玩游戏《星兽纪》**（`幻想大陆-星兽纪.html`）：四张 Canvas 地图、星兽捕捉、回合战斗与队伍/图鉴，玩法参考石器时代，素材与世界观沿用本图鉴
- 另有「单文件分发版」，把首页 + 序章 + 试玩 + 全部话页内嵌成一个 HTML，方便直接发给别人

---

## 二、文件结构

| 文件 | 作用 | 能不能手改 |
| --- | --- | --- |
| `index.html` | 图鉴首页（**唯一编辑源**）：星海 canvas、极光、漂浮岛视差、六境总览、生境筛选、23 张生灵卡片、试玩入口、序章入口 | ✅ 改这个 |
| `幻想大陆-星兽纪.html` | 8 分钟试玩游戏（单文件、Canvas、程序化音乐） | ✅ 改这个 |
| `幻想大陆-序章.html` | 54 秒介绍动画（五幕时间轴、播放控制、六境巡礼、卡片扇） | ✅ 改这个 |
| `<生灵名>.html` × 23 | 各生物话页（含新增篇 3 只），每页自包含 | ✅ 改这个 |
| `extras/新增篇首页.html` | 新增三只独立合集源首页 | ✅ 改这个 |
| `deliverables/新增三种动态图鉴-单文件版.html` | 新增三只独立合集**产物** | ❌ 由脚本生成 |
| `build-single.mjs` | 打包脚本：按首页真实链接收集页面，自动内嵌序章与试玩；支持 `--index/--out` | ✅ 按需改 |
| `幻想大陆生灵图鉴-单文件版.html` | 根目录**构建产物** | ❌ 绝不手改 |
| `qa/*.cjs` | 新增篇的真实浏览器 / 几何 / 合集验证脚本 | ✅ |
| `README.md` | 面向使用者的简短说明 | ✅ |
| `HANDOVER.md` | 本文件，面向开发者 | ✅ |
| `canvas-creature-demo.html` | 早期独立演示页，**不参与打包** | 可忽略 |

**铁律：`index.html` 与话页是唯一编辑源，单文件版永远由脚本生成。**
手改单文件版会在下次构建时被整体覆盖，白干。

---

## 三、三条命令

```bash
node build-single.mjs                      # 重建根目录单文件版（含自校验）
node build-single.mjs --index=extras/新增篇首页.html --out=deliverables/新增三种动态图鉴-单文件版.html
node verify-page.mjs <话页.html> <绘制函数名> --geo   # 验证旧版单个话页
```

`build-single.mjs` 会收集首页里的全部 `.html` 入口，把 `INTRO` / `GAME` 作为额外内嵌页，
其余链接与 `class="card rv"` 卡片数量对齐；三项自校验都必须是期望值：

```
内嵌页数: 25（生物页 23，序章 1，试玩 1） / 与原文件一致: true   ← 逐字节一致
入口 data-page: 26 / 残留文件链接: false                        ← 链接全部转换、无 .html 残留
内联脚本语法: OK (2 段)                                        ← 所有内联脚本可解析
```

> 新增话页时**不需要改任何硬编码阈值**：在首页加卡片和链接后重跑即可；
> 卡片数与话页链接数不一致时脚本会直接抛错。`--index` 指向新增篇首页时，只内嵌该首页链接的 3 页。
> 旧版 `verify-page.mjs --geo` 的断言只适用于原有话页；新增三只请用 `qa/verify-new-creatures.cjs`。

---

## 四、新增一只生物：完整清单

按顺序做，缺一项就会出现「首页有卡但打不开」或「单文件版缺页」：

1. **写话页** `<生灵名>.html`，照抄现有页面的骨架（见第五节）
2. **验证话页**：旧版用 `node verify-page.mjs <生灵名>.html drawBeast --geo`；
   新增篇用 `qa/verify-new-creatures.cjs` + `qa/verify-geometry.cjs`（见第七节）
3. **改首页** `index.html`：
   - 在 `.grid` 里加一张卡片，`data-realm` 填 `sky`/`sea`/`forest`/`ruin`/`wild`/`deep`（全境种填 `all`）
   - 更新 `.stats` 里的「已记录生灵 / 动态图鉴」两个数字
   - 更新对应六境的「常驻 N 种」计数
4. **重建**：`node build-single.mjs`，确认三项自校验都正常
5. **同步 README / HANDOVER**：文件结构表里的数量与话页数
6. **清理**：删掉临时测试脚本、中间产物、参考图

---

## 五、话页骨架（务必照抄）

原有 20 页共用同一套版式，**不要自创风格**。新增三只沿用同一骨架，仅换配色与档案内容。这是项目一致性的根基。

```
<!doctype html><html><head><meta charset=utf8>…   ← 首行内联 reset（照抄）
<title>生灵名 · XX图鉴 · 第 N 话</title>
<link … Google Fonts（IBM Plex Mono + Noto Sans SC + ZCOOL QingKe HuangYou）>
<style>
  :root{ --paper / --ink / 主色 / --chunk / --body / --mono }
  body{ 米色网点纸底 background-image:radial-gradient(…) }
  h1{ 大标题：-webkit-text-stroke:8px var(--ink); paint-order:stroke fill; text-shadow:6px 6px 0 }
  .stage{ aspect-ratio:16/10; border:4px solid var(--ink); box-shadow:8px 8px 0 var(--ink) }
  .cap / .gauge / .hud-pill / .ctl / .chapters / .manga-control-bar / .guide / .tech-spec / .note
  .sfxload{ position:absolute;left:-9999px }   ← 字体预载用，勿删
  .mode-monochrome / .mode-blueprint           ← 两种印刷滤镜
</style>
<body>
<main class="wrap" id="mainWrap">
  <header class="head">  kicker(含 tech-tag) + h1 + .latin  </header>
  <section class="film">
    <div class="stage" id="stageFrame">
      <canvas class="main" id="c"></canvas>
      <div class="cap"><b id="capName"></b><span id="capText"></span></div>
      <div class="gauge" id="gauge"></div>
      <div class="hud-pill"><span class="dot"></span><span>…</span></div>
    </div>
    <div class="ctl"> play / seek / clock </div>
    <nav class="chapters" id="chapters"></nav>   ← 4 格由 JS 生成
  </section>
  <footer class="manga-control-bar"> 4 个 .stamp-btn + 3 个 .filter-btn </footer>
  <section class="guide"> .guide-header + dl(.row×8) + .tech-spec + .note </section>
  <span class="sfxload">拟声词…</span>
</main>
<script>(function(){ 'use strict'; … })();</script>
```

### 必须实现的固定接口

| 名称 | 说明 |
| --- | --- |
| `DUR = 25` | 短片总时长（秒），全系列统一 |
| `scenes` | 4 个分镜 `{t, key, name, text}`；`t` 是起始秒，`key` 是缩略图取样时刻 |
| `INK` / `SFXFONT` | 墨色、拟声字字体常量 |
| `W, H, dpr` | 画布逻辑尺寸；`dpr = Math.min(devicePixelRatio, 2)` |
| `scene(tt, live)` | 全场景绘制。`live=false` 时不画循环淡出（缩略图用） |
| `draw(tt)` | `ctx = mctx; scene(tt, true);` |
| `fit()` | 尺寸自适应：重设 canvas 尺寸 + `setTransform(dpr,…)` + `draw()` + `renderThumbs()` |
| `renderThumbs()` | 用 `scene(scenes[n].key, false)` 画 4 个章节缩略图 |
| `ui()` | 同步字幕、进度条、时钟、仪表、按钮文案 |
| `frame(now)` | rAF 主循环，`dt = min(0.1, …)`，播放时 `t += dt` 并在 `t>=DUR` 时回绕 |
| `updateStamps(idx)` | 章节与印章 `aria-pressed` 联动 |

### 两个易错点

1. **`renderThumbs()` 里必须临时换掉 `W/H/ctx` 再换回来**，否则缩略图会按主画布尺寸绘制：
   ```js
   var sW=W,sH=H,sCtx=ctx;
   thumbs.forEach(function(el,n){ … W=r.width;H=r.height;ctx=c; scene(scenes[n].key,false); });
   W=sW;H=sH;ctx=sCtx;
   ```
2. **`fit()` 必须调用 `renderThumbs()`**，否则首次布局后缩略图是空白。

---

## 六、序章动画（`幻想大陆-序章.html`）

首页「▶ 观看序章动画」进入的 54 秒介绍短片。**纯 Canvas 2D 绘制 + WebAudio 程序化环境音，无视频、无图片、无第三方库**。

### 时间轴

| 秒 | 幕 | 内容 |
| --- | --- | --- |
| 0 – 4.4 | 序 | 星空点亮，一行旁白，坠星落向夜海 |
| 4.4 – 13.2 | 大陆浮现 | 冲击闪光 → 大陆从雾中升起（尖峰状倒悬岩体 + 树线 + 塔火 + 瀑布）→ 题名「幻想大陆」逐字浮现 |
| 13.2 – 40.2 | 六境巡礼 | 六境各 4.5 秒：苍穹（巨鳐）/ 碧海（水母）/ 林泽（雨林）/ 遗迹（齿轮钟楼）/ 旷野（星野风草）/ 幽域（晶洞热泉） |
| 40.2 – 47.4 | 二十页 | 20 张卡片沿弧线展开，数字 6 / 20 / 20 滚动 |
| 47.4 – 54 | 收束 | 远景大陆与上升光点，CTA「翻开图鉴 / 重播」 |

时间轴常量集中在脚本顶部：`DUR` / `OPEN_END` / `REVEAL_END` / `REALM_T0` / `REALM_LEN` / `REALM_END` / `SHOW_END`。
`resolve(t)` 决定当前幕；改任何一段时间后，进度条刻度 `BOUNDS` 会自动重算，但六境固定为 6 × `REALM_LEN`。

### 版式与缩放

- 画面在 **1600×900 设计坐标**里绘制，按 `cover` 铺满视口（`base = max(W/1600, H/900)`）。
- **文字不跟设计坐标走**：`drawText()` 用屏幕坐标 + `fsz()` 夹取字号，所以竖屏不会裁字。
- 竖屏可见设计宽度只有 ~420px，所有横向坐标尽量用 `HX(x)`（`800 + (x-800)*SPREAD`）包一层，
  `SPREAD` 在 `resize()` 里按可见宽度收缩（< 900 设计像素时生效），把装饰元素向中轴收拢。
  **新增场景元素时记得用 HX()**，否则手机上看不见。
- 装饰元素两侧可以任性，**主体与焦点必须落在中轴附近**。

### 每幕函数与文案

- `drawOpen` / `drawReveal`（含 `drawContinent`）/ `drawSkyRealm` / `drawSeaRealm` / `drawForestRealm` /
  `drawRuinRealm` / `drawWildRealm` / `drawDeepRealm` / `drawShowcase` / `drawClose`
- 文案全部在 `drawOpenText` / `drawRevealText` / `drawRealmText` / `drawShowText`；六境名称与描述取自 `REALMS` 数组。
- 公用件：`drawIsle`（漂浮岛）、`drawManta`（巨鳐）、`drawJelly`（水母）、`drawGear`、`drawCrystals`、`drawMoon`、`puff`（蒸汽柔边贴图）。

### 控制与调试

| 入口 | 说明 |
| --- | --- |
| 空格 / ← → / Home / Esc | 播放暂停 / ±5 秒（Shift ±10）/ 回到开头 / 跳过序章 |
| 进度条 | 可点击、可拖动，刻度对应幕边界 |
| `?t=秒&paused=1` | 深链直达某一帧，便于截图 |
| `window.__intro` | `seek(t)` / `play()` / `pause()` / `render()` / `DUR`，供脚本核帧 |

`prefers-reduced-motion: reduce` 时直接落在收尾画面（可手动播放），不自动放动画。
声音默认关闭，点「♪ 声音」后才初始化 WebAudio（浏览器要求手势触发）。

### 与单文件版的关系

- `build-single.mjs` 顶部 `const INTRO = '幻想大陆-序章.html'`，序章会被内嵌进 `PAGES`，但**不计入 20 个生物页阈值**。
- 序章在 iframe 里被查看器打开时（`window.self !== window.top`），会自动加 `body.embedded` 隐藏自身顶栏；
  「跳过序章 / 翻开图鉴」改为 `postMessage({type:'fantasia:close'})`，由查看器负责关闭。
- 因此序章内**不要**写死 `location.href='index.html'` 的跳转，统一走 `goHome()`。

---

## 七、验证：三层，别只跑语法

`node verify-page.mjs <话页> <绘制函数名> --geo`

| 层 | 查什么 | 抓得到的真实缺陷 |
| --- | --- | --- |
| 语法 | 内联脚本能否解析 | 拼写、括号错配 |
| 运行时 | 桩化 DOM/Canvas **真跑**一遍：4 幕分镜 + 7 条交互路径 | 未定义变量、空指针、交互崩溃 |
| 几何 | 插桩绘制函数，反解局部坐标 | **生物被画框裁切、部件层级错乱、朝向反了** |

### 为什么几何层必须做

历史教训：**纯语法检查通过、肉眼看着也「像那么回事」，但生物其实被画框顶边裁掉了。**
几何层通过追踪 `arc/ellipse/moveTo/lineTo/quadraticCurveTo/bezierCurveTo` 的变换后坐标，
能精确算出包围盒，从而发现裁切、悬空、层级错误。

> ⚠️ 追踪器必须记录**曲线路径点**。早期版本只记录 `arc/ellipse`，
> 导致纯用 `quadraticCurveTo` 画的腿完全漏测，误报「腿部没伸出躯干」。

### 几何自检失败时的正确做法

不要调低断言凑通过。**要调布局参数**，通常是这三个的配平：

```
生物比例 bs   ×   基准线位置（水线/地面）   ×   腾空/下沉位移上限
```

配平原则：静止时顶部留余量 → 最大位移时仍不越框 → 脚掌始终踩在基准线上。

---

## 八、设计约定（不是偏好，是已经定下来的规矩）

1. **非跟随型交互**：鼠标**不是**牵引绳。光标只影响环境（风、水波、共鸣、光照），
   生物按自己的生态设定活动。点击生物 = 逗它反应，点击环境 = 环境反馈。
   —— 这是用户明确要求过的，别再做成鼠标跟随。
2. **相位推进而非齐动**：多足/多鳍/多触须类生物，各部件要**按顺序依次延后**相位
   （如 `ph = tt*15 - i*0.46`），形成"波浪滚过"的观感。整排一起抬落是错的。
3. **波纹/光效是行波不是齐闪**：扩散类效果按由内向外推进，途经元素**延迟点亮再缓慢熄灭**。
4. **每页四幕**：分镜要有叙事递进（如：潜行 → 击钟 → 沸涌 → 碎晶），不是同一动作循环四遍。
5. **印章 = 跳章节**，不是开关切换。点印章应跳到对应分镜并高亮。
6. **滤镜 = 整页 CSS filter**（`mode-monochrome` / `mode-blueprint`），加在 `#mainWrap` 上。
7. **档案 `dl` 写 8 行**：体长 / 栖息 / 形态特征 ×4 / 食性 / 习性，用词具体、带数字。
8. **`tech-spec` 讲交互设计**，说清"为什么这样动"，这是本系列的特色栏目。
9. **每页独立配色**：改 `--paper`（米色系微调）与主色，但**版式结构不动**。
10. **拟声字用 `sfx()`**，配合 `popv()` 做弹出/消退曲线。

---

## 九、当前内容盘点

**话数**：原有 1–18 连续 + 2 篇「幻兽特报」= **20 页**；另加新增篇 **3 页**（名称案号）= **23 页**

| 话 | 生灵 | 生境 |
| --- | --- | --- |
| 1 | 灯袖鳐 | 碧海 |
| 2 | 伞耳獾 | 林泽 |
| 3 | 荧光波足兽 | 林泽 |
| 4 | 浮光天海鲵 | 全境种 |
| 5 | 曦光游晶兽 | 全境种 |
| 6 | 苍穹金鬃雀 | 苍穹 |
| 7 | 珊瑚铠角螈 | 碧海 |
| 8 | 风帆灯嘴海雀 | 碧海 |
| 9 | 铜铃刺刺豚 | 旷野 |
| 特报 09 | 霄海星羽鳐 | 苍穹 |
| 10 | 苔鳞潜沼蜥 | 林泽 |
| 特报 10 | 炽晶烛角鹿 | 幽域 |
| 11 | 机关磁齿蛛 | 遗迹 |
| 12 | 古卷风琴毛虫 | 遗迹 |
| 13 | 琥珀蜜罐熊 | 林泽 |
| 14 | 琉璃霓虹海蛞蝓 | 碧海 |
| 15 | 时钟齿轮寄居蟹 | 遗迹 |
| 16 | 星屑留声机蜗牛 | 旷野 |
| 17 | 星环引力水母 | 苍穹 |
| **18** | **沸泉晶钟兽** | **幽域** |
| 新增篇 | 寻泉萤草 | 旷野 |
| 新增篇 | 幽谷聆芽 | 幽域 |
| 新增篇 | 诱光芽蠕 | 林泽 |

**生境分布**（首页「常驻 N 种」要与之一致，共 23 种）：

| 生境 | 种数 | 备注 |
| --- | --- | --- |
| 碧海 `sea` | 4 | |
| 林泽 `forest` | 5 | 含新增篇诱光芽蠕 |
| 苍穹 `sky` | 3 | |
| 遗迹 `ruin` | 3 | |
| 幽域 `deep` | 3 | 含新增篇幽谷聆芽 |
| 旷野 `wild` | 3 | 含新增篇寻泉萤草 |
| 全境种 `all` | 2 | 浮光天海鲵、曦光游晶兽 |

---

## 十、下一步建议

1. 新增篇使用「新增篇＋名称」案号，不占用用户尚未上传的第 19–50 话；后续按用户提供的资料继续整合。
2. 若要写「幻兽特报」体例：案号用 `幻兽特报 · 第 NN 案`，卡片 `.go` 文案写「翻开特报页」，
   并给 `data-realm` 选一个非常驻生境（特报设定为罕见目击个体）。
3. 三只新增篇的独立合集源在 `extras/新增篇首页.html`，产物在 `deliverables/`，不要手改产物。

**不要**在没有新生物的情况下空转话数；每话必须是一个完整、独立的生物。

---

## 十一、试玩版《星兽纪》

`幻想大陆-星兽纪.html` 是独立运行的单文件游戏，也被 `build-single.mjs` 作为额外页面内嵌进单文件版。
它不依赖任何图片、音频文件或第三方库，所有地图、角色、星兽、UI、音乐均为 Canvas/CSS/WebAudio 程序化生成。

### 玩法与流程

- 四张地图：`camp` 风铃营地（教学/篝火）→ `redhill` 风蚀红丘 → `moss` 苔雨林 → `geode` 地脉晶洞（Boss）
- 三段剧情战依次收服 `snail` / `lizard` / `bell`，各给一道星痕；营地和晶泉可全队回复
- 高草随机遇敌（`MAPS.*.wild`），可捕获 `badger` / `centi`；队伍最多 6 只，图鉴共 6 种
- 战斗指令：攻击 / 星技 / 道具 / 捕获 / 换宠 / 逃跑；数字键 1–6 直接选择
- 捕获条件：敌方 HP 低于 `captureThreshold()`（普通 38%，首战蜗牛 55%）；Boss 不可扔环，血量 ≤28% 触发星痕共鸣收尾
- 结局显示记录数、用时、剩余藤环，可「再玩一次」或回标题；试玩版没有存档

### 代码结构（单文件内）

| 区块 | 内容 |
| --- | --- |
| 1–2 | 工具函数、`SPECIES`（6 种）、`SKILLS`、四张地图 ASCII（22×15）与对象表 |
| 3–4 | 全局状态 `S`、任务、程序化 WebAudio（五声音阶 + 打击 + 音效） |
| 5–6 | Canvas 自适应、粒子、伤害飘字 |
| 7–10 | 星兽/人物绘制、地图静态地面缓存、场景道具 |
| 11–13 | 天空/天气/世界绘制、战斗背景与战斗场景、标题/结局绘制 |
| 14–17 | HUD、地图进入、碰撞、对话系统、队伍/图鉴/帮助面板、交互动作 |
| 18–21 | 战斗状态机（异步动作/捕获/换宠/升级/结局）、指令绑定、流程与输入 |
| 22–23 | 粒子主循环、`init()` |

### 验证方法

1. 桌面 1280×800 与手机 390×844 各跑一遍：标题 → 营地对话 → 红丘 → 苔林 → 晶洞 → 结局
2. 检查点：对话可跳过、队伍/图鉴可开、捕获动画与结算、失败后全队恢复、单文件版 iframe 内可玩
3. 代码层：用 Chrome/CDP 或浏览器控制台确认 `S.scene`、`S.flags`、`S.party`、`S.captured` 符合预期
4. 游戏内不出现未捕获异常；战斗按钮在 `b.busy` 时必须全部禁用

### 这一版踩过的坑

| 坑 | 后果 | 正确做法 |
| --- | --- | --- |
| 地图对象漏写 `rows` | 加载即报 `m.rows[0]` 为空 | 四张地图都要有 `rows:XXX_ROWS` |
| 敌方对象没有 `id` | `calcDamage` 调 `petStats` 时崩溃 | 敌方对象同时保存 `id` 与 `species` |
| 画道具函数忘记 `translate` | 篝火/道具全画在地图原点 | 所有带 `x,y` 的绘制函数先 `save+translate`，末尾 `restore` |
| 用 `performance.now()` 对 `S.time` | 捕获动画进度为负、永远不缩圈 | 动画时间统一用 `S.time` |
| 内嵌游戏被当成生物页 | build 警告 21 页、误统计 | `build-single.mjs` 顶部 `GAME` 常量排除并单独内嵌 |
| 战斗 UI 挡住星兽 | 手机端看不到脚下 | 宠物脚下位置在 70% 高，血条面板在 14% 高 |

---

## 十二、环境与提交

- **Node ≥ 18**，仅用内置 `node:fs`，无需 `npm install`
- 本地预览：直接双击 `index.html`（`file://` 下功能完整）
- Git：仓库已初始化并绑定 `origin`（GitHub 公开仓库，`main` 分支）；
  本仓库配置了 `http.proxy=http://127.0.0.1:7897`（Clash），因为 Git 不读系统代理，直连会超时
- 提交流程：`git add` → `git commit` → `git push`

---

## 十三、踩过的坑（重要）

| 坑 | 后果 | 正确做法 |
| --- | --- | --- |
| 用 base64 图片贴图代替 Canvas 绘制 | 单文件版膨胀到 8 MB；画风与全系列脱节 | 坚持原生 Canvas 绘制 |
| 整张图连同背景一起做位移动画 | 看起来像画框在抖，不是生物在跑 | 只让生物部件动，背景按视差独立滚动 |
| 只跑语法检查就交付 | 生物被画框裁切、腿没画出来都没发现 | 跑 `verify-page.mjs --geo` 三层验证 |
| 几何追踪器不记录曲线路径 | 纯曲线部件漏测，误报"部件缺失" | 追踪器必须含 `quadraticCurveTo`/`bezierCurveTo` |
| 手改单文件版 | 下次构建被覆盖 | 只改源文件 |
| 首页卡片与话页链接数不一致 | 构建直接抛错，单文件缺页 | 卡片、链接、页面三处同步；构建脚本会自动比较 |
| 新增话页忘改首页统计 | 数字与实际不符 | 同步 `.stats` 与六境计数 |
| 序章元素写死设计横坐标 | 竖屏（可见宽度 ~420px）时主体被裁掉 | 横向坐标一律套 `HX()` |
| 序章里直接 `location.href='index.html'` | 单文件版 iframe 里跳转失败 | 统一用 `goHome()`（内嵌时 postMessage） |
| 动画时长只改 `DUR` | 幕边界错位、进度条刻度错 | 同时改 `OPEN_END`/`REVEAL_END`/`SHOW_END` |

---

## 十四、交付前自检清单

- [ ] 旧版话页 `node verify-page.mjs <话页> <绘制函数> --geo` 三层全过；新增篇跑 `qa/*.cjs`
- [ ] 首页已加卡片，`data-realm` 正确
- [ ] 首页 `.stats` 两个数字已更新
- [ ] 对应六境「常驻 N 种」已更新
- [ ] `node build-single.mjs` 三项自校验均正常（根目录 25 页内嵌、26 个 data-page）
- [ ] `node build-single.mjs --index=extras/新增篇首页.html --out=deliverables/新增三种动态图鉴-单文件版.html` 正常（3 页）
- [ ] README / HANDOVER 数量已同步
- [ ] 序章：桌面 1200×800 与竖屏 390×844 各截 5 帧，文字不裁、主体居中、CTA 不挡控制条
- [ ] 试玩：桌面与手机各完整跑通一次，捕获/战斗结算/失败恢复/结局均正常
- [ ] 单文件版：首页点「试玩《星兽纪》」能打开游戏，游戏在 iframe 内可开始并进入战斗
- [ ] 单文件版：首页点「观看序章动画」能打开，序章里点「翻开图鉴」能关闭查看器
- [ ] 临时文件（`HANDOVER` 以外的截图、脚本）已清理

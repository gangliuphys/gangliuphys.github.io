# 个人学术主页

一个零依赖、零构建的个人学术主页站点。纯静态 HTML + CSS + JavaScript，双击 `index.html` 即可预览，部署到 GitHub Pages 只需上传文件。

## 目录结构

```
.
├── index.html              # 主页全部内容（改这里就够了）
├── robots.txt              # 搜索引擎收录配置
├── sitemap.xml             # 站点地图
├── .nojekyll               # 让 GitHub Pages 不走 Jekyll 处理
├── assets/
│   ├── css/style.css       # 全站样式（含深色模式）
│   ├── js/site.js          # 语言切换 / 主题 / 搜索等交互
│   ├── img/
│   │   ├── profile.svg     # ← 换成你的照片
│   │   ├── favicon.svg
│   │   ├── papers/         # 论文配图
│   │   └── projects/       # 项目配图
│   └── cv.pdf              # ← 放你的简历 PDF
└── _build_placeholders.py  # 生成占位图（替换完真实图片后可删）
```

## 板块结构

| 板块 | 说明 |
|---|---|
| Hero | 照片 + 姓名 + 头衔 + 单位/校区/邮箱/语言 + 研究简介 + 关键词 + 学术链接 |
| 最新动态 | 时间轴倒序的论文、基金、预印本等动态 |
| 研究兴趣 | 5 张卡片，图标 + 标题 + 说明 |
| 精选论文 | 左侧配图 + 标题/作者/亮点/期刊链接（期刊名与 arXiv 编号均为超链接）；右上角「全部论文」按钮可展开完整列表 |
| 研究项目 | 带序号列表：项目名称 / 基金批号 / 起止时间 / 主持或参与 |
| 教育背景 | 学位 / 学校·学院·专业·课题组 / 研究方向 三行结构 |
| 工作经历 | 博士后等任职经历，同三行结构 |
| 相册 | 网格照片墙（Gallery），6 个占位待替换为自己的照片 |

## 全部论文弹窗

精选论文右上角的「全部论文」按钮会**弹窗**打开完整论文列表（不是页面内展开 —— 展开需要用户手动下滚，体验差）。弹窗宽 940px，列表独立滚动，打开时锁定页面滚动。

关闭方式：`Esc` 键、点击遮罩空白处、右上角 × 按钮。弹窗内焦点循环（Tab 不会跑出弹窗），关闭后焦点回到触发按钮。

列表含全部 13 篇论文（10 篇主要 + 3 篇合作），排版对齐学术简历的编号列表格式：

```
[1] 作者列表（Gang Liu 加粗，* / † 为上标标记）
    斜体论文标题（带链接）
    期刊或 arXiv 编号（带链接）· 投稿备注
```

顶部有符号说明：`*` 这些作者贡献相同，`†` 通讯作者。

### 新增一篇到完整列表

复制 `#pubsAll` 里的一个 `<li class="refitem">` 即可，编号由 CSS `counter` 自动生成。

```html
<li class="refitem">
  <p class="refitem__authors">A. Author, <strong>Gang Liu</strong><sup>†</sup></p>
  <p class="refitem__title"><a href="https://...">Paper Title</a></p>
  <p class="refitem__venue"><a href="https://...">Phys. Rev. A 114, 000000 (2026)</a></p>
</li>
```

## 学术链接

已配置：Google Scholar、ResearchGate、GitHub、ORCID、邮箱，简历按语言自动切换中/英文版。

修改位置：搜索 `hero__actions`，把 `href` 换成你的真实地址即可。

## 重要约定

### 论文区块为什么不用双语切换

学术论文题目、期刊名以英文原文为准，中文译名在国际学术语境下价值有限，反而增加维护成本。
因此论文区是**纯静态英文**，中英文页面显示完全一致——这与 wenbinzhai、Chris Piech 等主页的通行做法一致。

其他板块（Hero、研究兴趣、项目、教育背景、工作经历、动态）仍是中英双语，随顶栏按钮切换。

### 双语属性怎么写

| 场景 | 写法 |
|---|---|
| 需要保留子标签的短文本 | `<span data-zh="中文" data-en="English">` |
| 纯文本，不需要子标签 | `<span data-zh-text="中文" data-en-text="English">` |
| 富文本（作者名带 `<sup>` 上标等） | `<span data-zh-html="..." data-en-html="...">` |
| 链接按语言切换 | `<a data-zh-href="a.pdf" data-en-href="b.pdf">` |
| 图片 alt | `<img data-zh-alt="中文" data-en-alt="English">` |

⚠️ **属性值内不能用带双引号的标签**。例如 `<span class="x">` 里的双引号会提前终止属性值，导致 DOM 结构损坏。属性值内的富文本只能用无属性标签：`<em>`、`<i>`、`<sup>`、`<strong>`。

### 新增论文

```html
<article class="pub">
  <figure class="pub__figure">
    <a href="https://arxiv.org/xxxx">
      <img class="pub__thumb" src="assets/img/papers/paper-N.svg" alt="Figure" loading="lazy">
    </a>
  </figure>
  <div>
    <h3 class="pub__title"><a href="...">Paper Title in English</a></h3>
    <p class="pub__authors">A. Author<sup>*</sup>, <strong>Gang Liu</strong><sup>†</sup>, B. Author</p>
    <p class="pub__highlight"><strong>Highlight:</strong> One or two sentences on what was done and why it matters.</p>
    <!-- 期刊名与 arXiv 编号直接加超链接 -->
    <p class="pub__meta"><a href="https://arxiv.org/abs/xxxx"><em>arXiv:2606.25511</em></a> (2026) · <i>Submitted to <a href="..."><em>Physical Review A</em></a></i></p>
    <div class="pub__topics"><span class="topic">Topic</span></div>
  </div>
</article>
```

`*` = 同等贡献，`†` = 通讯作者。

## 正文含超链接时不能用 data 属性

`data-zh` / `data-en` 属性值里**不能安全嵌套 `<a href="...">`** —— 属性值的双引号会提前终止，后面全部变成游离文本，DOM 结构崩坏（开发过程中已踩坑多次）。

需要「中英文各自带超链接」时，改用 CSS 控制显隐的方案：

```html
<span class="lang-only" lang="zh">中文句子，<a href="...">链接</a>。</span>
<span class="lang-only" lang="en">English sentence, <a href="...">link</a>.</span>
```

配套 CSS（已内置）：

```css
html[data-lang="zh"] .lang-only[lang="en"] { display: none; }
html[data-lang="en"] .lang-only[lang="zh"] { display: none; }
```

最新动态板块就是这么实现的。

## 修改脚本时的注意事项

用 Python 批量改 HTML 时，**必须用 `html.parser.HTMLParser` 定位区间，不能用字符串查找或深度计数**：

- 深度计数（`<div` 与 `</div>` 逐个找）容易切错边界，且 `<img loading="lazy">` 这类自闭合标签会干扰配对
- HTMLParser 需实现 `handle_startendtag` 并把 VOID 标签（img/br/input 等）排除出栈
- 若按 `html.index('id="xxx"')` 定位 section，记得先 `rindex('<section', 0, pos)` 回到标签起点
- **改之前先备份**，出错立即回滚：`cp index.html /tmp/index.bak`

改完必须跑 `python _validate.py` 验证结构。

| 位置 | 内容 |
|---|---|
| `<h1 class="hero__name">` 与 `.nav__brand` | 姓名（中/英） |
| `.hero__role` | 头衔 |
| `.hero__meta` | 单位 / 校区 / 邮箱 / 语言（每行一个 `<li>`，带图标） |
| `.hero__tagline` | 研究简介 |
| `.hero__keywords` | 关键词标签 |
| `.hero__actions` | Google Scholar / ResearchGate / GitHub / ORCID / 简历按钮 |
| `#news` 段 | 复制一个 `<article class="news__item">` 新增动态 |
| `#research` 段 | 复制一个 `<article class="interest">` |
| `#publications` 段 | 复制一整个 `<article class="pub">`（详见下方论文说明） |
| `#projects` 段 | 复制一个 `<li class="grant">` |
| `#education` / `#experience` 段 | 复制一个 `<article class="tl-item">` |
| `#gallery` 段 | 复制一个 `<figure class="shot">`，改 `src` 指向 `assets/img/gallery/` 下的照片 |
| `#honors` 段 | 复制一个 `<li class="honor">` |
| `.nav__links` | 顶栏导航，增删 `<a class="nav__link">` |

## 功能说明

| 功能 | 操作 |
|---|---|
| 中英切换 | 点顶栏 `中 / EN` 按钮，选择记在浏览器本地 |
| 深色模式 | 点顶栏月亮/太阳图标；未手动设置时跟随系统 |
| 搜索 | 点放大镜，或按 `Ctrl + K` / `⌘ + K`；`↑` `↓` 选择，`Enter` 打开，`Esc` 关闭。中文英文都能搜，含全部论文列表 |
| 全部论文 | 点论文区右上角按钮**弹窗**打开完整论文列表；按 `Esc`、点遮罩空白处或右上角 × 均可关闭，列表在弹窗内独立滚动 |
| 移动端菜单 | 窄屏时顶栏折叠为汉堡菜单 |
| 导航高亮 | 滚动时顶栏自动高亮当前所在板块 |
| 打印 | `Ctrl + P` 会自动隐藏导航与按钮，便于导出 PDF 简历 |

## 替换照片

把你的照片命名为 `profile.jpg` 放进 `assets/img/`，然后把 `index.html` 中这一行

```html
<img class="hero__photo" src="assets/img/profile.svg" ...>
```

改为

```html
<img class="hero__photo" src="assets/img/profile.jpg" ...>
```

建议比例 **3:4 竖版**（如 630×840），人物居中，头部留出上方空间。文件体积控制在 200 KB 以内，可用 <https://squoosh.app> 压缩。

论文配图建议宽度 800 px 左右、`4:3` 或 `16:10` 比例。

## 本地预览

直接双击 `index.html` 即可。若想用本地服务器（搜索等功能表现更接近线上）：

```bash
# 在项目目录下执行任一命令
python -m http.server 8000
npx serve .
```

然后访问 <http://localhost:8000>。

## 部署到 GitHub Pages

1. 在 GitHub 新建一个仓库，命名为 `你的用户名.github.io`（这决定访问地址是 `你的用户名.github.io`），勾选 Public。
2. 把本目录所有文件上传到仓库根目录。可以直接在网页端拖拽，也可以用命令行：

   ```bash
   git init
   git add .
   git commit -m "init academic homepage"
   git branch -M main
   git remote add origin https://github.com/你的用户名/你的用户名.github.io.git
   git push -u origin main
   ```

3. 进入仓库 **Settings → Pages**，Source 选择 `Deploy from a branch`，Branch 选 `main` / `(root)`，保存。
4. 等待 1–2 分钟，访问 `https://你的用户名.github.io`。

### 发布前请替换

- `index.html` 里的 `YOUR-USERNAME` → 你的 GitHub 用户名（两处：`og:url` 与 `assets` 路径）
- `robots.txt` 与 `sitemap.xml` 里的 `YOUR-USERNAME.github.io` → 你的实际域名
- 如果有自定义域名，在根目录新建 `CNAME` 文件，内容写你的域名，并在 Pages 设置中勾选 Enforce HTTPS

## 浏览器兼容性

Chrome / Edge / Firefox / Safari 近两年版本均可。使用了 CSS 自定义属性、`aspect-ratio`、IntersectionObserver，未做老浏览器降级。

## 设计参考

版式综合了以下主页的优点：

- [连玉君的主页](https://lianyujun.github.io/Chinese.html) — 顶栏导航的布局与配色
- [Haofei Ma](https://haofei.ma/zh/) — Hero 区的信息组织方式
- [Chris Piech](https://web.stanford.edu/~cpiech/bio/index.html) — 照片与个人简介的排版
- [minimal-academic-homepage](https://github.com/Xin-Jiaqi/minimal-academic-homepage) — 论文卡片的「配图 + 亮点」结构
- [Wenbin Zhai](https://wenbinzhai.github.io/) — 板块划分（教育、工作经历、动态等）

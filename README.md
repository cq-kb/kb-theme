# kb-theme — 个人知识库 Halo 主题

基于 Halo 官方默认主题 [Earth](https://github.com/halo-dev/theme-earth)（GPL-3.0）fork，为 `kb.cqian.top` 定制。
Earth 负责通用的博客能力（布局、暗色模式、分类树、文档布局、各类插件适配），本仓库只做知识库特有的部分。

## 已实现（v0.1）

**结构化条目渲染**（`src/assets/kb/entries.ts` + `styles/kb.scss`）

针对「高性价比人生指南」这类内容：文章里每个二级标题是一条建议，下面紧跟
`**成本标签**：钱=0 · 时间=少 · 毅力=否 · 收益=大 · 口径=死亡率` 和一个字段列表
（成本 / 说人话 / 收益 / 证据等级 / 来源 / 备注）。浏览器端自动把它们升级成：

- 每条建议包成一张卡片（`section.kb-entry`），带 `data-evidence` / `data-tag*` 属性
- 成本标签 → 彩色徽章（成本越低越绿，收益越大越绿）
- 证据等级 A / B / C → 绿 / 橙 / 灰色块，悬停有说明
- 「说人话」→ 高亮摘要块
- 正文顶部一条吸顶筛选栏：按证据等级过滤、"只看说人话"模式

纯前端实现，不依赖后端；没有这种结构的普通文章完全不受影响。

**分享卡片 meta**（`src/post.html`、`src/index.html`）：Open Graph / Twitter Card 标签，微信、微博、知乎、即刻等平台抓取链接时能显示标题、摘要、封面（文章封面，缺省用站点 Logo）。

## 开发

```bash
pnpm install
pnpm dev        # 监听 src/ 变化，实时构建到 templates/
pnpm test       # 单元测试（happy-dom + 真实章节 fixture）
pnpm build      # 构建并打包成可上传的 zip（dist/）
```

本地预览需要一个 Halo 实例，见 `kb-deploy/dev/`：它会把本仓库挂载到 Halo 的 `themes/kb-theme`，
`pnpm dev` 构建出的 `templates/` 会被 Halo 直接读取，改完刷新页面即可。

## 目录

```
src/
├── *.html              页面模板（Thymeleaf），index / post / category / doc …
├── modules/            可复用模块（分类树、文章卡片、侧栏 …）
├── partials/           布局骨架（header / footer / layout）
└── assets/
    ├── kb/entries.ts   知识库条目增强（本仓库新增）
    ├── styles/kb.scss  对应样式（本仓库新增）
    ├── post.ts         文章页入口，已引入上面两个文件
    └── …               Earth 原有资源
settings.yaml           主题设置项（后台可配置）
theme.yaml              主题元信息
tests/fixtures/         测试用的真实章节
```

## 路线

- [ ] 首页改成知识库导航：分类为主、最新文章为辅
- [ ] 分类页展示该分类下所有条目的证据等级 / 成本分布
- [ ] VIP 内容在列表中显示锁标识（配合会员插件）
- [ ] 条目收藏 / "我做到了" 打卡（需要插件配合，属于下一层）

## 与上游同步

Earth 更新时：`git remote add upstream https://github.com/halo-dev/theme-earth.git`，
`git fetch upstream && git merge upstream/main`，冲突通常只在 `theme.yaml` / `settings.yaml` 的命名处。

## 许可

GPL-3.0，与上游一致。

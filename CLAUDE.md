# CLAUDE.md — kb-theme 交接说明

`kb.cqian.top` 的 Halo 主题，fork 自 halo-dev/theme-earth 1.18.0（GPL-3.0）。
整体规划、服务器、部署链路见 `cq-kb/kb-deploy` 仓库的 CLAUDE.md，这里只讲主题本身。

## 结构

- `src/*.html`：页面模板（Thymeleaf），构建后输出到 `templates/`（gitignore）
- `src/modules/`、`src/partials/`：可复用模块 / 布局
- `src/assets/kb/entries.ts` + `src/assets/styles/kb.scss`：**本仓库新增的全部知识库逻辑**，其余都是 Earth 原样
- `src/assets/post.ts`：文章页入口，引入了上面两个文件
- `theme.yaml`：主题名 `kb-theme`，设置项名 `kb-theme-setting`；`settings.yaml` 里的资源路径已改为 `/themes/kb-theme/...`
- `tests/fixtures/`：真实章节 Markdown，`src/assets/kb/entries.test.ts` 用它做单测（happy-dom + markdown-it）

## 命令

```
pnpm install
pnpm dev          # vp build --watch，输出 templates/
pnpm test         # vp test run
pnpm build-only   # 生产构建
pnpm build        # 构建 + 打 zip（dist/），手动上传时用
```

工具链是 vite-plus（rc）+ rolldown + Tailwind + Alpine，随 Earth 上游走，不要单独升级。

## entries.ts 做什么

文章正文里每个 `h2` 后面若紧跟「**成本标签**：钱=… · 时间=…」段落和字段列表（成本/说人话/收益/证据等级/来源/备注），
就把它们升级成条目卡片：成本标签→彩色徽章，证据等级→A/B/C 色块，说人话→高亮，顶部加证据等级筛选栏。
没有这种结构的普通文章完全不动。全部是运行时 DOM 改写，不依赖后端。

## 部署

push main → GitHub Actions：test → build-only → rsync `theme.yaml/settings.yaml/templates/i18n` 到服务器
`/opt/kb-deploy/data/halo2/themes/kb-theme/` → `docker compose restart halo`。
Secrets 在组织 `cq-kb` 级别。本地预览：`kb-deploy/dev/docker-compose.yml` 会把本仓库挂进本地 Halo。

## 与上游同步

`git remote add upstream https://github.com/halo-dev/theme-earth.git && git fetch upstream && git merge upstream/main`；
冲突点通常只有 `theme.yaml`、`settings.yaml` 的命名和 `post.ts` 的 import。

## 下一步（按优先级）

1. 首页改成知识库导航：分类为主、最新文章为辅（改 `src/index.html`）
2. 分类页汇总条：条目数、证据等级/成本分布（改 `src/category.html`，数据从文章列表统计）
3. 列表里 VIP 文章加锁标识（配合会员插件的可见性字段）
4. 页脚备案号（`settings.yaml` 已有 icp 相关项，确认后台填写即可）

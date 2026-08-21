<div align="center">
  <br/>
  <img src="https://img.shields.io/badge/v2.1.0-1976D2?style=flat-square&label=latest" alt="v2.1.0"/>
  <img src="https://img.shields.io/github/last-commit/Linraintong/SuiSui?style=flat-square&color=4CAF50" alt="Last Commit"/>
  <img src="https://img.shields.io/github/license/Linraintong/SuiSui?style=flat-square" alt="License"/>
  <img src="https://img.shields.io/github/repo-size/Linraintong/SuiSui?style=flat-square&color=FF9800" alt="Repo Size"/>
  <br/><br/>

# ✨ 碎碎 SuiSui

**碎片化笔记 SPA — 捕捉每一丝灵感碎片**

<br/>

[🔗 在线预览](https://suisui.malaoer.top) · [📖 文档](#) · [🐛 反馈](https://github.com/Linraintong/SuiSui/issues)

<br/>

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://img.shields.io/badge/Vue_3-4FC08D?style=for-the-badge&logo=vuedotjs&logoColor=white"/>
  <img alt="Tech Stack" src="https://img.shields.io/badge/Vue_3-4FC08D?style=for-the-badge&logo=vuedotjs&logoColor=white"/>
</picture>
<img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript"/>
<img src="https://img.shields.io/badge/Vuetify_4-1867C0?style=for-the-badge&logo=vuetify&logoColor=white" alt="Vuetify 4"/>
<img src="https://img.shields.io/badge/Cloudflare_Workers-F38020?style=for-the-badge&logo=cloudflare&logoColor=white" alt="Cloudflare Workers"/>
<img src="https://img.shields.io/badge/D1_%26_R2-F6821F?style=for-the-badge&logo=cloudflare&logoColor=white" alt="D1 & R2"/>

<br/>

<pre style="background: transparent; border: none; color: #666; font-size: 0.9em;">
╔══════════════════════════════════════════════════╗
║  前端 Vue 3 + Vuetify 4  ·  后端 Cloudflare      ║
║  TypeScript 严格模式  ·  零外部 CDN 依赖        ║
║  PBKDF2 密码哈希  ·  Content-Security-Policy      ║
╚══════════════════════════════════════════════════╝
</pre>

</div>

---

## 📸 预览

> **在线体验：** [https://suisui.malaoer.top](https://suisui.malaoer.top)  

---

## ✨ 特性一览

<div class="feature-grid">

### 📝 碎片笔记
| 功能 | 说明 |
|------|------|
| **Markdown 编辑器** | 工具栏快捷插入 · 实时预览 · 代码高亮 |
| **多图上传** | 拖拽/粘贴上传 · 横向滑动浏览 · 点击放大 |
| **标签系统** | 内联标签栏 · 多彩标签 · 标签筛选 |
| **全文搜索** | 实时搜索 · 关键词高亮 |
| **置顶排序** | ↑↓ 按钮调整置顶顺序 |
| **时间线视图** | 列表/时间线双视图切换 · 按日期分组 |
| **笔记大纲** | 侧边栏自动提取 Markdown 标题 |
| **GitHub 仓库解析** | 自动识别 GitHub URL，显示仓库信息卡片 |

### 🎨 用户体验
| 功能 | 说明 |
|------|------|
| **Emoji 反应** | 丰富的 emoji 库 · 游客也可参与 |
| **活动热力图** | 月度日历 · 按笔记数量着色 |
| **暗色模式** | 一键切换 · 主题色预设（9种）|
| **字体选择** | Maple Mono 默认 · 衬线/圆体/楷体/等宽可选 |
| **毛玻璃效果** | 侧边栏/卡片/编辑器毛玻璃 · 渐变背景 |
| **入场动效** | 卡片逐个淡入 · 骨架屏加载 |
| **响应式适配** | 桌面侧边栏 · 移动端底部导航 · 全端适配 |

### 🔐 系统管理
| 功能 | 说明 |
|------|------|
| **用户系统** | 注册/登录 · 角色权限（用户/管理员） |
| **回收站** | 软删除 · 恢复 · 永久清空 · 分页 |
| **后台管理** | 系统设置 · 用户管理 · 数据管理 |
| **数据导入导出** | JSON 格式批量导入/导出 |
| **分享链接** | 一键生成 · 公开查看 · 支持表情反应 |

### 🚀 部署特色
| 特性 | 说明 |
|------|------|
| **Cloudflare 免费部署** | 前端 **Pages** + 后端 **Worker** + **D1** 数据库 + **R2** 图片存储 |
| **零服务器成本** | 全部运行在 Cloudflare 边缘网络，个人用量完全免费 |
| **前端编译压缩** | Vite 构建时自动压缩静态资源（Brotli + Gzip）|
| **零外部依赖** | 除浏览器外无需安装任何运行时 |
| **安全响应头** | Content-Security-Policy · X-Frame-Options · HSTS |
| **自动部署** | GitHub Actions push 即自动部署到 Cloudflare |

---

## 🚀 快速开始

### 💻 开发模式
```bash
# 终端 1：启动 Cloudflare Worker 后端（本地模拟）
cd server-cf && npm install && npm run dev
# → 默认 http://localhost:8787

# 终端 2：启动前端开发服务器（已代理 /api 与 /uploads 到 8787）
npm install
npx vite --port 5173 --host
```
打开 **http://localhost:5173**。先访问任意接口触发默认管理员创建，或手动注册新用户。

首次使用前端需指定 Worker 地址，在项目根 `.env.local` 写入：
```bash
VITE_API_BASE=http://localhost:8787
```

### ☁️ 部署到 Cloudflare（免费）
前置：注册 Cloudflare 账号，安装 Node 18+，并在 `server-cf` 目录执行 `npm install`。

**1. 创建数据库与存储桶**（仅在 `server-cf/wrangler.toml` 中 database_id 仍为占位符时执行一次）：
```bash
cd server-cf
npx wrangler d1 create suisui          # 创建 D1 数据库，把输出的 database_id 填到 wrangler.toml
npx wrangler r2 bucket create suisui-uploads
npm run db:migrate:remote              # 应用表结构迁移
npx wrangler secret put GITHUB_TOKEN   # 可选：GitHub API 代理 token
```

**2. 部署后端 Worker**：
```bash
cd server-cf && npm run deploy
```

**3. 部署前端到 Pages**：
```bash
cd .. && npm run build
npx wrangler pages deploy dist --project-name=suisui
```
> 前端通过 `VITE_API_BASE` 指向 Worker 域名。若前后端同源部署（`workerd` 统一入口），可省略该变量。

**4. GitHub Actions 自动部署**（推荐）：推送 `main` 分支即自动部署前后端。在仓库 Settings → Secrets 配置：
| Secret | 说明 |
|--------|------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API Token（Workers Scripts + Pages 编辑权限）|
| `CLOUDFLARE_ACCOUNT_ID` | 你的 Cloudflare Account ID |
| `CF_PAGES_PROJECT` | （可选 Pages 项目名，默认 `suisui`）|

默认管理员 **admin / admin**，首次登录后请在「设置」中立即修改密码。

---

## 🏗️ 项目结构

```
📁 suisui/
├── 📁 src/                           # 🎨 前端 (Vue 3 + Vuetify 4)
│   ├── 📄 main.ts                    #   入口
│   ├── 📄 App.vue                    #   根组件（侧边栏 + 页面路由）
│   ├── 📁 stores/                    #   Pinia 状态管理
│   │   ├── 📄 auth.ts                #     认证 / 用户信息
│   │   ├── 📄 notes.ts               #     笔记 CRUD / Emoji 反应
│   │   └── 📄 settings.ts            #     站点配置
│   ├── 📁 views/
│   │   ├── 📄 NotesPage.vue          #   主页面（编辑器 + 笔记列表）
│   │   └── 📄 AdminPage.vue          #   后台管理
│   ├── 📁 components/                #   复用组件
│   │   ├── 📄 NoteCard.vue           #   笔记卡片
│   │   ├── 📄 MarkdownPreview.vue    #   Markdown 渲染
│   │   └── 📄 Heatmap.vue            #   活动热力图
│   └── 📁 utils/
│       └── 📄 api.ts                 #   authFetch 工具
│
├── 📁 server-cf/                     # ☁️ 后端 (Cloudflare Worker)
│   ├── 📄 src/index.ts               #   入口 + 路由 + 中间件
│   ├── 📄 src/auth.ts                #   认证（PBKDF2-SHA256 哈希 + 限流）
│   ├── 📄 src/notes.ts               #   笔记 + 回收站 + reactions
│   ├── 📄 src/admin.ts               #   设置 + 管理
│   ├── 📄 src/gh.ts                  #   GitHub API 代理
│   ├── 📁 migrations/                #   D1 数据库迁移
│   ├── 📄 wrangler.toml              #   Worker / D1 / R2 配置
│   └── 📄 package.json               #   server 依赖
│
├── 📄 vite.config.ts                 # Vite 配置
├── 📄 tsconfig.json                  # TypeScript 配置
├── 📄 package.json                   # 前端依赖
└── 📄 index.html                     # HTML 入口
```

### 🔄 数据流
```
用户操作 → Vue 组件 → Pinia Store → authFetch(Bearer) → Cloudflare Worker (Hono)
                                                                    ↓
                                                     D1 (SQLite) / R2 (图片)
                                                                    ↓
                                              JSON Response ← 查询 / 写入
                                                                    ↓
                                              Pinia Store 更新 → Vue 响应式渲染
```

### 🔄 实时同步
Worker 后端不提供 SSE，前端使用 **15 秒定时轮询**检测新笔记数量（`useNotePolling`）。

---

## 🛠️ 技术栈

<div align="center">

| 前端 | 后端 |
|:------|:------|
| **Vue 3** + **TypeScript** (strict 模式) | **Cloudflare Workers** (Hono) |
| **Vuetify 4** (Material Design 3) | **D1** (SQLite) |
| **Pinia** 状态管理 | **R2** (对象存储，图片) |
| **Marked** + **Highlight.js** (代码高亮) | **PBKDF2-SHA256** 密码哈希 |
| **Vite 6** (极速构建) | **Token 鉴权** + IP 限流 |
| **emojibase-data** (中文 emoji) | 版本化 DB 迁移 · GitHub API 反代 |
| 零 CDN · 全部本地打包 | Workers 边缘部署 · Pages 托管前端 |

</div>

---

## 📋 API 文档

### 🔑 认证
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/login` | 登录 |
| POST | `/api/auth/register` | 注册 |
| GET | `/api/auth/verify` | Token 验证 |
| PATCH | `/api/auth/avatar` | 更新头像 |
| PATCH | `/api/auth/nickname` | 更新昵称 |
| PATCH | `/api/auth/theme` | 更新主题色 |
| PATCH | `/api/auth/password` | 修改密码 |

### 📝 笔记
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/notes?limit=&offset=` | 获取笔记列表（分页） |
| POST | `/api/notes` | 创建笔记 |
| PUT | `/api/notes/:id` | 更新笔记 |
| DELETE | `/api/notes/:id` | 软删除至回收站 |
| PATCH | `/api/notes/:id/pin` | 切换置顶 |
| POST/DELETE | `/api/notes/:id/react` | 添加/移除 Emoji 反应 |
| PATCH | `/api/notes/reorder` | 置顶排序 |

### 🗑️ 回收站
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/notes/trash` | 查看回收站 |
| PATCH | `/api/notes/:id/restore` | 恢复笔记 |
| DELETE | `/api/notes/:id/hard-delete` | 永久删除 |

### ⚙️ 管理
| 方法 | 路径 | 说明 |
|------|------|------|
| GET/POST | `/api/settings` | 读取/更新站点设置 |
| GET | `/api/admin/stats` | 统计数据 |
| GET | `/api/admin/users` | 用户列表（分页） |
| DELETE | `/api/admin/users/:id` | 删除用户 |
| GET | `/health` | 健康检查 |

---

## 📦 更新日志

### v1.4.5 (最新)
> **置顶排序重做 + 内联标签栏**
- 🔼 **↑↓ 按钮替代拖拽排序** — 手机友好，hover 显示
- 🏷️ **内联标签栏** — 紧凑 chips + 短输入框回车添加
- 🐛 修复置顶排序被前端 `createdAt` 覆盖的问题

### v1.4.4
> **重新定位为碎片化笔记**
- 📝 全部界面"备忘录"→"碎片笔记"

### v1.4.0 ~ v1.4.3
- 🔐 密码哈希升级 HMAC-SHA256 × 10000 迭代
- 🛡️ Content-Security-Policy + Graceful Shutdown
- 🔥 TypeScript strict: false → true
- 📦 零 CDN 依赖，全部资源本地打包

<details>
<summary>📜 更早版本</summary>

### v1.3.6
- 🐛 修复 docker 数据库持久化 bug
- 🎨 编辑器工具栏按钮加大，移动端适配

### v1.3.5
- 🎨 UI 全面美化 — 侧边栏头像、卡片阴影升级

### v1.3.4
- 🔒 上线前安全加固 — Token 校验、SQL 错误信息隐藏
- 📦 Docker 镜像自动构建

### v1.3.3
- ✨ 热力图点击筛选日期
- 🎨 Todo List 样式美化

### v1.3.2
- ✨ 自动保存草稿、搜索高亮、粘贴图片
- ✨ 暗色模式持久化、Todo List
- ✨ 置顶顺序拖拽调整

### v1.3.0 / v1.3.1
- 🔴 修复 salt 重复生成、文件上传 XSS
- 🟡 N+1 查询优化、Go 后端拆文件
- 🟢 7 个测试用例、21 项修复清单

</details>

---

## 🧪 本地验证

```bash
# server-cf 后端（类型检查 + 单元测试）
cd server-cf && npm run typecheck && npm run test

# 前端（Lint + 类型检查 + 测试 + 构建）
cd ..
npm run lint && npm run typecheck && npm run test:run && npm run build
```

---

## 🤝 贡献

欢迎提交 Issue 和 PR！请确保通过上述验证。

---

## 📄 许可

[MIT License](LICENSE)

<div align="center">
  <br/>
  <sub>✨ 碎碎 — Capture every spark of inspiration. ✨</sub>
  <br/>
  <sub>Made with ❤️ by <a href="https://github.com/Linraintong">Linraintong</a></sub>
</div>

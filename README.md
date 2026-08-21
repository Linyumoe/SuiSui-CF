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
<img src="https://img.shields.io/badge/Go-00ADD8?style=for-the-badge&logo=go&logoColor=white" alt="Go"/>
<img src="https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white" alt="SQLite"/>

<br/>

<pre style="background: transparent; border: none; color: #666; font-size: 0.9em;">
╔══════════════════════════════════════════════════╗
║  前端 Vue 3 + Vuetify 4  ·  后端 Go 单二进制     ║
║  TypeScript 严格模式  ·  零外部 CDN 依赖        ║
║  HMAC-SHA256 密码哈希  ·  Content-Security-Policy ║
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
| **单二进制部署** | Go 编译为**一个可执行文件**，内嵌前端全部静态资源 |
| **SQLite 存储** | 无需数据库服务器，文件即数据库 |
| **前端编译压缩** | Vite 构建时自动压缩静态资源（Brotli + Gzip）|
| **零外部依赖** | 除浏览器外无需安装任何运行时 |
| **安全响应头** | Content-Security-Policy · X-Frame-Options · HSTS |
| **一键安装** | `curl -sSL .../install.sh \| bash` |

---

## 🚀 快速开始

### 💻 开发模式
```bash
# 终端 1：启动后端
cd server-go && go run .

# 终端 2：启动前端开发服务器
npx vite --port 5173 --host
```
打开 **http://localhost:5173**

### 📦 生产构建
```bash
# 构建前端
npm run build

# 编译为单二进制
cd server-go && go build -o suisui .

# 运行
./suisui                    # 默认端口 3742
./suisui -port 8080         # 自定义端口
PORT=8080 ./suisui          # 环境变量
```

### 🐳 Docker
```bash
# 一键安装
curl -sSL https://raw.githubusercontent.com/Linraintong/SuiSui/main/install.sh | bash

# 或手动运行
docker run -d --name suisui \
  --cpus="0.5" --memory="256m" \
  -p 3742:3742 \
  -v /opt/suisui:/data \
  linyumeng/suisui:latest
```

> HTTPS 可通过后台「系统设置 → 服务器配置」上传证书并启用，无需额外配置。

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
├── 📁 server-go/                     # 🖥️ 后端 (Go)
│   ├── 📄 main.go                    #   入口 + 路由 + 静态文件服务
│   ├── 📄 db.go                      #   数据库初始化 + 工具函数
│   ├── 📄 auth.go                    #   认证 handler
│   ├── 📄 notes.go                   #   笔记 + 回收站 handler
│   ├── 📄 admin.go                   #   设置 + 管理 handler
│   ├── 📄 responses.go               #   类型化响应结构体
│   ├── 📄 main_test.go               #   6 个测试用例
│   └── 📁 uploads/                   #   用户上传文件
│
├── 📄 vite.config.ts                 # Vite 配置
├── 📄 tsconfig.json                  # TypeScript 配置
├── 📄 package.json                   # 前端依赖
└── 📄 index.html                     # HTML 入口
```

### 🔄 数据流
```
用户操作 → Vue 组件 → Pinia Store → authFetch(Bearer) → Go handler → SQLite
                                                                    ↓
                                              JSON Response ← 查询 / 写入
                                                                    ↓
                                              Pinia Store 更新 → Vue 响应式渲染
```

---

## 🛠️ 技术栈

<div align="center">

| 前端 | 后端 |
|:------|:------|
| **Vue 3** + **TypeScript** (strict 模式) | **Go** (net/http) |
| **Vuetify 4** (Material Design 3) | **SQLite** (modernc.org/sqlite) |
| **Pinia** 状态管理 | RESTful API |
| **Marked** + **Highlight.js** (代码高亮) | **HMAC-SHA256** × 10000 迭代密码哈希 |
| **Vite 6** (极速构建) | **Token 鉴权** + IP 限流 |
| **emojibase-data** (中文 emoji) | 版本化 DB 迁移 · GitHub API 反代 |
| 零 CDN · 全部本地打包 | 单二进制嵌入前端 + 字体 |

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
# Go 后端
cd server-go && go vet ./... && go test ./...

# 前端
npx vue-tsc --noEmit && npm run build
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

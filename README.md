# 📚 AI小说创作平台

AI赋能的智能小说创作平台，支持沉浸式编辑、AI续写、世界观管理等核心功能。

## 🚀 快速开始

### 前置要求
- Node.js >= 18
- npm 或 yarn

### 安装依赖

```bash
# 安装前端依赖
cd frontend
npm install

# 安装后端依赖
cd ../backend
npm install
```

### 配置环境变量

```bash
# 复制后端环境变量模板
cd backend
cp .env.example .env

# 编辑 .env，填入你的 API Key
```

### 启动开发服务器

```bash
# 终端1: 启动后端
cd backend
npm run dev

# 终端2: 启动前端
cd frontend
npm run dev
```

访问 http://localhost:5173

### Docker部署

```bash
# 复制环境变量
cp .env.example .env

# 编辑 .env，填入必要的配置
# AI_API_KEY=your-api-key
# DB_PASSWORD=your-db-password

# 启动所有服务
docker-compose up -d
```

## 📁 项目结构

```
xiaoshui/
├── frontend/              # 前端 React 应用
│   ├── src/
│   │   ├── pages/         # 页面组件
│   │   ├── services/     # API 服务
│   │   ├── stores/       # Zustand 状态管理
│   │   └── App.tsx       # 路由配置
│   ├── Dockerfile
│   └── package.json
├── backend/               # 后端 Express 服务
│   ├── src/
│   │   ├── routes/        # API 路由
│   │   ├── services/     # AI 服务
│   │   └── index.ts       # 入口文件
│   ├── Dockerfile
│   └── package.json
├── database/
│   └── schema.sql         # PostgreSQL 数据库设计
├── docker-compose.yml
└── README.md
```

## 🎯 核心功能

### ✍️ 沉浸式编辑器
- 基于 TipTap 的富文本编辑器
- 多级大纲管理（卷/章/节）
- 自动保存与版本回溯
- 实时字数统计
- AI续写按钮

### 🪄 AI智能续写
- SSE 流式输出，打字机效果
- 支持多种风格转换（古风/废土/轻小说/悬疑）
- 结构化 Prompt 注入
- 大纲自动生成

### 📖 世界观Wiki
- 人物卡、地点志、道具库
- 智能关联检索
- 设定冲突检测

### 📋 章节大纲
- 树状结构管理
- 拖拽排序
- AI智能生成

## 🔧 技术栈

### 前端
- React 18 + TypeScript
- Vite
- TailwindCSS
- TipTap (编辑器)
- Zustand (状态管理)
- React Router

### 后端
- Node.js + Express
- TypeScript / tsx
- OpenAI / DeepSeek API
- SSE (流式输出)

### 数据库
- PostgreSQL + pgvector (向量搜索)
- Redis (缓存)

## 📝 API 接口

### 健康检查

```
GET /api/health
```

### AI 接口

#### POST /api/ai/stream-write
流式续写（返回SSE）

```json
// Request
{
  "context": "当前章节内容",
  "systemPrompt": "系统提示词",
  "maxTokens": 300,
  "temperature": 0.8
}
```

#### POST /api/ai/style-transfer
风格转换

```json
// Request
{
  "content": "待转换内容",
  "style": "古风|废土|轻小说|悬疑"
}

// Response
{
  "success": true,
  "result": "转换后的内容"
}
```

#### POST /api/ai/generate-outline
AI生成大纲

```json
// Request
{
  "plotSummary": "故事梗概",
  "style": "玄幻"
}

// Response
{
  "success": true,
  "outline": "生成的Markdown格式大纲"
}
```

### 小说接口

```
GET    /api/novels          # 获取小说列表
POST   /api/novels          # 创建小说
GET    /api/novels/:id      # 获取小说详情
PUT    /api/novels/:id      # 更新小说
DELETE /api/novels/:id      # 删除小说
GET    /api/novels/:id/chapters  # 获取章节列表
POST   /api/novels/:id/chapters  # 创建章节
```

### Wiki接口

```
GET    /api/wiki            # 获取设定列表
POST   /api/wiki            # 创建设定
GET    /api/wiki/:id         # 获取设定详情
PUT    /api/wiki/:id         # 更新设定
DELETE /api/wiki/:id         # 删除设定
POST   /api/wiki/search     # 搜索设定
```

## 📊 数据库设计

核心表结构：
- `users` - 用户表
- `novels` - 小说表
- `chapters` - 章节表
- `outlines` - 大纲表
- `wiki_entries` - Wiki条目表
- `wiki_relations` - Wiki关系表
- `wiki_embeddings` - 向量索引表（RAG）
- `ai_logs` - AI操作日志

详见 `database/schema.sql`

## 🔐 环境变量

### 后端 (.env)

```env
PORT=3000
NODE_ENV=development

# AI API (DeepSeek 或 OpenAI)
AI_API_KEY=your-api-key
AI_BASE_URL=https://api.deepseek.com
AI_MODEL=deepseek-chat

# CORS
CORS_ORIGIN=http://localhost:5173

# 数据库 (生产环境)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=novel_platform
DB_USER=postgres
DB_PASSWORD=xxx
```

## 🚀 部署建议

### 开发环境
```bash
npm run dev  # 前端和后端分别运行
```

### 生产环境
```bash
docker-compose up -d  # 一键部署所有服务
```

### 云服务推荐
- **前端**: Vercel, Netlify
- **后端**: Railway, Render, Fly.io
- **数据库**: Neon (PostgreSQL), Supabase
- **向量数据库**: Pinecone, Qdrant Cloud

## 📄 License

MIT

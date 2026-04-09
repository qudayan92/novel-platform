Netlify 部署指南
- 适用场景：前端静态站点/SPA 项目，直接使用 dist 目录作为发布产物。

步骤
- 1) 注册 Netlify 账号并新建站点
- 2) 连接你的 Git 仓库（选择 qudayan92/novel-platform）
- 3) 构建设置
  - 构建命令: npm install --silent && npm run build
  - 发布目录: frontend/dist
  - 基础目录(Base directory): frontend
- 4) 部署并等待构建完成
- 5) 打开生成的 URL，测试编辑器页面（通常为 /editor）

注意
- 该配置使用 netlify.toml 自动化部署，无需在 UI 配置复杂参数。
- 对于 SPA 路由，请确保 redirects 配置将所有路径重写到 index.html。

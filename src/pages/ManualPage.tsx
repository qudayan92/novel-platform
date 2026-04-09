import { Link } from 'react-router-dom';

export default function ManualPage() {
  return (
    <div className="manual-page">
      <nav className="manual-nav">
        <Link to="/" className="back-link">← 返回首页</Link>
      </nav>
      <main className="manual-content">
        <h1>功能手册</h1>
        
        <section>
          <h2>开始使用</h2>
          <p>欢迎使用 AI 小说创作平台！本平台提供多种智能写作辅助功能，帮助您创作精彩的小说作品。</p>
        </section>

        <section>
          <h2>核心功能</h2>
          <ul>
            <li><strong>AI 写作助手</strong>：智能续写、润色、改写您的文稿</li>
            <li><strong>角色管理</strong>：创建和管理小说中的角色信息</li>
            <li><strong>世界观设定</strong>：构建完整的故事世界观</li>
            <li><strong>情节规划</strong>：智能生成章节大纲和情节发展</li>
          </ul>
        </section>

        <section>
          <h2>使用技巧</h2>
          <ol>
            <li>在创作前先规划好故事大纲</li>
            <li>创建详细的角色设定，有助于保持角色一致性</li>
            <li>利用 AI 助手获取创作灵感</li>
            <li>定期保存您的作品，避免数据丢失</li>
          </ol>
        </section>

        <section>
          <h2>常见问题</h2>
          <dl>
            <dt>Q: 如何开始新作品？</dt>
            <dd>A: 在首页点击"开始创作"按钮，即可创建新项目。</dd>
            <dt>Q: 我的数据安全吗？</dt>
            <dd>A: 所有作品数据都存储在本地，我们会保护您的隐私。</dd>
          </dl>
        </section>
      </main>
    </div>
  );
}
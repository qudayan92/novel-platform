import { Link } from 'react-router-dom';

export default function HomePage() {
  return (
    <div className="home-page">
      <header className="hero">
        <h1>AI 小说创作平台</h1>
        <p>智能创作，让故事更精彩</p>
        <Link to="/manual" className="cta-button">
          了解更多
        </Link>
      </header>
      <section className="features">
        <div className="feature-card">
          <h3>AI 智能写作</h3>
          <p>基于先进AI技术，辅助您创作精彩故事</p>
        </div>
        <div className="feature-card">
          <h3>角色管理</h3>
          <p>轻松管理小说中的角色设定和信息</p>
        </div>
        <div className="feature-card">
          <h3>章节规划</h3>
          <p>智能规划章节结构，让创作更有条理</p>
        </div>
      </section>
    </div>
  );
}
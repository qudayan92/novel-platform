import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import HeroSection from '../components/HeroSection'
import WorkflowSection from '../components/WorkflowSection'
import FeaturesGrid from '../components/FeaturesGrid'
import RoadmapSection from '../components/RoadmapSection'
import StatCard from '../components/StatCard'
import CTASection from '../components/CTASection'

const aiTools = [
  { icon: '✍️', name: '续写', desc: '智能续写当前内容', category: '创作' },
  { icon: '🔮', name: '生成', desc: '生成人名/地名/剧情', category: '创作' },
  { icon: '🔍', name: '分析', desc: '逻辑/一致性/敏感词检测', category: '分析' },
  { icon: '👥', name: '协作', desc: '多人实时协作编辑', category: '协作' },
  { icon: '📊', name: 'AI指数', desc: '智能评估写作质量', category: '分析' },
  { icon: '✨', name: '润色', desc: '优化文笔提升表达', category: '润色' },
  { icon: '📝', name: '扩写', desc: '扩展内容增加细节', category: '润色' },
  { icon: '✂️', name: '缩写', desc: '精简内容保留核心', category: '润色' },
  { icon: '🌐', name: '翻译', desc: '多语言翻译支持', category: '翻译' },
  { icon: '🎨', name: '风格', desc: '古风/玄幻/都市多风格', category: '润色' }
]

export default function HomePage() {
  useEffect(() => {
    const chapters = document.querySelectorAll('.chapter')
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible')
        }
      })
    }, { threshold: 0.1 })
    chapters.forEach(ch => observer.observe(ch))
    return () => observer.disconnect()
  }, [])
  
  const features = [
    { icon: '✍️', title: '沉浸式编辑器', desc: '支持长篇创作，AI 续写、风格迁移，让写作更流畅' },
    { icon: '📚', title: '世界观 Wiki', desc: '统一管理人物、地点、道具设置，避免情节漏洞' },
    { icon: '🤖', title: 'AI 智能辅助', desc: '智能续写、逻辑纠错、灵感生成' },
    { icon: '📈', title: '数据看板', desc: '追踪创作进度，查看统计指标' }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-[#0a0a0f] text-white">
      <HeroSection />
      <WorkflowSection />
      
      {/* AI Writing Tools Section */}
      <section className="chapter py-16" id="ai-tools">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-10">
            <span className="text-xs uppercase tracking-wider text-violet-400">AI WRITING TOOLS</span>
            <h2 className="text-4xl md:text-5xl font-extrabold mt-2 gradient-text">AI 写作工具</h2>
            <p className="mt-3 text-gray-400">十大AI功能全方位赋能创作</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {aiTools.map((tool, idx) => (
              <Link
                key={idx}
                to="/editor"
                className="group p-5 rounded-2xl bg-dark-50/30 border border-white/5 hover:border-violet-500/30 hover:bg-dark-50/50 transition-all duration-300 hover:-translate-y-1"
              >
                <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">{tool.icon}</div>
                <h3 className="font-semibold text-white mb-1">{tool.name}</h3>
                <p className="text-xs text-gray-500">{tool.desc}</p>
                <span className="inline-block mt-2 text-[10px] px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-400">
                  {tool.category}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="chapter py-12">
        <div className="max-w-6xl mx-auto px-6 text-center mb-6">
          <span className="text-xs uppercase tracking-wider text-gray-400">FEATURES</span>
          <h2 className="text-4xl md:text-5xl font-extrabold mt-2 gradient-text">核心功能</h2>
          <p className="mt-3 text-gray-400">专为网文作者打造的全方位创作工具，写作更轻松</p>
        </div>
        <div className="max-w-6xl mx-auto px-6">
          <FeaturesGrid items={features} />
        </div>
      </section>

      <section className="chapter py-12">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-6">
          <StatCard label="总字数" value="52,480" color="text-blue-300" icon="📝" />
          <StatCard label="今日字数" value="1,234" color="text-emerald-400" icon="🔥" />
          <StatCard label="连载日更" value="7 天" color="text-amber-400" icon="📅" />
          <StatCard label="预计阅读" value="131 分" color="text-violet-300" icon="⏱" />
        </div>
      </section>

      <RoadmapSection />
      <CTASection />
    </div>
  )
}
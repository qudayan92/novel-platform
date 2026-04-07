import { Link } from 'react-router-dom'

export default function HeroSection() {
  return (
    <section className="relative py-20 px-6">
      <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 via-transparent to-purple-500/10 pointer-events-none" />
      <div className="max-w-6xl mx-auto text-center relative">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 mb-6">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-sm text-violet-300">AI 驱动的网文创作平台</span>
        </div>
        <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6">
          <span className="gradient-text">智能创作</span>
          <br />
          <span className="text-white">无限可能</span>
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10">
          专为网文作者打造的全方位创作工具，支持 AI 续写、风格迁移、世界观管理
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            to="/editor"
            className="px-8 py-4 bg-gradient-to-r from-violet-600 to-purple-600 rounded-xl font-semibold hover:opacity-90 transition-opacity"
          >
            开始创作
          </Link>
          <Link
            to="/wiki"
            className="px-8 py-4 bg-white/5 border border-white/10 rounded-xl font-semibold hover:bg-white/10 transition-colors"
          >
            了解更多
          </Link>
        </div>
      </div>
    </section>
  )
}

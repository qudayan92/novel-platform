import { Link } from 'react-router-dom'
import clsx from 'clsx'

const features = [
  {
    icon: '✍️',
    title: '沉浸式编辑器',
    description: '支持长篇创作，AI续写，风格迁移，让写作更流畅',
    color: 'from-violet-500 to-purple-500',
    glow: 'hover:shadow-violet-500/30',
    border: 'hover:border-violet-500/40',
    tag: '写作',
    path: '/editor'
  },
  {
    icon: '📚',
    title: '世界观Wiki',
    description: '统一管理人物、地点、道具设定，避免剧情漏洞',
    color: 'from-cyan-500 to-blue-500',
    glow: 'hover:shadow-cyan-500/30',
    border: 'hover:border-cyan-500/40',
    tag: '设定',
    path: '/wiki'
  },
  {
    icon: '🪄',
    title: 'AI智能辅助',
    description: '智能续写、逻辑纠错、灵感生成，告别卡文困扰',
    color: 'from-amber-500 to-orange-500',
    glow: 'hover:shadow-amber-500/30',
    border: 'hover:border-amber-500/40',
    tag: 'AI',
    path: '/editor'
  },
  {
    icon: '📊',
    title: '数据看板',
    description: '追踪创作进度、读者反馈，优化写作策略',
    color: 'from-emerald-500 to-green-500',
    glow: 'hover:shadow-emerald-500/30',
    border: 'hover:border-emerald-500/40',
    tag: '分析',
    path: '/stats'
  }
]

const comingFeatures = [
  {
    icon: '🎬',
    title: '剧情生成器',
    description: '根据设定自动生成完整剧情线，支持多线并行',
    progress: 30,
    color: 'from-red-500 to-pink-500',
    eta: '2026 Q2'
  },
  {
    icon: '👥',
    title: '角色AI对话',
    description: '与书中角色进行实时对话，深入了解人物',
    progress: 45,
    color: 'from-blue-500 to-indigo-500',
    eta: '2026 Q2'
  },
  {
    icon: '🌐',
    title: '多语言翻译',
    description: '一键翻译为英、日、韩等多语言版本',
    progress: 15,
    color: 'from-teal-500 to-cyan-500',
    eta: '2026 Q3'
  },
  {
    icon: '📱',
    title: '移动端APP',
    description: 'iOS/Android 原生应用，随时随地创作',
    progress: 0,
    color: 'from-purple-500 to-violet-500',
    eta: '2026 Q4'
  },
  {
    icon: '🤝',
    title: '多人协作',
    description: '支持多人同时编辑一本书的不同章节',
    progress: 60,
    color: 'from-green-500 to-emerald-500',
    eta: '2026 Q1'
  },
  {
    icon: '🎯',
    title: '智能校对',
    description: '自动检测错别字、标点、语法问题',
    progress: 75,
    color: 'from-orange-500 to-amber-500',
    eta: '2026 Q1'
  }
]

const quickStats = [
  { label: 'AI续写次数', value: '1,234', icon: '✨', color: 'text-violet-400' },
  { label: '生成字数', value: '52,480', icon: '📝', color: 'text-cyan-400' },
  { label: '连续创作', value: '7天', icon: '🔥', color: 'text-orange-400' },
]

const steps = [
  { num: '01', title: '创建作品', desc: '选择类型和风格，设定故事背景' },
  { num: '02', title: '构建世界观', desc: '完善人物、势力、地理等设定' },
  { num: '03', title: 'AI辅助创作', desc: '智能续写、灵感激发、逻辑校验' },
  { num: '04', title: '发布作品', desc: '一键导出，发布到各大平台' },
]

export default function Dashboard() {
  return (
    <div className="min-h-[calc(100vh-64px)] flex flex-col relative overflow-hidden">
      {/* Animated Background Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-violet-500/10 rounded-full blur-[120px] animate-float" />
        <div className="absolute top-1/3 right-0 w-[500px] h-[500px] bg-pink-500/10 rounded-full blur-[100px] animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-1/4 left-1/3 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[80px] animate-float" style={{ animationDelay: '4s' }} />
      </div>

      {/* Hero区域 */}
      <div className="flex-1 flex items-center justify-center py-16 relative z-10">
        <div className="text-center max-w-5xl px-6">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-violet-500/10 border border-violet-500/20 mb-10 backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
            <span className="text-sm text-violet-300 font-medium tracking-wide">AI驱动的专业写作工具</span>
          </div>

          {/* Title */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-8 leading-[1.1] tracking-tight">
            <span className="gradient-text">让AI成为你的</span>
            <br />
            <span className="text-white">创作伙伴</span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-gray-400 mb-12 leading-relaxed max-w-2xl mx-auto font-light">
            <span className="text-gray-300">7个专业AI Agent</span> 协作运行，模拟真实编辑团队流程
            <br className="hidden md:block" />
            从大纲规划到正文生成，从灵感到完稿
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link 
              to="/editor"
              className="group relative px-10 py-4 rounded-2xl font-medium text-lg overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-primary rounded-2xl" />
              <div className="absolute inset-0 bg-gradient-primary rounded-2xl opacity-80 group-hover:opacity-100 transition-opacity blur-xl" />
              <div className="relative flex items-center justify-center gap-3">
                <span className="text-2xl">🚀</span>
                <span>开始创作</span>
                <svg className="w-5 h-5 ml-1 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
            </Link>
            <Link 
              to="/wiki"
              className="px-10 py-4 rounded-2xl font-medium text-lg transition-all duration-300 glass hover:bg-white/10 border border-white/10 flex items-center justify-center gap-3 backdrop-blur-sm"
            >
              <span className="text-2xl">📖</span>
              <span>管理世界观</span>
            </Link>
          </div>

          {/* Quick Stats */}
          <div className="flex justify-center gap-12">
            {quickStats.map((stat, i) => (
              <div key={i} className="text-center group">
                <div className="text-3xl mb-2 transition-transform group-hover:scale-110">{stat.icon}</div>
                <div className={clsx('text-3xl font-bold mb-1 tracking-tight', stat.color)}>
                  {stat.value}
                </div>
                <div className="text-sm text-gray-500 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Steps Section */}
      <div className="py-16 px-6 relative z-10">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {steps.map((step, i) => (
              <div key={i} className="relative p-6 rounded-2xl glass border border-white/5 text-center group hover:border-violet-500/20 transition-all duration-300">
                <div className="text-5xl font-bold text-violet-500/20 mb-4 tracking-widest">{step.num}</div>
                <h3 className="text-lg font-semibold mb-2 text-white">{step.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-3 transform -translate-y-1/2 text-violet-500/30">→</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 功能展示 */}
      <div className="py-20 px-6 relative z-10">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
            <span className="text-violet-400 text-sm font-medium tracking-widest uppercase mb-4 block">Features</span>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="gradient-text">核心功能</span>
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto text-lg leading-relaxed">
              专为网文作者打造的全方位创作工具，让写作变得更轻松
            </p>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) => (
              <Link
                key={i}
                to={feature.path}
                className={clsx(
                  'group relative p-8 rounded-3xl overflow-hidden transition-all duration-500',
                  'glass border border-transparent',
                  feature.border,
                  feature.glow
                )}
              >
                {/* Glow Effect */}
                <div className={clsx(
                  'absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500',
                  'bg-gradient-to-br', feature.color
                )} style={{ opacity: 0 }} />
                
                {/* Icon */}
                <div className={clsx(
                  'w-16 h-16 rounded-2xl bg-gradient-to-br mb-6 flex items-center justify-center text-3xl',
                  feature.color,
                  'shadow-lg group-hover:scale-110 transition-transform duration-300'
                )}>
                  {feature.icon}
                </div>

                {/* Tag */}
                <span className={clsx(
                  'inline-block px-3 py-1 rounded-full text-xs font-medium mb-4',
                  'bg-gradient-to-r', feature.color,
                  'text-white'
                )}>
                  {feature.tag}
                </span>

                {/* Content */}
                <h3 className="text-xl font-bold mb-3 text-white group-hover:text-white transition-colors">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors">
                  {feature.description}
                </p>

                {/* Arrow */}
                <div className="mt-6 flex items-center gap-2 text-sm text-violet-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span>点击进入</span>
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* 待开发功能 */}
      <div className="py-20 px-6 relative z-10 bg-dark-50/30">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
            <span className="text-amber-400 text-sm font-medium tracking-widest uppercase mb-4 block">Coming Soon</span>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="text-white">待开发功能</span>
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto text-lg leading-relaxed">
              更多精彩功能正在路上，敬请期待
            </p>
          </div>

          {/* Coming Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {comingFeatures.map((feature, i) => (
              <div 
                key={i}
                className="group relative p-6 rounded-2xl glass border border-white/5 hover:border-white/10 transition-all duration-300"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className={clsx(
                    'w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center text-2xl',
                    feature.color
                  )}>
                    {feature.icon}
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-dark-100/50 text-gray-400 border border-white/5">
                    {feature.eta}
                  </span>
                </div>

                {/* Content */}
                <h3 className="text-lg font-bold mb-2 text-white group-hover:text-white transition-colors">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed mb-4">
                  {feature.description}
                </p>

                {/* Progress Bar */}
                {feature.progress > 0 && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">开发进度</span>
                      <span className={clsx(
                        'font-medium',
                        feature.progress >= 75 ? 'text-emerald-400' :
                        feature.progress >= 45 ? 'text-amber-400' : 'text-gray-400'
                      )}>
                        {feature.progress}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-dark-100 rounded-full overflow-hidden">
                      <div 
                        className={clsx(
                          'h-full rounded-full transition-all duration-1000',
                          'bg-gradient-to-r', feature.color
                        )}
                        style={{ width: `${feature.progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Coming Soon Badge */}
                {feature.progress === 0 && (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="w-2 h-2 rounded-full bg-gray-500 animate-pulse" />
                    <span>即将推出</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Feature Request CTA */}
          <div className="mt-12 text-center">
            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl glass border border-amber-500/20 bg-amber-500/5">
              <span className="text-2xl">💡</span>
              <span className="text-gray-400">有想法？</span>
              <a 
                href="https://github.com/anomalyco/opencode/issues" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-amber-400 hover:text-amber-300 font-medium transition-colors"
              >
                提交功能建议
              </a>
              <span className="text-gray-500">帮助我们做得更好</span>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 px-6 relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="relative p-10 md:p-16 rounded-3xl overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-primary opacity-15" />
            <div className="absolute inset-0 backdrop-blur-xl" />
            <div className="absolute inset-0 border border-white/10 rounded-3xl" />
            
            {/* Content */}
            <div className="relative text-center">
              <h3 className="text-3xl md:text-4xl font-bold mb-6">
                准备好开始你的创作之旅了吗？
              </h3>
              <p className="text-gray-400 mb-10 max-w-lg mx-auto text-lg leading-relaxed">
                无论是长篇连载还是短篇创作，AI都能为你提供全方位的辅助支持
              </p>
              <Link 
                to="/editor"
                className="inline-flex items-center gap-3 px-10 py-4 bg-white text-gray-900 rounded-2xl font-semibold text-lg hover:bg-gray-100 transition-colors shadow-lg hover:shadow-xl"
              >
                <span className="text-2xl">🚀</span>
                <span>立即开始</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Stats Bar */}
      <div className="py-6 px-6 border-t border-white/5 bg-dark-50/30 backdrop-blur-sm relative z-10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <span className="status-indicator" />
            <span>后端服务已连接</span>
          </div>
          <p className="text-gray-500 text-sm font-light tracking-wide">
            AI小说创作平台 v1.0.0 | 基于 React + TailwindCSS + TipTap
          </p>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span className="text-violet-400">❤️</span>
            <span>使用此项目</span>
          </div>
        </div>
      </div>
    </div>
  )
}

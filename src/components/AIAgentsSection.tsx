import { Link } from 'react-router-dom'

const agents = [
  {
    id: 'plot',
    icon: '🎭',
    name: '剧情规划师',
    desc: '构建故事框架，设计冲突高潮',
    color: 'from-rose-500/20 to-pink-500/20',
    border: 'hover:border-rose-500/30',
    tag: '策划'
  },
  {
    id: 'style',
    icon: '🖋️',
    name: '文风顾问',
    desc: '匹配写作风格，优化表达',
    color: 'from-violet-500/20 to-purple-500/20',
    border: 'hover:border-violet-500/30',
    tag: '润色'
  },
  {
    id: 'world',
    icon: '🌍',
    name: '世界观架构师',
    desc: '构建设定体系，统一逻辑',
    color: 'from-emerald-500/20 to-teal-500/20',
    border: 'hover:border-emerald-500/30',
    tag: '设定'
  },
  {
    id: 'character',
    icon: '👤',
    name: '角色分析师',
    desc: '塑造人物弧线，挖掘动机',
    color: 'from-amber-500/20 to-orange-500/20',
    border: 'hover:border-amber-500/30',
    tag: '人物'
  },
  {
    id: 'dialogue',
    icon: '💬',
    name: '对话生成器',
    desc: '塑造角色声音，对白自然',
    color: 'from-blue-500/20 to-cyan-500/20',
    border: 'hover:border-blue-500/30',
    tag: '对白'
  },
  {
    id: 'review',
    icon: '🔍',
    name: '内容审核',
    desc: '敏感词检测，风险评估',
    color: 'from-red-500/20 to-orange-500/20',
    border: 'hover:border-red-500/30',
    tag: '审核'
  },
  {
    id: 'data',
    icon: '📊',
    name: '数据分析师',
    desc: '追踪数据，优化运营',
    color: 'from-indigo-500/20 to-blue-500/20',
    border: 'hover:border-indigo-500/30',
    tag: '数据'
  }
]

export default function AIAgentsSection() {
  return (
    <section className="py-16 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <span className="text-xs uppercase tracking-wider text-emerald-400">AI AGENTS</span>
          <h2 className="text-4xl md:text-5xl font-extrabold mt-2 gradient-text">专业 AI Agent 协作助手</h2>
          <p className="mt-3 text-gray-400">7 大专业 AI Agent 协同创作，全方位提升写作效率</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {agents.map((agent) => (
            <div
              key={agent.id}
              className={`group p-5 rounded-2xl bg-gradient-to-br ${agent.color} border border-white/5 ${agent.border} transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-black/20 cursor-pointer`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="text-3xl group-hover:scale-110 transition-transform">{agent.icon}</div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-gray-400">
                  {agent.tag}
                </span>
              </div>
              <h3 className="font-semibold text-white mb-1">{agent.name}</h3>
              <p className="text-xs text-gray-500">{agent.desc}</p>
              <div className="mt-3 flex items-center gap-1 text-xs text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity">
                <span>开始协作</span>
                <span>→</span>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-8 text-center">
          <Link
            to="/editor"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl font-semibold hover:opacity-90 transition-opacity"
          >
            <span>体验 AI Agent 协作</span>
            <span>→</span>
          </Link>
        </div>
      </div>
    </section>
  )
}

const roadmap = [
  { quarter: 'Q1 2026', items: ['基础编辑器上线', 'AI 续写功能', '用户系统'] },
  { quarter: 'Q2 2026', items: ['世界观 Wiki', '多端同步', '社区功能'] },
  { quarter: 'Q3 2026', items: ['AI 风格迁移', '智能大纲', '数据看板'] },
  { quarter: 'Q4 2026', items: ['商业化支持', '版权交易', 'IP 孵化'] }
]

export default function RoadmapSection() {
  return (
    <section className="py-16 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <span className="text-xs uppercase tracking-wider text-gray-500">ROADMAP</span>
          <h2 className="text-3xl md:text-4xl font-bold mt-2">开发路线图</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {roadmap.map((phase) => (
            <div key={phase.quarter} className="p-6 rounded-2xl bg-gradient-to-br from-violet-500/10 to-transparent border border-violet-500/20">
              <h3 className="text-lg font-bold text-violet-400 mb-4">{phase.quarter}</h3>
              <ul className="space-y-2">
                {phase.items.map((item, idx) => (
                  <li key={idx} className="text-sm text-gray-400 flex items-start gap-2">
                    <span className="text-violet-500">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

const steps = [
  { num: '01', title: '灵感采集', desc: 'AI 智能生成灵感片段' },
  { num: '02', title: '大纲构建', desc: '自动生成章节大纲' },
  { num: '03', title: '智能续写', desc: '保持文风一致的内容续写' },
  { num: '04', title: '精修润色', desc: '多维度文笔优化' }
]

export default function WorkflowSection() {
  return (
    <section className="py-16 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <span className="text-xs uppercase tracking-wider text-gray-500">WORKFLOW</span>
          <h2 className="text-3xl md:text-4xl font-bold mt-2">创作工作流</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {steps.map((step) => (
            <div key={step.num} className="text-center p-6 rounded-2xl bg-white/5">
              <div className="text-4xl font-black text-violet-500 mb-4">{step.num}</div>
              <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
              <p className="text-sm text-gray-500">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

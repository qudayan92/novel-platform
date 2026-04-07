import { Link } from 'react-router-dom'

export default function CTASection() {
  return (
    <section className="py-20 px-6">
      <div className="max-w-4xl mx-auto text-center p-12 rounded-3xl bg-gradient-to-br from-violet-600/20 to-purple-600/20 border border-violet-500/20">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">准备好开始创作了吗？</h2>
        <p className="text-gray-400 mb-8">立即加入，体验 AI 驱动的网文创作</p>
        <Link
          to="/editor"
          className="inline-block px-10 py-4 bg-gradient-to-r from-violet-600 to-purple-600 rounded-xl font-semibold hover:opacity-90 transition-opacity"
        >
          立即开始免费使用
        </Link>
      </div>
    </section>
  )
}

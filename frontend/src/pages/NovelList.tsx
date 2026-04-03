import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import clsx from 'clsx'

interface Novel {
  id: string
  title: string
  synopsis: string
  genre: string
  wordCount: number
  status: string
  updatedAt: string
}
const defaultNew: { title: string; synopsis: string; genre: string } = { title: '', synopsis: '', genre: '玄幻' }

// Remove hard-coded mock data; fetch from backend API
const placeholderNovels: Novel[] = []

const genreColors: Record<string, string> = {
  '玄幻': 'from-violet-600 to-purple-600',
  '仙侠': 'from-emerald-600 to-teal-600',
  '都市': 'from-slate-600 to-gray-600',
  '科幻': 'from-cyan-600 to-blue-600',
  '悬疑': 'from-zinc-700 to-stone-700',
  '历史': 'from-amber-600 to-orange-600'
}

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  draft: { label: '草稿', color: 'text-gray-400', bg: 'bg-gray-500/20 border-gray-500/30' },
  writing: { label: '连载中', color: 'text-blue-400', bg: 'bg-blue-500/20 border-blue-500/30' },
  completed: { label: '已完结', color: 'text-green-400', bg: 'bg-green-500/20 border-green-500/30' }
}

export default function NovelList() {
  const [novels, setNovels] = useState<Novel[]>([]) 
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newnovel, setNewnovel] = useState({ title: '', synopsis: '', genre: '玄幻' })
  const [loading, setLoading] = useState(true)
  const loadNovels = async () => {
    try {
      const res = await fetch('/api/novels')
      const data = await res.json()
      if (data && data.data) {
        setNovels(data.data)
      } else {
        setNovels(placeholderNovels)
      }
    } catch (e) {
      console.error('Failed to load novels', e)
      setNovels(placeholderNovels)
    }
    finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    loadNovels()
  }, [])

  return (
    <div className="min-h-[calc(100vh-64px)] p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-primary flex items-center justify-center text-2xl shadow-glow">
              📚
            </div>
            <div>
              <h1 className="text-3xl font-bold">我的作品</h1>
              <p className="text-gray-500 text-sm">管理你的小说创作</p>
            </div>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2 bg-gradient-primary hover:opacity-90 shadow-glow"
          >
            <span className="text-lg">+</span>
            <span>创建新作品</span>
          </button>
        </div>

        {/* Novel Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-48 bg-gray-800 rounded-2xl" />
            ))}
          </div>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {novels.map((novel) => {
            const genreColor = genreColors[novel.genre] || 'from-gray-600 to-gray-600'
            const status = statusConfig[novel.status] || statusConfig.draft
            
            return (
              <Link
                key={novel.id}
                to={`/editor?id=${novel.id}`}
                className="group glass rounded-2xl overflow-hidden border border-white/5 card-hover"
              >
                {/* Cover */}
                <div className={clsx(
                  'aspect-[3/4] relative overflow-hidden flex items-center justify-center',
                  'bg-gradient-to-br from-dark-50/50 to-dark-50/30'
                )}>
                  <div className={clsx(
                    'absolute inset-0 bg-gradient-to-br opacity-30',
                    genreColor
                  )} />
                  <span className="text-8xl opacity-20 group-hover:opacity-40 transition-opacity duration-300">📖</span>
                  
                  {/* Status Badge */}
                  <div className="absolute top-3 right-3">
                    <span className={clsx(
                      'px-3 py-1 rounded-full text-xs font-medium border',
                      status.bg,
                      status.color
                    )}>
                      {status.label}
                    </span>
                  </div>
                </div>

                {/* Info */}
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-bold text-lg group-hover:text-primary-400 transition-colors truncate flex-1">
                      {novel.title}
                    </h3>
                  </div>
                  
                  <p className="text-sm text-gray-400 line-clamp-2 mb-3 leading-relaxed">
                    {novel.synopsis}
                  </p>
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className={clsx(
                        'px-3 py-1 rounded-lg text-xs font-medium bg-gradient-to-r text-white',
                        genreColor
                      )}>
                        {novel.genre}
                      </span>
                    </div>
                    <span className="text-gray-500">{novel.wordCount.toLocaleString()} 字</span>
                  </div>
                  
                  <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-gray-500">
                    <span>更新于 {novel.updatedAt}</span>
                    <span className="text-primary-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      点击编辑 →
                    </span>
                  </div>
                </div>
              </Link>
            )
          })}

          {/* Create New Card */}
          <button
            onClick={() => setShowCreateModal(true)}
            className="aspect-[3/4] glass rounded-2xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-4 hover:border-violet-500/30 hover:bg-dark-50/30 transition-all duration-300"
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-primary/20 flex items-center justify-center text-3xl text-violet-400">
              +
            </div>
            <span className="text-gray-400">创建新作品</span>
          </button>
        </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowCreateModal(false)}>
          <div className="glass rounded-2xl p-6 w-full max-w-md border border-white/10 shadow-card" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <span>✨</span>
                <span>创建新作品</span>
              </h2>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="w-8 h-8 rounded-lg bg-dark-50/50 hover:bg-dark-50 flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">作品名称</label>
                <input
                  type="text"
                  value={newnovel.title}
                  onChange={(e) => setNewnovel({ ...newnovel, title: e.target.value })}
                  className="w-full px-4 py-3 bg-dark-50/50 border border-white/5 rounded-xl focus:outline-none focus:border-violet-500/50 transition-all"
                  placeholder="输入作品名称"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-2">类型</label>
                <select
                  value={newnovel.genre}
                  onChange={(e) => setNewnovel({ ...newnovel, genre: e.target.value })}
                  className="w-full px-4 py-3 bg-dark-50/50 border border-white/5 rounded-xl focus:outline-none focus:border-violet-500/50 transition-all"
                >
                  {Object.keys(genreColors).map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-2">简介</label>
                <textarea
                  value={newnovel.synopsis}
                  onChange={(e) => setNewnovel({ ...newnovel, synopsis: e.target.value })}
                  className="w-full px-4 py-3 bg-dark-50/50 border border-white/5 rounded-xl focus:outline-none focus:border-violet-500/50 transition-all h-24 resize-none"
                  placeholder="简单描述你的故事..."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 py-3 rounded-xl text-sm font-medium transition-all glass hover:bg-white/10 border border-white/5"
              >
                取消
              </button>
            <button
              onClick={async () => {
                if (!newnovel.title) return
                try {
                  const res = await fetch('/api/novels', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ title: newnovel.title, synopsis: newnovel.synopsis, genre: newnovel.genre, targetWordCount: 500000 })
                  })
                  if (res.ok) {
                    // refresh list
                    await loadNovels()
                    setShowCreateModal(false)
                    setNewnovel({ title: '', synopsis: '', genre: '玄幻' })
                  }
                } catch (e) {
                  console.error('Create novel failed', e)
                }
              }}
              className="flex-1 py-3 rounded-xl text-sm font-medium transition-all bg-gradient-primary hover:opacity-90 shadow-glow"
            >
              创建
            </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

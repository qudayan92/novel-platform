import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom'
import EditorPage from './pages/EditorPage'
import WikiPage from './pages/WikiPage'
import Dashboard from './pages/Dashboard'
import NovelList from './pages/NovelList'
import StatsPage from './pages/StatsPage'
import { useStore } from './stores/store'

function Navigation() {
  const location = useLocation()
  const { writingStats } = useStore()

  const navItems = [
    { path: '/', label: '首页', icon: '🏠' },
    { path: '/novels', label: '作品', icon: '📚' },
    { path: '/editor', label: '编辑器', icon: '✍️' },
    { path: '/wiki', label: '世界观', icon: '📖' },
    { path: '/stats', label: '统计', icon: '📊' }
  ]

  return (
    <nav className="glass sticky top-0 z-50 border-b border-white/5 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center text-lg shadow-glow group-hover:scale-105 transition-transform duration-300">
              📚
            </div>
            <span className="text-xl font-bold tracking-tight hidden sm:block">
              <span className="gradient-text">小说创作</span>
              <span className="text-white">平台</span>
            </span>
          </Link>

          {/* Nav Items */}
          <div className="flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`
                    relative px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200
                    flex items-center gap-2
                    ${isActive 
                      ? 'bg-violet-500/15 text-violet-300 shadow-glow' 
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }
                  `}
                >
                  <span className="text-base">{item.icon}</span>
                  <span className="hidden md:inline">{item.label}</span>
                  {isActive && (
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-gradient-primary rounded-full" />
                  )}
                </Link>
              )
            })}
          </div>

          {/* Stats & User */}
          <div className="flex items-center gap-4">
            {/* Writing Stats */}
            <div className="hidden lg:flex items-center gap-4 px-4 py-2 rounded-xl bg-dark-50/50 border border-white/5 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">今日</span>
                <span className="text-sm font-semibold text-emerald-400 tracking-wide">
                  {writingStats.dailyWordCount.toLocaleString()}
                </span>
                <span className="text-xs text-gray-500">字</span>
              </div>
              <div className="w-px h-4 bg-white/10" />
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">总计</span>
                <span className="text-sm font-semibold text-violet-400 tracking-wide">
                  {writingStats.totalWordCount.toLocaleString()}
                </span>
                <span className="text-xs text-gray-500">字</span>
              </div>
            </div>

            {/* User Avatar */}
            <div className="relative group">
              <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center text-sm font-semibold cursor-pointer hover:scale-105 transition-transform duration-200 shadow-glow">
                作
              </div>
              {/* User Dropdown */}
              <div className="absolute right-0 top-full mt-2 w-60 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-1 group-hover:translate-y-0">
                <div className="glass rounded-xl border border-white/10 shadow-card p-3">
                  <div className="px-3 py-3 border-b border-white/5 mb-2">
                    <p className="font-semibold text-sm">创作者</p>
                    <p className="text-xs text-gray-500">@guest</p>
                  </div>
                  <div className="space-y-1">
                    <button className="w-full px-3 py-2.5 text-left text-sm text-gray-300 hover:bg-white/5 rounded-lg transition flex items-center gap-3">
                      <span className="text-lg">👤</span> 个人中心
                    </button>
                    <button className="w-full px-3 py-2.5 text-left text-sm text-gray-300 hover:bg-white/5 rounded-lg transition flex items-center gap-3">
                      <span className="text-lg">⚙️</span> 设置
                    </button>
                    <div className="border-t border-white/5 mt-2 pt-2">
                      <button className="w-full px-3 py-2.5 text-left text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition flex items-center gap-3">
                        <span className="text-lg">🚪</span> 退出登录
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen relative">
        <Navigation />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/novels" element={<NovelList />} />
          <Route path="/editor" element={<EditorPage />} />
          <Route path="/wiki" element={<WikiPage />} />
          <Route path="/stats" element={<StatsPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App

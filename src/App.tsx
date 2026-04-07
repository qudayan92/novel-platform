import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom'

function Navigation() {
  const location = useLocation()
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
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center text-lg shadow-glow">
              📚
            </div>
            <span className="text-xl font-bold tracking-tight hidden sm:block">
              <span className="gradient-text">小说创作</span>
              <span className="text-white">平台</span>
            </span>
          </Link>
          <div className="flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`relative px-4 py-2 rounded-xl text-sm font-medium transition-all ${isActive ? 'bg-violet-500/15 text-violet-300' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                >
                  <span>{item.icon}</span>
                  <span className="hidden md:inline ml-2">{item.label}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </nav>
  )
}

function Dashboard() {
  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold gradient-text mb-4">欢迎使用小说创作平台</h1>
      <p className="text-gray-400 mb-8">AI赋能，让创作更轻松</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-dark-50/30 border border-white/5">
          <div className="text-4xl mb-4">✍️</div>
          <h3 className="text-xl font-bold mb-2">AI续写</h3>
          <p className="text-gray-400">智能续写，灵感不断</p>
        </div>
        <div className="p-6 rounded-2xl bg-dark-50/30 border border-white/5">
          <div className="text-4xl mb-4">🤖</div>
          <h3 className="text-xl font-bold mb-2">AI分析</h3>
          <p className="text-gray-400">逻辑检测，质量把控</p>
        </div>
        <div className="p-6 rounded-2xl bg-dark-50/30 border border-white/5">
          <div className="text-4xl mb-4">📚</div>
          <h3 className="text-xl font-bold mb-2">世界观</h3>
          <p className="text-gray-400">统一管理，避免漏洞</p>
        </div>
      </div>
    </div>
  )
}

function EditorPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">编辑器</h1>
      <div className="p-6 rounded-2xl bg-dark-50/30 border border-white/5">
        <p className="text-gray-400">AI助手面板</p>
      </div>
    </div>
  )
}

function WikiPage() {
  return <div className="p-8"><h1 className="text-3xl font-bold">世界观</h1></div>
}

function NovelList() {
  return <div className="p-8"><h1 className="text-3xl font-bold">作品</h1></div>
}

function StatsPage() {
  return <div className="p-8"><h1 className="text-3xl font-bold">统计</h1></div>
}

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gradient-to-b from-black to-[#0a0a0f] text-white">
        <Navigation />
        <main>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/novels" element={<NovelList />} />
            <Route path="/editor" element={<EditorPage />} />
            <Route path="/wiki" element={<WikiPage />} />
            <Route path="/stats" element={<StatsPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
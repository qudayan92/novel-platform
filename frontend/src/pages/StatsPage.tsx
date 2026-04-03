import { useState, useEffect } from 'react'
import { useStore } from '../stores/store'
import clsx from 'clsx'

interface DailyStats {
  date: string
  wordCount: number
}

const achievements = [
  { icon: '🎯', title: '初露锋芒', desc: '累计创作1万字', unlocked: true, color: 'from-blue-500 to-cyan-500' },
  { icon: '🔥', title: '日更达人', desc: '连续日更7天', unlocked: true, color: 'from-orange-500 to-amber-500' },
  { icon: '💎', title: '笔耕不辍', desc: '累计创作10万字', unlocked: false, color: 'from-violet-500 to-purple-500' },
  { icon: '🏆', title: '百万作家', desc: '累计创作100万字', unlocked: false, color: 'from-yellow-500 to-amber-500' },
  { icon: '⚡', title: '爆更王者', desc: '单日创作突破1万字', unlocked: false, color: 'from-red-500 to-pink-500' },
  { icon: '🌟', title: '月度之星', desc: '月创作突破15万字', unlocked: false, color: 'from-emerald-500 to-green-500' }
]

const statCards = [
  { label: '总字数', value: 52480, color: 'text-primary-400', icon: '📚', suffix: '' },
  { label: '今日字数', value: 1234, color: 'text-green-400', icon: '✨', suffix: '' },
  { label: '连续日更', value: 7, color: 'text-amber-400', icon: '🔥', suffix: '天' },
  { label: '预计阅读', value: 131, color: 'text-violet-400', icon: '⏱️', suffix: '分钟' }
]

export default function StatsPage() {
  const { writingStats } = useStore()
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([])

  useEffect(() => {
    const mockStats: DailyStats[] = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      mockStats.push({
        date: date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }),
        wordCount: Math.floor(Math.random() * 5000) + 1000
      })
    }
    setDailyStats(mockStats)
  }, [])

  const maxWords = Math.max(...dailyStats.map(s => s.wordCount), 1)

  return (
    <div className="min-h-[calc(100vh-64px)] p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-primary flex items-center justify-center text-2xl shadow-glow">
            📊
          </div>
          <div>
            <h1 className="text-3xl font-bold">数据统计</h1>
            <p className="text-gray-500 text-sm">追踪你的创作进度</p>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map((stat, i) => (
            <div key={i} className="glass rounded-2xl p-6 border border-white/5 card-hover">
              <div className="flex items-center gap-3 mb-3">
                <div className={clsx(
                  'w-10 h-10 rounded-xl flex items-center justify-center',
                  i === 0 && 'bg-primary-500/20',
                  i === 1 && 'bg-green-500/20',
                  i === 2 && 'bg-amber-500/20',
                  i === 3 && 'bg-violet-500/20'
                )}>
                  <span className="text-lg">{stat.icon}</span>
                </div>
                <span className="text-sm text-gray-500">{stat.label}</span>
              </div>
              <div className={clsx('text-3xl font-bold', stat.color)}>
                {stat.value.toLocaleString()}{stat.suffix}
              </div>
            </div>
          ))}
        </div>

        {/* Chart Card */}
        <div className="glass rounded-2xl p-6 mb-8 border border-white/5">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <span>📈</span>
              <span>近7日创作</span>
            </h2>
            <span className="text-sm text-gray-500">每日字数统计</span>
          </div>
          
          {/* Chart */}
          <div className="flex items-end justify-between gap-3 h-52">
            {dailyStats.map((stat, i) => (
              <div key={i} className="flex-1 flex flex-col items-center group">
                <div className="w-full flex-1 flex flex-col items-center justify-end">
                  <div 
                    className={clsx(
                      'w-full max-w-12 rounded-t-xl transition-all duration-500',
                      'bg-gradient-to-t from-violet-600 to-primary-400',
                      'group-hover:from-violet-500 group-hover:to-primary-300',
                      'shadow-lg'
                    )}
                    style={{ height: `${Math.max((stat.wordCount / maxWords) * 100, 5)}%` }}
                  />
                </div>
                <div className="text-xs text-gray-500 mt-3">{stat.date}</div>
                <div className="text-sm font-medium text-gray-300">{stat.wordCount.toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Achievements */}
        <div className="glass rounded-2xl p-6 border border-white/5">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <span>🏆</span>
              <span>成就系统</span>
            </h2>
            <span className="text-sm text-gray-500">2/6 已解锁</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {achievements.map((achievement, i) => (
              <div
                key={i}
                className={clsx(
                  'relative p-4 rounded-2xl text-center transition-all duration-300',
                  achievement.unlocked
                    ? 'bg-gradient-to-br from-dark-50/50 to-dark-50/30 border border-white/10 card-hover cursor-pointer'
                    : 'bg-dark-50/20 border border-white/5 opacity-50'
                )}
              >
                {achievement.unlocked && (
                  <div className={clsx(
                    'absolute inset-0 rounded-2xl bg-gradient-to-br opacity-10 blur-xl',
                    achievement.color
                  )} />
                )}
                
                <div className={clsx(
                  'w-14 h-14 rounded-xl mx-auto mb-3 flex items-center justify-center text-2xl',
                  achievement.unlocked 
                    ? 'bg-gradient-to-br shadow-lg' 
                    : 'bg-dark-200 grayscale'
                )}>
                  <div className={clsx(
                    'text-3xl',
                    !achievement.unlocked && 'opacity-50'
                  )}>
                    {achievement.unlocked ? achievement.icon : '🔒'}
                  </div>
                </div>
                
                <div className={clsx(
                  'font-medium text-sm mb-1',
                  achievement.unlocked ? 'text-white' : 'text-gray-500'
                )}>
                  {achievement.title}
                </div>
                
                <div className="text-xs text-gray-500 leading-tight">
                  {achievement.desc}
                </div>
                
                {achievement.unlocked && (
                  <div className="absolute top-2 right-2">
                    <span className="w-5 h-5 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-xs shadow-lg">✓</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

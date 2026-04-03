import { useEffect, useState } from 'react'

interface Progress {
  totalWords: number
  targetWords: number
  todayWords: number
  weekWords: number
  monthWords: number
  chapterCount: number
  volumeCount: number
  percentComplete: number
  avgWordsPerChapter: number
  avgWordsPerDay: number
  estimatedDaysToComplete: number
  currentStreak: number
  longestStreak: number
  milestones: Milestone[]
}

interface Milestone {
  id: string
  targetWordCount: number
  label: string
  achieved: boolean
  achievedAt?: string
}

interface DailyWriting {
  date: string
  wordCount: number
  chaptersWritten: number
}

interface Props {
  novelId: string
  progress: Progress
  dailyStats: DailyWriting[]
}

export default function WritingProgress({ novelId, progress, dailyStats }: Props) {
  const [chartHeight] = useState(120)

  const maxDailyWords = Math.max(...dailyStats.map(d => d.wordCount), 1)

  const getBarHeight = (wordCount: number) => {
    return (wordCount / maxDailyWords) * chartHeight
  }

  return (
    <div className="bg-dark-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold flex items-center gap-2">
          <span>📊</span>
          <span>写作统计</span>
        </h3>
        <span className="text-xs text-gray-500">近30天</span>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-4">
        <StatCard label="今日" value={progress.todayWords} unit="字" />
        <StatCard label="本周" value={progress.weekWords} unit="字" />
        <StatCard label="本月" value={progress.monthWords} unit="字" />
        <StatCard label="总字数" value={progress.totalWords} unit="字" />
      </div>

      <div className="mb-4">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-400">目标进度</span>
          <span className="text-gray-400">{progress.totalWords.toLocaleString()} / {progress.targetWords.toLocaleString()}</span>
        </div>
        <div className="h-4 bg-dark-300 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary-500 via-primary-400 to-accent-500 transition-all duration-500"
            style={{ width: `${Math.min(100, progress.percentComplete)}%` }}
          />
        </div>
        <div className="flex justify-between text-xs mt-1">
          <span className="text-gray-500">{progress.percentComplete.toFixed(1)}%</span>
          <span className="text-gray-500">预计 {progress.estimatedDaysToComplete} 天完成</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-dark-300 p-3 rounded-lg">
          <div className="text-gray-400 text-xs mb-1">日均写作</div>
          <div className="text-xl font-bold">{progress.avgWordsPerDay.toLocaleString()}</div>
          <div className="text-xs text-gray-500">字/天</div>
        </div>
        <div className="bg-dark-300 p-3 rounded-lg">
          <div className="text-gray-400 text-xs mb-1">连续写作</div>
          <div className="text-xl font-bold flex items-center gap-2">
            {progress.currentStreak}
            <span className="text-xs">🔥</span>
          </div>
          <div className="text-xs text-gray-500">最长 {progress.longestStreak} 天</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-dark-300 p-3 rounded-lg text-center">
          <div className="text-2xl font-bold">{progress.volumeCount}</div>
          <div className="text-xs text-gray-500">卷</div>
        </div>
        <div className="bg-dark-300 p-3 rounded-lg text-center">
          <div className="text-2xl font-bold">{progress.chapterCount}</div>
          <div className="text-xs text-gray-500">章</div>
        </div>
        <div className="bg-dark-300 p-3 rounded-lg text-center">
          <div className="text-2xl font-bold">{progress.avgWordsPerChapter.toFixed(0)}</div>
          <div className="text-xs text-gray-500">均字数</div>
        </div>
      </div>

      <div className="mb-4">
        <div className="text-sm text-gray-400 mb-2">近30天写作趋势</div>
        <div className="flex items-end gap-1 h-32">
          {dailyStats.slice(-30).map((day, i) => (
            <div key={day.date} className="flex-1 flex flex-col items-center group">
              <div
                className="w-full bg-gradient-to-t from-primary-500 to-primary-400 rounded-t transition-all hover:from-primary-400 hover:to-primary-300"
                style={{ height: `${getBarHeight(day.wordCount)}px` }}
              />
              <div className="text-xs text-gray-500 mt-1 opacity-0 group-hover:opacity-100">
                {day.wordCount > 0 ? Math.round(day.wordCount / 1000) + 'k' : '0'}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="text-sm text-gray-400 mb-2">里程碑</div>
        <div className="grid grid-cols-4 gap-2">
          {progress.milestones.map(m => (
            <div
              key={m.id}
              className={`p-2 rounded-lg text-center text-xs transition ${
                m.achieved
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-dark-300 text-gray-500'
              }`}
            >
              <div className="text-lg mb-1">{m.achieved ? '✓' : '○'}</div>
              <div>{m.label}</div>
              <div className="text-xs opacity-70">{(m.targetWordCount / 10000).toFixed(0)}万字</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, unit }: { label: string; value: number; unit: string }) {
  return (
    <div className="bg-dark-300 p-3 rounded-lg">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="text-lg font-bold">{value.toLocaleString()}</div>
      <div className="text-xs text-gray-500">{unit}</div>
    </div>
  )
}
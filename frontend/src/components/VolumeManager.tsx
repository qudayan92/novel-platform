import { useState } from 'react'

interface Volume {
  id: string
  title: string
  orderIndex: number
  wordCount: number
  chapterCount: number
  status: 'planning' | 'writing' | 'completed' | 'archived'
}

interface Chapter {
  id: string
  volumeId?: string
  title: string
  orderIndex: number
  wordCount: number
  status: 'draft' | 'completed' | 'published'
}

interface Progress {
  totalWords: number
  targetWords: number
  percentComplete: number
  currentStreak: number
  avgWordsPerDay: number
  estimatedDaysToComplete: number
  milestones: { label: string; achieved: boolean; targetWordCount: number }[]
}

interface Props {
  novelId: string
  volumes: Volume[]
  chapters: Chapter[]
  progress: Progress
  onCreateVolume: (title: string) => void
  onDeleteVolume: (volumeId: string) => void
  onUpdateVolume: (volumeId: string, updates: Partial<Volume>) => void
  onMoveChapter: (chapterId: string, volumeId?: string) => void
  onCreateChapter: (title: string, volumeId?: string) => void
  onDeleteChapter: (chapterId: string) => void
}

export default function VolumeManager({
  volumes,
  chapters,
  progress,
  onCreateVolume,
  onDeleteVolume,
  onUpdateVolume,
  onMoveChapter,
  onCreateChapter,
  onDeleteChapter
}: Props) {
  const [selectedVolume, setSelectedVolume] = useState<string | null>(null)
  const [newVolumeTitle, setNewVolumeTitle] = useState('')
  const [newChapterTitle, setNewChapterTitle] = useState('')
  const [editingVolume, setEditingVolume] = useState<string | null>(null)
  const [dragOverChapter, setDragOverChapter] = useState<string | null>(null)

  const getVolumeChapters = (volumeId: string | undefined) => {
    return chapters
      .filter(c => c.volumeId === volumeId)
      .sort((a, b) => a.orderIndex - b.orderIndex)
  }

  const noVolumeChapters = getVolumeChapters(undefined)

  const handleDragStart = (e: React.DragEvent, chapterId: string) => {
    e.dataTransfer.setData('chapterId', chapterId)
  }

  const handleDragOver = (e: React.DragEvent, chapterId: string) => {
    e.preventDefault()
    setDragOverChapter(chapterId)
  }

  const handleDrop = (e: React.DragEvent, targetChapterId: string) => {
    e.preventDefault()
    setDragOverChapter(null)
    const chapterId = e.dataTransfer.getData('chapterId')
    if (chapterId && chapterId !== targetChapterId) {
      const targetChapter = chapters.find(c => c.id === targetChapterId)
      if (targetChapter) {
        onMoveChapter(chapterId, targetChapter.volumeId)
      }
    }
  }

  const handleDropToVolume = (e: React.DragEvent, volumeId: string | undefined) => {
    e.preventDefault()
    setDragOverChapter(null)
    const chapterId = e.dataTransfer.getData('chapterId')
    if (chapterId) {
      onMoveChapter(chapterId, volumeId)
    }
  }

  const statusColors: Record<string, string> = {
    planning: 'bg-blue-500/20 text-blue-400',
    writing: 'bg-yellow-500/20 text-yellow-400',
    completed: 'bg-green-500/20 text-green-400',
    archived: 'bg-gray-500/20 text-gray-400'
  }

  const statusLabels: Record<string, string> = {
    planning: '规划中',
    writing: '写作中',
    completed: '已完成',
    archived: '已归档'
  }

  return (
    <div className="flex h-full gap-4">
      <div className="w-80 flex flex-col bg-dark-200 rounded-lg">
        <div className="p-4 border-b border-dark-100">
          <h3 className="font-bold flex items-center gap-2">
            <span>📚</span>
            <span>写作进度</span>
          </h3>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <div className="flex justify-between text-sm text-gray-400 mb-1">
              <span>总字数</span>
              <span>{progress.totalWords.toLocaleString()} / {progress.targetWords.toLocaleString()}</span>
            </div>
            <div className="h-3 bg-dark-300 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary-500 to-primary-400 transition-all"
                style={{ width: `${Math.min(100, progress.percentComplete)}%` }}
              />
            </div>
            <div className="text-right text-xs text-gray-500 mt-1">
              {progress.percentComplete.toFixed(1)}%
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-dark-300 p-3 rounded-lg">
              <div className="text-gray-400 text-xs">今日写作</div>
              <div className="font-bold text-lg">{progress.avgWordsPerDay.toLocaleString()}</div>
              <div className="text-xs text-gray-500">字/天</div>
            </div>
            <div className="bg-dark-300 p-3 rounded-lg">
              <div className="text-gray-400 text-xs">连续写作</div>
              <div className="font-bold text-lg">{progress.currentStreak}</div>
              <div className="text-xs text-gray-500">天</div>
            </div>
          </div>

          <div className="text-sm">
            <div className="text-gray-400 mb-2">预计剩余</div>
            <div className="text-2xl font-bold">{progress.estimatedDaysToComplete}</div>
            <div className="text-xs text-gray-500">天</div>
          </div>
        </div>

        <div className="px-4 pb-4">
          <div className="text-sm text-gray-400 mb-2">里程碑</div>
          <div className="space-y-1">
            {progress.milestones.map(m => (
              <div
                key={m.label}
                className={`text-xs px-2 py-1 rounded ${
                  m.achieved ? 'bg-green-500/20 text-green-400' : 'bg-dark-300 text-gray-500'
                }`}
              >
                {m.achieved ? '✓' : '○'} {m.label} ({m.targetWordCount.toLocaleString()}字)
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-dark-200 rounded-lg">
        <div className="p-4 border-b border-dark-100 flex items-center justify-between">
          <h3 className="font-bold flex items-center gap-2">
            <span>📖</span>
            <span>卷册管理</span>
          </h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={newVolumeTitle}
              onChange={e => setNewVolumeTitle(e.target.value)}
              placeholder="新卷名称"
              className="px-3 py-1 bg-dark-300 border border-dark-100 rounded text-sm focus:outline-none focus:border-primary-500"
            />
            <button
              onClick={() => {
                if (newVolumeTitle.trim()) {
                  onCreateVolume(newVolumeTitle.trim())
                  setNewVolumeTitle('')
                }
              }}
              className="px-3 py-1 bg-primary-500 text-white rounded text-sm hover:bg-primary-600 transition"
            >
              新建卷
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div
            className="mb-4 p-4 border-2 border-dashed border-dark-100 rounded-lg text-center text-gray-500"
            onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('border-primary-500') }}
            onDragLeave={e => e.currentTarget.classList.remove('border-primary-500')}
            onDrop={e => { e.currentTarget.classList.remove('border-primary-500'); handleDropToVolume(e, undefined) }}
          >
            <div className="text-sm mb-2">无卷章节</div>
            <div className="text-xs">{noVolumeChapters.length} 章</div>
          </div>

          {noVolumeChapters.map(chapter => (
            <div
              key={chapter.id}
              draggable
              onDragStart={e => handleDragStart(e, chapter.id)}
              onDragOver={e => handleDragOver(e, chapter.id)}
              onDrop={e => handleDrop(e, chapter.id)}
              className={`mb-2 p-3 bg-dark-300 rounded cursor-move hover:bg-dark-100 transition ${
                dragOverChapter === chapter.id ? 'ring-2 ring-primary-500' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{chapter.title}</span>
                <span className="text-xs text-gray-500">{chapter.wordCount}字</span>
              </div>
            </div>
          ))}

          {volumes.sort((a, b) => a.orderIndex - b.orderIndex).map(volume => (
            <div key={volume.id} className="mb-4">
              <div
                className={`p-4 bg-dark-300 rounded-t-lg border-l-4 ${
                  selectedVolume === volume.id ? 'border-primary-500' : 'border-transparent'
                }`}
                onClick={() => setSelectedVolume(selectedVolume === volume.id ? null : volume.id)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold">{volume.title}</h4>
                    <div className="text-xs text-gray-500 mt-1">
                      {volume.chapterCount} 章 · {volume.wordCount.toLocaleString()} 字
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${statusColors[volume.status]}`}>
                    {statusLabels[volume.status]}
                  </span>
                </div>

                {selectedVolume === volume.id && (
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={e => { e.stopPropagation(); setEditingVolume(volume.id) }}
                      className="px-2 py-1 bg-dark-100 text-xs rounded hover:bg-dark-50 transition"
                    >
                      编辑
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); onDeleteVolume(volume.id) }}
                      className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded hover:bg-red-500/30 transition"
                    >
                      删除
                    </button>
                  </div>
                )}
              </div>

              {selectedVolume === volume.id && (
                <div
                  className="p-4 border-2 border-dashed border-dark-100 rounded-b-lg"
                  onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('border-primary-500') }}
                  onDragLeave={e => e.currentTarget.classList.remove('border-primary-500')}
                  onDrop={e => { e.currentTarget.classList.remove('border-primary-500'); handleDropToVolume(e, volume.id) }}
                >
                  <div className="mb-3 flex gap-2">
                    <input
                      type="text"
                      value={newChapterTitle}
                      onChange={e => setNewChapterTitle(e.target.value)}
                      placeholder="新章节名称"
                      className="flex-1 px-3 py-1 bg-dark-100 border border-dark-100 rounded text-sm focus:outline-none focus:border-primary-500"
                      onClick={e => e.stopPropagation()}
                    />
                    <button
                      onClick={e => {
                        e.stopPropagation()
                        if (newChapterTitle.trim()) {
                          onCreateChapter(newChapterTitle.trim(), volume.id)
                          setNewChapterTitle('')
                        }
                      }}
                      className="px-3 py-1 bg-primary-500 text-white rounded text-sm hover:bg-primary-600 transition"
                    >
                      添加
                    </button>
                  </div>

                  <div className="space-y-2">
                    {getVolumeChapters(volume.id).map(chapter => (
                      <div
                        key={chapter.id}
                        draggable
                        onDragStart={e => handleDragStart(e, chapter.id)}
                        onDragOver={e => handleDragOver(e, chapter.id)}
                        onDrop={e => handleDrop(e, chapter.id)}
                        className={`p-3 bg-dark-100 rounded cursor-move hover:bg-dark-50 transition ${
                          dragOverChapter === chapter.id ? 'ring-2 ring-primary-500' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>{chapter.title}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">{chapter.wordCount}字</span>
                            <button
                              onClick={e => { e.stopPropagation(); onDeleteChapter(chapter.id) }}
                              className="text-gray-500 hover:text-red-400 transition"
                            >
                              ×
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
import { useState } from 'react'

interface Props {
  versions: {
    id: string
    timestamp: Date
    content: string
    description?: string
  }[]
  currentId: string
  onRestore: (id: string) => void
  onCompare: (id1: string, id2: string) => void
  onClose: () => void
}

export default function VersionHistory({ versions, currentId, onRestore, onCompare, onClose }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [compareMode, setCompareMode] = useState(false)
  const [compareIds, setCompareIds] = useState<string[]>([])

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleSelect = (id: string) => {
    if (compareMode) {
      if (compareIds.includes(id)) {
        setCompareIds(compareIds.filter(i => i !== id))
      } else if (compareIds.length < 2) {
        setCompareIds([...compareIds, id])
        if (compareIds.length === 1) {
          onCompare(compareIds[0], id)
        }
      }
    } else {
      setSelectedId(id)
    }
  }

  const handleRestore = () => {
    if (selectedId) {
      onRestore(selectedId)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-dark-300 rounded-xl border border-dark-100 w-full max-w-lg max-h-[80vh] flex flex-col">
        <div className="p-4 border-b border-dark-100 flex items-center justify-between">
          <h2 className="text-lg font-bold">版本历史</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCompareMode(!compareMode)}
              className={`px-3 py-1 rounded text-sm transition ${
                compareMode ? 'bg-primary-600' : 'bg-dark-200 hover:bg-dark-100'
              }`}
            >
              对比模式
            </button>
            <button onClick={onClose} className="text-gray-500 hover:text-white">
              ✕
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {versions.map((version) => {
            const isCurrent = version.id === currentId
            const isSelected = version.id === selectedId || compareIds.includes(version.id)
            
            return (
              <div
                key={version.id}
                onClick={() => handleSelect(version.id)}
                className={`p-3 rounded-lg cursor-pointer transition ${
                  isSelected
                    ? 'bg-primary-600/20 border border-primary-500/50'
                    : 'bg-dark-200 hover:bg-dark-100 border border-transparent'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium">{formatDate(version.timestamp)}</span>
                  {isCurrent && (
                    <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded text-xs">
                      当前
                    </span>
                  )}
                </div>
                {version.description && (
                  <div className="text-sm text-gray-400">{version.description}</div>
                )}
                <div className="text-xs text-gray-500 mt-1">
                  {version.content.length} 字
                </div>
              </div>
            )
          })}
        </div>

        {selectedId && !compareMode && (
          <div className="p-4 border-t border-dark-100 flex gap-2">
            <button
              onClick={handleRestore}
              className="flex-1 py-2 bg-primary-600 hover:bg-primary-700 rounded-lg transition"
            >
              恢复此版本
            </button>
            <button
              onClick={() => setSelectedId(null)}
              className="px-4 py-2 bg-dark-200 hover:bg-dark-100 rounded-lg transition"
            >
              取消
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

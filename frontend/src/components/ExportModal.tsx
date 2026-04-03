import { useState } from 'react'

interface Props {
  isOpen: boolean
  onClose: () => void
  onExport: (format: string) => void
  wordCount: number
}

export default function ExportModal({ isOpen, onClose, onExport, wordCount }: Props) {
  const [format, setFormat] = useState('txt')
  const [includeOutline, setIncludeOutline] = useState(false)
  const [includeWiki, setIncludeWiki] = useState(false)

  if (!isOpen) return null

  const formats = [
    { value: 'txt', label: 'TXT 纯文本', icon: '📄' },
    { value: 'md', label: 'Markdown', icon: '📝' },
    { value: 'docx', label: 'Word 文档', icon: '📘' },
    { value: 'epub', label: 'EPUB 电子书', icon: '📖' },
    { value: 'pdf', label: 'PDF', icon: '📕' }
  ]

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-dark-300 rounded-xl border border-dark-100 w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">导出作品</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white">
            ✕
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm text-gray-400 mb-3">导出格式</label>
            <div className="grid grid-cols-2 gap-2">
              {formats.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setFormat(f.value)}
                  className={`p-3 rounded-lg text-left transition flex items-center gap-3 ${
                    format === f.value
                      ? 'bg-primary-600/20 border border-primary-500/50'
                      : 'bg-dark-200 border border-transparent hover:bg-dark-100'
                  }`}
                >
                  <span className="text-xl">{f.icon}</span>
                  <span className="text-sm">{f.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-3">附加选项</label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 bg-dark-200 rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeOutline}
                  onChange={(e) => setIncludeOutline(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">包含章节大纲</span>
              </label>
              <label className="flex items-center gap-3 p-3 bg-dark-200 rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeWiki}
                  onChange={(e) => setIncludeWiki(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">包含世界观设定</span>
              </label>
            </div>
          </div>

          <div className="p-3 bg-dark-200/50 rounded-lg text-sm text-gray-400">
            预计导出 <span className="text-white font-medium">{wordCount.toLocaleString()}</span> 字
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-dark-200 hover:bg-dark-100 rounded-lg transition"
          >
            取消
          </button>
          <button
            onClick={() => {
              onExport(format)
              onClose()
            }}
            className="flex-1 py-3 bg-primary-600 hover:bg-primary-700 rounded-lg transition"
          >
            导出
          </button>
        </div>
      </div>
    </div>
  )
}

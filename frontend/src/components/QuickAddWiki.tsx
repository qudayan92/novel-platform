import { useState } from 'react'

interface QuickAddProps {
  onAdd: (type: string, name: string, description?: string) => void
}

export default function QuickAddWiki({ onAdd }: QuickAddProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [type, setType] = useState('character')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  const types = [
    { value: 'character', label: '人物', icon: '👤', placeholder: '角色名称' },
    { value: 'location', label: '地点', icon: '📍', placeholder: '地点名称' },
    { value: 'item', label: '道具', icon: '🔮', placeholder: '道具名称' },
    { value: 'setting', label: '设定', icon: '⚙️', placeholder: '设定名称' },
    { value: 'faction', label: '势力', icon: '🏰', placeholder: '势力名称' }
  ]

  const handleSubmit = () => {
    if (name.trim()) {
      onAdd(type, name, description)
      setName('')
      setDescription('')
      setIsOpen(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="w-full p-3 border border-dashed border-dark-100 rounded-lg text-gray-500 hover:text-gray-300 hover:border-gray-500 transition flex items-center justify-center gap-2"
      >
        <span>+</span>
        <span>快速添加设定</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-dark-300 rounded-xl border border-dark-100 w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">快速添加设定</h2>
              <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-white">
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">类型</label>
                <div className="flex flex-wrap gap-2">
                  {types.map((t) => (
                    <button
                      key={t.value}
                      onClick={() => setType(t.value)}
                      className={`px-3 py-2 rounded-lg text-sm transition flex items-center gap-2 ${
                        type === t.value
                          ? 'bg-primary-600 text-white'
                          : 'bg-dark-200 text-gray-400 hover:bg-dark-100'
                      }`}
                    >
                      <span>{t.icon}</span>
                      <span>{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">名称</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={types.find(t => t.value === type)?.placeholder}
                  className="w-full px-4 py-2 bg-dark-200 border border-dark-100 rounded-lg focus:outline-none focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">简介（可选）</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="简单描述..."
                  className="w-full px-4 py-2 bg-dark-200 border border-dark-100 rounded-lg focus:outline-none focus:border-primary-500 h-20 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setIsOpen(false)}
                className="flex-1 py-2 bg-dark-200 hover:bg-dark-100 rounded-lg transition"
              >
                取消
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 py-2 bg-primary-600 hover:bg-primary-700 rounded-lg transition"
              >
                添加
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

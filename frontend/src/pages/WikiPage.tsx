import { useState } from 'react'
import clsx from 'clsx'

interface WikiEntry {
  id: string
  name: string
  type: 'character' | 'location' | 'item' | 'setting'
  description: string
  traits?: string[]
  relations?: { name: string; type: string }[]
}

const mockWikiData: WikiEntry[] = [
  {
    id: '1',
    name: '林墨',
    type: 'character',
    description: '男主角，性格冷静克制，不轻易表现恐惧。自幼被神秘组织收养，学习古武与现代科技的融合之道。',
    traits: ['冷静', '克制', '重情义', '天赋异禀'],
    relations: [
      { name: '姬紫月', type: '恋人' },
      { name: '古币', type: '持有' }
    ]
  },
  {
    id: '2',
    name: '姬紫月',
    type: 'character',
    description: '女主角，古灵精怪，出身神秘世家。掌握虚空经，性格活泼却深藏不露。',
    traits: ['古灵精怪', '聪明', '活泼'],
    relations: [
      { name: '林墨', type: '恋人' }
    ]
  },
  {
    id: '3',
    name: '古币',
    type: 'item',
    description: '开启"幽冥之门"的钥匙，会在危险临近时发热。材质古朴，刻有未知铭文。',
    traits: ['神秘', '古老', '关键道具']
  },
  {
    id: '4',
    name: '青云镇',
    type: 'location',
    description: '表面平静的边陲小镇，实则暗流涌动。多方势力在此交汇，隐藏着古老秘密。',
    traits: ['表面平静', '暗流涌动', '边陲']
  },
  {
    id: '5',
    name: '幽冥之门',
    type: 'setting',
    description: '传说中连接生死的通道，被古币封印。每逢月圆之夜，封印会变得不稳定。',
    traits: ['神秘', '危险', '传说']
  }
]

const typeConfig = {
  character: { icon: '👤', color: 'from-blue-500 to-cyan-500', bg: 'bg-blue-500/20', text: 'text-blue-400' },
  location: { icon: '📍', color: 'from-emerald-500 to-green-500', bg: 'bg-emerald-500/20', text: 'text-emerald-400' },
  item: { icon: '🔮', color: 'from-violet-500 to-purple-500', bg: 'bg-violet-500/20', text: 'text-violet-400' },
  setting: { icon: '⚙️', color: 'from-amber-500 to-orange-500', bg: 'bg-amber-500/20', text: 'text-amber-400' }
}

const typeLabels = {
  character: '人物',
  location: '地点',
  item: '道具',
  setting: '设定'
}

export default function WikiPage() {
  const [entries] = useState<WikiEntry[]>(mockWikiData)
  const [filter, setFilter] = useState<string>('all')
  const [selectedEntry, setSelectedEntry] = useState<WikiEntry | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const filteredEntries = entries.filter(entry => {
    const matchesFilter = filter === 'all' || entry.type === filter
    const matchesSearch = entry.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.description.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesFilter && matchesSearch
  })

  return (
    <div className="flex h-[calc(100vh-64px)]">
      {/* 左侧列表 */}
      <div className="w-96 glass flex flex-col border-r border-white/5 relative z-10">
        {/* Header */}
        <div className="p-4 border-b border-white/5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center text-lg shadow-glow">
              📖
            </div>
            <div>
              <h2 className="font-bold">世界观设定</h2>
              <p className="text-xs text-gray-500">{entries.length} 个设定</p>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="搜索设定..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2.5 pl-10 bg-dark-50/50 border border-white/5 rounded-xl text-sm focus:outline-none focus:border-violet-500/50 transition-all"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">🔍</span>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
            {[
              { key: 'all', label: '全部', icon: '📚' },
              { key: 'character', label: '人物', icon: '👤' },
              { key: 'location', label: '地点', icon: '📍' },
              { key: 'item', label: '道具', icon: '🔮' },
              { key: 'setting', label: '设定', icon: '⚙️' }
            ].map((type) => (
              <button
                key={type.key}
                onClick={() => setFilter(type.key)}
                className={clsx(
                  'px-3 py-1.5 text-xs rounded-lg transition-all whitespace-nowrap flex items-center gap-1.5',
                  filter === type.key
                    ? 'bg-primary-600/20 text-primary-400 border border-primary-500/30'
                    : 'bg-dark-50/50 text-gray-400 hover:bg-dark-50 hover:text-white border border-transparent'
                )}
              >
                <span>{type.icon}</span>
                <span>{type.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {filteredEntries.map((entry) => {
            const config = typeConfig[entry.type]
            const isSelected = selectedEntry?.id === entry.id
            
            return (
              <div
                key={entry.id}
                onClick={() => setSelectedEntry(entry)}
                className={clsx(
                  'p-4 rounded-xl cursor-pointer transition-all duration-200 border',
                  isSelected
                    ? 'bg-primary-600/10 border-primary-500/30 shadow-glow'
                    : 'bg-dark-50/30 border-transparent hover:bg-dark-50/50 hover:border-white/5'
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={clsx(
                    'w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center text-lg',
                    config.color
                  )}>
                    {config.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{entry.name}</div>
                    <div className={clsx('text-xs', config.text)}>
                      {typeLabels[entry.type]}
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-2 line-clamp-2 leading-relaxed">
                  {entry.description}
                </p>
              </div>
            )
          })}
        </div>

        {/* Add Button */}
        <div className="p-4 border-t border-white/5">
          <button className="w-full py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 bg-gradient-primary hover:opacity-90 shadow-glow">
            <span className="text-lg">+</span>
            <span>添加新设定</span>
          </button>
        </div>
      </div>

      {/* 右侧详情 */}
      <div className="flex-1 overflow-y-auto relative">
        {/* Background Glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent pointer-events-none" />
        
        {selectedEntry ? (
          <div className="max-w-3xl mx-auto p-8 relative z-10">
            {(() => {
              const config = typeConfig[selectedEntry.type]
              return (
                <>
                  {/* Header */}
                  <div className="flex items-start justify-between mb-8">
                    <div>
                      <div className="flex items-center gap-4 mb-3">
                        <div className={clsx(
                          'w-16 h-16 rounded-2xl bg-gradient-to-br flex items-center justify-center text-3xl shadow-lg',
                          config.color
                        )}>
                          {config.icon}
                        </div>
                        <div>
                          <h2 className="text-3xl font-bold mb-1">{selectedEntry.name}</h2>
                          <span className={clsx(
                            'px-3 py-1 rounded-full text-xs font-medium',
                            config.bg,
                            config.text
                          )}>
                            {typeLabels[selectedEntry.type]}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="px-4 py-2 rounded-xl text-sm transition-all glass hover:bg-white/10 border border-white/5 flex items-center gap-2">
                        <span>✏️</span>
                        <span>编辑</span>
                      </button>
                      <button className="px-4 py-2 rounded-xl text-sm transition-all bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 flex items-center gap-2">
                        <span>🗑️</span>
                        <span>删除</span>
                      </button>
                    </div>
                  </div>

                  {/* Description Card */}
                  <div className="glass rounded-2xl p-6 mb-6 border border-white/5">
                    <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
                      <span>📝</span>
                      <span>描述</span>
                    </h3>
                    <p className="text-gray-200 leading-relaxed text-lg">
                      {selectedEntry.description}
                    </p>
                  </div>

                  {/* Traits Card */}
                  {selectedEntry.traits && selectedEntry.traits.length > 0 && (
                    <div className="glass rounded-2xl p-6 mb-6 border border-white/5">
                      <h3 className="text-sm font-medium text-gray-400 mb-4 flex items-center gap-2">
                        <span>🏷️</span>
                        <span>特征标签</span>
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedEntry.traits.map((trait, i) => (
                          <span 
                            key={i} 
                            className="px-4 py-2 bg-gradient-to-r from-violet-500/10 to-purple-500/10 text-violet-300 rounded-xl text-sm border border-violet-500/20"
                          >
                            {trait}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Relations Card */}
                  {selectedEntry.relations && selectedEntry.relations.length > 0 && (
                    <div className="glass rounded-2xl p-6 border border-white/5">
                      <h3 className="text-sm font-medium text-gray-400 mb-4 flex items-center gap-2">
                        <span>🔗</span>
                        <span>关联关系</span>
                      </h3>
                      <div className="space-y-2">
                        {selectedEntry.relations.map((rel, i) => (
                          <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-dark-50/30 border border-white/5 hover:border-violet-500/20 transition-all">
                            <span className="text-lg">👤</span>
                            <span className="font-medium text-amber-300">{rel.name}</span>
                            <span className="text-gray-500">-</span>
                            <span className="text-gray-400">{rel.type}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )
            })()}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full relative z-10">
            <div className="text-center">
              <div className="w-24 h-24 rounded-3xl bg-gradient-primary/20 flex items-center justify-center text-5xl mx-auto mb-4 opacity-50">
                📖
              </div>
              <p className="text-gray-500 text-lg">选择一个设定查看详情</p>
              <p className="text-gray-600 text-sm mt-2">点击左侧列表中的项目</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

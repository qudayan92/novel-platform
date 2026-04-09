import { useState } from 'react'
import clsx from 'clsx'

interface Props {
  onAction: (action: string, params?: any) => void
  isGenerating: boolean
}

export default function AIPanel({ onAction, isGenerating }: Props) {
  const [activeTab, setActiveTab] = useState<'write' | 'generate' | 'analyze'>('write')
  const [style, setStyle] = useState('古风')

  const actions = [
    { key: 'continue', label: '继续', icon: '📝', color: 'from-violet-500 to-purple-500' },
    { key: 'conflict', label: '冲突', icon: '⚔️', color: 'from-red-500 to-orange-500' },
    { key: 'twist', label: '反转', icon: '🔄', color: 'from-cyan-500 to-blue-500' },
    { key: 'dialog', label: '对话', icon: '💬', color: 'from-pink-500 to-rose-500' },
    { key: 'scene', label: '场景', icon: '🏞️', color: 'from-emerald-500 to-green-500' },
    { key: 'emotion', label: '情感', icon: '💫', color: 'from-amber-500 to-yellow-500' }
  ]

  const styles = [
    { name: '古风', color: 'from-amber-600 to-orange-600' },
    { name: '玄幻', color: 'from-violet-600 to-purple-600' },
    { name: '都市', color: 'from-slate-600 to-gray-600' },
    { name: '悬疑', color: 'from-zinc-700 to-stone-700' },
    { name: '轻小说', color: 'from-pink-500 to-rose-500' },
    { name: '废土', color: 'from-red-700 to-orange-700' }
  ]

  const generators = [
    { key: 'name', label: '人名生成', icon: '👤' },
    { key: 'place', label: '地名生成', icon: '📍' },
    { key: 'skill', label: '功法/技能', icon: '⚔️' },
    { key: 'item', label: '道具/法宝', icon: '🔮' },
    { key: 'org', label: '势力/门派', icon: '🏰' },
    { key: 'history', label: '历史背景', icon: '📜' }
  ]

  const analyzers = [
    { key: 'logic', label: '逻辑检测', icon: '🔍', desc: '检查剧情逻辑' },
    { key: 'consistency', label: '一致性检查', icon: '✓', desc: '设定一致性' },
    { key: 'sensitive', label: '敏感词检测', icon: '⚠️', desc: '内容安全' },
    { key: 'readability', label: '可读性分析', icon: '📊', desc: '文字质量' }
  ]

  return (
    <div className="w-80 glass flex flex-col border-r border-white/5 relative z-10">
      {/* Header */}
      <div className="p-4 border-b border-white/5">
        <h3 className="font-bold text-lg flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-primary flex items-center justify-center text-sm shadow-glow">
            🪄
          </div>
          <span>AI 助手</span>
        </h3>
        <p className="text-xs text-gray-500 mt-1">智能续写 · 灵感生成 · 文本分析</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/5">
        {[
          { key: 'write', label: '续写' },
          { key: 'generate', label: '生成' },
          { key: 'analyze', label: '分析' }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={clsx(
              'flex-1 py-3 text-sm font-medium transition-all duration-200 relative',
              activeTab === tab.key
                ? 'text-primary-400'
                : 'text-gray-500 hover:text-gray-300'
            )}
          >
            {tab.label}
            {activeTab === tab.key && (
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-gradient-primary rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'write' && (
          <div className="space-y-5">
            {/* Writing Direction */}
            <div>
              <label className="block text-xs text-gray-500 mb-3 uppercase tracking-wider">续写方向</label>
              <div className="grid grid-cols-2 gap-2">
                {actions.map((action) => (
                  <button
                    key={action.key}
                    onClick={() => onAction('write', { direction: action.key })}
                    disabled={isGenerating}
                    className={clsx(
                      'p-3 rounded-xl text-sm transition-all duration-200',
                      'border border-transparent hover:border-white/10',
                      'bg-dark-50/30 hover:bg-dark-50/50',
                      'disabled:opacity-50 disabled:cursor-not-allowed',
                      'group'
                    )}
                  >
                    <div className={clsx(
                      'w-8 h-8 rounded-lg bg-gradient-to-br mb-2 flex items-center justify-center text-sm',
                      action.color
                    )}>
                      {action.icon}
                    </div>
                    <div className="font-medium">{action.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Writing Style */}
            <div>
              <label className="block text-xs text-gray-500 mb-3 uppercase tracking-wider">写作风格</label>
              <div className="flex flex-wrap gap-2">
                {styles.map((s) => (
                  <button
                    key={s.name}
                    onClick={() => setStyle(s.name)}
                    className={clsx(
                      'px-3 py-1.5 text-xs rounded-full transition-all duration-200',
                      style === s.name
                        ? 'bg-gradient-primary text-white shadow-glow'
                        : 'bg-dark-50/50 text-gray-400 hover:bg-dark-50 hover:text-white border border-transparent'
                    )}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'generate' && (
          <div className="space-y-3">
            <p className="text-xs text-gray-500 mb-4">灵感生成器 - 一键生成创作素材</p>
            {generators.map((gen) => (
              <button
                key={gen.key}
                onClick={() => onAction('generate', { type: gen.key })}
                disabled={isGenerating}
                className={clsx(
                  'w-full p-3 rounded-xl text-sm transition-all duration-200',
                  'border border-transparent hover:border-white/10',
                  'bg-dark-50/30 hover:bg-dark-50/50',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  'flex items-center gap-3'
                )}
              >
                <span className="text-xl">{gen.icon}</span>
                <span className="font-medium">{gen.label}</span>
              </button>
            ))}
          </div>
        )}

        {activeTab === 'analyze' && (
          <div className="space-y-3">
            <p className="text-xs text-gray-500 mb-4">文本分析 - 优化内容质量</p>
            {analyzers.map((item) => (
              <button
                key={item.key}
                onClick={() => onAction('analyze', { type: item.key })}
                disabled={isGenerating}
                className={clsx(
                  'w-full p-3 rounded-xl transition-all duration-200',
                  'border border-transparent hover:border-white/10',
                  'bg-dark-50/30 hover:bg-dark-50/50',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{item.icon}</span>
                  <div className="text-left">
                    <div className="font-medium text-sm">{item.label}</div>
                    <div className="text-xs text-gray-500">{item.desc}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer - Main AI Button */}
      <div className="p-4 border-t border-white/5">
        <button
          onClick={() => onAction('write', { direction: 'continue' })}
          disabled={isGenerating}
          className={clsx(
            'w-full py-3 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2',
            isGenerating
              ? 'bg-violet-600/50 cursor-not-allowed'
              : 'bg-gradient-primary hover:opacity-90 shadow-glow hover:shadow-glow-lg'
          )}
        >
          <span className={isGenerating ? 'animate-spin' : ''}>🪄</span>
          <span>{isGenerating ? '生成中...' : 'AI 续写'}</span>
        </button>
        <p className="text-xs text-gray-500 text-center mt-2">
          当前风格: <span className="text-violet-400">{style}</span>
        </p>
      </div>
    </div>
  )
}

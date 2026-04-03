import { useState, useEffect } from 'react'
import { contentChecker } from '../utils/contentChecker'

interface Props {
  content: string
  onDismiss: () => void
}

interface Warning {
  type: 'sensitive' | 'consistency' | 'logic'
  message: string
  level: 'low' | 'medium' | 'high'
}

export default function ContentWarning({ content, onDismiss }: Props) {
  const [warnings, setWarnings] = useState<Warning[]>([])

  useEffect(() => {
    const sensitiveWords = contentChecker.checkSensitiveWords(content)
    const logicGaps = contentChecker.checkLogicGaps(content)
    
    const newWarnings: Warning[] = [
      ...sensitiveWords.map(w => ({
        type: 'sensitive' as const,
        message: `发现敏感词"${w.word}"：${w.reason || '可能违规'}`,
        level: w.level
      })),
      ...logicGaps.map(g => ({
        type: 'logic' as const,
        message: g,
        level: 'medium' as const
      }))
    ]
    
    setWarnings(newWarnings)
  }, [content])

  if (warnings.length === 0) return null

  const levelColors = {
    low: 'border-yellow-500/50 bg-yellow-500/10',
    medium: 'border-orange-500/50 bg-orange-500/10',
    high: 'border-red-500/50 bg-red-500/10'
  }

  return (
    <div className={`fixed bottom-4 right-4 max-w-sm border rounded-xl p-4 z-50 ${levelColors[warnings[0]?.level || 'low']}`}>
      <div className="flex items-start justify-between mb-2">
        <div className="font-medium text-yellow-400">⚠️ 内容提示</div>
        <button onClick={onDismiss} className="text-gray-500 hover:text-white">
          ✕
        </button>
      </div>
      <ul className="space-y-1 text-sm">
        {warnings.slice(0, 3).map((w, i) => (
          <li key={i} className="text-gray-300">
            • {w.message}
          </li>
        ))}
        {warnings.length > 3 && (
          <li className="text-gray-500">还有 {warnings.length - 3} 条提示...</li>
        )}
      </ul>
    </div>
  )
}

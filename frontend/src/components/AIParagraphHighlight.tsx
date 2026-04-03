import { useState } from 'react'

interface ParagraphResult {
  index: number
  text: string
  humanScore: number
  suspectedAIScore: number
  aiScore: number
  riskLevel: string
  matchedPatterns: string[]
}

interface Props {
  paragraphs: ParagraphResult[]
  originalText: string
}

export default function AIParagraphHighlight({ paragraphs, originalText }: Props) {
  const [selectedParagraph, setSelectedParagraph] = useState<number | null>(null)

  const riskStyles: Record<string, { bg: string; border: string; label: string }> = {
    safe: { bg: 'bg-green-500/10', border: 'border-green-500/30', label: '安全' },
    low: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', label: '低风险' },
    medium: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', label: '中等' },
    high: { bg: 'bg-orange-500/10', border: 'border-orange-500/30', label: '高风险' },
    very_high: { bg: 'bg-red-500/10', border: 'border-red-500/30', label: '极高' }
  }

  const sortedByRisk = [...paragraphs].sort((a, b) => b.aiScore - a.aiScore)

  return (
    <div className="bg-dark-200 rounded-lg overflow-hidden">
      <div className="p-4 border-b border-dark-100">
        <h3 className="font-bold flex items-center gap-2">
          <span>📍</span>
          <span>段落AI分析</span>
        </h3>
        <p className="text-xs text-gray-500 mt-1">点击段落查看详情，高风险段落已标出</p>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {paragraphs.map((para, idx) => {
          const style = riskStyles[para.riskLevel] || riskStyles.safe
          const isSelected = selectedParagraph === idx

          return (
            <div
              key={idx}
              className={`p-4 border-b border-dark-100 cursor-pointer transition ${
                isSelected ? `${style.bg} border-l-4 ${style.border}` : 'hover:bg-dark-300'
              }`}
              onClick={() => setSelectedParagraph(isSelected ? null : idx)}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="text-xs text-gray-500">段落 {para.index + 1}</span>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded ${style.bg} ${style.border} border`}>
                    {style.label}
                  </span>
                  <span className="text-xs text-gray-500">
                    AI: <span className={para.aiScore > 50 ? 'text-red-400' : 'text-gray-400'}>{para.aiScore}%</span>
                  </span>
                </div>
              </div>

              <p className="text-sm text-gray-300 line-clamp-3">{para.text}</p>

              {isSelected && (
                <div className="mt-3 pt-3 border-t border-dark-100">
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    <div className="text-center">
                      <div className="text-lg font-bold text-[#4ECDC4]">{para.humanScore}</div>
                      <div className="text-xs text-gray-500">人工特征</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-[#FFE66D]">{para.suspectedAIScore}</div>
                      <div className="text-xs text-gray-500">疑似AI</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-[#FF6B6B]">{para.aiScore}</div>
                      <div className="text-xs text-gray-500">AI特征</div>
                    </div>
                  </div>

                  {para.matchedPatterns.length > 0 && (
                    <div>
                      <div className="text-xs text-gray-500 mb-1">匹配的特征:</div>
                      <div className="flex flex-wrap gap-1">
                        {para.matchedPatterns.map((pattern, i) => (
                          <span key={i} className="text-xs px-2 py-0.5 bg-red-500/20 text-red-400 rounded">
                            {pattern}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="p-4 bg-dark-300">
        <div className="text-xs text-gray-500 mb-2">风险分布</div>
        <div className="flex h-2 rounded-full overflow-hidden bg-dark-100">
          {(['safe', 'low', 'medium', 'high', 'very_high'] as const).map(level => {
            const count = paragraphs.filter(p => p.riskLevel === level).length
            const percentage = (count / paragraphs.length) * 100
            if (percentage === 0) return null
            return (
              <div
                key={level}
                className={`${riskStyles[level].bg}`}
                style={{ width: `${percentage}%` }}
                title={`${riskStyles[level].label}: ${count}段`}
              />
            )
          })}
        </div>
        <div className="flex justify-between mt-1 text-xs text-gray-500">
          <span>安全</span>
          <span>高风险</span>
        </div>
      </div>
    </div>
  )
}
import { useState } from 'react'
import AIIndexPanel from './AIIndexPanel'

interface ChapterResult {
  chapterId: string
  chapterTitle: string
  humanScore: number
  suspectedAIScore: number
  aiScore: number
  riskLevel: string
}

interface Props {
  novelId: string
  chapters: { id: string; title: string; wordCount: number }[]
  onDetect: (chapterIds: string[]) => Promise<void>
  result?: {
    overall: {
      humanScore: number
      suspectedAIScore: number
      aiScore: number
      riskLevel: string
      confidence: number
      summary: string
      suggestions: string[]
      detectedModels: { name: string; confidence: number }[]
      statistics: any
    }
    chapterResults: ChapterResult[]
  }
  isDetecting: boolean
}

export default function NovelAIDetector({ novelId, chapters, onDetect, result, isDetecting }: Props) {
  const [selectedChapters, setSelectedChapters] = useState<string[]>([])
  const [detectMode, setDetectMode] = useState<'all' | 'selected'>('all')

  const toggleChapter = (chapterId: string) => {
    setSelectedChapters(prev =>
      prev.includes(chapterId) ? prev.filter(id => id !== chapterId) : [...prev, chapterId]
    )
  }

  const selectAll = () => {
    setSelectedChapters(chapters.map(c => c.id))
  }

  const selectNone = () => {
    setSelectedChapters([])
  }

  const handleDetect = async () => {
    const idsToDetect = detectMode === 'all' ? chapters.map(c => c.id) : selectedChapters
    await onDetect(idsToDetect)
  }

  const riskColors: Record<string, string> = {
    safe: 'bg-green-500',
    low: 'bg-blue-500',
    medium: 'bg-yellow-500',
    high: 'bg-orange-500',
    very_high: 'bg-red-500'
  }

  return (
    <div className="bg-dark-200 rounded-lg">
      <div className="p-4 border-b border-dark-100">
        <h3 className="font-bold flex items-center gap-2">
          <span>🤖</span>
          <span>AI指数检测 - 整本分析</span>
        </h3>
      </div>

      {!result ? (
        <div className="p-4">
          <div className="mb-4">
            <div className="text-sm text-gray-400 mb-2">检测范围</div>
            <div className="flex gap-2">
              <button
                onClick={() => setDetectMode('all')}
                className={`flex-1 py-2 rounded text-sm transition ${
                  detectMode === 'all' ? 'bg-primary-500 text-white' : 'bg-dark-300 text-gray-400'
                }`}
              >
                整本检测 ({chapters.length} 章)
              </button>
              <button
                onClick={() => setDetectMode('selected')}
                className={`flex-1 py-2 rounded text-sm transition ${
                  detectMode === 'selected' ? 'bg-primary-500 text-white' : 'bg-dark-300 text-gray-400'
                }`}
              >
                选择章节 ({selectedChapters.length})
              </button>
            </div>
          </div>

          {detectMode === 'selected' && (
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-400">选择要检测的章节:</span>
                <div className="flex gap-2">
                  <button onClick={selectAll} className="text-xs text-primary-400 hover:text-primary-300">
                    全选
                  </button>
                  <button onClick={selectNone} className="text-xs text-gray-400 hover:text-gray-300">
                    取消
                  </button>
                </div>
              </div>
              <div className="max-h-40 overflow-y-auto bg-dark-300 rounded-lg p-2 space-y-1">
                {chapters.map(chapter => (
                  <label
                    key={chapter.id}
                    className="flex items-center gap-2 p-2 hover:bg-dark-100 rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedChapters.includes(chapter.id)}
                      onChange={() => toggleChapter(chapter.id)}
                      className="w-4 h-4 rounded border-gray-500"
                    />
                    <span className="flex-1 text-sm truncate">{chapter.title}</span>
                    <span className="text-xs text-gray-500">{chapter.wordCount}字</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="bg-dark-300 rounded-lg p-4 mb-4">
            <div className="text-sm text-gray-400 mb-2">检测说明</div>
            <ul className="text-xs text-gray-500 space-y-1">
              <li>• 分析文本的统计特征（句子长度、词汇多样性等）</li>
              <li>• 识别AI特征模式（GPT-4、Claude、DeepSeek等）</li>
              <li>• 计算三维指数：人工特征、疑似AI、AI特征</li>
              <li>• 生成详细的风险评估报告</li>
            </ul>
          </div>

          <button
            onClick={handleDetect}
            disabled={isDetecting || (detectMode === 'selected' && selectedChapters.length === 0)}
            className={`w-full py-3 rounded font-medium transition ${
              isDetecting || (detectMode === 'selected' && selectedChapters.length === 0)
                ? 'bg-dark-300 text-gray-500 cursor-not-allowed'
                : 'bg-primary-500 text-white hover:bg-primary-600'
            }`}
          >
            {isDetecting ? '检测中...' : '开始检测'}
          </button>
        </div>
      ) : (
        <div className="p-4 space-y-4">
          <AIIndexPanel
            humanScore={result.overall.humanScore}
            suspectedAIScore={result.overall.suspectedAIScore}
            aiScore={result.overall.aiScore}
            riskLevel={result.overall.riskLevel as any}
            confidence={result.overall.confidence}
            detectedModels={result.overall.detectedModels}
            statistics={result.overall.statistics}
          />

          <div className="bg-dark-300 rounded-lg p-4">
            <h4 className="font-medium mb-2">检测结论</h4>
            <p className="text-sm text-gray-300">{result.overall.summary}</p>
          </div>

          {result.overall.suggestions.length > 0 && (
            <div className="bg-dark-300 rounded-lg p-4">
              <h4 className="font-medium mb-2">优化建议</h4>
              <ul className="space-y-1">
                {result.overall.suggestions.map((s, i) => (
                  <li key={i} className="text-sm text-gray-400 flex items-start gap-2">
                    <span className="text-primary-400">•</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <h4 className="font-medium mb-2">章节详情</h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {result.chapterResults.map((cr, i) => (
                <div key={cr.chapterId} className="bg-dark-300 p-3 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium truncate flex-1">{cr.chapterTitle}</span>
                    <span className={`w-2 h-2 rounded-full ${riskColors[cr.riskLevel] || 'bg-gray-500'}`} />
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="text-center">
                      <div className="text-[#4ECDC4]">{cr.humanScore}</div>
                      <div className="text-gray-500">人工</div>
                    </div>
                    <div className="text-center">
                      <div className="text-[#FFE66D]">{cr.suspectedAIScore}</div>
                      <div className="text-gray-500">疑似</div>
                    </div>
                    <div className="text-center">
                      <div className="text-[#FF6B6B]">{cr.aiScore}</div>
                      <div className="text-gray-500">AI</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => window.location.reload()}
            className="w-full py-2 bg-dark-300 text-gray-400 rounded hover:bg-dark-100 transition"
          >
            重新检测
          </button>
        </div>
      )}
    </div>
  )
}
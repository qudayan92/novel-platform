import { useEffect, useRef, useState } from 'react'

interface Props {
  humanScore: number
  suspectedAIScore: number
  aiScore: number
  riskLevel: 'safe' | 'low' | 'medium' | 'high' | 'very_high'
  confidence: number
  detectedModels: { name: string; confidence: number }[]
  statistics?: {
    avgSentenceLength: number
    sentenceLengthVariance: number
    vocabDiversity: number
    burstinessScore: number
    repetitionRate: number
  }
}

export default function AIIndexPanel({
  humanScore,
  suspectedAIScore,
  aiScore,
  riskLevel,
  confidence,
  detectedModels,
  statistics
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [activeTab, setActiveTab] = useState<'radar' | 'stats' | 'models'>('radar')

  useEffect(() => {
    if (activeTab === 'radar') {
      drawRadarChart()
    }
  }, [humanScore, suspectedAIScore, aiScore, activeTab])

  const drawRadarChart = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const width = 280
    const height = 280
    const centerX = width / 2
    const centerY = height / 2
    const radius = 100

    ctx.clearRect(0, 0, width, height)

    const labels = ['人工特征', '疑似AI', 'AI特征']
    const values = [humanScore, suspectedAIScore, aiScore]
    const colors = ['#4ECDC4', '#FFE66D', '#FF6B6B']

    const angleStep = (Math.PI * 2) / 3
    const startAngle = -Math.PI / 2

    for (let level = 1; level <= 5; level++) {
      const levelRadius = (radius * level) / 5
      ctx.beginPath()
      for (let i = 0; i <= 3; i++) {
        const angle = startAngle + i * angleStep
        const x = centerX + levelRadius * Math.cos(angle)
        const y = centerY + levelRadius * Math.sin(angle)
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.closePath()
      ctx.strokeStyle = level === 5 ? '#444' : '#333'
      ctx.lineWidth = 1
      ctx.stroke()
    }

    for (let i = 0; i < 3; i++) {
      const angle = startAngle + i * angleStep
      ctx.beginPath()
      ctx.moveTo(centerX, centerY)
      ctx.lineTo(centerX + radius * Math.cos(angle), centerY + radius * Math.sin(angle))
      ctx.strokeStyle = '#333'
      ctx.lineWidth = 1
      ctx.stroke()

      ctx.fillStyle = '#888'
      ctx.font = '12px system-ui'
      ctx.textAlign = 'center'
      ctx.fillText(labels[i], centerX + (radius + 25) * Math.cos(angle), centerY + (radius + 25) * Math.sin(angle))
    }

    ctx.beginPath()
    for (let i = 0; i < 3; i++) {
      const angle = startAngle + i * angleStep
      const valueRadius = (values[i] / 100) * radius
      const x = centerX + valueRadius * Math.cos(angle)
      const y = centerY + valueRadius * Math.sin(angle)
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.closePath()
    ctx.fillStyle = 'rgba(78, 205, 196, 0.3)'
    ctx.fill()
    ctx.strokeStyle = colors[0]
    ctx.lineWidth = 2
    ctx.stroke()

    for (let i = 0; i < 3; i++) {
      const angle = startAngle + i * angleStep
      const valueRadius = (values[i] / 100) * radius
      const x = centerX + valueRadius * Math.cos(angle)
      const y = centerY + valueRadius * Math.sin(angle)

      ctx.beginPath()
      ctx.arc(x, y, 5, 0, Math.PI * 2)
      ctx.fillStyle = colors[i]
      ctx.fill()
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 2
      ctx.stroke()

      ctx.fillStyle = '#fff'
      ctx.font = 'bold 12px system-ui'
      ctx.textAlign = 'center'
      ctx.fillText(`${values[i]}`, x, y + 4)
    }
  }

  const riskColors: Record<string, string> = {
    safe: 'bg-green-500/20 text-green-400 border-green-500/30',
    low: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    very_high: 'bg-red-500/20 text-red-400 border-red-500/30'
  }

  const riskLabels: Record<string, string> = {
    safe: '安全',
    low: '低风险',
    medium: '中等风险',
    high: '高风险',
    very_high: '极高风险'
  }

  return (
    <div className="bg-dark-200 rounded-lg overflow-hidden">
      <div className="p-4 border-b border-dark-100">
        <div className="flex items-center justify-between">
          <h3 className="font-bold flex items-center gap-2">
            <span>🔍</span>
            <span>AI指数检测</span>
          </h3>
          <span className={`text-xs px-2 py-1 rounded border ${riskColors[riskLevel]}`}>
            {riskLabels[riskLevel]}
          </span>
        </div>
      </div>

      <div className="flex border-b border-dark-100">
        {[
          { key: 'radar', label: '雷达图' },
          { key: 'stats', label: '统计' },
          { key: 'models', label: '模型' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex-1 py-2 text-sm transition ${
              activeTab === tab.key ? 'bg-dark-300 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="p-4">
        {activeTab === 'radar' && (
          <div className="flex flex-col items-center">
            <canvas ref={canvasRef} width={280} height={280} className="mb-4" />
            <div className="grid grid-cols-3 gap-3 w-full text-center">
              <div className="bg-dark-300 p-3 rounded-lg">
                <div className="text-2xl font-bold text-[#4ECDC4]">{humanScore}</div>
                <div className="text-xs text-gray-400">人工特征</div>
              </div>
              <div className="bg-dark-300 p-3 rounded-lg">
                <div className="text-2xl font-bold text-[#FFE66D]">{suspectedAIScore}</div>
                <div className="text-xs text-gray-400">疑似AI</div>
              </div>
              <div className="bg-dark-300 p-3 rounded-lg">
                <div className="text-2xl font-bold text-[#FF6B6B]">{aiScore}</div>
                <div className="text-xs text-gray-400">AI特征</div>
              </div>
            </div>
            <div className="mt-4 text-xs text-gray-500">
              可信度: {confidence.toFixed(0)}%
            </div>
          </div>
        )}

        {activeTab === 'stats' && statistics && (
          <div className="space-y-3">
            <StatBar label="平均句子长度" value={statistics.avgSentenceLength} max={50} unit="字符" />
            <StatBar label="句子长度方差" value={statistics.sentenceLengthVariance} max={300} />
            <StatBar label="词汇多样性" value={statistics.vocabDiversity * 100} max={100} unit="%" />
            <StatBar label="突发性指数" value={statistics.burstinessScore * 100} max={100} unit="%" />
            <StatBar label="重复率" value={statistics.repetitionRate * 100} max={20} unit="%" />
          </div>
        )}

        {activeTab === 'models' && (
          <div className="space-y-3">
            {detectedModels.length > 0 ? (
              detectedModels.map(model => (
                <div key={model.name} className="bg-dark-300 p-3 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{model.name}</span>
                    <span className="text-sm text-[#FF6B6B]">{model.confidence.toFixed(0)}%</span>
                  </div>
                  <div className="h-2 bg-dark-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-red-500 to-orange-500"
                      style={{ width: `${model.confidence}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500 py-8">
                <div className="text-2xl mb-2">✅</div>
                <div>未检测到明显的AI模型特征</div>
              </div>
            )}

            <div className="mt-4 text-xs text-gray-500">
              <div className="font-medium mb-2">支持的检测模型:</div>
              <div className="flex flex-wrap gap-1">
                {['GPT-4', 'Claude', 'DeepSeek', 'Gemini', '文心一言', '豆包', '元宝'].map(m => (
                  <span key={m} className="px-2 py-0.5 bg-dark-300 rounded text-xs">{m}</span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function StatBar({ label, value, max, unit = '' }: { label: string; value: number; max: number; unit?: string }) {
  const percentage = Math.min(100, (value / max) * 100)
  const color = percentage < 30 ? '#4ECDC4' : percentage < 60 ? '#FFE66D' : '#FF6B6B'

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-400">{label}</span>
        <span className="text-gray-300">{value.toFixed(1)}{unit}</span>
      </div>
      <div className="h-2 bg-dark-300 rounded-full overflow-hidden">
        <div
          className="h-full transition-all"
          style={{ width: `${percentage}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}
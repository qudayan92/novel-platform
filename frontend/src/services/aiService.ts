const SYSTEM_PROMPT = `你是一名经验丰富的中文网络小说编辑，擅长节奏控制、伏笔埋设和人物塑造。
你需要严格模仿作者的写作风格，不要总结，不要评价，只输出小说正文。`

export class AIService {
  private baseUrl: string

  constructor(baseUrl = '/api') {
    this.baseUrl = baseUrl
  }

  async streamWrite(
    context: string,
    onChunk: (text: string) => void,
    options: {
      style?: string
      tension?: 'low' | 'medium' | 'high'
      length?: number
    } = {}
  ): Promise<void> {
    const { length = 300 } = options

    try {
      const response = await fetch(`${this.baseUrl}/ai/stream-write`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          context,
          systemPrompt: SYSTEM_PROMPT,
          maxTokens: length,
          temperature: 0.8,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('No response body')
      }

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') {
              return
            }
            try {
              const parsed = JSON.parse(data)
              if (parsed.text) {
                onChunk(parsed.text)
              }
            } catch {
              onChunk(data)
            }
          }
        }
      }
    } catch (error) {
      console.error('AI stream error:', error)
      throw error
    }
  }

  async styleTransfer(
    content: string,
    style: '古风' | '废土' | '轻小说' | '悬疑'
  ): Promise<string> {
    const response = await fetch(`${this.baseUrl}/ai/style-transfer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content, style }),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data.result
  }

  async checkConsistency(
    newContent: string,
    wikiEntries: { name: string; description: string }[]
  ): Promise<{ consistent: boolean; warnings: string[] }> {
    const response = await fetch(`${this.baseUrl}/ai/check-consistency`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ newContent, wikiEntries }),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return response.json()
  }

  async generateOutline(plotSummary: string, style: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}/ai/generate-outline`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ plotSummary, style }),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data.outline
  }
}

export const aiService = new AIService()

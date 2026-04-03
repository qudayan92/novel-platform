import OpenAI from 'openai'
import dotenv from 'dotenv'

dotenv.config()

export interface TextChunk {
  content: string
  startIndex: number
  endIndex: number
  summary?: string
}

export interface SummarizedChunk {
  content: string
  summary: string
  keywords: string[]
  keyEvents: string[]
}

export interface ProgressiveSummary {
  chapterId: string
  summaries: SummarizedChunk[]
  fullSummary: string
  characterStates: Map<string, string>
  plotThreads: string[]
}

export class LongTextService {
  private client: OpenAI
  private readonly MAX_CHUNK_SIZE = 4000
  private readonly OVERLAP_SIZE = 500
  private readonly CONTEXT_WINDOW = 6000

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.AI_API_KEY || 'sk-dummy',
      baseURL: process.env.AI_BASE_URL || 'https://api.deepseek.com'
    })
  }

  splitIntoChunks(text: string, chunkSize: number = this.MAX_CHUNK_SIZE): TextChunk[] {
    const chunks: TextChunk[] = []
    const sentences = text.split(/([。！？；\n]|[\.!?;]\s)/)
    let currentChunk = ''
    let startIndex = 0

    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i]
      if ((currentChunk + sentence).length > chunkSize && currentChunk.length > 0) {
        chunks.push({
          content: currentChunk.trim(),
          startIndex,
          endIndex: startIndex + currentChunk.length
        })
        startIndex += currentChunk.length - this.OVERLAP_SIZE
        currentChunk = currentChunk.slice(-this.OVERLAP_SIZE) + sentence
      } else {
        currentChunk += sentence
      }
    }

    if (currentChunk.trim().length > 0) {
      chunks.push({
        content: currentChunk.trim(),
        startIndex,
        endIndex: startIndex + currentChunk.length
      })
    }

    return chunks
  }

  async summarizeChunk(chunk: TextChunk): Promise<SummarizedChunk> {
    const systemPrompt = `你是一个专门用于摘要的AI助手。请提取以下文本的关键信息。

## 输出格式（JSON）
{
  "summary": "100字以内的摘要",
  "keywords": ["关键词1", "关键词2", "关键词3"],
  "keyEvents": ["关键事件1", "关键事件2"]
}

## 注意事项
- 只提取与情节发展相关的重要信息
- 关键词包括：人物、地点、物品、势力等
- 关键事件包括：重大情节转折、冲突、决定等`

    try {
      const response = await this.client.chat.completions.create({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: chunk.content }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2
      })

      const content = response.choices[0].message.content
      if (!content) {
        return { content: chunk.content, summary: '', keywords: [], keyEvents: [] }
      }

      const parsed = JSON.parse(content)
      return {
        content: chunk.content,
        summary: parsed.summary || '',
        keywords: parsed.keywords || [],
        keyEvents: parsed.keyEvents || []
      }
    } catch (error) {
      console.error('Chunk summarization failed:', error)
      return { content: chunk.content, summary: '', keywords: [], keyEvents: [] }
    }
  }

  async progressiveSummarize(
    text: string,
    chapterId: string,
    previousSummary?: ProgressiveSummary
  ): Promise<ProgressiveSummary> {
    const chunks = this.splitIntoChunks(text)
    const summarizedChunks: SummarizedChunk[] = []

    for (const chunk of chunks) {
      const summarized = await this.summarizeChunk(chunk)
      summarizedChunks.push(summarized)
    }

    const fullSummary = await this.generateFullSummary(summarizedChunks, previousSummary?.fullSummary)
    const characterStates = await this.extractCharacterStates(summarizedChunks, previousSummary)
    const plotThreads = this.extractPlotThreads(summarizedChunks)

    return {
      chapterId,
      summaries: summarizedChunks,
      fullSummary,
      characterStates,
      plotThreads
    }
  }

  private async generateFullSummary(
    chunks: SummarizedChunk[],
    previousSummary?: string
  ): Promise<string> {
    const combinedSummaries = chunks.map(c => c.summary).filter(Boolean).join('\n')
    const context = previousSummary ? `【前情摘要】\n${previousSummary}\n\n` : ''

    const systemPrompt = `你是一个小说摘要助手。根据各章节片段的摘要，生成一个连贯的完整摘要。

## 要求
1. 按时间顺序组织信息
2. 保持情节连贯性
3. 突出重要事件和转折
4. 字数控制在300字以内`

    try {
      const response = await this.client.chat.completions.create({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `${context}【各片段摘要】\n${combinedSummaries}` }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2
      })

      const content = response.choices[0].message.content
      if (!content) return combinedSummaries

      const parsed = JSON.parse(content)
      return parsed.summary || combinedSummaries
    } catch (error) {
      console.error('Full summary generation failed:', error)
      return combinedSummaries
    }
  }

  private async extractCharacterStates(
    chunks: SummarizedChunk[],
    previousSummary?: ProgressiveSummary
  ): Promise<Map<string, string>> {
    const states = new Map<string, string>()

    for (const chunk of chunks) {
      for (const keyword of chunk.keywords) {
        if (keyword.includes('人') || keyword.includes('角色')) {
          states.set(keyword, chunk.summary)
        }
      }
    }

    if (previousSummary?.characterStates) {
      for (const [name, state] of previousSummary.characterStates) {
        if (!states.has(name)) {
          states.set(name, state)
        }
      }
    }

    return states
  }

  private extractPlotThreads(chunks: SummarizedChunk[]): string[] {
    const threads = new Set<string>()

    for (const chunk of chunks) {
      for (const event of chunk.keyEvents) {
        threads.add(event)
      }
    }

    return Array.from(threads)
  }

  buildContextWindow(
    currentPosition: number,
    fullText: string,
    summaries: SummarizedChunk[]
  ): string {
    const chunks = this.splitIntoChunks(fullText)
    const relevantChunks: TextChunk[] = []

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i]
      if (chunk.startIndex <= currentPosition && chunk.endIndex >= currentPosition) {
        const startIdx = Math.max(0, i - 2)
        const endIdx = Math.min(chunks.length, i + 3)
        for (let j = startIdx; j < endIdx; j++) {
          relevantChunks.push(chunks[j])
        }
        break
      }
    }

    const contextText = relevantChunks
      .map((c, i) => `[${i === 0 ? '当前' : '上文'} ${i * this.MAX_CHUNK_SIZE}-${(i + 1) * this.MAX_CHUNK_SIZE}]\n${c.content}`)
      .join('\n\n')

    const summaryContext = summaries.length > 0
      ? `\n\n【前情概要】\n${summaries.map(s => s.summary).join('\n')}`
      : ''

    return contextText + summaryContext
  }

  async enhancePromptWithHistory(
    originalPrompt: string,
    novelContext: {
      title: string
      currentChapter: number
      chapters: { id: string; title: string; summary?: string }[]
      characterProfiles: { name: string; description: string }[]
    }
  ): Promise<string> {
    const relevantChapters = novelContext.chapters.slice(
      Math.max(0, novelContext.currentChapter - 5),
      novelContext.currentChapter
    )

    const chapterHistory = relevantChapters
      .map(c => `【${c.title}】\n${c.summary || '无摘要'}`)
      .join('\n\n')

    const characterContext = novelContext.characterProfiles
      .map(p => `${p.name}: ${p.description}`)
      .join('\n')

    return `${originalPrompt}

【小说信息】
标题: ${novelContext.title}

【角色设定】
${characterContext || '暂无详细角色设定'}

【前文概要】
${chapterHistory || '暂无前文概要'}
`
  }

  estimateProcessingTime(wordCount: number): number {
    const wordsPerSecond = 50
    return Math.ceil(wordCount / wordsPerSecond)
  }
}

export const longTextService = new LongTextService()
import OpenAI from 'openai'
import dotenv from 'dotenv'

dotenv.config()

export interface ConsistencyIssue {
  type: 'timeline' | 'property' | 'relation' | 'logic'
  severity: 'high' | 'medium' | 'low'
  entityName?: string
  description: string
  chapterId?: string
  evidence?: string
  suggestion?: string
}

export interface ConsistencyCheckResult {
  issues: ConsistencyIssue[]
  summary: {
    total: number
    high: number
    medium: number
    low: number
  }
}

export class ConsistencyAgent {
  private client: OpenAI

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.AI_API_KEY || 'sk-dummy',
      baseURL: process.env.AI_BASE_URL || 'https://api.deepseek.com'
    })
  }

  async checkConsistency(
    novelContext: {
      title: string
      synopsis: string
      chapters: { id: string; title: string; content: string }[]
      entities: { name: string; type: string; properties: Record<string, any> }[]
      relations: { source: string; target: string; type: string }[]
    }
  ): Promise<ConsistencyCheckResult> {
    const systemPrompt = `你是一个专门检查小说内容一致性的AI助手。
你的任务是检测小说中的逻辑矛盾、时间线错误、属性冲突等问题。

## 检查类型
1. 时间线矛盾: 事件发生的顺序是否合理
2. 属性冲突: 角色的年龄、性格等属性是否一致
3. 关系冲突: 角色之间的关系是否自相矛盾
4. 逻辑错误: 情节发展是否合理

## 输出格式
JSON对象，包含issues数组和summary统计

## 注意
- 只报告明显的问题，忽略微小的不一致
- 每个问题需要包含类型、严重程度、描述和建议`

    const contextSummary = `
【小说信息】
标题: ${novelContext.title}
简介: ${novelContext.synopsis}

【已知实体】
${novelContext.entities.map(e => `${e.name}(${e.type}): ${JSON.stringify(e.properties)}`).join('\n')}

【已知关系】
${novelContext.relations.map(r => `${r.source} --${r.type}--> ${r.target}`).join('\n')}

【章节内容】
${novelContext.chapters.map(c => `【${c.title}】\n${c.content.slice(0, 1000)}`).join('\n\n')}
`

    try {
      const response = await this.client.chat.completions.create({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: contextSummary }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2
      })

      const content = response.choices[0].message.content
      if (!content) {
        return { issues: [], summary: { total: 0, high: 0, medium: 0, low: 0 } }
      }

      const parsed = JSON.parse(content)
      return {
        issues: parsed.issues || [],
        summary: parsed.summary || { total: 0, high: 0, medium: 0, low: 0 }
      }
    } catch (error) {
      console.error('Consistency check failed:', error)
      return { issues: [], summary: { total: 0, high: 0, medium: 0, low: 0 } }
    }
  }

  async checkTimeline(novelContext: {
    chapters: { id: string; title: string; content: string }[]
  }): Promise<ConsistencyIssue[]> {
    const systemPrompt = `你是一个时间线分析专家。检查小说中事件的时间顺序是否合理。`

    const chapterTexts = novelContext.chapters
      .map(c => `【${c.title}】\n${c.content.slice(0, 500)}`)
      .join('\n\n')

    try {
      const response = await this.client.chat.completions.create({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: chapterTexts }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2
      })

      const content = response.choices[0].message.content
      if (!content) return []

      const parsed = JSON.parse(content)
      return (parsed.timelineIssues || []).map((issue: any) => ({
        ...issue,
        type: 'timeline' as const
      }))
    } catch (error) {
      console.error('Timeline check failed:', error)
      return []
    }
  }

  async checkPropertyConsistency(
    entityName: string,
    mentions: { chapterTitle: string; content: string }[]
  ): Promise<ConsistencyIssue[]> {
    const systemPrompt = `检查角色 "${entityName}" 的属性在不同章节中是否一致。`

    const context = mentions
      .map(m => `【${m.chapterTitle}】\n${m.content}`)
      .join('\n\n')

    try {
      const response = await this.client.chat.completions.create({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: context }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2
      })

      const content = response.choices[0].message.content
      if (!content) return []

      const parsed = JSON.parse(content)
      return (parsed.conflicts || []).map((conflict: any) => ({
        ...conflict,
        type: 'property' as const,
        entityName
      }))
    } catch (error) {
      console.error('Property consistency check failed:', error)
      return []
    }
  }

  prioritizeIssues(issues: ConsistencyIssue[]): ConsistencyIssue[] {
    const priorityMap = { high: 0, medium: 1, low: 2 }
    return [...issues].sort((a, b) => priorityMap[a.severity] - priorityMap[b.severity])
  }

  groupIssuesByType(issues: ConsistencyIssue[]): Record<string, ConsistencyIssue[]> {
    return issues.reduce((acc, issue) => {
      if (!acc[issue.type]) acc[issue.type] = []
      acc[issue.type].push(issue)
      return acc
    }, {} as Record<string, ConsistencyIssue[]>)
  }
}

export const consistencyAgent = new ConsistencyAgent()
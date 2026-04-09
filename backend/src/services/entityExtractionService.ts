import OpenAI from 'openai'
import dotenv from 'dotenv'

dotenv.config()

export interface ExtractedEntity {
  name: string
  type: 'character' | 'location' | 'item' | 'faction' | 'event' | 'concept'
  category?: string
  description: string
  properties: Record<string, any>
  firstMention?: { chapterId: string; position: number }
}

export interface ExtractedRelation {
  sourceName: string
  targetName: string
  relationType: string
  relationLabel?: string
  confidence: number
  evidence?: string
}

export interface ExtractionResult {
  entities: ExtractedEntity[]
  relations: ExtractedRelation[]
}

export class EntityExtractionService {
  private client: OpenAI

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.AI_API_KEY || 'sk-dummy',
      baseURL: process.env.AI_BASE_URL || 'https://api.deepseek.com'
    })
  }

  async extractEntitiesAndRelations(
    text: string,
    novelId: string,
    existingEntities: ExtractedEntity[] = []
  ): Promise<ExtractionResult> {
    const systemPrompt = `你是一个专门用于小说写作的知识图谱构建助手。
你的任务是从给定的小说文本中提取实体和关系。

## 实体类型
- character: 人物角色
- location: 地点场所
- item: 物品道具
- faction: 组织势力
- event: 事件
- concept: 概念设定

## 关系类型
- 恋人, 夫妻, 父子, 母子, 兄弟, 朋友, 敌对, 竞争
- 所属, 管辖, 参与, 导致, 发生在
- 持有, 使用, 赠送, 获得

## 输出格式
请以JSON格式输出，包含entities和relations两个数组。

## 注意事项
1. 只提取在文本中明确提到的实体
2. 关系需要有文本证据
3. 对于已存在的实体，如果在新文本中再次出现，也要记录
4. 返回的关系要明确源实体和目标实体名称`

    const existingContext = existingEntities.length > 0
      ? `\n\n【已知实体】\n${existingEntities.map(e => `${e.name}(${e.type})`).join(', ')}`
      : ''

    const userPrompt = `【待分析文本】\n${text}${existingContext}`

    try {
      const response = await this.client.chat.completions.create({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1
      })

      const content = response.choices[0].message.content
      if (!content) {
        return { entities: [], relations: [] }
      }

      const parsed = JSON.parse(content)
      return {
        entities: parsed.entities || [],
        relations: parsed.relations || []
      }
    } catch (error) {
      console.error('Entity extraction failed:', error)
      return { entities: [], relations: [] }
    }
  }

  async extractEntitiesFromChapter(
    chapterId: string,
    chapterContent: string
  ): Promise<ExtractionResult> {
    return this.extractEntitiesAndRelations(chapterContent, chapterId)
  }

  async extractEntitiesFromNovel(
    novelId: string,
    chapters: { id: string; title: string; content: string }[]
  ): Promise<ExtractionResult> {
    const allEntities: ExtractedEntity[] = []
    const allRelations: ExtractedRelation[] = []

    for (const chapter of chapters) {
      const result = await this.extractEntitiesAndRelations(
        chapter.content,
        novelId,
        allEntities
      )

      result.entities.forEach(entity => {
        entity.firstMention = {
          chapterId: chapter.id,
          position: 0
        }
        allEntities.push(entity)
      })

      allRelations.push(...result.relations)
    }

    return {
      entities: this.deduplicateEntities(allEntities),
      relations: allRelations
    }
  }

  private deduplicateEntities(entities: ExtractedEntity[]): ExtractedEntity[] {
    const seen = new Map<string, ExtractedEntity>()
    
    for (const entity of entities) {
      const key = entity.name.toLowerCase()
      if (!seen.has(key)) {
        seen.set(key, entity)
      }
    }
    
    return Array.from(seen.values())
  }

  categorizeEntity(name: string, context: string): string {
    const characterPatterns = [
      /^(他|她|它)说/, /^(他|她|它)又/, /的名字是/, /是.*的(儿子|女儿|父亲|母亲)/
    ]
    
    const locationPatterns = [
      /在.*(城|镇|村|山|河|海|湖|森林|宫殿|房间)/, /来到.*(街|路|桥|门)/
    ]
    
    const itemPatterns = [
      /(拿着|握着|带着|背着|佩戴着).*(剑|刀|书|药|宝石|玉佩)/
    ]

    if (characterPatterns.some(p => p.test(context))) return 'character'
    if (locationPatterns.some(p => p.test(context))) return 'location'
    if (itemPatterns.some(p => p.test(context))) return 'item'
    
    return 'concept'
  }

  getEntityColor(type: ExtractedEntity['type']): string {
    const colors: Record<string, string> = {
      character: '#FF6B6B',
      location: '#4ECDC4',
      item: '#FFE66D',
      faction: '#95E1D3',
      event: '#DDA0DD',
      concept: '#C9B1FF'
    }
    return colors[type] || '#CCCCCC'
  }
}

export const entityExtractionService = new EntityExtractionService()
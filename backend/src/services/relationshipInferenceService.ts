import OpenAI from 'openai'
import dotenv from 'dotenv'

dotenv.config()

export interface GraphNode {
  id: string
  name: string
  type: 'character' | 'location' | 'item' | 'faction' | 'event' | 'concept'
  properties?: Record<string, any>
  importance?: 'core' | 'important' | 'normal' | 'minor'
}

export interface GraphEdge {
  source: string
  target: string
  relationType: string
  label?: string
  weight?: number
  isImplicit?: boolean
  confidence?: number
}

export interface InferredRelation {
  sourceName: string
  targetName: string
  relationType: string
  confidence: number
  reasoning: string
}

export class RelationshipInferenceService {
  private client: OpenAI

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.AI_API_KEY || 'sk-dummy',
      baseURL: process.env.AI_BASE_URL || 'https://api.deepseek.com'
    })
  }

  async inferRelations(
    entities: GraphNode[],
    context: string
  ): Promise<InferredRelation[]> {
    if (entities.length < 2) return []

    const systemPrompt = `你是一个专门用于推断小说中实体之间隐含关系的AI助手。
给定一组实体和上下文文本，你需要推断它们之间可能存在但未明确说明的关系。

## 关系类型
- 恋人, 夫妻, 父子, 母子, 兄弟, 姐妹, 朋友, 敌对, 竞争, 同伴
- 上下级, 师徒, 所属, 管辖, 队友
- 相似, 对立, 同时出现

## 推断原则
1. 基于实体的属性和上下文推断关系
2. 给出置信度(0-1)，只有置信度>0.6的关系才返回
3. 每个推断都需要给出推理过程

## 输出格式
JSON数组，每个元素包含sourceName, targetName, relationType, confidence, reasoning`

    const entityList = entities.map(e => `${e.name}(${e.type})`).join(', ')
    const userPrompt = `【实体列表】\n${entityList}\n\n【上下文文本】\n${context}`

    try {
      const response = await this.client.chat.completions.create({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3
      })

      const content = response.choices[0].message.content
      if (!content) return []

      const parsed = JSON.parse(content)
      return (parsed.relations || []).filter((r: InferredRelation) => r.confidence > 0.6)
    } catch (error) {
      console.error('Relation inference failed:', error)
      return []
    }
  }

  async inferCharacterRelations(
    characters: GraphNode[],
    novelContext: string
  ): Promise<InferredRelation[]> {
    const characterNodes = characters.filter(c => c.type === 'character')
    return this.inferRelations(characterNodes, novelContext)
  }

  async inferLocationRelations(
    locations: GraphNode[],
    novelContext: string
  ): Promise<InferredRelation[]> {
    const locationNodes = locations.filter(l => l.type === 'location')
    return this.inferRelations(locationNodes, novelContext)
  }

  async buildRelationGraph(
    entities: GraphNode[],
    explicitRelations: GraphEdge[],
    context: string
  ): Promise<{ nodes: GraphNode[], edges: GraphEdge[] }> {
    const inferredRelations = await this.inferRelations(entities, context)
    
    const inferredEdges: GraphEdge[] = inferredRelations.map(rel => ({
      source: rel.sourceName,
      target: rel.targetName,
      relationType: rel.relationType,
      isImplicit: true,
      confidence: rel.confidence,
      weight: rel.confidence
    }))

    const explicitEdgeSet = new Set(
      explicitRelations.map(e => `${e.source}-${e.relationType}-${e.target}`)
    )

    const uniqueInferredEdges = inferredEdges.filter(edge => {
      const key = `${edge.source}-${edge.relationType}-${edge.target}`
      return !explicitEdgeSet.has(key)
    })

    return {
      nodes: entities,
      edges: [...explicitRelations, ...uniqueInferredEdges]
    }
  }

  calculateEdgeWeight(
    sourceNode: GraphNode,
    targetNode: GraphNode,
    relationType: string
  ): number {
    let weight = 1.0

    if (sourceNode.importance === 'core' && targetNode.importance === 'core') {
      weight *= 1.5
    }

    const strongRelations = ['恋人', '夫妻', '父子', '母子', '兄弟', '敌人']
    if (strongRelations.includes(relationType)) {
      weight *= 1.2
    }

    const weakRelations = ['朋友', '同伴', '队友']
    if (weakRelations.includes(relationType)) {
      weight *= 0.8
    }

    return Math.min(weight, 2.0)
  }

  getRelationColor(relationType: string): string {
    const colors: Record<string, string> = {
      '恋人': '#FF6B6B',
      '夫妻': '#FF6B6B',
      '父子': '#4ECDC4',
      '母子': '#4ECDC4',
      '兄弟': '#4ECDC4',
      '姐妹': '#4ECDC4',
      '朋友': '#95E1D3',
      '敌对': '#E74C3C',
      '竞争': '#F39C12',
      '所属': '#9B59B6',
      '师徒': '#3498DB',
      '同伴': '#1ABC9C'
    }
    return colors[relationType] || '#95a5a6'
  }
}

export const relationshipInferenceService = new RelationshipInferenceService()
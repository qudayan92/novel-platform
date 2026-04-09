import OpenAI from 'openai'
import dotenv from 'dotenv'

dotenv.config()

interface EmbeddingChunk {
  id: string
  text: string
  metadata: {
    wikiEntryId: string
    wikiEntryName: string
    wikiEntryType: string
  }
}

interface SearchResult {
  wikiEntryId: string
  wikiEntryName: string
  wikiEntryType: string
  chunk: string
  score: number
}

export class RAGService {
  private client: OpenAI
  private embeddings: Map<string, { text: string; embedding: number[]; metadata: any }> = new Map()
  private dimension = 1536

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.AI_API_KEY || 'sk-dummy',
      baseURL: process.env.AI_BASE_URL || 'https://api.deepseek.com'
    })
  }

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await this.client.embeddings.create({
        model: 'text-embedding-3-small',
        input: text
      })
      return response.data[0].embedding
    } catch (error) {
      console.error('Embedding generation failed:', error)
      const mockEmbedding = Array.from({ length: this.dimension }, () => Math.random() - 0.5)
      const norm = Math.sqrt(mockEmbedding.reduce((sum, v) => sum + v * v, 0))
      return mockEmbedding.map(v => v / norm)
    }
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0
    
    let dotProduct = 0
    let normA = 0
    let normB = 0
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i]
      normA += a[i] * a[i]
      normB += b[i] * b[i]
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
  }

  async indexWikiEntry(wikiEntry: {
    id: string
    name: string
    type: string
    description: string
    content?: any
  }): Promise<void> {
    const chunks = this.chunkText(wikiEntry.description, 500)
    
    for (const chunk of chunks) {
      const id = `${wikiEntry.id}-${Date.now()}`
      const embedding = await this.generateEmbedding(chunk.text)
      
      this.embeddings.set(id, {
        text: chunk.text,
        embedding,
        metadata: {
          wikiEntryId: wikiEntry.id,
          wikiEntryName: wikiEntry.name,
          wikiEntryType: wikiEntry.type
        }
      })
    }
  }

  private chunkText(text: string, chunkSize: number): { text: string; start: number }[] {
    const chunks: { text: string; start: number }[] = []
    const sentences = text.split(/[。！？；\n]/)
    let currentChunk = ''
    let start = 0

    for (const sentence of sentences) {
      if ((currentChunk + sentence).length > chunkSize && currentChunk.length > 0) {
        chunks.push({ text: currentChunk, start })
        start += currentChunk.length
        currentChunk = sentence
      } else {
        currentChunk += sentence
      }
    }

    if (currentChunk.length > 0) {
      chunks.push({ text: currentChunk, start })
    }

    return chunks
  }

  async search(query: string, topK = 5): Promise<SearchResult[]> {
    const queryEmbedding = await this.generateEmbedding(query)
    
    const results: SearchResult[] = []
    
    for (const [id, data] of this.embeddings) {
      const score = this.cosineSimilarity(queryEmbedding, data.embedding)
      
      if (score > 0.3) {
        results.push({
          wikiEntryId: data.metadata.wikiEntryId,
          wikiEntryName: data.metadata.wikiEntryName,
          wikiEntryType: data.metadata.wikiEntryType,
          chunk: data.text,
          score
        })
      }
    }
    
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
  }

  buildContextFromSearch(query: string, wikiEntries: SearchResult[]): string {
    if (wikiEntries.length === 0) return ''
    
    const context = wikiEntries
      .map(entry => `[${entry.wikiEntryType}] ${entry.wikiEntryName}: ${entry.chunk}`)
      .join('\n\n')
    
    return `【相关世界观设定】
${context}

【注意】
以上设定来自你的世界观Wiki，续写时请严格遵守上述设定。`
  }

  async enhancePrompt(
    originalPrompt: string,
    context: string
  ): Promise<string> {
    return `${originalPrompt}

${context}`
  }
}

export const ragService = new RAGService()

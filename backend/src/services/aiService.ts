import OpenAI from 'openai'
import dotenv from 'dotenv'

dotenv.config()

const SYSTEM_PROMPT = `你是一名经验丰富的中文网络小说编辑，擅长节奏控制、伏笔埋设和人物塑造。
你需要严格模仿作者的写作风格，不要总结，不要评价，只输出小说正文。
保持文字流畅自然，符合中文阅读习惯。`

const STYLE_PROMPTS: Record<string, string> = {
  '古风': '使用古风文言风格，语言典雅，善用四字成语，营造古典韵味。',
  '废土': '风格冷峻残酷，描写末世氛围，强调生存的绝望与挣扎。',
  '轻小说': '语言轻松活泼，对话幽默，心理描写细腻，节奏明快。',
  '悬疑': '营造紧张氛围，善于铺垫和反转，文字简洁有力。'
}

export class AIService {
  private client: OpenAI

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.AI_API_KEY || 'sk-dummy',
      baseURL: process.env.AI_BASE_URL || 'https://api.deepseek.com'
    })
  }

  async streamWrite(
    params: {
      context: string
      systemPrompt?: string
      maxTokens?: number
      temperature?: number
    },
    onChunk: (text: string) => void
  ): Promise<void> {
    const { context, maxTokens = 300, temperature = 0.8 } = params
    const system = params.systemPrompt || SYSTEM_PROMPT

    const storyContext = `【STORY CONTEXT】
以下是当前章节的已有内容（你正在这里继续写）：
---
${context}
---

【INSTRUCTION】
请直接续写剧情，保持风格一致，字数控制在200-300字左右。`

    try {
      const stream = await this.client.chat.completions.create({
        model: process.env.AI_MODEL || 'deepseek-chat',
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: storyContext }
        ],
        max_tokens: maxTokens,
        temperature,
        stream: true
      })

      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content
        if (text) {
          onChunk(text)
        }
      }
    } catch (error) {
      console.error('OpenAI API error:', error)
      throw error
    }
  }

  async styleTransfer(
    content: string,
    style: keyof typeof STYLE_PROMPTS
  ): Promise<string> {
    const stylePrompt = STYLE_PROMPTS[style] || STYLE_PROMPTS['轻小说']

    const response = await this.client.chat.completions.create({
      model: process.env.AI_MODEL || 'deepseek-chat',
      messages: [
        { 
          role: 'system', 
          content: `你是一个风格转换专家。请将原文转换为指定的写作风格。${stylePrompt}` 
        },
        { 
          role: 'user', 
          content: `将以下内容转换为${style}风格：\n\n${content}` 
        }
      ],
      temperature: 0.7
    })

    return response.choices[0]?.message?.content || ''
  }

  async checkConsistency(
    newContent: string,
    wikiEntries: { name: string; description: string }[]
  ): Promise<{ consistent: boolean; warnings: string[] }> {
    const wikiContext = wikiEntries
      .map(e => `- ${e.name}: ${e.description}`)
      .join('\n')

    const response = await this.client.chat.completions.create({
      model: process.env.AI_MODEL || 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: `你是一个逻辑一致性检查专家。请检查新内容是否与已有设定冲突。`
        },
        {
          role: 'user',
          content: `【已有设定】
${wikiContext}

【新内容】
${newContent}

请检查新内容是否与已有设定存在矛盾。如果有矛盾，请指出；如果没有，请说"一致"。`
        }
      ],
      temperature: 0.3
    })

    const result = response.choices[0]?.message?.content || ''
    
    return {
      consistent: !result.includes('矛盾') && !result.includes('冲突'),
      warnings: result.includes('矛盾') || result.includes('冲突') ? [result] : []
    }
  }

  async generateOutline(
    plotSummary: string,
    style: string = '玄幻'
  ): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: process.env.AI_MODEL || 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: `你是一个网文大纲设计专家。根据作者提供的故事梗概，设计完整的章节大纲。`
        },
        {
          role: 'user',
          content: `【故事梗概】
${plotSummary}

【类型】
${style}

请设计一份详细的章节大纲，包括：
1. 主要人物设定
2. 世界观设定
3. 章节结构（建议10-20章）
4. 每章核心剧情点
5. 埋设的伏笔

使用清晰的Markdown格式输出。`
        }
      ],
      temperature: 0.7
    })

    return response.choices[0]?.message?.content || ''
  }
}

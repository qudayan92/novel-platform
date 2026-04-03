interface SensitiveWord {
  word: string
  level: 'low' | 'medium' | 'high'
  reason?: string
}

const SENSITIVE_PATTERNS: SensitiveWord[] = [
  { word: '色情', level: 'high', reason: '低俗内容' },
  { word: '暴力', level: 'medium', reason: '可能涉及暴力描写' },
  { word: '政治', level: 'high', reason: '敏感政治内容' },
  { word: '赌博', level: 'medium', reason: '可能涉及违法行为' },
  { word: '毒品', level: 'high', reason: '违法内容' },
  { word: '自杀', level: 'high', reason: '涉及自残自杀内容' },
  { word: '邪教', level: 'high', reason: '邪教相关内容' },
  { word: '分裂', level: 'high', reason: '分裂国家内容' },
  { word: '迷信', level: 'low', reason: '可能涉及封建迷信' }
]

export class ContentChecker {
  private sensitivePatterns: SensitiveWord[]

  constructor(patterns?: SensitiveWord[]) {
    this.sensitivePatterns = patterns || SENSITIVE_PATTERNS
  }

  checkSensitiveWords(text: string): SensitiveWord[] {
    const found: SensitiveWord[] = []
    
    for (const pattern of this.sensitivePatterns) {
      if (text.includes(pattern.word)) {
        found.push(pattern)
      }
    }
    
    return found
  }

  checkCharacterConsistency(
    content: string,
    characters: { name: string; traits: string[] }[]
  ): { character: string; issue: string }[] {
    const issues: { character: string; issue: string }[] = []
    
    for (const char of characters) {
      const traitPatterns = [
        { trait: '左撇子', pattern: /左手/g },
        { trait: '独臂', pattern: /(左|右)手(拿着|握着|抓着)/g },
        { trait: '失明', pattern: /看见|看到|注视着/g }
      ]
      
      for (const { trait, pattern } of traitPatterns) {
        if (char.traits.includes(trait) && pattern.test(content)) {
          issues.push({
            character: char.name,
            issue: `角色设定为"${trait}"，但文本中可能存在矛盾`
          })
        }
      }
    }
    
    return issues
  }

  checkLogicGaps(content: string): string[] {
    const gaps: string[] = []
    
    const timeGaps = content.match(/(刚才|片刻之后|突然|忽然).{0,20}(已经|早就|早就已经)/g)
    if (timeGaps) {
      gaps.push('存在时间逻辑矛盾')
    }
    
    const locationGaps = content.match(/在(.+?)突然(到了|来到|进入)/g)
    if (locationGaps) {
      gaps.push('存在空间转移但未描述过程')
    }
    
    return gaps
  }

  getOverallRiskLevel(words: SensitiveWord[]): 'safe' | 'low' | 'medium' | 'high' {
    if (words.length === 0) return 'safe'
    
    const hasHigh = words.some(w => w.level === 'high')
    if (hasHigh) return 'high'
    
    const hasMedium = words.some(w => w.level === 'medium')
    if (hasMedium) return 'medium'
    
    return 'low'
  }
}

export const contentChecker = new ContentChecker()

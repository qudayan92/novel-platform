import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/novel_platform'
})

export interface SensitiveWord {
  word: string
  category: string
  severity: 'low' | 'medium' | 'high'
  suggestion?: string
  positions: number[]
}

export interface CheckResult {
  totalWords: number
  sensitiveCount: number
  riskLevel: 'safe' | 'low' | 'medium' | 'high'
  matches: SensitiveWord[]
  suggestions: Array<{ original: string; suggestion: string }>
}

const DEFAULT_SENSITIVE_WORDS = [
  { word: '政治', category: 'political', severity: 'high' },
  { word: '领导人', category: 'political', severity: 'high' },
  { word: '政府', category: 'political', severity: 'medium' },
  { word: '色情', category: 'pornographic', severity: 'high' },
  { word: '裸体', category: 'pornographic', severity: 'high' },
  { word: '暴力', category: 'violence', severity: 'medium' },
  { word: '杀人', category: 'violence', severity: 'high' },
  { word: '毒品', category: 'illegal', severity: 'high' },
  { word: '赌博', category: 'illegal', severity: 'medium' },
  { word: '恐怖', category: 'violence', severity: 'medium' },
  { word: '邪教', category: 'illegal', severity: 'high' },
  { word: '法轮', category: 'illegal', severity: 'high' },
  { word: '六四', category: 'political', severity: 'high' },
  { word: '天安门', category: 'political', severity: 'high' },
  { word: '台独', category: 'political', severity: 'high' },
  { word: '藏独', category: 'political', severity: 'high' },
  { word: '疆独', category: 'political', severity: 'high' },
]

class SensitiveWordService {
  private wordCache: Map<string, { category: string; severity: string; suggestion?: string }> = new Map()
  private lastCacheUpdate: number = 0
  private cacheTTL: number = 5 * 60 * 1000 // 5分钟

  async initializeDefaultWords() {
    for (const item of DEFAULT_SENSITIVE_WORDS) {
      await pool.query(
        `INSERT INTO sensitive_words (word, category, severity) 
         VALUES ($1, $2, $3) 
         ON CONFLICT (word) DO NOTHING`,
        [item.word, item.category, item.severity]
      )
    }
  }

  private async loadWords() {
    const now = Date.now()
    if (now - this.lastCacheUpdate < this.cacheTTL && this.wordCache.size > 0) {
      return
    }

    const result = await pool.query(
      'SELECT word, category, severity, suggestion FROM sensitive_words WHERE is_active = true'
    )

    this.wordCache.clear()
    for (const row of result.rows) {
      this.wordCache.set(row.word, {
        category: row.category,
        severity: row.severity,
        suggestion: row.suggestion
      })
    }

    this.lastCacheUpdate = now
  }

  async checkText(text: string): Promise<CheckResult> {
    await this.loadWords()

    const totalWords = text.replace(/\s/g, '').length
    const matches: SensitiveWord[] = []
    const suggestions: Array<{ original: string; suggestion: string }> = []

    const wordMap = new Map<string, SensitiveWord>()

    for (const [word, info] of this.wordCache) {
      let pos = 0
      while (true) {
        const index = text.indexOf(word, pos)
        if (index === -1) break

        if (wordMap.has(word)) {
          wordMap.get(word)!.positions.push(index)
        } else {
          wordMap.set(word, {
            word,
            category: info.category,
            severity: info.severity as 'low' | 'medium' | 'high',
            suggestion: info.suggestion,
            positions: [index]
          })
        }

        pos = index + 1
      }
    }

    for (const match of wordMap.values()) {
      matches.push(match)
      if (match.suggestion) {
        suggestions.push({
          original: match.word,
          suggestion: match.suggestion
        })
      }
    }

    matches.sort((a, b) => {
      const severityOrder = { high: 3, medium: 2, low: 1 }
      return severityOrder[b.severity] - severityOrder[a.severity]
    })

    const riskLevel = this.calculateRiskLevel(matches)

    return {
      totalWords,
      sensitiveCount: matches.length,
      riskLevel,
      matches,
      suggestions
    }
  }

  private calculateRiskLevel(matches: SensitiveWord[]): 'safe' | 'low' | 'medium' | 'high' {
    if (matches.length === 0) return 'safe'

    const highCount = matches.filter(m => m.severity === 'high').length
    const mediumCount = matches.filter(m => m.severity === 'medium').length

    if (highCount >= 3) return 'high'
    if (highCount >= 1 || mediumCount >= 5) return 'medium'
    if (matches.length >= 3) return 'low'
    
    return 'low'
  }

  async saveCheckResult(submissionId: string, chapterId: string | null, result: CheckResult) {
    await pool.query(
      `INSERT INTO sensitive_check_results 
       (submission_id, chapter_id, total_words, sensitive_count, risk_level, matches)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [submissionId, chapterId, result.totalWords, result.sensitiveCount, result.riskLevel, JSON.stringify(result.matches)]
    )
  }

  async getCheckResult(submissionId: string) {
    const result = await pool.query(
      'SELECT * FROM sensitive_check_results WHERE submission_id = $1 ORDER BY checked_at DESC LIMIT 1',
      [submissionId]
    )
    return result.rows.length > 0 ? result.rows[0] : null
  }

  async checkAndSave(text: string, submissionId: string, chapterId?: string): Promise<CheckResult> {
    const result = await this.checkText(text)
    await this.saveCheckResult(submissionId, chapterId || null, result)
    return result
  }

  async addSensitiveWord(word: string, category: string, severity: string, suggestion?: string) {
    const result = await pool.query(
      `INSERT INTO sensitive_words (word, category, severity, suggestion)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (word) DO UPDATE 
       SET category = $2, severity = $3, suggestion = $4, is_active = true
       RETURNING *`,
      [word, category, severity, suggestion]
    )

    this.wordCache.set(word, { category, severity, suggestion })
    
    return result.rows[0]
  }

  async removeSensitiveWord(word: string) {
    await pool.query(
      'UPDATE sensitive_words SET is_active = false WHERE word = $1',
      [word]
    )
    this.wordCache.delete(word)
  }

  async getSensitiveWords(category?: string) {
    const query = category 
      ? 'SELECT * FROM sensitive_words WHERE category = $1 AND is_active = true ORDER BY word'
      : 'SELECT * FROM sensitive_words WHERE is_active = true ORDER BY category, word'
    
    const result = category ? await pool.query(query, [category]) : await pool.query(query)
    return result.rows
  }

  async getCategories() {
    const result = await pool.query(
      'SELECT DISTINCT category FROM sensitive_words WHERE is_active = true ORDER BY category'
    )
    return result.rows.map(r => r.category)
  }

  getAutoReplaceText(text: string, matches: SensitiveWord[]): string {
    let result = text
    
    const sortedMatches = [...matches].sort((a, b) => b.positions[0] - a.positions[0])
    
    for (const match of sortedMatches) {
      if (match.suggestion) {
        result = result.replaceAll(match.word, match.suggestion)
      } else {
        result = result.replaceAll(match.word, '***')
      }
    }
    
    return result
  }
}

export const sensitiveWordService = new SensitiveWordService()

import OpenAI from 'openai'
import dotenv from 'dotenv'

dotenv.config()

export interface AIDetectionResult {
  humanScore: number
  suspectedAIScore: number
  aiScore: number
  riskLevel: 'safe' | 'low' | 'medium' | 'high' | 'very_high'
  confidence: number
  summary: string
  suggestions: string[]
  statistics: TextStatistics
  paragraphResults: ParagraphResult[]
  detectedModels: DetectedModel[]
}

export interface TextStatistics {
  avgSentenceLength: number
  sentenceLengthVariance: number
  vocabDiversity: number
  perplexityScore: number
  burstinessScore: number
  repetitionRate: number
  stopWordRatio: number
  avgClauseLength: number
}

export interface ParagraphResult {
  index: number
  text: string
  humanScore: number
  suspectedAIScore: number
  aiScore: number
  riskLevel: string
  matchedPatterns: string[]
}

export interface DetectedModel {
  name: string
  confidence: number
  matchedPatterns: string[]
}

interface Pattern {
  modelName: string
  patternType: string
  patternRegex: string
  patternDescription: string
  weight: number
}

const CHINESE_STOPWORDS = [
  '的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都', '一', '一个',
  '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有', '看', '好',
  '自己', '这', '那', '里', '来', '他', '她', '它', '们', '之', '为', '与', '或',
  '但', '却', '因为', '所以', '如果', '虽然', '然而', '而且', '因此'
]

export class AIDetectionService {
  private client: OpenAI
  private patterns: Pattern[] = []
  private patternsLoaded = false

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.AI_API_KEY || 'sk-dummy',
      baseURL: process.env.AI_BASE_URL || 'https://api.deepseek.com'
    })
  }

  private async loadPatterns(): Promise<void> {
    if (this.patternsLoaded) return

    this.patterns = [
      { modelName: 'GPT-4', patternType: 'sentence', patternRegex: '首先，其次，最后，因此，然而，不过', patternDescription: '过度使用连接词', weight: 1.2 },
      { modelName: 'GPT-4', patternType: 'structure', patternRegex: '一方面.{0,3}另一方面', patternDescription: '机械化的对比结构', weight: 1.0 },
      { modelName: 'GPT-4', patternType: 'vocabulary', patternRegex: '至关重要|不可或缺|众所周知|毋庸置疑', patternDescription: '过度使用的四字词语', weight: 0.8 },
      { modelName: 'Claude', patternType: 'sentence', patternRegex: '[，。][^，。！？]{80,}', patternDescription: '超长复合句', weight: 1.5 },
      { modelName: 'Claude', patternType: 'structure', patternRegex: '具体而言|总的来说|值得注意的是', patternDescription: '学术化开头语', weight: 1.0 },
      { modelName: 'Claude', patternType: 'emotion', patternRegex: '感受到.*的情感|内心.*的挣扎', patternDescription: '过度描写内心情感', weight: 0.7 },
      { modelName: 'DeepSeek', patternType: 'sentence', patternRegex: '因为.*所以|如果.*那么', patternDescription: '过度使用的逻辑链', weight: 1.3 },
      { modelName: 'DeepSeek', patternType: 'structure', patternRegex: '第一步|第二步|第三步|总结', patternDescription: '机械化的步骤结构', weight: 1.1 },
      { modelName: 'DeepSeek', patternType: 'vocabulary', patternRegex: '核心要点|关键在于|本质上', patternDescription: '过度使用的总结词', weight: 0.9 },
      { modelName: 'Gemini', patternType: 'structure', patternRegex: '同时|此外|另外|除此之外', patternDescription: '多角度并列结构', weight: 1.0 },
      { modelName: 'Gemini', patternType: 'sentence', patternRegex: '从.*角度来看|从.*视角来看', patternDescription: '过度使用视角切换', weight: 0.8 },
      { modelName: 'Wenxin', patternType: 'vocabulary', patternRegex: '日新月异|蒸蒸日上|欣欣向荣|五彩缤纷', patternDescription: '过度使用的成语', weight: 1.4 },
      { modelName: 'Wenxin', patternType: 'structure', patternRegex: '不仅.*而且|既.*又', patternDescription: '对仗工整结构', weight: 1.0 },
      { modelName: 'Wenxin', patternType: 'emotion', patternRegex: '激动不已|感慨万千|热泪盈眶', patternDescription: '过度使用的情感词', weight: 0.8 },
      { modelName: 'Doubao', patternType: 'sentence', patternRegex: '真的.*吗|[？?]$', patternDescription: '过度使用反问句', weight: 0.9 },
      { modelName: 'Doubao', patternType: 'vocabulary', patternRegex: '太.*了吧|真的.*诶', patternDescription: '口语化表达', weight: 0.6 },
      { modelName: 'Yuanbao', patternType: 'vocabulary', patternRegex: '牛蛙|绝绝子|emo|YYDS', patternDescription: '网络流行语', weight: 0.7 },
      { modelName: 'Yuanbao', patternType: 'structure', patternRegex: '家人们|就是说|各位', patternDescription: '过度使用的口头禅', weight: 0.8 }
    ]

    this.patternsLoaded = true
  }

  async detect(text: string): Promise<AIDetectionResult> {
    await this.loadPatterns()

    const statistics = this.analyzeStatistics(text)
    const paragraphResults = this.analyzeParagraphs(text)
    const patternResults = this.detectPatterns(text)
    const detectedModels = this.identifyModels(patternResults)
    const scores = this.calculateScores(statistics, patternResults, paragraphResults)

    return {
      humanScore: scores.human,
      suspectedAIScore: scores.suspected,
      aiScore: scores.ai,
      riskLevel: this.determineRiskLevel(scores),
      confidence: scores.confidence,
      summary: this.generateSummary(scores, detectedModels),
      suggestions: this.generateSuggestions(scores, detectedModels, patternResults),
      statistics,
      paragraphResults,
      detectedModels
    }
  }

  private analyzeStatistics(text: string): TextStatistics {
    const sentences = this.splitSentences(text)
    const words = this.tokenize(text)

    const sentenceLengths = sentences.map(s => this.countCharacters(s))
    const avgSentenceLength = sentenceLengths.reduce((a, b) => a + b, 0) / (sentenceLengths.length || 1)
    const sentenceLengthVariance = this.calculateVariance(sentenceLengths, avgSentenceLength)

    const uniqueWords = new Set(words)
    const vocabDiversity = uniqueWords.size / (words.length || 1)

    const perplexityScore = this.estimatePerplexity(text)

    const burstinessScore = this.calculateBurstiness(sentenceLengths)

    const repetitionRate = this.calculateRepetitionRate(text)

    const stopWordCount = words.filter(w => CHINESE_STOPWORDS.includes(w)).length
    const stopWordRatio = stopWordCount / (words.length || 1)

    const avgClauseLength = this.estimateClauseLength(text)

    return {
      avgSentenceLength,
      sentenceLengthVariance,
      vocabDiversity,
      perplexityScore,
      burstinessScore,
      repetitionRate,
      stopWordRatio,
      avgClauseLength
    }
  }

  private splitSentences(text: string): string[] {
    return text.split(/[。！？；\n]+/).filter(s => s.trim().length > 0)
  }

  private tokenize(text: string): string[] {
    return text.split(/[\s，。！？；：""''（）《》【】、]/).filter(w => w.length > 0)
  }

  private countCharacters(text: string): number {
    return text.replace(/[\s，。！？；：""''（）《》【】、]/g, '').length
  }

  private calculateVariance(values: number[], mean: number): number {
    if (values.length === 0) return 0
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2))
    return squaredDiffs.reduce((a, b) => a + b, 0) / values.length
  }

  private estimatePerplexity(text: string): number {
    const n = 2
    const ngrams = new Map<string, number>()
    const totalNgrams = Math.max(text.length - n + 1, 1)

    for (let i = 0; i <= text.length - n; i++) {
      const ngram = text.substring(i, i + n)
      ngrams.set(ngram, (ngrams.get(ngram) || 0) + 1)
    }

    let entropy = 0
    for (const count of ngrams.values()) {
      const p = count / totalNgrams
      entropy -= p * Math.log2(p)
    }

    return Math.pow(2, entropy)
  }

  private calculateBurstiness(sentenceLengths: number[]): number {
    if (sentenceLengths.length < 2) return 0
    const mean = sentenceLengths.reduce((a, b) => a + b, 0) / sentenceLengths.length
    const variance = this.calculateVariance(sentenceLengths, mean)
    return Math.sqrt(variance) / (mean || 1)
  }

  private calculateRepetitionRate(text: string): number {
    const words = this.tokenize(text)
    if (words.length < 3) return 0

    let repeated = 0
    for (let i = 2; i < words.length; i++) {
      if (words[i] === words[i - 1] && words[i] === words[i - 2]) {
        repeated++
      }
    }

    return repeated / (words.length - 2)
  }

  private estimateClauseLength(text: string): number {
    const clauses = text.split(/[，、：；]/).filter(c => c.length > 0)
    return clauses.length > 0 ? clauses.reduce((sum, c) => sum + c.length, 0) / clauses.length : 0
  }

  private analyzeParagraphs(text: string): ParagraphResult[] {
    const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0)
    const results: ParagraphResult[] = []

    for (let i = 0; i < paragraphs.length; i++) {
      const para = paragraphs[i]
      const stats = this.analyzeStatistics(para)
      const patterns = this.detectPatterns(para)

      const humanScore = this.calculateHumanScore(stats, patterns)
      const aiScore = this.calculateAIScore(stats, patterns)
      const suspectedScore = Math.max(0, 100 - humanScore - aiScore)

      results.push({
        index: i,
        text: para.slice(0, 100) + (para.length > 100 ? '...' : ''),
        humanScore,
        suspectedAIScore: suspectedScore,
        aiScore,
        riskLevel: this.getRiskLevel(aiScore),
        matchedPatterns: patterns.map(p => p.patternDescription)
      })
    }

    return results
  }

  private detectPatterns(text: string): { pattern: Pattern; matches: number }[] {
    const results: { pattern: Pattern; matches: number }[] = []

    for (const pattern of this.patterns) {
      try {
        const regex = new RegExp(pattern.patternRegex, 'g')
        const matches = (text.match(regex) || []).length
        if (matches > 0) {
          results.push({ pattern, matches })
        }
      } catch (e) {
        // Invalid regex, skip
      }
    }

    return results
  }

  private identifyModels(patternResults: { pattern: Pattern; matches: number }[]): DetectedModel[] {
    const modelScores = new Map<string, { score: number; matchedPatterns: string[] }>()

    for (const { pattern, matches } of patternResults) {
      const modelName = pattern.modelName
      const current = modelScores.get(modelName) || { score: 0, matchedPatterns: [] }
      current.score += matches * pattern.weight
      current.matchedPatterns.push(pattern.patternDescription)
      modelScores.set(modelName, current)
    }

    const totalScore = Array.from(modelScores.values()).reduce((sum, m) => sum + m.score, 0)
    const detectedModels: DetectedModel[] = []

    for (const [name, data] of modelScores) {
      if (data.score > 0) {
        detectedModels.push({
          name,
          confidence: Math.min(100, (data.score / (totalScore || 1)) * 100),
          matchedPatterns: [...new Set(data.matchedPatterns)]
        })
      }
    }

    return detectedModels.sort((a, b) => b.confidence - a.confidence)
  }

  private calculateScores(
    stats: TextStatistics,
    patternResults: { pattern: Pattern; matches: number }[],
    paragraphResults: ParagraphResult[]
  ): { human: number; suspected: number; ai: number; confidence: number } {
    let humanScore = 50
    let aiScore = 20
    let suspectedScore = 30

    const patternPenalty = patternResults.reduce((sum, { matches, pattern }) => {
      return sum + matches * pattern.weight * 2
    }, 0)
    aiScore += Math.min(30, patternPenalty)
    humanScore -= Math.min(20, patternPenalty)

    if (stats.burstinessScore > 0.5) {
      humanScore += 15
      aiScore -= 5
    } else if (stats.burstinessScore < 0.3) {
      humanScore -= 10
      aiScore += 10
    }

    if (stats.sentenceLengthVariance > 200) {
      humanScore += 10
    } else if (stats.sentenceLengthVariance < 50) {
      humanScore -= 15
      aiScore += 15
    }

    if (stats.repetitionRate > 0.05) {
      aiScore += 20
      humanScore -= 10
    }

    if (stats.avgClauseLength > 30) {
      aiScore += 10
    }

    const uniquePatterns = new Set(patternResults.map(p => p.pattern.modelName)).size
    if (uniquePatterns >= 3) {
      aiScore += 15
      suspectedScore += 10
      humanScore -= 10
    }

    const lowVarianceParagraphs = paragraphResults.filter(p => p.aiScore > 70).length
    if (lowVarianceParagraphs > paragraphResults.length * 0.5) {
      aiScore += 10
    }

    humanScore = Math.max(0, Math.min(100, humanScore))
    aiScore = Math.max(0, Math.min(100, aiScore))
    suspectedScore = Math.max(0, Math.min(100, 100 - humanScore - aiScore))

    const confidence = Math.min(95, 50 + patternResults.length * 2 + paragraphResults.length)

    return { human: Math.round(humanScore), suspected: Math.round(suspectedScore), ai: Math.round(aiScore), confidence }
  }

  private calculateHumanScore(stats: TextStatistics, patterns: { pattern: Pattern; matches: number }[]): number {
    let score = 70

    if (stats.burstinessScore > 0.4) score += 15
    else if (stats.burstinessScore < 0.2) score -= 20

    if (stats.sentenceLengthVariance > 100) score += 10
    else if (stats.sentenceLengthVariance < 30) score -= 15

    if (stats.vocabDiversity > 0.6 && stats.vocabDiversity < 0.85) score += 10
    else if (stats.vocabDiversity < 0.4) score -= 15

    if (stats.repetitionRate < 0.02) score += 10
    else if (stats.repetitionRate > 0.08) score -= 20

    const patternPenalty = patterns.reduce((sum, { matches, pattern }) => sum + matches * pattern.weight, 0)
    score -= Math.min(30, patternPenalty * 3)

    return Math.max(0, Math.min(100, score))
  }

  private calculateAIScore(stats: TextStatistics, patterns: { pattern: Pattern; matches: number }[]): number {
    let score = 15

    const patternScore = patterns.reduce((sum, { matches, pattern }) => sum + matches * pattern.weight, 0)
    score += Math.min(50, patternScore * 3)

    if (stats.burstinessScore < 0.3) score += 20
    if (stats.sentenceLengthVariance < 50) score += 15
    if (stats.repetitionRate > 0.05) score += 25
    if (stats.avgClauseLength > 25) score += 10

    return Math.max(0, Math.min(100, score))
  }

  private determineRiskLevel(scores: { human: number; suspected: number; ai: number }): AIDetectionResult['riskLevel'] {
    if (scores.ai >= 70) return 'very_high'
    if (scores.ai >= 50) return 'high'
    if (scores.ai >= 30) return 'medium'
    if (scores.ai >= 15) return 'low'
    return 'safe'
  }

  private getRiskLevel(aiScore: number): string {
    if (aiScore >= 70) return 'very_high'
    if (aiScore >= 50) return 'high'
    if (aiScore >= 30) return 'medium'
    if (aiScore >= 15) return 'low'
    return 'safe'
  }

  private generateSummary(scores: { human: number; suspected: number; ai: number }, detectedModels: DetectedModel[]): string {
    const modelList = detectedModels.slice(0, 3).map(m => `${m.name}(${m.confidence.toFixed(0)}%)`).join('、')

    if (scores.ai >= 70) {
      return `文本具有明显的AI生成特征，检测到可能的AI写作迹象（${modelList || '未能识别具体模型'}）。建议人工审核并适当修改。`
    } else if (scores.ai >= 50) {
      return `文本部分段落显示AI写作特征，疑似AI辅助创作。需要进一步人工判断内容的原创性。`
    } else if (scores.ai >= 30) {
      return `文本整体偏向人类写作风格，但存在少量AI特征痕迹。可能是AI辅助或轻度润色。`
    } else {
      return `文本具有典型的人类写作特征，词汇丰富、表达自然，未检测到明显的AI生成痕迹。`
    }
  }

  private generateSuggestions(
    scores: { human: number; suspected: number; ai: number },
    detectedModels: DetectedModel[],
    patternResults: { pattern: Pattern; matches: number }[]
  ): string[] {
    const suggestions: string[] = []

    if (scores.ai >= 50) {
      suggestions.push('建议对文本进行人工审核，适当增加个人风格的表达')
      suggestions.push('减少过度使用的连接词和结构化表达')
    }

    if (scores.ai >= 30) {
      suggestions.push('可以适当增加情感波动和写作节奏变化')
      suggestions.push('避免机械化的段落结构')
    }

    const topPatterns = patternResults
      .sort((a, b) => b.matches * b.pattern.weight - a.matches * a.pattern.weight)
      .slice(0, 3)

    for (const { pattern, matches } of topPatterns) {
      if (matches >= 2) {
        suggestions.push(`注意：过度使用"${pattern.patternDescription}"（检测到${matches}处）`)
      }
    }

    if (scores.human < 40) {
      suggestions.push('词汇多样性偏低，建议增加同义词替换和表达多样性')
    }

    if (suggestions.length === 0) {
      suggestions.push('继续保持当前的写作风格')
    }

    return suggestions
  }

  async detectChapter(chapterId: string, content: string): Promise<AIDetectionResult> {
    return this.detect(content)
  }

  async detectNovel(
    chapters: { id: string; title: string; content: string }[]
  ): Promise<{ overall: AIDetectionResult; chapterResults: { chapterId: string; chapterTitle: string; result: AIDetectionResult }[] }> {
    const chapterResults: { chapterId: string; chapterTitle: string; result: AIDetectionResult }[] = []

    for (const chapter of chapters) {
      const result = await this.detect(chapter.content)
      chapterResults.push({
        chapterId: chapter.id,
        chapterTitle: chapter.title,
        result
      })
    }

    const overallStatistics = this.aggregateStatistics(chapterResults.map(r => r.result.statistics))
    const overallPatterns = chapterResults.flatMap(r => r.result.detectedModels)
    const overallModels = this.aggregateModels(chapterResults.map(r => r.result.detectedModels))

    const avgScores = {
      human: chapterResults.reduce((sum, r) => sum + r.result.humanScore, 0) / chapterResults.length,
      suspected: chapterResults.reduce((sum, r) => sum + r.result.suspectedAIScore, 0) / chapterResults.length,
      ai: chapterResults.reduce((sum, r) => sum + r.result.aiScore, 0) / chapterResults.length
    }

    return {
      overall: {
        humanScore: Math.round(avgScores.human),
        suspectedAIScore: Math.round(avgScores.suspected),
        aiScore: Math.round(avgScores.ai),
        riskLevel: this.determineRiskLevel(avgScores),
        confidence: 85,
        summary: this.generateSummary(avgScores, overallModels),
        suggestions: chapterResults.flatMap(r => r.result.suggestions).filter((s, i, arr) => arr.indexOf(s) === i).slice(0, 5),
        statistics: overallStatistics,
        paragraphResults: chapterResults.flatMap(r => r.result.paragraphResults).slice(0, 10),
        detectedModels: overallModels
      },
      chapterResults
    }
  }

  private aggregateStatistics(statsList: TextStatistics[]): TextStatistics {
    return {
      avgSentenceLength: this.avg(statsList.map(s => s.avgSentenceLength)),
      sentenceLengthVariance: this.avg(statsList.map(s => s.sentenceLengthVariance)),
      vocabDiversity: this.avg(statsList.map(s => s.vocabDiversity)),
      perplexityScore: this.avg(statsList.map(s => s.perplexityScore)),
      burstinessScore: this.avg(statsList.map(s => s.burstinessScore)),
      repetitionRate: this.avg(statsList.map(s => s.repetitionRate)),
      stopWordRatio: this.avg(statsList.map(s => s.stopWordRatio)),
      avgClauseLength: this.avg(statsList.map(s => s.avgClauseLength))
    }
  }

  private aggregateModels(modelsList: DetectedModel[][]): DetectedModel[] {
    const modelMap = new Map<string, { confidence: number; patterns: Set<string> }>()

    for (const models of modelsList) {
      for (const model of models) {
        const existing = modelMap.get(model.name) || { confidence: 0, patterns: new Set() }
        existing.confidence += model.confidence
        model.matchedPatterns.forEach(p => existing.patterns.add(p))
        modelMap.set(model.name, existing)
      }
    }

    const totalConfidence = Array.from(modelMap.values()).reduce((sum, m) => sum + m.confidence, 0)

    return Array.from(modelMap.entries())
      .map(([name, data]) => ({
        name,
        confidence: Math.min(100, data.confidence / (modelsList.length || 1)),
        matchedPatterns: Array.from(data.patterns)
      }))
      .sort((a, b) => b.confidence - a.confidence)
  }

  private avg(values: number[]): number {
    return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0
  }
}

export const aiDetectionService = new AIDetectionService()
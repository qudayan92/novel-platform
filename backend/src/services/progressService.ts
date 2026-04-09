export interface WritingMilestone {
  id: string
  targetWordCount: number
  label: string
  achieved: boolean
  achievedAt?: Date
}

export interface WritingProgress {
  novelId: string
  totalWords: number
  targetWords: number
  todayWords: number
  weekWords: number
  monthWords: number
  chapterCount: number
  volumeCount: number
  percentComplete: number
  avgWordsPerChapter: number
  avgWordsPerDay: number
  estimatedDaysToComplete: number
  currentStreak: number
  longestStreak: number
  milestones: WritingMilestone[]
}

export interface DailyWriting {
  date: string
  wordCount: number
  chaptersWritten: number
}

export class ProgressService {
  private dailyWritings: Map<string, DailyWriting[]> = new Map()

  async getProgress(
    novelId: string,
    chapters: { wordCount: number; createdAt: Date }[],
    volumes: { id: string }[],
    targetWords: number = 500000
  ): Promise<WritingProgress> {
    const now = new Date()
    const today = this.getDateString(now)
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const totalWords = chapters.reduce((sum, c) => sum + (c.wordCount || 0), 0)
    const todayWords = chapters
      .filter(c => this.getDateString(c.createdAt) === today)
      .reduce((sum, c) => sum + (c.wordCount || 0), 0)

    const weekWords = chapters
      .filter(c => c.createdAt >= weekAgo)
      .reduce((sum, c) => sum + (c.wordCount || 0), 0)

    const monthWords = chapters
      .filter(c => c.createdAt >= monthAgo)
      .reduce((sum, c) => sum + (c.wordCount || 0), 0)

    const chapterCount = chapters.length
    const volumeCount = volumes.length
    const percentComplete = targetWords > 0 ? (totalWords / targetWords) * 100 : 0
    const avgWordsPerChapter = chapterCount > 0 ? totalWords / chapterCount : 0
    const avgWordsPerDay = 30 > 0 ? monthWords / 30 : 0
    const remainingWords = targetWords - totalWords
    const estimatedDaysToComplete = avgWordsPerDay > 0 ? Math.ceil(remainingWords / avgWordsPerDay) : 0

    const milestones = this.generateMilestones(targetWords, totalWords)

    const streak = this.calculateStreak(novelId)

    return {
      novelId,
      totalWords,
      targetWords,
      todayWords,
      weekWords,
      monthWords,
      chapterCount,
      volumeCount,
      percentComplete,
      avgWordsPerChapter,
      avgWordsPerDay,
      estimatedDaysToComplete,
      currentStreak: streak.current,
      longestStreak: streak.longest,
      milestones
    }
  }

  private generateMilestones(targetWords: number, currentWords: number): WritingMilestone[] {
    const milestones: WritingMilestone[] = []
    const levels = [
      { percent: 0.01, label: '起步 (1%)' },
      { percent: 0.05, label: '小成 (5%)' },
      { percent: 0.10, label: '十分之一 (10%)' },
      { percent: 0.25, label: '四分之一 (25%)' },
      { percent: 0.50, label: '半程 (50%)' },
      { percent: 0.75, label: '四分之三 (75%)' },
      { percent: 0.90, label: '九成 (90%)' },
      { percent: 1.00, label: '完本 (100%)' }
    ]

    for (const level of levels) {
      const targetWordCount = Math.floor(targetWords * level.percent)
      const achieved = currentWords >= targetWordCount
      milestones.push({
        id: `milestone-${level.percent}`,
        targetWordCount,
        label: level.label,
        achieved,
        achievedAt: achieved ? new Date() : undefined
      })
    }

    return milestones
  }

  private calculateStreak(novelId: string): { current: number; longest: number } {
    const writings = this.dailyWritings.get(novelId) || []
    if (writings.length === 0) return { current: 0, longest: 0 }

    const sortedDates = writings
      .filter(w => w.wordCount > 0)
      .map(w => w.date)
      .sort()
      .reverse()

    const today = this.getDateString(new Date())
    const yesterday = this.getDateString(new Date(Date.now() - 24 * 60 * 60 * 1000))

    let currentStreak = 0
    let longestStreak = 0
    let tempStreak = 0
    let lastDate: string | null = null

    for (const date of sortedDates) {
      if (lastDate === null) {
        if (date === today || date === yesterday) {
          tempStreak = 1
          currentStreak = 1
        }
      } else {
        const diff = this.daysBetween(lastDate, date)
        if (diff === 1) {
          tempStreak++
          if (currentStreak > 0) currentStreak++
        } else {
          longestStreak = Math.max(longestStreak, tempStreak)
          tempStreak = 1
        }
      }
      lastDate = date
    }

    longestStreak = Math.max(longestStreak, tempStreak)

    return { current: currentStreak, longest: longestStreak }
  }

  private daysBetween(date1: string, date2: string): number {
    const d1 = new Date(date1)
    const d2 = new Date(date2)
    return Math.floor(Math.abs(d1.getTime() - d2.getTime()) / (24 * 60 * 60 * 1000))
  }

  private getDateString(date: Date): string {
    return date.toISOString().split('T')[0]
  }

  recordWriting(novelId: string, wordCount: number, chapterId: string): void {
    const today = this.getDateString(new Date())
    const writings = this.dailyWritings.get(novelId) || []

    const todayEntry = writings.find(w => w.date === today)
    if (todayEntry) {
      todayEntry.wordCount += wordCount
      todayEntry.chaptersWritten++
    } else {
      writings.push({
        date: today,
        wordCount,
        chaptersWritten: 1
      })
    }

    this.dailyWritings.set(novelId, writings)
  }

  getWritingStats(novelId: string, days: number = 30): DailyWriting[] {
    const writings = this.dailyWritings.get(novelId) || []
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    return writings
      .filter(w => new Date(w.date) >= cutoff)
      .sort((a, b) => a.date.localeCompare(b.date))
  }

  suggestDailyTarget(novelId: string, targetWords: number, remainingDays: number): number {
    const progress = this.getProgress(novelId, [], [], targetWords)
    const remainingWords = targetWords - progress.totalWords

    if (remainingDays <= 0) return remainingWords

    const baseTarget = Math.ceil(remainingWords / remainingDays)
    const historicalAvg = progress.avgWordsPerDay

    if (historicalAvg > 0) {
      return Math.max(baseTarget, Math.floor(historicalAvg * 1.2))
    }

    return baseTarget
  }
}

export const progressService = new ProgressService()
export interface Volume {
  id: string
  title: string
  subtitle?: string
  orderIndex: number
  description?: string
  wordCount: number
  chapterCount: number
  status: 'planning' | 'writing' | 'completed' | 'archived'
  createdAt: Date
  updatedAt: Date
}

export interface Chapter {
  id: string
  volumeId?: string
  title: string
  subtitle?: string
  content?: string
  orderIndex: number
  wordCount: number
  status: 'draft' | 'writing' | 'completed' | 'published'
  isVip: boolean
  price: number
  summary?: string
  createdAt: Date
  updatedAt: Date
}

export interface NovelOutline {
  id: string
  novelId: string
  level: 'three' | 'two' | 'one'
  structure: OutlineNode[]
  updatedAt: Date
}

export interface OutlineNode {
  id: string
  type: 'volume' | 'chapter' | 'arc' | 'section'
  title: string
  description?: string
  orderIndex: number
  parentId?: string
  children?: OutlineNode[]
  wordCountTarget?: number
  status?: 'planning' | 'writing' | 'completed'
}

export interface NovelHierarchy {
  novel: {
    id: string
    title: string
    synopsis: string
    genre: string
    targetWordCount: number
    currentWordCount: number
  }
  volumes: Volume[]
  outline: NovelOutline | null
  recentChapters: Chapter[]
}

export class NovelService {
  private volumes: Map<string, Volume[]> = new Map()
  private chapters: Map<string, Chapter[]> = new Map()

  buildHierarchy(
    novelId: string,
    novel: NovelHierarchy['novel'],
    chapters: Chapter[]
  ): NovelHierarchy {
    const novelChapters = chapters.filter(c => c.novelId === novelId)

    const volumeMap = new Map<string, Chapter[]>()
    const noVolumeChapters: Chapter[] = []

    for (const chapter of novelChapters) {
      if (chapter.volumeId) {
        const volChapters = volumeMap.get(chapter.volumeId) || []
        volChapters.push(chapter)
        volumeMap.set(chapter.volumeId, volChapters)
      } else {
        noVolumeChapters.push(chapter)
      }
    }

    const volumes: Volume[] = []
    for (const [volumeId, volChapters] of volumeMap) {
      const vol = this.volumes.get(novelId)?.find(v => v.id === volumeId)
      if (vol) {
        vol.chapterCount = volChapters.length
        vol.wordCount = volChapters.reduce((sum, c) => sum + (c.wordCount || 0), 0)
        volumes.push(vol)
      }
    }

    volumes.sort((a, b) => a.orderIndex - b.orderIndex)
    noVolumeChapters.sort((a, b) => a.orderIndex - b.orderIndex)

    return {
      novel: {
        ...novel,
        currentWordCount: novelChapters.reduce((sum, c) => sum + (c.wordCount || 0), 0)
      },
      volumes,
      outline: null,
      recentChapters: novelChapters
        .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
        .slice(0, 5)
    }
  }

  createVolume(novelId: string, title: string, orderIndex: number): Volume {
    const volume: Volume = {
      id: `vol-${Date.now()}`,
      title,
      orderIndex,
      wordCount: 0,
      chapterCount: 0,
      status: 'planning',
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const novelVolumes = this.volumes.get(novelId) || []
    novelVolumes.push(volume)
    this.volumes.set(novelId, novelVolumes)

    return volume
  }

  reorganizeChapters(
    novelId: string,
    chapterOrders: { chapterId: string; volumeId?: string; orderIndex: number }[]
  ): void {
    for (const change of chapterOrders) {
      const novelChapters = this.chapters.get(novelId) || []
      const chapter = novelChapters.find(c => c.id === change.chapterId)
      if (chapter) {
        chapter.volumeId = change.volumeId
        chapter.orderIndex = change.orderIndex
        chapter.updatedAt = new Date()
      }
    }
  }

  generateThreeLevelOutline(novel: {
    title: string
    synopsis: string
    genre: string
    targetWordCount: number
  }): NovelOutline {
    const structure: OutlineNode[] = []

    const arcCount = Math.ceil(novel.targetWordCount / 100000)
    const chaptersPerArc = Math.ceil(novel.targetWordCount / arcCount / 3000)

    for (let i = 0; i < arcCount; i++) {
      const arc: OutlineNode = {
        id: `arc-${i}`,
        type: 'arc',
        title: `第${this.toChineseNumber(i + 1)}卷`,
        description: `主要情节点`,
        orderIndex: i,
        children: []
      }

      for (let j = 0; j < chaptersPerArc; j++) {
        const section: OutlineNode = {
          id: `section-${i}-${j}`,
          type: 'section',
          title: `第${this.toChineseNumber(j + 1)}节`,
          orderIndex: j,
          children: []
        }

        const chaptersInSection = Math.max(3, Math.floor(chaptersPerSection / 2))
        for (let k = 0; k < chaptersInSection; k++) {
          const chapterNode: OutlineNode = {
            id: `chapter-${i}-${j}-${k}`,
            type: 'chapter',
            title: `章节标题`,
            orderIndex: k,
            wordCountTarget: 3000
          }
          section.children!.push(chapterNode)
        }

        arc.children!.push(section)
      }

      structure.push(arc)
    }

    return {
      id: `outline-${Date.now()}`,
      novelId: novel.title,
      level: 'three',
      structure,
      updatedAt: new Date()
    }
  }

  private toChineseNumber(num: number): string {
    const chinese = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十']
    if (num <= 10) return chinese[num]
    if (num < 20) return '十' + chinese[num - 10]
    if (num < 100) {
      const tens = Math.floor(num / 10)
      const ones = num % 10
      return chinese[tens] + '十' + (ones > 0 ? chinese[ones] : '')
    }
    return num.toString()
  }

  mergeVolumes(novelId: string, sourceVolumeIds: string[], targetVolumeId: string): void {
    const novelChapters = this.chapters.get(novelId) || []

    for (const sourceId of sourceVolumeIds) {
      for (const chapter of novelChapters) {
        if (chapter.volumeId === sourceId) {
          chapter.volumeId = targetVolumeId
        }
      }

      const volumes = this.volumes.get(novelId) || []
      const index = volumes.findIndex(v => v.id === sourceId)
      if (index !== -1) {
        volumes.splice(index, 1)
      }
    }
  }

  splitVolume(novelId: string, volumeId: string, splitPoints: number[]): Volume[] {
    const volumes = this.volumes.get(novelId) || []
    const sourceVolume = volumes.find(v => v.id === volumeId)
    if (!sourceVolume) return []

    const newVolumes: Volume[] = []
    let currentIndex = 0
    let partNum = 1

    for (const splitPoint of splitPoints) {
      const newVolume: Volume = {
        ...sourceVolume,
        id: `vol-${Date.now()}-${partNum}`,
        title: `${sourceVolume.title} (第${partNum}部分)`,
        orderIndex: sourceVolume.orderIndex + partNum - 1,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      newVolumes.push(newVolume)
      partNum++
    }

    return newVolumes
  }

  calculateWordCountDistribution(chapters: Chapter[]): Map<string, number> {
    const distribution = new Map<string, number>()

    const ranges = [
      { label: '<1000', min: 0, max: 1000 },
      { label: '1000-2000', min: 1000, max: 2000 },
      { label: '2000-3000', min: 2000, max: 3000 },
      { label: '3000-5000', min: 3000, max: 5000 },
      { label: '5000-8000', min: 5000, max: 8000 },
      { label: '>8000', min: 8000, max: Infinity }
    ]

    for (const range of ranges) {
      distribution.set(range.label, 0)
    }

    for (const chapter of chapters) {
      const wordCount = chapter.wordCount || 0
      for (const range of ranges) {
        if (wordCount >= range.min && wordCount < range.max) {
          distribution.set(range.label, distribution.get(range.label)! + 1)
          break
        }
      }
    }

    return distribution
  }
}

export const novelService = new NovelService()
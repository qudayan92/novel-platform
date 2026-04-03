import { Router } from 'express'
import { progressService, WritingProgress } from '../services/progressService'
import { novelService, NovelHierarchy, OutlineNode } from '../services/novelService'
import { longTextService } from '../services/longTextService'

export const novelRouter = Router()

const mockNovels = [
  {
    id: '1',
    title: '幽冥古币',
    synopsis: '一个关于神秘古币的玄幻故事',
    genre: '玄幻',
    targetWordCount: 500000,
    wordCount: 52000,
    status: 'writing',
    createdAt: new Date().toISOString()
  }
]

const mockVolumes = [
  { id: 'vol-1', novelId: '1', title: '第一卷 起源', orderIndex: 0, wordCount: 25000, chapterCount: 8, status: 'completed' as const },
  { id: 'vol-2', novelId: '1', title: '第二卷 崛起', orderIndex: 1, wordCount: 27000, chapterCount: 9, status: 'writing' as const }
]

const mockChapters = [
  { id: '1', novelId: '1', volumeId: 'vol-1', title: '第一章 觉醒', orderIndex: 0, wordCount: 3200, status: 'published' as const, createdAt: new Date(), updatedAt: new Date() },
  { id: '2', novelId: '1', volumeId: 'vol-1', title: '第二章 幽冥之门', orderIndex: 1, wordCount: 3500, status: 'published' as const, createdAt: new Date(), updatedAt: new Date() },
  { id: '3', novelId: '1', volumeId: 'vol-2', title: '第三章 新的开始', orderIndex: 0, wordCount: 2800, status: 'draft' as const, createdAt: new Date(), updatedAt: new Date() }
]

novelRouter.get('/', (req, res) => {
  res.json({ success: true, data: mockNovels })
})

novelRouter.get('/:id', (req, res) => {
  const novel = mockNovels.find(n => n.id === req.params.id)
  if (!novel) {
    return res.status(404).json({ success: false, error: '小说不存在' })
  }
  res.json({ success: true, data: novel })
})

novelRouter.post('/', (req, res) => {
  const { title, synopsis, genre, targetWordCount } = req.body
  const newNovel = {
    id: Date.now().toString(),
    title,
    synopsis,
    genre,
    targetWordCount: targetWordCount || 500000,
    wordCount: 0,
    status: 'draft',
    createdAt: new Date().toISOString()
  }
  mockNovels.push(newNovel)
  res.json({ success: true, data: newNovel })
})

novelRouter.put('/:id', (req, res) => {
  const index = mockNovels.findIndex(n => n.id === req.params.id)
  if (index === -1) {
    return res.status(404).json({ success: false, error: '小说不存在' })
  }
  mockNovels[index] = { ...mockNovels[index], ...req.body }
  res.json({ success: true, data: mockNovels[index] })
})

novelRouter.delete('/:id', (req, res) => {
  const index = mockNovels.findIndex(n => n.id === req.params.id)
  if (index === -1) {
    return res.status(404).json({ success: false, error: '小说不存在' })
  }
  mockNovels.splice(index, 1)
  res.json({ success: true })
})

novelRouter.get('/:id/hierarchy', (req, res) => {
  const novel = mockNovels.find(n => n.id === req.params.id)
  if (!novel) {
    return res.status(404).json({ success: false, error: '小说不存在' })
  }
  const hierarchy = novelService.buildHierarchy(req.params.id, novel as any, mockChapters as any)
  res.json({ success: true, data: hierarchy })
})

novelRouter.get('/:id/chapters', (req, res) => {
  const volumeId = req.query.volumeId as string | undefined
  let chapters = mockChapters.filter(c => c.novelId === req.params.id)
  if (volumeId) {
    chapters = chapters.filter(c => c.volumeId === volumeId)
  }
  chapters.sort((a, b) => a.orderIndex - b.orderIndex)
  res.json({ success: true, data: chapters })
})

novelRouter.post('/:id/chapters', (req, res) => {
  const { title, content, orderIndex, volumeId } = req.body
  const newChapter = {
    id: Date.now().toString(),
    novelId: req.params.id,
    volumeId,
    title,
    content,
    orderIndex: orderIndex ?? 0,
    wordCount: content?.length || 0,
    status: 'draft' as const,
    createdAt: new Date(),
    updatedAt: new Date()
  }
  mockChapters.push(newChapter)
  res.json({ success: true, data: newChapter })
})

novelRouter.put('/:id/chapters/:chapterId', (req, res) => {
  const chapter = mockChapters.find(c => c.id === req.params.chapterId)
  if (!chapter) {
    return res.status(404).json({ success: false, error: '章节不存在' })
  }
  Object.assign(chapter, req.body, { updatedAt: new Date() })
  res.json({ success: true, data: chapter })
})

novelRouter.delete('/:id/chapters/:chapterId', (req, res) => {
  const index = mockChapters.findIndex(c => c.id === req.params.chapterId)
  if (index === -1) {
    return res.status(404).json({ success: false, error: '章节不存在' })
  }
  mockChapters.splice(index, 1)
  res.json({ success: true })
})

novelRouter.get('/:id/volumes', (req, res) => {
  const volumes = mockVolumes.filter(v => v.novelId === req.params.id)
  res.json({ success: true, data: volumes })
})

novelRouter.post('/:id/volumes', (req, res) => {
  const { title, subtitle, orderIndex, description } = req.body
  const newVolume = {
    id: `vol-${Date.now()}`,
    novelId: req.params.id,
    title,
    subtitle,
    orderIndex: orderIndex ?? 0,
    description,
    wordCount: 0,
    chapterCount: 0,
    status: 'planning' as const,
    createdAt: new Date(),
    updatedAt: new Date()
  }
  mockVolumes.push(newVolume)
  res.json({ success: true, data: newVolume })
})

novelRouter.put('/:id/volumes/:volumeId', (req, res) => {
  const volume = mockVolumes.find(v => v.id === req.params.volumeId)
  if (!volume) {
    return res.status(404).json({ success: false, error: '卷不存在' })
  }
  Object.assign(volume, req.body, { updatedAt: new Date() })
  res.json({ success: true, data: volume })
})

novelRouter.delete('/:id/volumes/:volumeId', (req, res) => {
  const index = mockVolumes.findIndex(v => v.id === req.params.volumeId)
  if (index === -1) {
    return res.status(404).json({ success: false, error: '卷不存在' })
  }
  mockChapters.forEach(c => {
    if (c.volumeId === req.params.volumeId) {
      c.volumeId = undefined
    }
  })
  mockVolumes.splice(index, 1)
  res.json({ success: true })
})

novelRouter.get('/:id/progress', (req, res) => {
  const novel = mockNovels.find(n => n.id === req.params.id)
  if (!novel) {
    return res.status(404).json({ success: false, error: '小说不存在' })
  }
  const progress = progressService.getProgress(
    req.params.id,
    mockChapters.map(c => ({ wordCount: c.wordCount, createdAt: c.createdAt })),
    mockVolumes.map(v => ({ id: v.id })),
    novel.targetWordCount
  )
  res.json({ success: true, data: progress })
})

novelRouter.get('/:id/progress/stats', (req, res) => {
  const days = parseInt(req.query.days as string) || 30
  const stats = progressService.getWritingStats(req.params.id, days)
  res.json({ success: true, data: stats })
})

novelRouter.get('/:id/outline', (req, res) => {
  const novel = mockNovels.find(n => n.id === req.params.id)
  if (!novel) {
    return res.status(404).json({ success: false, error: '小说不存在' })
  }
  const outline = novelService.generateThreeLevelOutline(novel as any)
  res.json({ success: true, data: outline })
})

novelRouter.post('/:id/outline/generate', (req, res) => {
  const { synopsis, genre, targetWordCount } = req.body
  const outline = novelService.generateThreeLevelOutline({ title: '', synopsis, genre, targetWordCount })
  res.json({ success: true, data: outline })
})

novelRouter.post('/:id/outline', (req, res) => {
  const { structure, level } = req.body
  res.json({ success: true, data: { id: `outline-${Date.now()}`, novelId: req.params.id, structure, level, updatedAt: new Date() } })
})

novelRouter.put('/:id/outline', (req, res) => {
  res.json({ success: true, data: { id: req.params.id, ...req.body, updatedAt: new Date() } })
})

novelRouter.post('/:id/chapters/:chapterId/summarize', async (req, res) => {
  const chapter = mockChapters.find(c => c.id === req.params.chapterId)
  if (!chapter) {
    return res.status(404).json({ success: false, error: '章节不存在' })
  }
  const summary = await longTextService.progressiveSummarize(chapter.title + ' ' + (chapter.title || ''), chapter.id)
  chapter.title = chapter.title
  res.json({ success: true, data: summary })
})

novelRouter.post('/:id/reorganize', (req, res) => {
  const { chapterOrders } = req.body
  novelService.reorganizeChapters(req.params.id, chapterOrders)
  res.json({ success: true })
})

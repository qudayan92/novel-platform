import { Router, Response } from 'express'
import { AuthRequest, authMiddleware } from '../middleware/auth.js'
import { publishService, formatConverter, NovelForExport, Chapter } from '../services/publishService.js'
import { sensitiveWordService } from '../services/sensitiveWordService.js'

const router = Router()

router.use(authMiddleware)

router.get('/platforms', async (req: AuthRequest, res: Response) => {
  try {
    const platforms = await publishService.getAllPlatforms()
    res.json(platforms.map(p => ({
      id: p.id,
      name: p.name,
      displayName: p.display_name,
      minWordCount: p.min_word_count,
      chapterMinWords: p.chapter_min_words,
      supportedCategories: p.supported_categories,
      iconUrl: p.icon_url
    })))
  } catch (error) {
    console.error('获取平台列表失败:', error)
    res.status(500).json({ error: '获取平台列表失败' })
  }
})

router.post('/submissions', async (req: AuthRequest, res: Response) => {
  try {
    const { novelId, platformId, title, authorName, category, tags, synopsis, coverUrl, chapters } = req.body
    const userId = req.userId

    if (!novelId || !platformId || !title || !authorName) {
      return res.status(400).json({ error: '缺少必要参数' })
    }

    const submission = await publishService.createSubmission({
      novelId,
      userId: userId!,
      platformId,
      title,
      authorName,
      category: category || '玄幻',
      tags: tags || [],
      synopsis: synopsis || '',
      coverUrl
    })

    if (chapters && chapters.length > 0) {
      await publishService.addSubmissionChapters(submission.id, chapters)
    }

    res.status(201).json({
      id: submission.id,
      status: submission.status,
      createdAt: submission.created_at
    })
  } catch (error) {
    console.error('创建投稿失败:', error)
    res.status(500).json({ error: '创建投稿失败' })
  }
})

router.get('/submissions', async (req: AuthRequest, res: Response) => {
  try {
    const submissions = await publishService.getSubmissionsByUser(req.userId!)
    res.json(submissions.map(s => ({
      id: s.id,
      novelId: s.novel_id,
      novelTitle: s.novel_title,
      platformName: s.platform_name,
      platformDisplayName: s.platform_display_name,
      title: s.title,
      status: s.status,
      totalWords: s.total_words,
      chapterCount: s.chapter_count,
      submittedAt: s.submitted_at,
      publishedAt: s.published_at,
      platformUrl: s.platform_url,
      rejectReason: s.reject_reason,
      createdAt: s.created_at
    })))
  } catch (error) {
    console.error('获取投稿列表失败:', error)
    res.status(500).json({ error: '获取投稿列表失败' })
  }
})

router.get('/submissions/:submissionId', async (req: AuthRequest, res: Response) => {
  try {
    const { submissionId } = req.params
    const submission = await publishService.getSubmission(submissionId)

    if (!submission) {
      return res.status(404).json({ error: '投稿不存在' })
    }

    const chapters = await publishService.getSubmissionChapters(submissionId)
    const checkResult = await sensitiveWordService.getCheckResult(submissionId)

    res.json({
      id: submission.id,
      novelId: submission.novel_id,
      platformName: submission.platform_name,
      platformDisplayName: submission.platform_display_name,
      title: submission.title,
      authorName: submission.author_name,
      category: submission.category,
      tags: submission.tags,
      synopsis: submission.synopsis,
      coverUrl: submission.cover_url,
      status: submission.status,
      totalWords: submission.total_words,
      chapterCount: submission.chapter_count,
      submittedAt: submission.submitted_at,
      reviewedAt: submission.reviewed_at,
      publishedAt: submission.published_at,
      platformNovelId: submission.platform_novel_id,
      platformUrl: submission.platform_url,
      rejectReason: submission.reject_reason,
      reviewNotes: submission.review_notes,
      chapters: chapters.map(ch => ({
        id: ch.id,
        chapterId: ch.chapter_id,
        title: ch.title,
        wordCount: ch.word_count,
        orderIndex: ch.order_index,
        status: ch.status
      })),
      sensitiveCheck: checkResult ? {
        riskLevel: checkResult.risk_level,
        sensitiveCount: checkResult.sensitive_count,
        matches: checkResult.matches
      } : null,
      createdAt: submission.created_at
    })
  } catch (error) {
    console.error('获取投稿详情失败:', error)
    res.status(500).json({ error: '获取投稿详情失败' })
  }
})

router.post('/submissions/:submissionId/submit', async (req: AuthRequest, res: Response) => {
  try {
    const { submissionId } = req.params

    const checkResult = await sensitiveWordService.getCheckResult(submissionId)
    if (checkResult && checkResult.risk_level === 'high') {
      return res.status(400).json({ 
        error: '内容包含高风险敏感词，请修改后再投稿',
        sensitiveCount: checkResult.sensitive_count
      })
    }

    const result = await publishService.submitToPlatform(submissionId)

    if (result.success) {
      res.json({
        message: result.message,
        platformNovelId: result.platformNovelId
      })
    } else {
      res.status(400).json({ error: result.message })
    }
  } catch (error) {
    console.error('提交投稿失败:', error)
    res.status(500).json({ error: '提交投稿失败' })
  }
})

router.delete('/submissions/:submissionId', async (req: AuthRequest, res: Response) => {
  try {
    const { submissionId } = req.params
    const deleted = await publishService.deleteSubmission(submissionId, req.userId!)

    if (!deleted) {
      return res.status(400).json({ error: '无法删除该投稿，可能已提交或不存在' })
    }

    res.json({ message: '投稿已删除' })
  } catch (error) {
    console.error('删除投稿失败:', error)
    res.status(500).json({ error: '删除投稿失败' })
  }
})

router.post('/check-sensitive', async (req: AuthRequest, res: Response) => {
  try {
    const { text, submissionId, chapterId } = req.body

    if (!text) {
      return res.status(400).json({ error: '缺少文本内容' })
    }

    const result = await sensitiveWordService.checkText(text)

    if (submissionId) {
      await sensitiveWordService.saveCheckResult(submissionId, chapterId || null, result)
    }

    res.json({
      totalWords: result.totalWords,
      sensitiveCount: result.sensitiveCount,
      riskLevel: result.riskLevel,
      matches: result.matches.slice(0, 50),
      suggestions: result.suggestions
    })
  } catch (error) {
    console.error('敏感词检测失败:', error)
    res.status(500).json({ error: '敏感词检测失败' })
  }
})

router.post('/check-submission/:submissionId', async (req: AuthRequest, res: Response) => {
  try {
    const { submissionId } = req.params

    const submission = await publishService.getSubmission(submissionId)
    if (!submission) {
      return res.status(404).json({ error: '投稿不存在' })
    }

    const chapters = await publishService.getSubmissionChapters(submissionId)
    
    const allText = chapters.map(ch => ch.content).join('\n')
    const result = await sensitiveWordService.checkAndSave(allText, submissionId)

    res.json({
      submissionId,
      totalWords: result.totalWords,
      sensitiveCount: result.sensitiveCount,
      riskLevel: result.riskLevel,
      canSubmit: result.riskLevel !== 'high',
      matches: result.matches.slice(0, 100)
    })
  } catch (error) {
    console.error('检测投稿内容失败:', error)
    res.status(500).json({ error: '检测投稿内容失败' })
  }
})

router.post('/submissions/:submissionId/chapters', async (req: AuthRequest, res: Response) => {
  try {
    const { submissionId } = req.params
    const { chapters } = req.body

    if (!chapters || !Array.isArray(chapters)) {
      return res.status(400).json({ error: '缺少章节数据' })
    }

    const formattedChapters: Chapter[] = chapters.map((ch: any, index: number) => ({
      id: ch.id || `ch-${index}`,
      title: ch.title,
      content: ch.content,
      wordCount: ch.wordCount || ch.content.replace(/\s/g, '').length,
      orderIndex: ch.orderIndex || index
    }))

    await publishService.addSubmissionChapters(submissionId, formattedChapters)

    res.json({ message: '章节添加成功', chapterCount: formattedChapters.length })
  } catch (error) {
    console.error('添加章节失败:', error)
    res.status(500).json({ error: '添加章节失败' })
  }
})

router.post('/export', (req: AuthRequest, res: Response) => {
  try {
    const { novel, format } = req.body

    if (!novel || !format) {
      return res.status(400).json({ error: '缺少参数' })
    }

    const formattedNovel: NovelForExport = {
      id: novel.id,
      title: novel.title,
      authorName: novel.authorName || '佚名',
      synopsis: novel.synopsis || '',
      coverUrl: novel.coverUrl || null,
      category: novel.category || '玄幻',
      tags: novel.tags || [],
      chapters: (novel.chapters || []).map((ch: any, index: number) => ({
        id: ch.id || `ch-${index}`,
        title: ch.title,
        content: ch.content,
        wordCount: ch.wordCount || ch.content?.replace(/\s/g, '').length || 0,
        orderIndex: ch.orderIndex || index
      })),
      totalWords: novel.totalWords || 0
    }

    let result
    switch (format) {
      case 'txt':
        result = formatConverter.toTxt(formattedNovel)
        break
      case 'html':
        result = formatConverter.toHtml(formattedNovel)
        break
      case 'markdown':
        result = formatConverter.toMarkdown(formattedNovel)
        break
      case 'epub':
        result = formatConverter.toEpub(formattedNovel)
        break
      default:
        return res.status(400).json({ error: '不支持的格式' })
    }

    res.setHeader('Content-Type', result.mimeType)
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(result.filename)}"`)
    res.send(result.content)
  } catch (error) {
    console.error('导出失败:', error)
    res.status(500).json({ error: '导出失败' })
  }
})

router.get('/submissions/:submissionId/stats', async (req: AuthRequest, res: Response) => {
  try {
    const { submissionId } = req.params
    const { days = 30 } = req.query

    const stats = await publishService.getSubmissionStats(submissionId, Number(days))
    
    res.json(stats.map(s => ({
      date: s.stat_date,
      viewCount: s.view_count,
      uniqueViewCount: s.unique_view_count,
      likeCount: s.like_count,
      commentCount: s.comment_count,
      favoriteCount: s.favorite_count,
      shareCount: s.share_count,
      income: s.income
    })))
  } catch (error) {
    console.error('获取统计数据失败:', error)
    res.status(500).json({ error: '获取统计数据失败' })
  }
})

router.get('/sensitive-words', async (req: AuthRequest, res: Response) => {
  try {
    const { category } = req.query
    const words = await sensitiveWordService.getSensitiveWords(category as string)
    res.json(words)
  } catch (error) {
    console.error('获取敏感词列表失败:', error)
    res.status(500).json({ error: '获取敏感词列表失败' })
  }
})

router.post('/sensitive-words', async (req: AuthRequest, res: Response) => {
  try {
    const { word, category, severity, suggestion } = req.body

    if (!word || !category || !severity) {
      return res.status(400).json({ error: '缺少必要参数' })
    }

    const result = await sensitiveWordService.addSensitiveWord(word, category, severity, suggestion)
    res.status(201).json(result)
  } catch (error) {
    console.error('添加敏感词失败:', error)
    res.status(500).json({ error: '添加敏感词失败' })
  }
})

export { router as publishRouter }

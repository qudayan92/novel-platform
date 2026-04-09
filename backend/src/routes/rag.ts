import { Router } from 'express'
import { ragService } from '../services/ragService.js'

export const ragRouter = Router()

ragRouter.post('/index', async (req, res) => {
  try {
    const { id, name, type, description } = req.body
    await ragService.indexWikiEntry({ id, name, type, description })
    res.json({ success: true, message: '索引创建成功' })
  } catch (error) {
    res.status(500).json({ success: false, error: '索引创建失败' })
  }
})

ragRouter.post('/search', async (req, res) => {
  try {
    const { query, topK = 5 } = req.body
    const results = await ragService.search(query, topK)
    res.json({ success: true, data: results })
  } catch (error) {
    res.status(500).json({ success: false, error: '搜索失败' })
  }
})

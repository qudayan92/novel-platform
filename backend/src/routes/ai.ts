import { Router } from 'express'
import { AIService } from '../services/aiService.js'

export const aiRouter = Router()
const aiService = new AIService()

aiRouter.post('/stream-write', async (req, res) => {
  const { context, systemPrompt, maxTokens = 300, temperature = 0.8 } = req.body

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no')

  res.write('data: {"type":"status","message":"开始生成..."}\n\n')

  try {
    await aiService.streamWrite(
      { context, systemPrompt, maxTokens, temperature },
      (text) => {
        res.write(`data: ${JSON.stringify({ type: 'chunk', text })}\n\n`)
      }
    )

    res.write('data: [DONE]\n\n')
    res.end()
  } catch (error) {
    console.error('Stream write error:', error)
    res.write(`data: ${JSON.stringify({ type: 'error', message: '生成失败' })}\n\n`)
    res.end()
  }
})

aiRouter.post('/style-transfer', async (req, res) => {
  try {
    const { content, style } = req.body
    const result = await aiService.styleTransfer(content, style)
    res.json({ success: true, result })
  } catch (error) {
    console.error('Style transfer error:', error)
    res.status(500).json({ success: false, error: '风格转换失败' })
  }
})

aiRouter.post('/check-consistency', async (req, res) => {
  try {
    const { newContent, wikiEntries } = req.body
    const result = await aiService.checkConsistency(newContent, wikiEntries)
    res.json(result)
  } catch (error) {
    console.error('Consistency check error:', error)
    res.status(500).json({ success: false, error: '一致性检查失败' })
  }
})

aiRouter.post('/generate-outline', async (req, res) => {
  try {
    const { plotSummary, style } = req.body
    const result = await aiService.generateOutline(plotSummary, style)
    res.json({ success: true, outline: result })
  } catch (error) {
    console.error('Outline generation error:', error)
    res.status(500).json({ success: false, error: '大纲生成失败' })
  }
})

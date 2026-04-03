import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import dotenv from 'dotenv'
import { createServer } from 'http'

dotenv.config()

import { aiRouter } from './routes/ai.js'
import { aiDetectRouter } from './routes/aiDetect.js'
import { novelRouter } from './routes/novel.js'
import { wikiRouter } from './routes/wiki.js'
import { ragRouter } from './routes/rag.js'
import { authRouter } from './routes/auth.js'
import { collaborationRouter } from './routes/collaboration.js'
import { publishRouter } from './routes/publish.js'
import { createCollaborationServer } from './services/websocketService.js'
import { sensitiveWordService } from './services/sensitiveWordService.js'

const app = express()
const PORT = process.env.PORT || 3000

const httpServer = createServer(app)

const collaborationServer = createCollaborationServer(httpServer)

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}))

app.use(express.json())
app.use(cookieParser())

app.use('/api/auth', authRouter)
app.use('/api/ai', aiRouter)
app.use('/api/ai-detect', aiDetectRouter)
app.use('/api/novels', novelRouter)
app.use('/api/wiki', wikiRouter)
app.use('/api/rag', ragRouter)
app.use('/api/collaboration', collaborationRouter)
app.use('/api/publish', publishRouter)

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    features: ['auth', 'ai', 'ai-detect', 'novels', 'wiki', 'rag', 'collaboration', 'publish'],
    websocket: 'enabled'
  })
})

app.get('/api/stats', (req, res) => {
  const activeRooms = collaborationServer.getActiveRooms()
  res.json({
    activeRooms: activeRooms.length,
    rooms: activeRooms.map(roomId => collaborationServer.getRoomStats(roomId))
  })
})

httpServer.listen(PORT, () => {
  console.log(`🚀 服务器运行在 http://localhost:${PORT}`)
  console.log(`📖 API文档: http://localhost:${PORT}/api/health`)
  console.log(`🔌 WebSocket: ws://localhost:${PORT}`)
})

export { collaborationServer }

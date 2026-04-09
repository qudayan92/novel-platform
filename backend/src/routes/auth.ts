import { Router, Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { Pool } from 'pg'

const router = Router()

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/novel_platform'
})

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'
const JWT_EXPIRES_IN = '15m'
const REFRESH_EXPIRES_IN = '7d'

interface User {
  id: string
  username: string
  password_hash: string
  display_name: string | null
  avatar_url: string | null
}

router.post('/register', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码不能为空' })
    }

    if (username.length < 3 || username.length > 50) {
      return res.status(400).json({ error: '用户名长度需要在3-50个字符之间' })
    }

    if (password.length < 6) {
      return res.status(400).json({ error: '密码长度至少为6个字符' })
    }

    const existingUser = await pool.query(
      'SELECT id FROM users WHERE username = $1',
      [username]
    )

    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: '用户名已存在' })
    }

    const passwordHash = await bcrypt.hash(password, 12)

    const result = await pool.query(
      `INSERT INTO users (username, password_hash, display_name)
       VALUES ($1, $2, $3)
       RETURNING id, username, display_name, avatar_url, created_at`,
      [username, passwordHash, username]
    )

    const user = result.rows[0]
    const { accessToken, refreshToken } = await generateTokens(user.id)

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    })

    res.status(201).json({
      user: {
        id: user.id,
        username: user.username,
        displayName: user.display_name,
        avatarUrl: user.avatar_url
      },
      accessToken
    })
  } catch (error) {
    console.error('注册错误:', error)
    res.status(500).json({ error: '服务器错误' })
  }
})

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码不能为空' })
    }

    const result = await pool.query(
      'SELECT id, username, password_hash, display_name, avatar_url FROM users WHERE username = $1',
      [username]
    )

    if (result.rows.length === 0) {
      return res.status(401).json({ error: '用户名或密码错误' })
    }

    const user: User = result.rows[0]

    const isValidPassword = await bcrypt.compare(password, user.password_hash)

    if (!isValidPassword) {
      return res.status(401).json({ error: '用户名或密码错误' })
    }

    const { accessToken, refreshToken } = await generateTokens(user.id)

    await pool.query(
      `INSERT INTO sessions (user_id, refresh_token_hash, user_agent, ip_address, expires_at)
       VALUES ($1, $2, $3, $4, NOW() + INTERVAL '7 days')`,
      [
        user.id,
        await bcrypt.hash(refreshToken, 10),
        req.headers['user-agent'] || '',
        req.ip || ''
      ]
    )

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    })

    res.json({
      user: {
        id: user.id,
        username: user.username,
        displayName: user.display_name,
        avatarUrl: user.avatar_url
      },
      accessToken
    })
  } catch (error) {
    console.error('登录错误:', error)
    res.status(500).json({ error: '服务器错误' })
  }
})

router.post('/logout', async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies?.refreshToken

    if (refreshToken) {
      const tokenHash = await bcrypt.hash(refreshToken, 10)
      await pool.query('DELETE FROM sessions WHERE refresh_token_hash = $1', [tokenHash])
    }

    res.clearCookie('refreshToken')
    res.json({ message: '已退出登录' })
  } catch (error) {
    console.error('退出登录错误:', error)
    res.status(500).json({ error: '服务器错误' })
  }
})

router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies?.refreshToken

    if (!refreshToken) {
      return res.status(401).json({ error: '未提供刷新令牌' })
    }

    let decoded: any
    try {
      decoded = jwt.verify(refreshToken, JWT_SECRET)
    } catch {
      return res.status(401).json({ error: '无效的刷新令牌' })
    }

    const sessions = await pool.query(
      'SELECT id FROM sessions WHERE user_id = $1',
      [decoded.userId]
    )

    if (sessions.rows.length === 0) {
      return res.status(401).json({ error: '会话已过期' })
    }

    const userResult = await pool.query(
      'SELECT id, username, display_name, avatar_url FROM users WHERE id = $1',
      [decoded.userId]
    )

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: '用户不存在' })
    }

    const user = userResult.rows[0]
    const accessToken = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })

    res.json({ accessToken })
  } catch (error) {
    console.error('刷新令牌错误:', error)
    res.status(500).json({ error: '服务器错误' })
  }
})

router.get('/me', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

    if (!token) {
      return res.status(401).json({ error: '未提供访问令牌' })
    }

    let decoded: any
    try {
      decoded = jwt.verify(token, JWT_SECRET)
    } catch {
      return res.status(401).json({ error: '无效的访问令牌' })
    }

    const result = await pool.query(
      'SELECT id, username, display_name, avatar_url, created_at FROM users WHERE id = $1',
      [decoded.userId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '用户不存在' })
    }

    const user = result.rows[0]
    res.json({
      id: user.id,
      username: user.username,
      displayName: user.display_name,
      avatarUrl: user.avatar_url,
      createdAt: user.created_at
    })
  } catch (error) {
    console.error('获取用户信息错误:', error)
    res.status(500).json({ error: '服务器错误' })
  }
})

async function generateTokens(userId: string): Promise<{ accessToken: string; refreshToken: string }> {
  const accessToken = jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
  const refreshToken = jwt.sign({ userId }, JWT_SECRET, { expiresIn: REFRESH_EXPIRES_IN })
  return { accessToken, refreshToken }
}

export { router as authRouter }

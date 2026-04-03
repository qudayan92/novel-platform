import { useState } from 'react'
import { authAPI } from '../api/auth'
import { useAuthStore } from '../stores/authStore'

type AuthMode = 'login' | 'register'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const login = useAuthStore((state) => state.login)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!username.trim()) {
      setError('请输入用户名')
      return
    }

    if (!password) {
      setError('请输入密码')
      return
    }

    if (mode === 'register' && password !== confirmPassword) {
      setError('两次输入的密码不一致')
      return
    }

    if (mode === 'register' && password.length < 6) {
      setError('密码长度至少为6个字符')
      return
    }

    setIsLoading(true)

    try {
      if (mode === 'login') {
        const result = await authAPI.login(username, password)
        login(result.user, result.accessToken)
      } else {
        const result = await authAPI.register(username, password)
        login(result.user, result.accessToken)
      }

      onClose()
      setUsername('')
      setPassword('')
      setConfirmPassword('')
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失败')
    } finally {
      setIsLoading(false)
    }
  }

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login')
    setError('')
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay show" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ margin: 0 }}>{mode === 'login' ? '🔐 登录' : '📝 注册'}</h2>
          <button className="toolbar-btn" onClick={onClose}>✕</button>
        </div>

        <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'var(--bg-tertiary)', padding: 4, borderRadius: 8 }}>
          <button
            style={{
              flex: 1,
              padding: '8px 16px',
              border: 'none',
              borderRadius: 6,
              background: mode === 'login' ? 'var(--bg-card)' : 'transparent',
              color: mode === 'login' ? 'var(--text-primary)' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontWeight: 500,
              transition: 'all 0.2s'
            }}
            onClick={() => setMode('login')}
          >
            登录
          </button>
          <button
            style={{
              flex: 1,
              padding: '8px 16px',
              border: 'none',
              borderRadius: 6,
              background: mode === 'register' ? 'var(--bg-card)' : 'transparent',
              color: mode === 'register' ? 'var(--text-primary)' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontWeight: 500,
              transition: 'all 0.2s'
            }}
            onClick={() => setMode('register')}
          >
            注册
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">用户名</label>
            <input
              type="text"
              className="form-input"
              placeholder="输入用户名"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">密码</label>
            <input
              type="password"
              className="form-input"
              placeholder="输入密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {mode === 'register' && (
            <div className="form-group">
              <label className="form-label">确认密码</label>
              <input
                type="password"
                className="form-input"
                placeholder="再次输入密码"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          )}

          {error && (
            <div style={{
              padding: '10px 14px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 8,
              color: '#ef4444',
              fontSize: 14,
              marginBottom: 16
            }}>
              {error}
            </div>
          )}

          <div className="modal-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={isLoading}
            >
              取消
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isLoading}
              style={{ opacity: isLoading ? 0.7 : 1 }}
            >
              {isLoading ? '处理中...' : (mode === 'login' ? '登录' : '注册')}
            </button>
          </div>
        </form>

        {mode === 'login' && (
          <p style={{
            textAlign: 'center',
            marginTop: 16,
            fontSize: 13,
            color: 'var(--text-muted)'
          }}>
            还没有账号？
            <button
              type="button"
              onClick={switchMode}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--accent-blue)',
                cursor: 'pointer',
                padding: '0 4px',
                fontSize: 13
              }}
            >
              立即注册
            </button>
          </p>
        )}
      </div>
    </div>
  )
}

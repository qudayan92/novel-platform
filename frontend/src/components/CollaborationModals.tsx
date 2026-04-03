import { useState, useEffect } from 'react'
import { collaborationAPI } from '@/api/collaboration'
import { useAuthStore } from '@/stores/authStore'

interface InviteModalProps {
  isOpen: boolean
  onClose: () => void
  roomId: string
  novelId: string
}

export function InviteModal({ isOpen, onClose, roomId, novelId }: InviteModalProps) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('co_writer')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [inviteLink, setInviteLink] = useState('')
  const [error, setError] = useState('')
  
  const accessToken = useAuthStore(state => state.accessToken)
  const [roles, setRoles] = useState<Array<{ name: string; permissions: string[] }>>([])

  useEffect(() => {
    collaborationAPI.getRoles().then(setRoles)
  }, [])

  const handleInvite = async () => {
    if (!accessToken) return
    
    setLoading(true)
    setError('')
    
    try {
      const result = await collaborationAPI.createInvitation({
        roomId,
        novelId,
        inviteeEmail: email || undefined,
        role,
        message: message || undefined
      }, accessToken)
      
      setInviteLink(result.inviteLink)
    } catch (err) {
      setError(err instanceof Error ? err.message : '邀请失败')
    } finally {
      setLoading(false)
    }
  }

  const copyLink = () => {
    navigator.clipboard.writeText(inviteLink)
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay show" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ margin: 0 }}>邀请协作者</h2>
          <button className="toolbar-btn" onClick={onClose}>✕</button>
        </div>

        {inviteLink ? (
          <div className="space-y-4">
            <div className="p-4 bg-[var(--bg-tertiary)] rounded-lg">
              <p className="text-sm text-[var(--text-secondary)] mb-2">邀请链接已生成：</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inviteLink}
                  readOnly
                  className="form-input flex-1"
                />
                <button className="btn-primary" onClick={copyLink}>
                  复制
                </button>
              </div>
            </div>
            <p className="text-xs text-[var(--text-muted)]">
              链接7天内有效，可发送给协作者加入
            </p>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setInviteLink('')}>
                生成新链接
              </button>
              <button className="btn-primary" onClick={onClose}>
                完成
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="form-group">
              <label className="form-label">邮箱（可选）</label>
              <input
                type="email"
                className="form-input"
                placeholder="输入协作者邮箱"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">角色</label>
              <select
                className="form-input"
                value={role}
                onChange={e => setRole(e.target.value)}
              >
                {roles.filter(r => r.name !== 'owner').map(r => (
                  <option key={r.name} value={r.name}>
                    {roleNames[r.name] || r.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">附带消息（可选）</label>
              <textarea
                className="form-input"
                placeholder="添加一条个人消息..."
                value={message}
                onChange={e => setMessage(e.target.value)}
                rows={3}
              />
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="modal-actions">
              <button className="btn-secondary" onClick={onClose}>取消</button>
              <button 
                className="btn-primary" 
                onClick={handleInvite}
                disabled={loading}
              >
                {loading ? '生成中...' : '生成邀请链接'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const roleNames: Record<string, string> = {
  owner: '主作者',
  co_writer: '协写',
  editor: '编辑',
  setting_manager: '设定管理',
  reviewer: '审阅者'
}

interface InvitationAcceptProps {
  token: string
  onAccepted: (roomId: string) => void
  onRejected: () => void
}

export function InvitationAccept({ token, onAccepted, onRejected }: InvitationAcceptProps) {
  const [invitation, setInvitation] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')
  
  const accessToken = useAuthStore(state => state.accessToken)

  useEffect(() => {
    collaborationAPI.getInvitation(token)
      .then(setInvitation)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [token])

  const handleAccept = async () => {
    if (!accessToken) {
      setError('请先登录')
      return
    }

    setProcessing(true)
    try {
      const result = await collaborationAPI.acceptInvitation(token, accessToken)
      onAccepted(result.roomId)
    } catch (err) {
      setError(err instanceof Error ? err.message : '接受邀请失败')
    } finally {
      setProcessing(false)
    }
  }

  const handleReject = async () => {
    try {
      await collaborationAPI.rejectInvitation(token)
      onRejected()
    } catch {
      onRejected()
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-[var(--text-secondary)]">加载中...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <div className="text-red-400 mb-4">{error}</div>
        <button className="btn-secondary" onClick={onRejected}>返回</button>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-md mx-auto">
      <h2 className="text-xl font-semibold mb-4">协作邀请</h2>
      
      <div className="p-4 bg-[var(--bg-tertiary)] rounded-lg mb-4">
        <div className="mb-2">
          <span className="text-[var(--text-muted)]">小说：</span>
          <span className="font-medium">{invitation?.novelTitle}</span>
        </div>
        <div className="mb-2">
          <span className="text-[var(--text-muted)]">房间：</span>
          <span>{invitation?.roomName}</span>
        </div>
        <div className="mb-2">
          <span className="text-[var(--text-muted)]">邀请人：</span>
          <span>{invitation?.inviterName}</span>
        </div>
        <div className="mb-2">
          <span className="text-[var(--text-muted)]">角色：</span>
          <span className="text-[var(--accent-blue)]">{roleNames[invitation?.role] || invitation?.role}</span>
        </div>
        {invitation?.message && (
          <div className="mt-3 pt-3 border-t border-[var(--border-color)]">
            <span className="text-[var(--text-muted)]">留言：</span>
            <p className="text-sm mt-1">{invitation.message}</p>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <button 
          className="btn-secondary flex-1" 
          onClick={handleReject}
          disabled={processing}
        >
          拒绝
        </button>
        <button 
          className="btn-primary flex-1" 
          onClick={handleAccept}
          disabled={processing}
        >
          {processing ? '处理中...' : '接受邀请'}
        </button>
      </div>
    </div>
  )
}

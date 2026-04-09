import { useEffect, useState, useCallback, useRef } from 'react'
import { useCollaborationStore } from '@/stores/collaborationStore'
import { useAuthStore } from '@/stores/authStore'

interface OnlineUser {
  id: string
  username: string
  displayName: string
  cursor: { position: number; selection?: { start: number; end: number } } | null
  color: string
}

interface UserCursorProps {
  userId: string
  username: string
  position: number
  selection?: { start: number; end: number }
  color: string
}

const USER_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#d946ef',
  '#ec4899', '#f43f5e'
]

export function useCollaboration(roomId: string | null, chapterId?: string) {
  const accessToken = useAuthStore(state => state.accessToken)
  const {
    isConnected,
    isConnecting,
    connectionError,
    currentRoom,
    users,
    locks,
    documentVersion,
    yourRole,
    yourPermissions,
    yourCredit,
    connect,
    disconnect,
    joinRoom,
    leaveRoom,
    sendOperation,
    updateCursor,
    acquireLock,
    releaseLock,
    requestAI,
    createSnapshot,
    getHistory,
    restoreVersion
  } = useCollaborationStore()

  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([])
  const colorMap = useRef<Map<string, string>>(new Map())

  useEffect(() => {
    if (roomId && accessToken) {
      connect(accessToken, roomId, chapterId)
    }

    return () => {
      disconnect()
    }
  }, [roomId, accessToken])

  useEffect(() => {
    const coloredUsers = users.map((user, index) => {
      if (!colorMap.current.has(user.id)) {
        colorMap.current.set(
          user.id, 
          USER_COLORS[index % USER_COLORS.length]
        )
      }
      return {
        ...user,
        color: colorMap.current.get(user.id)!
      }
    })
    setOnlineUsers(coloredUsers)
  }, [users])

  const canEdit = yourPermissions.includes('write_content')
  const canUseAI = yourPermissions.includes('ai_generate')
  const canInvite = yourPermissions.includes('invite')
  const canManage = yourPermissions.includes('manage_member')

  return {
    isConnected,
    isConnecting,
    connectionError,
    currentRoom,
    onlineUsers,
    locks,
    documentVersion,
    yourRole,
    yourPermissions,
    yourCredit,
    canEdit,
    canUseAI,
    canInvite,
    canManage,
    joinRoom,
    leaveRoom,
    sendOperation,
    updateCursor,
    acquireLock,
    releaseLock,
    requestAI,
    createSnapshot,
    getHistory,
    restoreVersion
  }
}

export function CollaborationUsers({ users }: { users: OnlineUser[] }) {
  if (users.length === 0) return null

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-tertiary)] rounded-lg">
      <span className="text-xs text-[var(--text-muted)]">
        在线 {users.length} 人
      </span>
      <div className="flex -space-x-2">
        {users.slice(0, 5).map(user => (
          <div
            key={user.id}
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium text-white ring-2 ring-[var(--bg-primary)]"
            style={{ backgroundColor: user.color }}
            title={user.displayName}
          >
            {user.displayName.charAt(0).toUpperCase()}
          </div>
        ))}
        {users.length > 5 && (
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium bg-[var(--bg-card)] text-[var(--text-secondary)] ring-2 ring-[var(--bg-primary)]">
            +{users.length - 5}
          </div>
        )}
      </div>
    </div>
  )
}

export function UserCursor({ userId, username, position, selection, color }: UserCursorProps) {
  return null
}

export function LockIndicator({ locks, paragraphId }: { locks: any[]; paragraphId: string }) {
  const lock = locks.find(l => l.paragraphId === paragraphId)
  
  if (!lock) return null

  return (
    <div className="absolute -left-8 top-0 flex items-center">
      <div 
        className="w-6 h-6 rounded-full flex items-center justify-center text-xs text-white"
        style={{ backgroundColor: lock.color || '#6b7280' }}
        title={`被 ${lock.lockedByName} 锁定`}
      >
        🔒
      </div>
    </div>
  )
}

export function CollaborativeEditor({ 
  roomId, 
  chapterId, 
  initialContent,
  onContentChange 
}: { 
  roomId: string
  chapterId: string
  initialContent: string
  onContentChange: (content: string) => void
}) {
  const {
    isConnected,
    onlineUsers,
    locks,
    documentVersion,
    canEdit,
    sendOperation,
    updateCursor,
    acquireLock,
    releaseLock
  } = useCollaboration(roomId, chapterId)

  const [content, setContent] = useState(initialContent)
  const [isLocked, setIsLocked] = useState(false)
  const editorRef = useRef<HTMLTextAreaElement>(null)

  const handleBeforeInput = useCallback(async (e: React.FormEvent<HTMLTextAreaElement>) => {
    if (!canEdit) {
      e.preventDefault()
      return
    }

    const selection = window.getSelection()
    if (!selection) return

    const paragraphId = `p-${selection.anchorOffset}`
    const result = await acquireLock(chapterId, paragraphId)
    
    if (!result.success) {
      e.preventDefault()
    } else {
      setIsLocked(true)
    }
  }, [canEdit, chapterId, acquireLock])

  const handleInput = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value
    const oldContent = content
    const changes = computeChanges(oldContent, newContent)

    if (changes) {
      sendOperation(chapterId, changes)
    }

    setContent(newContent)
    onContentChange(newContent)
  }, [content, chapterId, sendOperation, onContentChange])

  const handleSelectionChange = useCallback(() => {
    const selection = window.getSelection()
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0)
      updateCursor(range.startOffset, {
        start: range.startOffset,
        end: range.endOffset
      })
    }
  }, [updateCursor])

  const handleBlur = useCallback(() => {
    if (isLocked) {
      releaseLock(chapterId, 'current')
      setIsLocked(false)
    }
  }, [isLocked, chapterId, releaseLock])

  return (
    <div className="relative">
      <div className="absolute top-0 right-0 z-10">
        <CollaborationUsers users={onlineUsers} />
      </div>
      
      <div className="relative">
        <textarea
          ref={editorRef}
          value={content}
          onChange={handleInput}
          onMouseUp={handleSelectionChange}
          onKeyUp={handleSelectionChange}
          onBlur={handleBlur}
          disabled={!canEdit}
          className="w-full min-h-[500px] p-4 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] resize-none focus:outline-none focus:border-[var(--accent-blue)] disabled:opacity-50 disabled:cursor-not-allowed"
          placeholder={canEdit ? "开始写作..." : "您没有编辑权限"}
        />
      </div>

      {/* 用户光标显示 */}
      {onlineUsers
        .filter(u => u.cursor && !u.displayName.startsWith('You'))
        .map(user => (
          <UserCursor
            key={user.id}
            userId={user.id}
            username={user.displayName}
            position={user.cursor!.position}
            selection={user.cursor!.selection}
            color={user.color}
          />
        ))
      }
    </div>
  )
}

function computeChanges(oldContent: string, newContent: string): { type: 'insert' | 'delete' | 'replace'; position: number; content?: string; length?: number } | null {
  if (oldContent === newContent) return null

  const oldLen = oldContent.length
  const newLen = newContent.length

  if (newLen > oldLen) {
    let insertPos = 0
    while (insertPos < oldLen && oldContent[insertPos] === newContent[insertPos]) {
      insertPos++
    }
    
    const insertedContent = newContent.slice(insertPos, insertPos + (newLen - oldLen))
    
    return {
      type: 'insert',
      position: insertPos,
      content: insertedContent
    }
  } else {
    let deletePos = 0
    while (deletePos < newLen && oldContent[deletePos] === newContent[deletePos]) {
      deletePos++
    }
    
    return {
      type: 'delete',
      position: deletePos,
      length: oldLen - newLen
    }
  }
}

export function ConnectionStatus({ isConnected, isConnecting, error }: { 
  isConnected: boolean
  isConnecting: boolean
  error: string | null 
}) {
  if (error) {
    return (
      <div className="flex items-center gap-2 text-red-400">
        <div className="w-2 h-2 rounded-full bg-red-400" />
        <span className="text-xs">连接错误: {error}</span>
      </div>
    )
  }

  if (isConnecting) {
    return (
      <div className="flex items-center gap-2 text-yellow-400">
        <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
        <span className="text-xs">连接中...</span>
      </div>
    )
  }

  if (isConnected) {
    return (
      <div className="flex items-center gap-2 text-green-400">
        <div className="w-2 h-2 rounded-full bg-green-400" />
        <span className="text-xs">已连接</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 text-gray-400">
      <div className="w-2 h-2 rounded-full bg-gray-400" />
      <span className="text-xs">未连接</span>
    </div>
  )
}

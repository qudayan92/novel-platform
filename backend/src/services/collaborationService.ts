import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/novel_platform'
})

export interface Room {
  id: string
  novelId: string
  name: string
  type: 'chapter' | 'outline' | 'setting' | 'ai'
  createdBy: string
  maxMembers: number
  isActive: boolean
  createdAt: Date
}

export interface RoomMember {
  id: string
  roomId: string
  userId: string
  username: string
  role: 'owner' | 'co_writer' | 'editor' | 'setting_manager' | 'reviewer'
  permissions: string[]
  creditLimit: number
  creditUsed: number
  lastActiveAt: Date | null
  joinedAt: Date
}

export interface Permission {
  name: string
  description: string
}

export const PERMISSIONS = {
  READ: 'read',
  WRITE_CONTENT: 'write_content',
  WRITE_SETTING: 'write_setting',
  WRITE_OUTLINE: 'write_outline',
  AI_GENERATE: 'ai_generate',
  INVITE: 'invite',
  MANAGE_MEMBER: 'manage_member',
  DELETE_CONTENT: 'delete_content',
  PUBLISH: 'publish',
  ADMIN: 'admin'
} as const

export const ROLE_PERMISSIONS: Record<string, string[]> = {
  owner: [
    PERMISSIONS.ADMIN,
    PERMISSIONS.READ,
    PERMISSIONS.WRITE_CONTENT,
    PERMISSIONS.WRITE_SETTING,
    PERMISSIONS.WRITE_OUTLINE,
    PERMISSIONS.AI_GENERATE,
    PERMISSIONS.INVITE,
    PERMISSIONS.MANAGE_MEMBER,
    PERMISSIONS.DELETE_CONTENT,
    PERMISSIONS.PUBLISH
  ],
  co_writer: [
    PERMISSIONS.READ,
    PERMISSIONS.WRITE_CONTENT,
    PERMISSIONS.WRITE_OUTLINE,
    PERMISSIONS.AI_GENERATE
  ],
  editor: [
    PERMISSIONS.READ,
    PERMISSIONS.WRITE_CONTENT
  ],
  setting_manager: [
    PERMISSIONS.READ,
    PERMISSIONS.WRITE_SETTING,
    PERMISSIONS.WRITE_OUTLINE
  ],
  reviewer: [
    PERMISSIONS.READ
  ]
}

export class CollaborationService {
  async createRoom(data: {
    novelId: string
    name: string
    type: 'chapter' | 'outline' | 'setting' | 'ai'
    createdBy: string
  }): Promise<Room> {
    const result = await pool.query(
      `INSERT INTO collaboration_rooms (novel_id, name, type, created_by)
       VALUES ($1, $2, $3, $4)
       RETURNING id, novel_id, name, type, created_by, max_members, is_active, created_at`,
      [data.novelId, data.name, data.type, data.createdBy]
    )

    const room = result.rows[0]
    
    await this.addMember(room.id, data.createdBy, 'owner')
    
    return {
      id: room.id,
      novelId: room.novel_id,
      name: room.name,
      type: room.type,
      createdBy: room.created_by,
      maxMembers: room.max_members,
      isActive: room.is_active,
      createdAt: room.created_at
    }
  }

  async getRoom(roomId: string): Promise<Room | null> {
    const result = await pool.query(
      `SELECT id, novel_id, name, type, created_by, max_members, is_active, created_at
       FROM collaboration_rooms WHERE id = $1 AND is_active = true`,
      [roomId]
    )

    if (result.rows.length === 0) return null

    const room = result.rows[0]
    return {
      id: room.id,
      novelId: room.novel_id,
      name: room.name,
      type: room.type,
      createdBy: room.created_by,
      maxMembers: room.max_members,
      isActive: room.is_active,
      createdAt: room.created_at
    }
  }

  async getRoomsByNovel(novelId: string): Promise<Room[]> {
    const result = await pool.query(
      `SELECT id, novel_id, name, type, created_by, max_members, is_active, created_at
       FROM collaboration_rooms WHERE novel_id = $1 AND is_active = true
       ORDER BY created_at DESC`,
      [novelId]
    )

    return result.rows.map(room => ({
      id: room.id,
      novelId: room.novel_id,
      name: room.name,
      type: room.type,
      createdBy: room.created_by,
      maxMembers: room.max_members,
      isActive: room.is_active,
      createdAt: room.created_at
    }))
  }

  async addMember(
    roomId: string, 
    userId: string, 
    role: keyof typeof ROLE_PERMISSIONS,
    customPermissions?: string[]
  ): Promise<RoomMember> {
    const permissions = customPermissions || ROLE_PERMISSIONS[role] || []
    const creditLimit = role === 'owner' ? -1 : (role === 'co_writer' ? 50000 : 0)

    const result = await pool.query(
      `INSERT INTO room_members (room_id, user_id, role, permissions, credit_limit)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, room_id, user_id, role, permissions, credit_limit, credit_used, last_active_at, joined_at`,
      [roomId, userId, role, permissions, creditLimit]
    )

    const member = result.rows[0]
    
    const userResult = await pool.query(
      'SELECT username FROM users WHERE id = $1',
      [userId]
    )

    return {
      id: member.id,
      roomId: member.room_id,
      userId: member.user_id,
      username: userResult.rows[0]?.username || 'Unknown',
      role: member.role,
      permissions: member.permissions,
      creditLimit: member.credit_limit,
      creditUsed: member.credit_used,
      lastActiveAt: member.last_active_at,
      joinedAt: member.joined_at
    }
  }

  async getRoomMembers(roomId: string): Promise<RoomMember[]> {
    const result = await pool.query(
      `SELECT rm.id, rm.room_id, rm.user_id, u.username, rm.role, rm.permissions, 
              rm.credit_limit, rm.credit_used, rm.last_active_at, rm.joined_at
       FROM room_members rm
       JOIN users u ON rm.user_id = u.id
       WHERE rm.room_id = $1
       ORDER BY rm.joined_at ASC`,
      [roomId]
    )

    return result.rows.map(member => ({
      id: member.id,
      roomId: member.room_id,
      userId: member.user_id,
      username: member.username,
      role: member.role,
      permissions: member.permissions,
      creditLimit: member.credit_limit,
      creditUsed: member.credit_used,
      lastActiveAt: member.last_active_at,
      joinedAt: member.joined_at
    }))
  }

  async getMemberByUserAndRoom(roomId: string, userId: string): Promise<RoomMember | null> {
    const result = await pool.query(
      `SELECT rm.id, rm.room_id, rm.user_id, u.username, rm.role, rm.permissions,
              rm.credit_limit, rm.credit_used, rm.last_active_at, rm.joined_at
       FROM room_members rm
       JOIN users u ON rm.user_id = u.id
       WHERE rm.room_id = $1 AND rm.user_id = $2`,
      [roomId, userId]
    )

    if (result.rows.length === 0) return null

    const member = result.rows[0]
    return {
      id: member.id,
      roomId: member.room_id,
      userId: member.user_id,
      username: member.username,
      role: member.role,
      permissions: member.permissions,
      creditLimit: member.credit_limit,
      creditUsed: member.credit_used,
      lastActiveAt: member.last_active_at,
      joinedAt: member.joined_at
    }
  }

  async updateMemberRole(roomId: string, userId: string, newRole: string): Promise<void> {
    const permissions = ROLE_PERMISSIONS[newRole] || []
    const creditLimit = newRole === 'owner' ? -1 : (newRole === 'co_writer' ? 50000 : 0)

    await pool.query(
      `UPDATE room_members 
       SET role = $1, permissions = $2, credit_limit = $3
       WHERE room_id = $4 AND user_id = $5`,
      [newRole, permissions, creditLimit, roomId, userId]
    )
  }

  async removeMember(roomId: string, userId: string): Promise<void> {
    await pool.query(
      'DELETE FROM room_members WHERE room_id = $1 AND user_id = $2',
      [roomId, userId]
    )
  }

  async checkPermission(roomId: string, userId: string, permission: string): Promise<boolean> {
    const member = await this.getMemberByUserAndRoom(roomId, userId)
    if (!member) return false
    
    if (member.permissions.includes(PERMISSIONS.ADMIN)) return true
    return member.permissions.includes(permission)
  }

  async updateLastActive(roomId: string, userId: string): Promise<void> {
    await pool.query(
      `UPDATE room_members 
       SET last_active_at = CURRENT_TIMESTAMP 
       WHERE room_id = $1 AND user_id = $2`,
      [roomId, userId]
    )
  }

  async createInvitation(data: {
    roomId: string
    novelId: string
    inviterId: string
    inviteeEmail?: string
    inviteeUserId?: string
    role: string
    message?: string
  }): Promise<{ id: string; token: string }> {
    const crypto = await import('crypto')
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7天有效期

    const permissions = ROLE_PERMISSIONS[data.role] || []

    const result = await pool.query(
      `INSERT INTO collaboration_invitations 
       (room_id, novel_id, inviter_id, invitee_email, invitee_user_id, role, permissions, token, message, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id, token`,
      [
        data.roomId, data.novelId, data.inviterId, 
        data.inviteeEmail, data.inviteeUserId, data.role, 
        permissions, token, data.message, expiresAt
      ]
    )

    return {
      id: result.rows[0].id,
      token: result.rows[0].token
    }
  }

  async getInvitationByToken(token: string) {
    const result = await pool.query(
      `SELECT ci.*, cr.name as room_name, n.title as novel_title,
              u.username as inviter_name
       FROM collaboration_invitations ci
       JOIN collaboration_rooms cr ON ci.room_id = cr.id
       JOIN novels n ON ci.novel_id = n.id
       JOIN users u ON ci.inviter_id = u.id
       WHERE ci.token = $1 AND ci.status = 'pending' AND ci.expires_at > CURRENT_TIMESTAMP`,
      [token]
    )

    return result.rows.length > 0 ? result.rows[0] : null
  }

  async acceptInvitation(token: string, userId: string): Promise<RoomMember | null> {
    const invitation = await this.getInvitationByToken(token)
    if (!invitation) return null

    await pool.query(
      `UPDATE collaboration_invitations SET status = 'accepted' WHERE token = $1`,
      [token]
    )

    return this.addMember(invitation.room_id, userId, invitation.role, invitation.permissions)
  }

  async rejectInvitation(token: string): Promise<void> {
    await pool.query(
      `UPDATE collaboration_invitations SET status = 'rejected' WHERE token = $1`,
      [token]
    )
  }

  async logOperation(data: {
    roomId: string
    chapterId?: string
    userId: string
    operationType: 'insert' | 'delete' | 'replace'
    operationData: any
    positionStart?: number
    positionEnd?: number
    version: number
  }): Promise<void> {
    await pool.query(
      `INSERT INTO operation_logs 
       (room_id, chapter_id, user_id, operation_type, operation_data, position_start, position_end, version)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        data.roomId, data.chapterId, data.userId, 
        data.operationType, JSON.stringify(data.operationData),
        data.positionStart, data.positionEnd, data.version
      ]
    )
  }

  async getLatestVersion(chapterId: string): Promise<number> {
    const result = await pool.query(
      `SELECT MAX(version) as version FROM operation_logs WHERE chapter_id = $1`,
      [chapterId]
    )
    return result.rows[0]?.version || 0
  }

  async acquireLock(roomId: string, chapterId: string, paragraphId: string, userId: string): Promise<boolean> {
    const result = await pool.query(
      `INSERT INTO paragraph_locks (room_id, chapter_id, paragraph_id, locked_by)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (room_id, chapter_id, paragraph_id) 
       DO UPDATE SET locked_by = $4, locked_at = CURRENT_TIMESTAMP
       WHERE paragraph_locks.locked_by = $4 
          OR paragraph_locks.locked_at < CURRENT_TIMESTAMP - INTERVAL '1 minute'
       RETURNING id`,
      [roomId, chapterId, paragraphId, userId]
    )

    return result.rows.length > 0
  }

  async releaseLock(roomId: string, chapterId: string, paragraphId: string, userId: string): Promise<void> {
    await pool.query(
      `DELETE FROM paragraph_locks 
       WHERE room_id = $1 AND chapter_id = $2 AND paragraph_id = $3 AND locked_by = $4`,
      [roomId, chapterId, paragraphId, userId]
    )
  }

  async getLocks(roomId: string, chapterId?: string) {
    const query = chapterId
      ? `SELECT pl.*, u.username FROM paragraph_locks pl JOIN users u ON pl.locked_by = u.id 
         WHERE pl.room_id = $1 AND pl.chapter_id = $2`
      : `SELECT pl.*, u.username FROM paragraph_locks pl JOIN users u ON pl.locked_by = u.id 
         WHERE pl.room_id = $1`
    
    const params = chapterId ? [roomId, chapterId] : [roomId]
    const result = await pool.query(query, params)
    
    return result.rows.map(lock => ({
      paragraphId: lock.paragraph_id,
      lockedBy: lock.locked_by,
      lockedByName: lock.username,
      lockedAt: lock.locked_at,
      timeout: lock.timeout
    }))
  }

  async checkCreditLimit(roomId: string, userId: string, estimatedTokens: number): Promise<{ allowed: boolean; remaining: number }> {
    const member = await this.getMemberByUserAndRoom(roomId, userId)
    if (!member) return { allowed: false, remaining: 0 }

    if (member.creditLimit === -1) {
      return { allowed: true, remaining: -1 }
    }

    const remaining = member.creditLimit - member.creditUsed
    return {
      allowed: remaining >= estimatedTokens,
      remaining
    }
  }

  async useCredit(roomId: string, userId: string, tokens: number): Promise<void> {
    await pool.query(
      `UPDATE room_members SET credit_used = credit_used + $1 
       WHERE room_id = $2 AND user_id = $3`,
      [tokens, roomId, userId]
    )
  }

  async createSnapshot(chapterId: string, content: string, createdBy: string, description?: string): Promise<void> {
    const versionResult = await pool.query(
      `SELECT COALESCE(MAX(version), 0) + 1 as next_version FROM document_snapshots WHERE chapter_id = $1`,
      [chapterId]
    )
    const version = versionResult.rows[0].next_version

    await pool.query(
      `INSERT INTO document_snapshots (chapter_id, version, content, created_by, description)
       VALUES ($1, $2, $3, $4, $5)`,
      [chapterId, version, content, createdBy, description]
    )
  }

  async getSnapshots(chapterId: string, limit: number = 20) {
    const result = await pool.query(
      `SELECT ds.*, u.username 
       FROM document_snapshots ds 
       JOIN users u ON ds.created_by = u.id
       WHERE ds.chapter_id = $1 
       ORDER BY ds.version DESC 
       LIMIT $2`,
      [chapterId, limit]
    )

    return result.rows.map(snap => ({
      id: snap.id,
      version: snap.version,
      description: snap.description,
      createdBy: snap.username,
      createdAt: snap.created_at
    }))
  }

  async getSnapshotContent(chapterId: string, version: number): Promise<string | null> {
    const result = await pool.query(
      'SELECT content FROM document_snapshots WHERE chapter_id = $1 AND version = $2',
      [chapterId, version]
    )
    return result.rows.length > 0 ? result.rows[0].content : null
  }
}

export const collaborationService = new CollaborationService()

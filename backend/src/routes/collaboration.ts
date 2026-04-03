import { Router, Request, Response } from 'express'
import { collaborationService, ROLE_PERMISSIONS } from '../services/collaborationService.js'
import { authMiddleware, AuthRequest } from '../middleware/auth.js'
import crypto from 'crypto'

const router = Router()

router.use(authMiddleware)

router.post('/rooms', async (req: AuthRequest, res: Response) => {
  try {
    const { novelId, name, type } = req.body
    const userId = req.userId

    if (!novelId || !name) {
      return res.status(400).json({ error: '缺少必要参数' })
    }

    const validTypes = ['chapter', 'outline', 'setting', 'ai']
    if (type && !validTypes.includes(type)) {
      return res.status(400).json({ error: '无效的房间类型' })
    }

    const room = await collaborationService.createRoom({
      novelId,
      name,
      type: type || 'chapter',
      createdBy: userId!
    })

    res.status(201).json(room)
  } catch (error) {
    console.error('创建房间失败:', error)
    res.status(500).json({ error: '创建房间失败' })
  }
})

router.get('/rooms/novel/:novelId', async (req: AuthRequest, res: Response) => {
  try {
    const { novelId } = req.params
    const rooms = await collaborationService.getRoomsByNovel(novelId)
    res.json(rooms)
  } catch (error) {
    console.error('获取房间列表失败:', error)
    res.status(500).json({ error: '获取房间列表失败' })
  }
})

router.get('/rooms/:roomId', async (req: AuthRequest, res: Response) => {
  try {
    const { roomId } = req.params
    const userId = req.userId

    const member = await collaborationService.getMemberByUserAndRoom(roomId, userId!)
    if (!member) {
      return res.status(403).json({ error: '您不是该房间的成员' })
    }

    const room = await collaborationService.getRoom(roomId)
    if (!room) {
      return res.status(404).json({ error: '房间不存在' })
    }

    const members = await collaborationService.getRoomMembers(roomId)

    res.json({
      ...room,
      members,
      yourRole: member.role,
      yourPermissions: member.permissions
    })
  } catch (error) {
    console.error('获取房间详情失败:', error)
    res.status(500).json({ error: '获取房间详情失败' })
  }
})

router.get('/rooms/:roomId/members', async (req: AuthRequest, res: Response) => {
  try {
    const { roomId } = req.params
    const userId = req.userId

    const member = await collaborationService.getMemberByUserAndRoom(roomId, userId!)
    if (!member) {
      return res.status(403).json({ error: '您不是该房间的成员' })
    }

    const members = await collaborationService.getRoomMembers(roomId)
    res.json(members)
  } catch (error) {
    console.error('获取成员列表失败:', error)
    res.status(500).json({ error: '获取成员列表失败' })
  }
})

router.put('/rooms/:roomId/members/:memberId', async (req: AuthRequest, res: Response) => {
  try {
    const { roomId, memberId } = req.params
    const { role } = req.body
    const userId = req.userId

    const canManage = await collaborationService.checkPermission(roomId, userId!, 'manage_member')
    if (!canManage) {
      return res.status(403).json({ error: '没有管理成员的权限' })
    }

    if (!ROLE_PERMISSIONS[role]) {
      return res.status(400).json({ error: '无效的角色' })
    }

    await collaborationService.updateMemberRole(roomId, memberId, role)
    res.json({ message: '角色更新成功' })
  } catch (error) {
    console.error('更新成员角色失败:', error)
    res.status(500).json({ error: '更新成员角色失败' })
  }
})

router.delete('/rooms/:roomId/members/:memberId', async (req: AuthRequest, res: Response) => {
  try {
    const { roomId, memberId } = req.params
    const userId = req.userId

    const canManage = await collaborationService.checkPermission(roomId, userId!, 'manage_member')
    if (!canManage && memberId !== userId) {
      return res.status(403).json({ error: '没有移除成员的权限' })
    }

    await collaborationService.removeMember(roomId, memberId)
    res.json({ message: '成员已移除' })
  } catch (error) {
    console.error('移除成员失败:', error)
    res.status(500).json({ error: '移除成员失败' })
  }
})

router.post('/invitations', async (req: AuthRequest, res: Response) => {
  try {
    const { roomId, novelId, inviteeEmail, inviteeUserId, role, message } = req.body
    const userId = req.userId

    if (!roomId || !novelId || !role) {
      return res.status(400).json({ error: '缺少必要参数' })
    }

    if (!ROLE_PERMISSIONS[role]) {
      return res.status(400).json({ error: '无效的角色' })
    }

    const canInvite = await collaborationService.checkPermission(roomId, userId!, 'invite')
    if (!canInvite) {
      return res.status(403).json({ error: '没有邀请权限' })
    }

    const invitation = await collaborationService.createInvitation({
      roomId,
      novelId,
      inviterId: userId!,
      inviteeEmail,
      inviteeUserId,
      role,
      message
    })

    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173'
    const inviteLink = `${baseUrl}/invite/${invitation.token}`

    res.status(201).json({
      id: invitation.id,
      token: invitation.token,
      inviteLink
    })
  } catch (error) {
    console.error('创建邀请失败:', error)
    res.status(500).json({ error: '创建邀请失败' })
  }
})

router.get('/invitations/:token', async (req: Request, res: Response) => {
  try {
    const { token } = req.params

    const invitation = await collaborationService.getInvitationByToken(token)
    if (!invitation) {
      return res.status(404).json({ error: '邀请不存在或已过期' })
    }

    res.json({
      id: invitation.id,
      roomName: invitation.room_name,
      novelTitle: invitation.novel_title,
      inviterName: invitation.inviter_name,
      role: invitation.role,
      message: invitation.message,
      expiresAt: invitation.expires_at
    })
  } catch (error) {
    console.error('获取邀请信息失败:', error)
    res.status(500).json({ error: '获取邀请信息失败' })
  }
})

router.post('/invitations/:token/accept', async (req: AuthRequest, res: Response) => {
  try {
    const { token } = req.params
    const userId = req.userId

    const member = await collaborationService.acceptInvitation(token, userId!)
    if (!member) {
      return res.status(400).json({ error: '邀请不存在或已过期' })
    }

    res.json({
      message: '已接受邀请',
      roomId: member.roomId,
      role: member.role
    })
  } catch (error) {
    console.error('接受邀请失败:', error)
    res.status(500).json({ error: '接受邀请失败' })
  }
})

router.post('/invitations/:token/reject', async (req: Request, res: Response) => {
  try {
    const { token } = req.params

    await collaborationService.rejectInvitation(token)
    res.json({ message: '已拒绝邀请' })
  } catch (error) {
    console.error('拒绝邀请失败:', error)
    res.status(500).json({ error: '拒绝邀请失败' })
  }
})

router.get('/rooms/:roomId/locks', async (req: AuthRequest, res: Response) => {
  try {
    const { roomId } = req.params
    const { chapterId } = req.query
    const userId = req.userId

    const member = await collaborationService.getMemberByUserAndRoom(roomId, userId!)
    if (!member) {
      return res.status(403).json({ error: '您不是该房间的成员' })
    }

    const locks = await collaborationService.getLocks(roomId, chapterId as string)
    res.json(locks)
  } catch (error) {
    console.error('获取锁定信息失败:', error)
    res.status(500).json({ error: '获取锁定信息失败' })
  }
})

router.get('/rooms/:roomId/credit', async (req: AuthRequest, res: Response) => {
  try {
    const { roomId } = req.params
    const userId = req.userId

    const member = await collaborationService.getMemberByUserAndRoom(roomId, userId!)
    if (!member) {
      return res.status(403).json({ error: '您不是该房间的成员' })
    }

    res.json({
      limit: member.creditLimit,
      used: member.creditUsed,
      remaining: member.creditLimit === -1 ? -1 : member.creditLimit - member.creditUsed
    })
  } catch (error) {
    console.error('获取额度信息失败:', error)
    res.status(500).json({ error: '获取额度信息失败' })
  }
})

router.get('/chapters/:chapterId/history', async (req: AuthRequest, res: Response) => {
  try {
    const { chapterId } = req.params
    const { limit = 20 } = req.query

    const versions = await collaborationService.getSnapshots(chapterId, Number(limit))
    res.json(versions)
  } catch (error) {
    console.error('获取版本历史失败:', error)
    res.status(500).json({ error: '获取版本历史失败' })
  }
})

router.get('/chapters/:chapterId/history/:version', async (req: AuthRequest, res: Response) => {
  try {
    const { chapterId, version } = req.params

    const content = await collaborationService.getSnapshotContent(chapterId, Number(version))
    if (!content) {
      return res.status(404).json({ error: '版本不存在' })
    }

    res.json({ content, version: Number(version) })
  } catch (error) {
    console.error('获取版本内容失败:', error)
    res.status(500).json({ error: '获取版本内容失败' })
  }
})

router.post('/chapters/:chapterId/snapshot', async (req: AuthRequest, res: Response) => {
  try {
    const { chapterId } = req.params
    const { content, description } = req.body
    const userId = req.userId

    if (!content) {
      return res.status(400).json({ error: '缺少内容' })
    }

    await collaborationService.createSnapshot(chapterId, content, userId!, description)

    res.status(201).json({ message: '版本已保存' })
  } catch (error) {
    console.error('保存版本失败:', error)
    res.status(500).json({ error: '保存版本失败' })
  }
})

router.get('/roles', (req: Request, res: Response) => {
  const roles = Object.keys(ROLE_PERMISSIONS).map(role => ({
    name: role,
    permissions: ROLE_PERMISSIONS[role]
  }))
  res.json(roles)
})

export { router as collaborationRouter }

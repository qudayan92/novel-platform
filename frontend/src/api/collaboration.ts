const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000'

interface Room {
  id: string
  novelId: string
  name: string
  type: 'chapter' | 'outline' | 'setting' | 'ai'
  createdBy: string
  maxMembers: number
  isActive: boolean
  createdAt: Date
}

interface Member {
  id: string
  roomId: string
  userId: string
  username: string
  role: 'owner' | 'co_writer' | 'editor' | 'setting_manager' | 'reviewer'
  permissions: string[]
  creditLimit: number
  creditUsed: number
  joinedAt: Date
}

interface Invitation {
  id: string
  roomName: string
  novelTitle: string
  inviterName: string
  role: string
  message?: string
  expiresAt: Date
}

interface VersionSnapshot {
  id: string
  version: number
  description?: string
  createdBy: string
  createdAt: Date
}

class CollaborationAPI {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    token?: string
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers as Record<string, string>
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(`${API_BASE}/api/collaboration${endpoint}`, {
      ...options,
      headers,
      credentials: 'include'
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || '请求失败')
    }

    return data as T
  }

  async createRoom(
    novelId: string,
    name: string,
    type: 'chapter' | 'outline' | 'setting' | 'ai',
    token: string
  ): Promise<Room> {
    return this.request<Room>('/rooms', {
      method: 'POST',
      body: JSON.stringify({ novelId, name, type }),
    }, token)
  }

  async getRoomsByNovel(novelId: string, token: string): Promise<Room[]> {
    return this.request<Room[]>(`/rooms/novel/${novelId}`, {}, token)
  }

  async getRoom(roomId: string, token: string): Promise<Room & { members: Member[]; yourRole: string; yourPermissions: string[] }> {
    return this.request(`/rooms/${roomId}`, {}, token)
  }

  async getMembers(roomId: string, token: string): Promise<Member[]> {
    return this.request<Member[]>(`/rooms/${roomId}/members`, {}, token)
  }

  async updateMemberRole(
    roomId: string,
    memberId: string,
    role: string,
    token: string
  ): Promise<void> {
    await this.request(`/rooms/${roomId}/members/${memberId}`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    }, token)
  }

  async removeMember(roomId: string, memberId: string, token: string): Promise<void> {
    await this.request(`/rooms/${roomId}/members/${memberId}`, {
      method: 'DELETE',
    }, token)
  }

  async createInvitation(
    data: {
      roomId: string
      novelId: string
      inviteeEmail?: string
      inviteeUserId?: string
      role: string
      message?: string
    },
    token: string
  ): Promise<{ id: string; token: string; inviteLink: string }> {
    return this.request('/invitations', {
      method: 'POST',
      body: JSON.stringify(data),
    }, token)
  }

  async getInvitation(invitationToken: string): Promise<Invitation> {
    return this.request<Invitation>(`/invitations/${invitationToken}`)
  }

  async acceptInvitation(invitationToken: string, token: string): Promise<{ message: string; roomId: string; role: string }> {
    return this.request(`/invitations/${invitationToken}/accept`, {
      method: 'POST',
    }, token)
  }

  async rejectInvitation(invitationToken: string): Promise<void> {
    await this.request(`/invitations/${invitationToken}/reject`, {
      method: 'POST',
    })
  }

  async getLocks(roomId: string, chapterId: string, token: string): Promise<any[]> {
    return this.request(`/rooms/${roomId}/locks?chapterId=${chapterId}`, {}, token)
  }

  async getCredit(roomId: string, token: string): Promise<{ limit: number; used: number; remaining: number }> {
    return this.request(`/rooms/${roomId}/credit`, {}, token)
  }

  async getVersionHistory(chapterId: string, token: string, limit: number = 20): Promise<VersionSnapshot[]> {
    return this.request(`/chapters/${chapterId}/history?limit=${limit}`, {}, token)
  }

  async getVersionContent(chapterId: string, version: number, token: string): Promise<{ content: string; version: number }> {
    return this.request(`/chapters/${chapterId}/history/${version}`, {}, token)
  }

  async createSnapshot(
    chapterId: string,
    content: string,
    description: string | undefined,
    token: string
  ): Promise<void> {
    await this.request(`/chapters/${chapterId}/snapshot`, {
      method: 'POST',
      body: JSON.stringify({ content, description }),
    }, token)
  }

  async getRoles(): Promise<Array<{ name: string; permissions: string[] }>> {
    return this.request('/roles')
  }
}

export const collaborationAPI = new CollaborationAPI()

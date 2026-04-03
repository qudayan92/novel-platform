const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export interface Platform {
  id: string
  name: string
  displayName: string
  minWordCount: number
  chapterMinWords: number
  supportedCategories: string[]
  iconUrl?: string
}

export interface Submission {
  id: string
  novelId: string
  novelTitle?: string
  platformName: string
  platformDisplayName: string
  title: string
  authorName?: string
  category?: string
  tags?: string[]
  synopsis?: string
  coverUrl?: string
  status: 'draft' | 'pending' | 'reviewing' | 'published' | 'rejected'
  totalWords: number
  chapterCount: number
  submittedAt?: string
  publishedAt?: string
  platformUrl?: string
  platformNovelId?: string
  rejectReason?: string
  createdAt: string
}

export interface SensitiveCheckResult {
  totalWords: number
  sensitiveCount: number
  riskLevel: 'safe' | 'low' | 'medium' | 'high'
  matches: Array<{
    word: string
    category: string
    severity: string
    suggestion?: string
    positions: number[]
  }>
  canSubmit?: boolean
}

class PublishAPI {
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

    const response = await fetch(`${API_BASE}/api/publish${endpoint}`, {
      ...options,
      headers,
      credentials: 'include'
    })

    if (response.headers.get('content-type')?.includes('application/json')) {
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || '请求失败')
      }
      return data as T
    }

    if (!response.ok) {
      throw new Error('请求失败')
    }

    return {} as T
  }

  async getPlatforms(token: string): Promise<Platform[]> {
    return this.request<Platform[]>('/platforms', {}, token)
  }

  async createSubmission(
    data: {
      novelId: string
      platformId: string
      title: string
      authorName: string
      category?: string
      tags?: string[]
      synopsis?: string
      coverUrl?: string
      chapters?: Array<{
        id?: string
        title: string
        content: string
        wordCount?: number
        orderIndex?: number
      }>
    },
    token: string
  ): Promise<{ id: string; status: string; createdAt: string }> {
    return this.request('/submissions', {
      method: 'POST',
      body: JSON.stringify(data)
    }, token)
  }

  async getSubmissions(token: string): Promise<Submission[]> {
    return this.request<Submission[]>('/submissions', {}, token)
  }

  async getSubmission(submissionId: string, token: string): Promise<Submission & {
    chapters: Array<{ id: string; title: string; wordCount: number; status: string }>
    sensitiveCheck?: { riskLevel: string; sensitiveCount: number; matches: any[] }
  }> {
    return this.request(`/submissions/${submissionId}`, {}, token)
  }

  async submitToPlatform(submissionId: string, token: string): Promise<{ message: string; platformNovelId?: string }> {
    return this.request(`/submissions/${submissionId}/submit`, {
      method: 'POST'
    }, token)
  }

  async deleteSubmission(submissionId: string, token: string): Promise<void> {
    await this.request(`/submissions/${submissionId}`, {
      method: 'DELETE'
    }, token)
  }

  async checkSensitiveText(text: string, token?: string): Promise<SensitiveCheckResult> {
    return this.request('/check-sensitive', {
      method: 'POST',
      body: JSON.stringify({ text })
    }, token)
  }

  async checkSubmission(submissionId: string, token: string): Promise<SensitiveCheckResult & { submissionId: string }> {
    return this.request(`/check-submission/${submissionId}`, {
      method: 'POST'
    }, token)
  }

  async addChapters(submissionId: string, chapters: any[], token: string): Promise<void> {
    await this.request(`/submissions/${submissionId}/chapters`, {
      method: 'POST',
      body: JSON.stringify({ chapters })
    }, token)
  }

  async getStats(submissionId: string, token: string, days: number = 30): Promise<any[]> {
    return this.request(`/submissions/${submissionId}/stats?days=${days}`, {}, token)
  }

  exportNovel(novel: any, format: 'txt' | 'html' | 'markdown' | 'epub'): void {
    const form = document.createElement('form')
    form.method = 'POST'
    form.action = `${API_BASE}/api/publish/export`
    form.target = '_blank'

    const token = localStorage.getItem('auth_token')
    if (token) {
      const tokenInput = document.createElement('input')
      tokenInput.type = 'hidden'
      tokenInput.name = 'token'
      tokenInput.value = token
      form.appendChild(tokenInput)
    }

    const novelInput = document.createElement('input')
    novelInput.type = 'hidden'
    novelInput.name = 'novel'
    novelInput.value = JSON.stringify(novel)
    form.appendChild(novelInput)

    const formatInput = document.createElement('input')
    formatInput.type = 'hidden'
    formatInput.name = 'format'
    formatInput.value = format
    form.appendChild(formatInput)

    document.body.appendChild(form)
    form.submit()
    document.body.removeChild(form)
  }
}

export const publishAPI = new PublishAPI()

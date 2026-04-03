const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000'

interface LoginResponse {
  user: {
    id: string
    username: string
    displayName: string | null
    avatarUrl: string | null
  }
  accessToken: string
}

interface RegisterResponse extends LoginResponse {}

interface AuthError {
  error: string
}

class AuthAPI {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const response = await fetch(`${API_BASE}/api/auth${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      credentials: 'include'
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error((data as AuthError).error || '请求失败')
    }

    return data as T
  }

  async login(username: string, password: string): Promise<LoginResponse> {
    return this.request<LoginResponse>('/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    })
  }

  async register(username: string, password: string): Promise<RegisterResponse> {
    return this.request<RegisterResponse>('/register', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    })
  }

  async logout(): Promise<void> {
    await this.request('/logout', { method: 'POST' })
  }

  async refreshToken(): Promise<{ accessToken: string }> {
    return this.request<{ accessToken: string }>('/refresh', {
      method: 'POST'
    })
  }

  async getCurrentUser(token: string): Promise<LoginResponse['user']> {
    const response = await fetch(`${API_BASE}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`
      },
      credentials: 'include'
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error((data as AuthError).error || '获取用户信息失败')
    }

    return data as LoginResponse['user']
  }
}

export const authAPI = new AuthAPI()

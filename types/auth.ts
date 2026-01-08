export interface User {
  id: number
  email: string
  role: 'client' | 'deliverer' | 'dispatcher' | 'admin'
  first_name: string
  last_name: string
  phone?: string
  active: boolean
}

export interface LoginResponse {
  success: boolean
  data: {
    user: User
    token: string
  }
  message: string
  metadata: {
    login_time: string
    expires_in: number
  }
}

export interface LoginCredentials {
  email: string
  password: string
}
import apiClient from './api'
import type { LoginCredentials, LoginResponse, User } from '@/types/auth'

export const authService = {
  // Connexion utilisateur
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await apiClient.post('/api/auth/login', credentials)
    return response.data
  },

  // Déconnexion
  async logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  },

  // Vérifier si l'utilisateur est connecté
  isAuthenticated(): boolean {
    return !!localStorage.getItem('token')
  },

  // Récupérer l'utilisateur courant
  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('user')
    return userStr ? JSON.parse(userStr) : null
  },

  // Récupérer le token
  getToken(): string | null {
    return localStorage.getItem('token')
  },

  // Sauvegarder la session
  saveSession(token: string, user: User) {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
  }
}
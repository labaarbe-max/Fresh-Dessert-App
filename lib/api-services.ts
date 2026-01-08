import apiClient from './api'

// Types pour les données du dashboard
export interface DashboardStats {
  totalCommandes: number
  commandesAujourdhui: number
  livreursActifs: number
  tournesEnCours: number
  chiffreAffaires: number
  tempsMoyenLivraison: number
}

// Service pour récupérer les stats du dashboard
export const dashboardService = {
  // Récupérer les KPIs du dashboard
  async getStats(): Promise<DashboardStats> {
    const response = await apiClient.get('/api/stats/dashboard')
    return response.data.data
  },

  // Récupérer les commandes récentes
  async getRecentOrders(limit = 10) {
    const response = await apiClient.get('/api/orders', {
      params: { limit }
    })
    return response.data.data
  },

  // Récupérer les livreurs actifs
  async getActiveDeliverers() {
    const response = await apiClient.get('/api/deliverers', {
      params: { active_only: true }
    })
    return response.data.data
  }
}
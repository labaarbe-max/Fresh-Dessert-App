import axios from 'axios'

// Configuration du client API pour communiquer avec ton backend
const apiClient = axios.create({
  baseURL: process.env.NODE_ENV === 'production' 
    ? 'https://ton-domaine.com' 
    : 'http://localhost:3000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Intercepteur pour ajouter le token JWT
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default apiClient
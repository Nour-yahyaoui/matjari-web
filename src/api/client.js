// src/api/client.js
import axios from 'axios'

// ✅ HARDCODED API URL - PRIMARY SERVER ONLY
const API_URL = 'https://opalex1234.vercel.app'

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
})

// Add token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('pos_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('pos_token')
      localStorage.removeItem('pos_user')
      localStorage.removeItem('pos_permissions')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// ✅ ALWAYS RETURN PRIMARY - NO HEALTH CHECK
export const checkServerHealth = async () => {
  return 'primary'
}

export const getActiveServer = () => {
  return 'primary'
}

export default api
// src/contexts/AuthContext.jsx
import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { login as loginApi } from '../api/endpoints'

const AuthContext = createContext(null)
const API_URL = 'https://opalex1234.vercel.app'

const calculateDaysLeft = (expiresAt) => {
  if (!expiresAt) return 0
  try {
    const expiry = new Date(expiresAt)
    const now = new Date()
    const diff = expiry.getTime() - now.getTime()
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
  } catch {
    return 0
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('pos_user')
    return raw ? JSON.parse(raw) : null
  })
  const [token, setToken] = useState(() => localStorage.getItem('pos_token'))
  const [permissions, setPermissions] = useState(() => {
    const raw = localStorage.getItem('pos_permissions')
    return raw ? JSON.parse(raw) : {}
  })
  const [serverStatus, setServerStatus] = useState('primary')
  const [initializing, setInitializing] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    setServerStatus('primary')
    setInitializing(false)
  }, [])

  const login = useCallback(async (credentials) => {
    const data = await loginApi(credentials)
    const { token: newToken, user: newUser } = data

    const expiresAt = newUser.expiresAt || newUser.expires_at
    const daysLeft = calculateDaysLeft(expiresAt)
    const planType = newUser.planType || newUser.plan_type || 'basic'

    const isBasic = planType === 'basic' || planType === 'trial'
    const isMedium = planType === 'medium'
    const isAdvanced = planType === 'premium' || planType === 'pro' || planType === 'enterprise'

    const planPermissions = {
      canManageEmployees: !isBasic,
      canManageDebts: !isBasic,
      canManageStores: isAdvanced,
      canManageClients: isAdvanced,
      canViewClients: isAdvanced,
      canViewGlobalDashboard: isAdvanced,
      canViewFinancials: isAdvanced,
      canExportReports: isAdvanced,
      canViewAnalytics: isAdvanced,
      planName: planType,
      planExpiry: expiresAt,
      daysLeft: daysLeft,
      isExpired: daysLeft <= 0,
      role: newUser.type || 'manager',
    }

    const userToStore = {
      id: newUser.id,
      fullName: newUser.fullName || newUser.full_name || newUser.name,
      name: newUser.name || newUser.fullName || newUser.full_name,
      phone: newUser.phone || newUser.Phone,
      email: newUser.email || newUser.Email,
      type: newUser.type || newUser.userType || 'manager',
      role: newUser.role || newUser.type || 'manager',
      storeId: newUser.storeId || newUser.store_id,
      storeName: newUser.storeName || newUser.store_name,
      storeCode: newUser.storeCode || newUser.store_code,
      planType: newUser.planType || newUser.plan_type || planType,
      expiresAt: expiresAt,
      expires_at: expiresAt,
      daysLeft: daysLeft,
      isExpired: daysLeft <= 0,
      isActive: newUser.isActive !== undefined ? newUser.isActive : true,
      ...newUser,
    }

    localStorage.setItem('pos_token', newToken)
    localStorage.setItem('pos_user', JSON.stringify(userToStore))
    localStorage.setItem('pos_permissions', JSON.stringify(planPermissions))

    setToken(newToken)
    setUser(userToStore)
    setPermissions(planPermissions)

    toast.success(`مرحباً ${userToStore.fullName || userToStore.name || 'مدير'}`)
    navigate('/dashboard')
    return data
  }, [navigate])

  const logout = useCallback(async () => {
    console.log('🚪 Logging out...')
    
    try {
      const token = localStorage.getItem('pos_token')
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        }).catch(() => {})
      }
    } catch (e) {
      // Ignore server logout errors
    }
    
    localStorage.removeItem('pos_token')
    localStorage.removeItem('pos_user')
    localStorage.removeItem('pos_permissions')
    
    setToken(null)
    setUser(null)
    setPermissions({})
    
    navigate('/login')
    toast.success('تم تسجيل الخروج بنجاح')
  }, [navigate])

  const refreshUserData = useCallback(async () => {
    try {
      const token = localStorage.getItem('pos_token')
      if (!token) return false

      const response = await fetch(`${API_URL}/api/auth/validate-session`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      const data = await response.json()
      
      if (data.success && data.user) {
        const expiresAt = data.user.expiresAt || data.user.expires_at
        const daysLeft = calculateDaysLeft(expiresAt)
        const planType = data.user.planType || data.user.plan_type || 'basic'

        const updatedUser = {
          ...user,
          ...data.user,
          planType: planType,
          expiresAt: expiresAt,
          daysLeft: daysLeft,
          isExpired: daysLeft <= 0,
        }
        
        localStorage.setItem('pos_user', JSON.stringify(updatedUser))
        setUser(updatedUser)
        
        const isBasic = planType === 'basic' || planType === 'trial'
        const isMedium = planType === 'medium'
        const isAdvanced = planType === 'premium' || planType === 'pro' || planType === 'enterprise'

        const newPermissions = {
          ...permissions,
          planExpiry: expiresAt,
          daysLeft: daysLeft,
          planName: planType,
          isExpired: daysLeft <= 0,
          canManageEmployees: !isBasic,
          canManageDebts: !isBasic,
          canManageStores: isAdvanced,
          canManageClients: isAdvanced,
          canViewClients: isAdvanced,
          canViewGlobalDashboard: isAdvanced,
          canViewFinancials: isAdvanced,
          canExportReports: isAdvanced,
          canViewAnalytics: isAdvanced,
        }
        localStorage.setItem('pos_permissions', JSON.stringify(newPermissions))
        setPermissions(newPermissions)
        
        return true
      }
      return false
    } catch (error) {
      console.error('Failed to refresh user data:', error)
      return false
    }
  }, [user, permissions])

  const updateUserToken = useCallback((newToken, updatedUser) => {
    localStorage.setItem('pos_token', newToken)
    setToken(newToken)
    if (updatedUser) {
      const expiresAt = updatedUser.expiresAt || updatedUser.expires_at
      const daysLeft = calculateDaysLeft(expiresAt)
      const userToStore = {
        ...updatedUser,
        daysLeft: daysLeft,
        isExpired: daysLeft <= 0,
      }
      localStorage.setItem('pos_user', JSON.stringify(userToStore))
      setUser(userToStore)
      
      const newPermissions = {
        ...permissions,
        planExpiry: expiresAt,
        daysLeft: daysLeft,
        isExpired: daysLeft <= 0,
      }
      localStorage.setItem('pos_permissions', JSON.stringify(newPermissions))
      setPermissions(newPermissions)
    }
  }, [permissions])

  const value = {
    user,
    token,
    permissions,
    isAuthenticated: !!token && !!user,
    serverStatus,
    initializing,
    login,
    logout,
    refreshUserData,
    updateUserToken,
    isManager: user?.type === 'manager' || user?.type === 'admin',
    isEmployee: user?.type === 'employee',
    isClient: user?.type === 'client',
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
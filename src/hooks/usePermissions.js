import { useAuth } from '../contexts/AuthContext'

export function usePermissions() {
  const { permissions, user } = useAuth()

  const can = (key) => Boolean(permissions?.[key])
  const role = user?.type || null
  const isManager = role === 'manager'
  const isEmployee = role === 'employee'

  return {
    permissions,
    can,
    role,
    isManager,
    isEmployee,
    canManageEmployees: can('canManageEmployees'),
    canViewGlobalDashboard: can('canViewGlobalDashboard'),
    canManageDebts: can('canManageDebts'),
    canManageStores: can('canManageStores'),
    canViewFinancials: can('canViewFinancials'),
    canExportReports: can('canExportReports'),
    planName: permissions?.planName || 'basic',
    planExpiry: permissions?.planExpiry,
    daysLeft: permissions?.daysLeft || 0,
  }
}
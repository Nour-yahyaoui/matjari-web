// src/hooks/usePlanBlocker.js
import { useAuth } from '../contexts/AuthContext'
import { usePermissions } from './usePermissions'

export function usePlanBlocker() {
  const { user } = useAuth()
  const { planName } = usePermissions()

  const planType = planName || user?.planType || 'basic'
  const isBasic = planType === 'basic' || planType === 'trial'

  const showUpgradeModal = (feature) => {
    const features = {
      employees: 'إدارة الموظفين',
      debts: 'إدارة الديون',
      financials: 'التقارير المالية',
      stores: 'المتاجر المتعددة',
      clients: 'إدارة العملاء',
      reports: 'التقارير المتقدمة',
    }

    const featureName = features[feature] || 'هذه الميزة'

    return {
      title: '🚫 ميزة غير متاحة',
      message: `ميزة "${featureName}" غير متاحة في خطتك الحالية (أساسي)`,
      details: 'قم بالترقية إلى خطة متوسطة أو مميزة للوصول إلى هذه الميزة وجميع الميزات المتقدمة.',
      confirmText: 'ترقية الخطة',
      cancelText: 'رجوع',
    }
  }

  const blockAction = (feature) => {
    if (isBasic) {
      return showUpgradeModal(feature)
    }
    return null
  }

  const canAccess = (feature) => {
    if (isBasic) {
      // Basic plan can only access: dashboard, products, stock, sales, orders
      const allowed = ['dashboard', 'products', 'stock', 'sales', 'orders', 'settings']
      return allowed.includes(feature)
    }
    return true
  }

  return {
    isBasic,
    planType,
    blockAction,
    canAccess,
    showUpgradeModal,
  }
}
// src/components/Layout/Sidebar.jsx
import { NavLink } from 'react-router-dom'
import { usePermissions } from '../../hooks/usePermissions'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import { useQuery } from '@tanstack/react-query'
import { getDashboardStats } from '../../api/endpoints'

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

export default function Sidebar({ open, onClose }) {
  const { user, permissions, logout } = useAuth()
  const { isManager, isEmployee, isClient } = usePermissions()
  const { theme, toggleTheme } = useTheme()

  const { data: dashboardData } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: getDashboardStats,
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  })

  const planType = dashboardData?.planType || permissions?.planName || user?.planType || 'basic'
  const expiresAt = dashboardData?.expiresAt || user?.expiresAt || user?.expires_at || permissions?.planExpiry

  const isEmployeeRole = isEmployee || user?.type === 'employee'
  const isManagerRole = isManager || user?.type === 'manager'
  const isBasicPlan = planType === 'basic' || planType === 'trial'
  const isMediumPlan = planType === 'medium'
  const isAdvancedPlan = planType === 'premium' || planType === 'pro' || planType === 'enterprise'

  const NAV_ITEMS = [
    { to: '/dashboard', icon: 'fa-house', label: 'لوحة التحكم' },
    { to: '/products', icon: 'fa-laptop', label: 'المنتجات' },
    { to: '/stock', icon: 'fa-boxes-stacked', label: 'المخزون' },
    { to: '/sales', icon: 'fa-cart-shopping', label: 'المبيعات' },
    { to: '/orders', icon: 'fa-clipboard-list', label: 'الطلبات' },
  ]

  if (isManagerRole && !isBasicPlan) {
    NAV_ITEMS.push({ to: '/debts', icon: 'fa-hand-holding-dollar', label: 'الديون' })
  }

  if (isManagerRole && isMediumPlan) {
    NAV_ITEMS.push({ to: '/employees', icon: 'fa-user-group', label: 'الموظفون' })
  }

  if (isManagerRole && isAdvancedPlan) {
    NAV_ITEMS.push({ to: '/employees', icon: 'fa-user-group', label: 'الموظفون' })
    NAV_ITEMS.push({ to: '/financials', icon: 'fa-file-invoice', label: 'التقارير المالية' })
    NAV_ITEMS.push({ to: '/stores', icon: 'fa-store', label: 'المتاجر' })
  }

  const getInitials = () => {
    const name = user?.fullName || user?.name || 'U'
    return name.charAt(0).toUpperCase()
  }

  const handleLogout = (e) => {
    e.preventDefault()
    e.stopPropagation()
    logout()
  }

  const storeName = user?.storeName || user?.store_name || 'المتجر'

  const planNames = {
    trial: 'تجريبي',
    basic: 'أساسي',
    medium: 'متوسط',
    premium: 'مميز',
    pro: 'احترافي',
    enterprise: 'مؤسسي'
  }
  const planLabel = planNames[planType] || planType

  const daysLeft = calculateDaysLeft(expiresAt)

  const getRoleLabel = () => {
    if (isEmployeeRole) return 'موظف'
    if (isManagerRole) return 'مدير'
    if (isClient) return 'عميل'
    return 'مستخدم'
  }

  return (
    <aside
      className={`fixed lg:relative inset-y-0 left-0 z-40 w-[280px] bg-[#0f172a] dark:bg-[#0f172a] flex flex-col flex-shrink-0 transform transition-transform duration-300 ease-in-out h-full overflow-hidden ${
        open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}
    >
      <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-700/50 flex-shrink-0">
        <div className="w-10 h-10 bg-[#445b7a] rounded-xl flex items-center justify-center text-white shadow-lg shadow-[#445b7a]/20">
          <i className="fa-solid fa-store text-lg" />
        </div>
        <div>
          <h1 className="text-base font-bold text-white tracking-tight">{storeName}</h1>
          <p className="text-[10px] text-slate-400">{getRoleLabel()}</p>
        </div>
      </div>

      <div className="px-4 py-3 bg-slate-800/50 border-b border-slate-700/50 flex-shrink-0">
        <div className="flex justify-between items-center text-[11px]">
          <span className="text-slate-400">الخطة:</span>
          <span className="font-medium text-emerald-400">{planLabel}</span>
        </div>
        <div className="flex justify-between items-center text-[11px] mt-0.5">
          <span className="text-slate-400">متبقي:</span>
          <span className={`font-medium ${daysLeft <= 7 ? 'text-rose-400' : 'text-slate-300'}`}>
            {daysLeft} يوم
          </span>
        </div>
        {expiresAt && (
          <div className="flex justify-between items-center text-[10px] mt-0.5 text-slate-500">
            <span>تنتهي:</span>
            <span>{new Date(expiresAt).toLocaleDateString('ar-TN')}</span>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto no-scrollbar py-4 px-3">
        <div className="pb-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider px-2 mb-1">
          القائمة الرئيسية
        </div>
        
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={() => {
              if (window.innerWidth < 1024) onClose?.()
            }}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 transition-all duration-200 text-sm font-medium ${
                isActive
                  ? 'bg-[#1e293b] text-white shadow-sm'
                  : 'text-slate-400 hover:bg-[#1e293b] hover:text-slate-200'
              }`
            }
          >
            <i className={`fa-solid ${item.icon} text-base w-5 text-center`} />
            <span className="flex-1">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-slate-700/50 p-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 text-sm font-bold">
            {getInitials()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {user?.fullName || user?.name || 'مستخدم'}
            </p>
            <p className="text-[10px] text-slate-400">
              {getRoleLabel()} • {planLabel}
            </p>
          </div>
          <button
            onClick={toggleTheme}
            className="text-slate-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-slate-700/50"
            title={theme === 'dark' ? 'الوضع النهاري' : 'الوضع الليلي'}
          >
            <i className={`fa-solid ${theme === 'dark' ? 'fa-sun' : 'fa-moon'} text-sm`} />
          </button>
          <button
            onClick={handleLogout}
            className="text-slate-500 hover:text-rose-400 transition-colors p-2 rounded-lg hover:bg-slate-700/50"
            title="تسجيل الخروج"
          >
            <i className="fa-solid fa-right-from-bracket text-sm" />
          </button>
        </div>
      </div>

      <button
        onClick={onClose}
        className="lg:hidden absolute top-3 right-3 text-slate-400 hover:text-white p-1"
      >
        <i className="fa-solid fa-xmark text-xl" />
      </button>
    </aside>
  )
}
// src/pages/Dashboard.jsx
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import toast from 'react-hot-toast'
import { getDashboardStats, getGlobalDashboard } from '../api/endpoints'
import { KpiCard } from '../components/UI/Card'
import Card from '../components/UI/Card'
import Button from '../components/UI/Button'
import { usePermissions } from '../hooks/usePermissions'
import { useAuth } from '../contexts/AuthContext'

const toNumber = (val) => {
  if (val === null || val === undefined) return 0
  if (typeof val === 'string') {
    const parsed = parseFloat(val)
    return isNaN(parsed) ? 0 : parsed
  }
  if (typeof val === 'number') return val
  return 0
}

const formatCurrency = (val) => {
  const num = toNumber(val)
  return num.toFixed(3)
}

const QUICK_ACTIONS = [
  { key: 'sale', label: 'عملية بيع', icon: 'fa-cart-plus', variant: 'primary', to: '/sales' },
  { key: 'stock', label: 'إضافة مخزون', icon: 'fa-boxes-stacked', variant: 'success', to: '/stock' },
  { key: 'order', label: 'طلب يدوي', icon: 'fa-pen', variant: 'warning', to: '/orders' },
  { key: 'damage', label: 'تسجيل تلف', icon: 'fa-bolt', variant: 'danger', to: '/stock' },
  { key: 'debt', label: 'سداد دين', icon: 'fa-hand-holding-dollar', variant: 'ghost', to: '/debts', permission: 'canManageDebts' },
  { key: 'financials', label: 'التقارير المالية', icon: 'fa-file-invoice', variant: 'outline', to: '/financials', permission: 'canViewFinancials' },
]

export default function Dashboard() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { can, isManager } = usePermissions()
  const { user, refreshUserData } = useAuth()

  const { data: statsData, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const result = await getDashboardStats()
      if (result?.token) {
        // Token refresh handled elsewhere
      }
      return result
    },
    refetchOnWindowFocus: true,
    staleTime: 0,
    retry: 1,
    gcTime: 0,
  })

  const { data: globalStats, refetch: refetchGlobal } = useQuery({
    queryKey: ['dashboard-global'],
    queryFn: () => getGlobalDashboard(),
    enabled: isManager && can('canViewGlobalDashboard'),
    refetchOnWindowFocus: true,
    staleTime: 0,
    gcTime: 0,
  })

  useEffect(() => {
    const refresh = async () => {
      await queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      await refreshUserData()
    }
    refresh()
  }, [])

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
        refreshUserData()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  const handleHardRefresh = async () => {
    toast.loading('جاري تحديث البيانات...')
    
    await queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
    await queryClient.invalidateQueries({ queryKey: ['dashboard-global'] })
    await refreshUserData()
    await refetch()
    
    if (isManager && can('canViewGlobalDashboard')) {
      await refetchGlobal()
    }
    
    toast.dismiss()
    toast.success('✅ تم تحديث البيانات بنجاح')
  }

  const rawStats = statsData?.stats || {}
  const permissions = statsData?.permissions || {}
  const planType = statsData?.planType || permissions?.planName || user?.planType || 'basic'
  const expiresAt = statsData?.expiresAt || permissions?.planExpiry || user?.expiresAt
  const daysLeft = statsData?.daysLeft ?? permissions?.daysLeft ?? user?.daysLeft ?? 0
  const isExpired = statsData?.isExpired ?? permissions?.isExpired ?? user?.isExpired ?? false

  const s = {
    todayRevenue: toNumber(rawStats.today_revenue),
    todayProfit: toNumber(rawStats.today_profit),
    todaySales: toNumber(rawStats.today_sales),
    pendingOrders: toNumber(rawStats.pending_orders),
    totalDebts: toNumber(rawStats.total_debts),
    activeProducts: toNumber(rawStats.products_count),
    activeEmployees: toNumber(rawStats.employees_count),
    todayLosses: toNumber(rawStats.today_losses_cost),
    todayNetProfit: toNumber(rawStats.today_net_profit),
    todayGrossProfit: toNumber(rawStats.today_gross_profit),
    totalSalaries: toNumber(rawStats.total_salaries),
    todayLossesCount: toNumber(rawStats.today_losses),
    planType: planType,
    expiresAt: expiresAt,
    daysLeft: daysLeft,
    isExpired: isExpired,
    storeName: statsData?.storeName || user?.storeName || user?.store_name || '',
    permissions: permissions,
  }

  const visibleActions = QUICK_ACTIONS.filter((a) => !a.permission || can(a.permission))

  const planNameMap = {
    trial: 'تجريبي',
    basic: 'أساسي',
    medium: 'متوسط',
    premium: 'مميز',
    pro: 'احترافي',
    enterprise: 'مؤسسي'
  }
  const planName = planNameMap[s.planType] || s.planType

  return (
    <>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">لوحة التحكم</h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
            {s.storeName || 'المتجر الخاص بك'}
            {s.planType && (
              <span className="mr-2 text-xs text-gray-400">
                • خطة {planName}
                {s.isExpired && <span className="text-rose-500 mr-1">(منتهية)</span>}
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            icon="fa-solid fa-rotate-right" 
            onClick={handleHardRefresh} 
            loading={isFetching}
          >
            تحديث البيانات
          </Button>
        </div>
      </div>

      {s.isExpired && (
        <Card className="p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-rose-600 dark:text-rose-400">
                ⚠️ اشتراكك منتهي
              </p>
              <p className="text-xs text-rose-500 dark:text-rose-300">
                انتهت صلاحية اشتراكك في {new Date(s.expiresAt).toLocaleDateString('ar-TN')}
              </p>
            </div>
            <Button variant="warning" onClick={() => navigate('/renew')}>
              تجديد الاشتراك
            </Button>
          </div>
        </Card>
      )}

      {!s.isExpired && s.expiresAt && (
        <Card className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-gradient-to-l from-amber-50 to-white dark:from-amber-900/20 dark:to-gray-800 border border-amber-200 dark:border-amber-800/30">
          <div className="text-sm text-gray-700 dark:text-gray-200">
            <span>خطتك <span className="font-bold">{planName}</span> تنتهي في {new Date(s.expiresAt).toLocaleDateString('ar-TN')}</span>
            {s.daysLeft > 0 ? (
              <span className="mr-2">— متبقي <span className={`font-bold ${s.daysLeft <= 7 ? 'text-rose-500' : 'text-amber-600'}`}>{s.daysLeft}</span> يومًا</span>
            ) : (
              <span className="mr-2 font-bold text-rose-500">— منتهية</span>
            )}
          </div>
          <Button variant="warning" onClick={() => navigate('/renew')}>
            تجديد الخطة
          </Button>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          label="إيرادات اليوم"
          value={`${formatCurrency(s.todayRevenue)} د.ت`}
          trend={s.todaySales > 0 ? `🔹 ${s.todaySales} مبيعات` : null}
          icon="fa-solid fa-money-bill-wave"
          iconBg="bg-blue-50 dark:bg-blue-900/20"
          iconColor="text-blue-600 dark:text-blue-400"
        />
        <KpiCard
          label="صافي ربح اليوم"
          value={`${formatCurrency(s.todayNetProfit)} د.ت`}
          trend={s.todayNetProfit > 0 ? '▲ ربح' : s.todayNetProfit < 0 ? '▼ خسارة' : null}
          trendColor={s.todayNetProfit > 0 ? 'text-emerald-500' : 'text-rose-500'}
          icon="fa-solid fa-circle-dollar"
          iconBg="bg-emerald-50 dark:bg-emerald-900/20"
          iconColor="text-emerald-600 dark:text-emerald-400"
        />
        <KpiCard
          label="الطلبات المعلقة"
          value={s.pendingOrders}
          trend={s.pendingOrders > 0 ? '⏳ قيد المعالجة' : '✅ لا توجد طلبات'}
          trendColor={s.pendingOrders > 0 ? 'text-amber-500' : 'text-emerald-500'}
          icon="fa-solid fa-truck-fast"
          iconBg="bg-amber-50 dark:bg-amber-900/20"
          iconColor="text-amber-600 dark:text-amber-400"
        />
        <KpiCard
          label="الديون المستحقة"
          value={`${formatCurrency(s.totalDebts)} د.ت`}
          trend={s.totalDebts > 0 ? 'غير مدفوع' : 'مدفوع بالكامل'}
          trendColor={s.totalDebts > 0 ? 'text-rose-500' : 'text-emerald-500'}
          icon="fa-solid fa-file-invoice-dollar"
          iconBg="bg-rose-50 dark:bg-rose-900/20"
          iconColor="text-rose-600 dark:text-rose-400"
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <SecondaryStat label="المنتجات النشطة" value={s.activeProducts} icon="fa-box" color="text-indigo-400" />
        <SecondaryStat label="الموظفون النشطون" value={s.activeEmployees} icon="fa-user-tie" color="text-cyan-400" />
        <SecondaryStat label="خسائر اليوم" value={`${formatCurrency(s.todayLosses)} د.ت`} icon="fa-triangle-exclamation" color="text-rose-400" valueColor="text-rose-500" />
        <SecondaryStat label="إجمالي الرواتب" value={`${formatCurrency(s.totalSalaries)} د.ت`} icon="fa-wallet" color="text-purple-400" />
      </div>

      <Card className="p-4 sm:p-6">
        <h3 className="text-sm sm:text-base font-medium text-gray-800 dark:text-white mb-3">إجراءات سريعة</h3>
        <div className="flex flex-wrap gap-2">
          {visibleActions.map((a) => (
            <Button 
              key={a.key} 
              variant={a.variant} 
              icon={`fa-solid ${a.icon}`} 
              onClick={() => navigate(a.to)}
            >
              {a.label}
            </Button>
          ))}
        </div>
      </Card>

      {isManager && can('canViewGlobalDashboard') && globalStats && (
        <Card className="p-4 sm:p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm sm:text-base font-medium text-gray-800 dark:text-white">
              إحصائيات جميع المتاجر
            </h3>
            <span className="text-xs text-gray-400">{globalStats?.total?.stores_count || 0} متاجر</span>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <GlobalStat 
              label="إجمالي الإيرادات" 
              value={`${formatCurrency(globalStats?.total?.total_revenue)} د.ت`}
              icon="fa-solid fa-money-bill-wave"
              color="text-blue-400"
            />
            <GlobalStat 
              label="إجمالي الأرباح" 
              value={`${formatCurrency(globalStats?.total?.total_profit)} د.ت`}
              icon="fa-solid fa-chart-line"
              color="text-emerald-400"
            />
            <GlobalStat 
              label="إجمالي المبيعات" 
              value={globalStats?.total?.total_sales || 0}
              icon="fa-solid fa-cart-shopping"
              color="text-purple-400"
            />
            <GlobalStat 
              label="إجمالي الديون" 
              value={`${formatCurrency(globalStats?.total?.total_debts)} د.ت`}
              icon="fa-solid fa-hand-holding-dollar"
              color="text-rose-400"
            />
          </div>
        </Card>
      )}
    </>
  )
}

function SecondaryStat({ label, value, icon, color, valueColor = 'text-gray-800 dark:text-white' }) {
  return (
    <Card className="p-3 flex items-center justify-between">
      <div>
        <p className="text-[10px] text-gray-500 dark:text-gray-400">{label}</p>
        <p className={`text-base sm:text-lg font-bold ${valueColor}`}>{value ?? '—'}</p>
      </div>
      <i className={`fa-solid ${icon} text-lg sm:text-2xl ${color}`} />
    </Card>
  )
}

function GlobalStat({ label, value, icon, color }) {
  return (
    <div className="p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg text-center">
      <i className={`fa-solid ${icon} text-lg ${color} block mb-1`} />
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-sm font-bold text-gray-800 dark:text-white mt-1">{value}</p>
    </div>
  )
}
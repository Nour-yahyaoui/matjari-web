import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getDailyFinancials, getFinancialSummary } from '../api/endpoints'
import { usePagination } from '../hooks/usePagination'
import { usePermissions } from '../hooks/usePermissions'
import PageHeader from '../components/UI/PageHeader'
import Card, { KpiCard } from '../components/UI/Card'
import DataTable from '../components/UI/DataTable'
import Pagination from '../components/UI/Pagination'
import { Input } from '../components/UI/Input'

// ✅ Safe number formatter - handles null, undefined, strings
const toNumber = (val) => {
  if (val === null || val === undefined) return 0
  if (typeof val === 'string') {
    const parsed = parseFloat(val)
    return isNaN(parsed) ? 0 : parsed
  }
  if (typeof val === 'number') return val
  return 0
}

// ✅ Safe toFixed wrapper
const formatCurrency = (val, decimals = 3) => {
  const num = toNumber(val)
  return num.toFixed(decimals)
}

// ✅ Safe date formatter
const formatDate = (dateStr) => {
  if (!dateStr) return '—'
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return '—'
    return d.toLocaleDateString('ar-TN')
  } catch {
    return '—'
  }
}

export default function Financials() {
  const { canViewFinancials } = usePermissions()
  const { page, limit, offset, goToPage } = usePagination(30)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  if (!canViewFinancials) {
    return (
      <Card className="p-8 text-center text-sm text-gray-500 dark:text-gray-400">
        <i className="fa-solid fa-lock text-2xl block mb-3 text-gray-400" />
        هذه الميزة غير متاحة في خطتك الحالية
        <br />
        <span className="text-xs text-gray-400">يرجى الترقية للوصول إلى التقارير المالية</span>
      </Card>
    )
  }

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['financials', limit, offset, startDate, endDate],
    queryFn: () => getDailyFinancials({ 
      limit, 
      offset, 
      startDate: startDate || undefined, 
      endDate: endDate || undefined 
    }),
    retry: 1,
  })

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['financial-summary', startDate, endDate],
    queryFn: () => getFinancialSummary({ 
      days: startDate || endDate ? undefined : 30,
      startDate: startDate || undefined,
      endDate: endDate || undefined
    }),
    enabled: canViewFinancials,
    retry: 1,
  })

  // ✅ Extract data safely with fallbacks
  const financials = data?.financials || []
  const total = data?.pagination?.total || 0
  const pages = data?.pagination?.pages || 0

  // ✅ Safely extract summary values
  const summaryData = summary?.summary || {}
  
  const safeSummary = {
    total_revenue: toNumber(summaryData.total_revenue),
    total_cost: toNumber(summaryData.total_cost),
    total_profit: toNumber(summaryData.total_profit),
    net_profit: toNumber(summaryData.net_profit),
    total_losses: toNumber(summaryData.total_losses),
    total_sales: toNumber(summaryData.total_sales),
    total_orders: toNumber(summaryData.total_orders),
    avg_profit: toNumber(summaryData.avg_profit),
    best_day: toNumber(summaryData.best_day),
    worst_day: toNumber(summaryData.worst_day),
  }

  // ✅ Columns with safe rendering
  const columns = [
    { 
      key: 'date', 
      header: 'التاريخ', 
      render: (r) => formatDate(r.date) 
    },
    { 
      key: 'total_revenue', 
      header: 'الإيرادات', 
      render: (r) => `${formatCurrency(r.total_revenue)} د.ت` 
    },
    { 
      key: 'total_cost', 
      header: 'التكلفة', 
      render: (r) => `${formatCurrency(r.total_cost)} د.ت` 
    },
    { 
      key: 'total_profit', 
      header: 'الربح الإجمالي', 
      render: (r) => `${formatCurrency(r.total_profit)} د.ت` 
    },
    { 
      key: 'total_losses', 
      header: 'الخسائر', 
      render: (r) => `${formatCurrency(r.total_losses)} د.ت` 
    },
    { 
      key: 'net_profit', 
      header: 'صافي الربح', 
      render: (r) => {
        const val = toNumber(r.net_profit)
        return (
          <span className={val >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
            {formatCurrency(val)} د.ت
          </span>
        )
      }
    },
    { 
      key: 'sales_count', 
      header: 'المبيعات', 
      render: (r) => toNumber(r.sales_count) 
    },
  ]

  // ✅ If error, show friendly message
  if (isError) {
    return (
      <Card className="p-8 text-center">
        <i className="fa-solid fa-triangle-exclamation text-2xl text-amber-500 block mb-3" />
        <p className="text-sm text-gray-600 dark:text-gray-300">
          حدث خطأ في تحميل البيانات المالية
        </p>
        <p className="text-xs text-gray-400 mt-1">
          {error?.message || 'يرجى المحاولة مرة أخرى'}
        </p>
      </Card>
    )
  }

  return (
    <>
      <PageHeader 
        title="التقارير المالية" 
        subtitle="إحصاءات يومية وشهرية وأرباح وخسائر" 
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard
          label="إجمالي الإيرادات"
          value={`${formatCurrency(safeSummary.total_revenue)} د.ت`}
          icon="fa-solid fa-money-bill-wave"
          iconBg="bg-blue-50 dark:bg-blue-900/20"
          iconColor="text-blue-600 dark:text-blue-400"
        />
        <KpiCard
          label="إجمالي الربح"
          value={`${formatCurrency(safeSummary.total_profit)} د.ت`}
          icon="fa-solid fa-chart-line"
          iconBg="bg-green-50 dark:bg-green-900/20"
          iconColor="text-green-600 dark:text-green-400"
        />
        <KpiCard
          label="صافي الربح"
          value={`${formatCurrency(safeSummary.net_profit)} د.ت`}
          icon="fa-solid fa-circle-dollar"
          iconBg="bg-emerald-50 dark:bg-emerald-900/20"
          iconColor="text-emerald-600 dark:text-emerald-400"
        />
        <KpiCard
          label="إجمالي المبيعات"
          value={safeSummary.total_sales}
          icon="fa-solid fa-cart-shopping"
          iconBg="bg-purple-50 dark:bg-purple-900/20"
          iconColor="text-purple-600 dark:text-purple-400"
        />
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard 
          label="إجمالي الخسائر" 
          value={`${formatCurrency(safeSummary.total_losses)} د.ت`}
          color="text-rose-600 dark:text-rose-400"
          icon="fa-solid fa-triangle-exclamation"
        />
        <StatCard 
          label="متوسط الربح اليومي" 
          value={`${formatCurrency(safeSummary.avg_profit)} د.ت`}
          color="text-amber-600 dark:text-amber-400"
          icon="fa-solid fa-calendar-day"
        />
        <StatCard 
          label="أفضل يوم" 
          value={`${formatCurrency(safeSummary.best_day)} د.ت`}
          color="text-emerald-600 dark:text-emerald-400"
          icon="fa-solid fa-trophy"
        />
        <StatCard 
          label="أسوأ يوم" 
          value={`${formatCurrency(safeSummary.worst_day)} د.ت`}
          color="text-rose-600 dark:text-rose-400"
          icon="fa-solid fa-chart-simple"
        />
      </div>

      {/* Date Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-end">
        <Input
          label="من تاريخ"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="max-w-xs"
        />
        <Input
          label="إلى تاريخ"
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="max-w-xs"
        />
        {(startDate || endDate) && (
          <button
            onClick={() => { setStartDate(''); setEndDate('') }}
            className="text-xs text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 px-3 py-2"
          >
            <i className="fa-solid fa-times ml-1" /> إعادة تعيين
          </button>
        )}
      </div>

      {/* Table */}
      <Card>
        <DataTable 
          columns={columns} 
          rows={financials} 
          loading={isLoading || summaryLoading} 
          emptyText="لا توجد بيانات مالية في هذه الفترة" 
        />
        <Pagination 
          page={page} 
          limit={limit} 
          total={total} 
          onPageChange={goToPage} 
        />
      </Card>
    </>
  )
}

// ============================================
// Stat Card Component
// ============================================
function StatCard({ label, value, color, icon }) {
  return (
    <Card className="p-4 flex items-center justify-between">
      <div>
        <p className="text-[10px] text-gray-500 dark:text-gray-400">{label}</p>
        <p className={`text-sm font-bold ${color}`}>{value}</p>
      </div>
      <i className={`fa-solid ${icon} text-lg text-gray-400 dark:text-gray-500`} />
    </Card>
  )
}
// src/pages/Settings.jsx
import { useAuth } from '../contexts/AuthContext'
import { getActiveServer } from '../api/client'
import PageHeader from '../components/UI/PageHeader'
import Card from '../components/UI/Card'

export default function Settings() {
  const { user, permissions, serverStatus } = useAuth()

  const activeServer = getActiveServer()

  // ✅ Debug: Log what's in the user object
  console.log('🔍 Settings - User object:', user)

  // ✅ Get user name from various possible fields
  const userName = user?.fullName || user?.name || user?.full_name || '—'
  
  // ✅ Get user role
  const userRole = user?.type || user?.role || '—'
  const roleLabels = {
    manager: 'مدير',
    employee: 'موظف',
    client: 'عميل',
  }
  const roleLabel = roleLabels[userRole] || userRole || '—'

  // ✅ Get phone - try multiple possible fields
  const phone = user?.phone || user?.Phone || user?.mobile || user?.telephone || '—'

  // ✅ Get email - try multiple possible fields
  const email = user?.email || user?.Email || user?.mail || '—'

  // ✅ Get plan name
  const planType = permissions?.planName || user?.planType || user?.plan_type || 'basic'
  const planNames = {
    trial: 'تجريبي',
    basic: 'أساسي',
    medium: 'متوسط',
    premium: 'مميز',
    pro: 'احترافي'
  }
  const planLabel = planNames[planType] || planType

  // ✅ Get expiry
  const expiresAt = user?.expiresAt || user?.expires_at || permissions?.planExpiry

  // ✅ Calculate days left
  const calculateDaysLeft = (expiry) => {
    if (!expiry) return 0
    try {
      const exp = new Date(expiry)
      const now = new Date()
      const diff = exp.getTime() - now.getTime()
      return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
    } catch {
      return 0
    }
  }
  const daysLeft = calculateDaysLeft(expiresAt)

  // ✅ Server status
  const serverStatusLabel = {
    primary: 'الخادم الرئيسي',
    secondary: 'الخادم الاحتياطي',
    unavailable: 'غير متصل',
    checking: 'جاري التحقق...',
  }[serverStatus] || '—'

  // ✅ Connection status
  const connectionStatus = serverStatus === 'unavailable' ? 'غير متصل' : 'متصل'

  // ✅ Store name
  const storeName = user?.storeName || user?.store_name || '—'

  return (
    <>
      <PageHeader title="الإعدادات" subtitle="معلومات الحساب وحالة الخادم" />

      <Card className="p-6 space-y-3 max-w-lg">
        <Row label="اسم المستخدم" value={userName} />
        <Row label="الدور" value={roleLabel} />
        <Row label="المتجر" value={storeName} />
        <Row label="رقم الهاتف" value={phone} />
        <Row label="البريد الإلكتروني" value={email} />
        <Row label="الخطة" value={planLabel} />
        {expiresAt && (
          <Row 
            label="تاريخ الانتهاء" 
            value={new Date(expiresAt).toLocaleDateString('ar-TN')} 
          />
        )}
        {daysLeft > 0 && (
          <Row 
            label="المتبقي" 
            value={`${daysLeft} يوم`}
            valueColor={daysLeft <= 7 ? 'text-rose-500' : 'text-emerald-500'}
          />
        )}
        <Row label="الخادم النشط" value={serverStatusLabel} />
        <Row label="حالة الاتصال" value={connectionStatus} />
      </Card>
    </>
  )
}

function Row({ label, value, valueColor = 'text-gray-800 dark:text-white' }) {
  return (
    <div className="flex justify-between text-sm border-b border-gray-100 dark:border-gray-700 pb-2 last:border-0 last:pb-0">
      <span className="text-gray-500 dark:text-gray-400">{label}</span>
      <span className={`font-medium ${valueColor}`}>{value || '—'}</span>
    </div>
  )
}
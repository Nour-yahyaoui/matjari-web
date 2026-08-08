// src/components/UI/UpgradeModal.jsx
import Modal from './Modal'
import Button from './Button'
import { useNavigate } from 'react-router-dom'

export default function UpgradeModal({ open, onClose, feature, planType = 'أساسي' }) {
  const navigate = useNavigate()

  const features = {
    employees: {
      icon: 'fa-user-group',
      title: 'إدارة الموظفين',
      description: 'أضف وادير فريق عملك بكل سهولة'
    },
    debts: {
      icon: 'fa-hand-holding-dollar',
      title: 'إدارة الديون',
      description: 'تتبع ديون العملاء وسدادها'
    },
    financials: {
      icon: 'fa-file-invoice',
      title: 'التقارير المالية',
      description: 'شاهد أرباحك وخسائرك اليومية والشهرية'
    },
    stores: {
      icon: 'fa-store',
      title: 'المتاجر المتعددة',
      description: 'ادير متاجر متعددة من لوحة تحكم واحدة'
    },
    clients: {
      icon: 'fa-users',
      title: 'إدارة العملاء',
      description: 'تتبع عملائك وتواصل معهم'
    },
    reports: {
      icon: 'fa-chart-bar',
      title: 'التقارير المتقدمة',
      description: 'تحليلات وتقارير متقدمة لأعمالك'
    },
  }

  const featureInfo = features[feature] || {
    icon: 'fa-lock',
    title: 'هذه الميزة',
    description: 'غير متاحة في خطتك الحالية'
  }

  const handleUpgrade = () => {
    onClose()
    navigate('/settings?tab=plan')
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title=""
      footer={
        <div className="flex gap-3 w-full">
          <Button variant="outline" onClick={onClose} className="flex-1">
            رجوع
          </Button>
          <Button variant="warning" onClick={handleUpgrade} className="flex-1">
            <i className="fa-solid fa-crown ml-2" />
            ترقية الخطة
          </Button>
        </div>
      }
    >
      <div className="text-center py-4">
        <div className="w-20 h-20 mx-auto bg-amber-50 dark:bg-amber-900/20 rounded-full flex items-center justify-center text-4xl text-amber-500 mb-4">
          <i className={`fa-solid ${featureInfo.icon}`} />
        </div>
        
        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
          🚫 ميزة غير متاحة
        </h3>
        
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
          ميزة "<span className="font-bold">{featureInfo.title}</span>" غير متاحة في خطتك الحالية
        </p>
        
        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            <span className="font-bold text-amber-500">خطة أساسي</span> • 
            قم بالترقية إلى <span className="font-bold text-emerald-500">خطة متوسطة</span> أو <span className="font-bold text-blue-500">خطة مميزة</span>
          </p>
          <p className="text-xs text-gray-400 mt-2">
            {featureInfo.description}
          </p>
        </div>
        
        <div className="mt-4 flex justify-center gap-4 text-xs text-gray-400">
          <div className="flex items-center gap-1">
            <i className="fa-solid fa-check text-emerald-500" /> أساسي
          </div>
          <div className="flex items-center gap-1">
            <i className="fa-solid fa-check text-emerald-500" /> متوسط
          </div>
          <div className="flex items-center gap-1">
            <i className="fa-solid fa-crown text-amber-500" /> مميز
          </div>
        </div>
      </div>
    </Modal>
  )
}
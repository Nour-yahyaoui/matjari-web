// src/pages/Renew.jsx
import { useNavigate } from 'react-router-dom'
import Card from '../components/UI/Card'
import Button from '../components/UI/Button'

export default function Renew() {
  const navigate = useNavigate()

  const handleWhatsApp = () => {
    const phone = '25739896'
    const message = encodeURIComponent('السلام عليكم، أريد تجديد اشتراك متجري')
    window.open(`https://wa.me/216${phone}?text=${message}`, '_blank')
  }

  const handleCall1 = () => {
    window.location.href = 'tel:+21625739896'
  }

  const handleCall2 = () => {
    window.location.href = 'tel:+21658923247'
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-gray-900 p-4 sm:p-6 flex items-center justify-center">
      <Card className="max-w-lg w-full p-6 sm:p-8">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
            <i className="fa-solid fa-crown text-amber-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">تجديد الاشتراك</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            تواصل معنا لتجديد اشتراكك في متجري
          </p>
        </div>

        <div className="space-y-4">
          {/* WhatsApp */}
          <button
            onClick={handleWhatsApp}
            className="w-full flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl hover:bg-green-100 dark:hover:bg-green-900/30 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white text-lg">
                <i className="fa-brands fa-whatsapp" />
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-gray-800 dark:text-white">واتساب</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">+216 25 739 896</p>
              </div>
            </div>
            <i className="fa-solid fa-chevron-left text-gray-400" />
          </button>

          {/* Call 1 */}
          <button
            onClick={handleCall1}
            className="w-full flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white text-lg">
                <i className="fa-solid fa-phone" />
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-gray-800 dark:text-white">اتصال</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">+216 25 739 896</p>
              </div>
            </div>
            <i className="fa-solid fa-chevron-left text-gray-400" />
          </button>

          {/* Call 2 */}
          <button
            onClick={handleCall2}
            className="w-full flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white text-lg">
                <i className="fa-solid fa-phone" />
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-gray-800 dark:text-white">اتصال (احتياطي)</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">+216 58 923 247</p>
              </div>
            </div>
            <i className="fa-solid fa-chevron-left text-gray-400" />
          </button>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
          <p className="text-xs text-center text-gray-400">
            <i className="fa-solid fa-shield ml-1" />
            سيتم تفعيل اشتراكك فور تأكيد الدفع
          </p>
        </div>

        <Button
          variant="outline"
          className="w-full mt-4"
          onClick={() => navigate('/dashboard')}
          icon="fa-solid fa-arrow-right"
        >
          العودة إلى لوحة التحكم
        </Button>
      </Card>
    </div>
  )
}
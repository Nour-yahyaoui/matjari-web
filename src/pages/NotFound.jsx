import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-[#f1f5f9] dark:bg-gray-900 gap-3">
      <h1 className="text-5xl font-bold text-gray-300 dark:text-gray-600">404</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400">الصفحة غير موجودة</p>
      <Link to="/dashboard" className="text-sm text-[#445b7a] dark:text-blue-400 hover:underline">
        العودة إلى لوحة التحكم
      </Link>
    </div>
  )
}

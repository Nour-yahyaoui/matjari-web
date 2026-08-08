// src/components/Layout/Header.jsx
import { useTheme } from '../../contexts/ThemeContext'
import { useAuth } from '../../contexts/AuthContext'

export default function Header({ onHamburgerClick }) {
  const { theme, toggleTheme } = useTheme()
  const { user, permissions, logout } = useAuth()

  // ✅ Get user initials for avatar
  const getInitials = () => {
    const name = user?.fullName || user?.name || 'U'
    return name.charAt(0).toUpperCase()
  }

  // ✅ Handle logout
  const handleLogout = (e) => {
    e.preventDefault()
    e.stopPropagation()
    console.log('🚪 Header logout clicked')
    logout()
  }

  return (
    <header className="flex items-center justify-between px-4 sm:px-8 h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex-shrink-0 shadow-sm z-20">
      {/* Left - Logo & Hamburger */}
      <div className="flex items-center gap-3">
        <button
          onClick={onHamburgerClick}
          className="block lg:hidden text-gray-600 dark:text-gray-300 hover:text-[#445b7a] dark:hover:text-white text-xl p-1"
        >
          <i className="fa-solid fa-bars" />
        </button>
        <div className="w-8 h-8 bg-[#445b7a] dark:bg-slate-600 rounded-lg flex items-center justify-center text-white">
          <i className="fa-solid fa-microchip" />
        </div>
        <span className="text-lg font-bold text-gray-800 dark:text-white hidden sm:block">
          {user?.storeName || 'تيك بوس'}
        </span>
      </div>

      {/* Center - Search Bar */}
      <div className="relative hidden md:flex flex-1 max-w-lg mx-auto px-6">
        <i className="fa-solid fa-magnifying-glass absolute left-8 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
        <input
          type="text"
          placeholder="ابحث عن منتج، عميل، أو فاتورة..."
          className="w-full pl-10 pr-12 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-full focus:outline-none focus:ring-2 focus:ring-[#445b7a] text-sm text-gray-600 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500"
        />
        <i className="fa-solid fa-barcode absolute right-9 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 text-lg" />
      </div>

      {/* Right - Theme Toggle & Profile */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="text-gray-600 dark:text-gray-300 hover:text-[#445b7a] dark:hover:text-white text-lg transition-colors p-2 rounded-full bg-gray-100 dark:bg-gray-700 cursor-pointer"
        >
          <i className={`fa-solid ${theme === 'dark' ? 'fa-sun' : 'fa-moon'}`} />
        </button>

        {/* Profile Dropdown */}
        <div className="relative group">
          <button
            className="flex items-center gap-2 border-l pl-3 border-gray-200 dark:border-gray-700 cursor-pointer focus:outline-none"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300 hidden sm:block truncate max-w-[80px]">
              {user?.fullName || user?.name || 'مستخدم'}
            </span>
            <div className="w-8 h-8 rounded-full bg-[#445b7a] text-white flex items-center justify-center text-sm font-bold border border-gray-300 dark:border-gray-600 flex-shrink-0">
              {getInitials()}
            </div>
          </button>

          {/* Dropdown Menu */}
          <div className="absolute left-0 top-full mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 p-4 hidden group-hover:block group-focus-within:block transition-opacity z-30">
            {/* User Info */}
            <div className="text-xs space-y-1 mb-3 pb-3 border-b border-gray-100 dark:border-gray-700">
              <div className="flex justify-between text-gray-500 dark:text-gray-400">
                <span>الخطة:</span>
                <span className="font-bold text-[#445b7a] dark:text-blue-400">
                  {permissions?.planName || '—'}
                </span>
              </div>
              {permissions?.planExpiry && (
                <div className="flex justify-between text-gray-500 dark:text-gray-400">
                  <span>تنتهي في:</span>
                  <span className="font-bold text-gray-800 dark:text-white">
                    {new Date(permissions.planExpiry).toLocaleDateString('ar-TN')}
                  </span>
                </div>
              )}
              {permissions?.daysLeft != null && (
                <div className={`text-center mt-1 text-[11px] ${permissions.daysLeft <= 7 ? 'text-rose-500' : 'text-emerald-500'}`}>
                  متبقي: {permissions.daysLeft} يومًا
                </div>
              )}
            </div>

            {/* ✅ Logout Button - FIXED */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 py-2 rounded-lg transition-colors text-sm font-medium"
            >
              <i className="fa-solid fa-right-from-bracket" /> تسجيل الخروج
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
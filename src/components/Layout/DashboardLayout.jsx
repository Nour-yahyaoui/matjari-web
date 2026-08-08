import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Header from './Header'
import Sidebar from './Sidebar'
import { useAuth } from '../../contexts/AuthContext'

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { serverStatus } = useAuth()

  return (
    <div className="bg-[#f1f5f9] dark:bg-gray-900 h-screen w-full overflow-hidden flex flex-col">
      <Header onHamburgerClick={() => setSidebarOpen((o) => !o)} />

      {serverStatus === 'unavailable' && (
        <div className="bg-rose-500 text-white text-xs text-center py-1.5">
          الخدمة غير متاحة حاليًا، يرجى المحاولة لاحقًا
        </div>
      )}

      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/30 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        <main className="flex-1 bg-[#f8fafc] dark:bg-gray-900 p-4 sm:p-6 overflow-y-auto no-scrollbar flex flex-col gap-4 sm:gap-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

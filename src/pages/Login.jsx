// src/pages/Login.jsx
import { useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'
import { Input } from '../components/UI/Input'
import Button from '../components/UI/Button'

const ROLES = [
  { value: 'manager', label: 'مدير', icon: 'fa-user-tie', color: 'text-blue-600' },
  { value: 'employee', label: 'موظف', icon: 'fa-user', color: 'text-emerald-600' },
]

export default function Login() {
  const { login } = useAuth()
  const [role, setRole] = useState('manager')
  const [form, setForm] = useState({ phone: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    let rawPhone = form.phone.trim().replace(/\s/g, '')
    if (!rawPhone.startsWith('+216') && rawPhone.length === 8) {
      rawPhone = `+216${rawPhone}`
    }

    const payload = { login_type: role, phone: rawPhone }
    if (role === 'employee') {
      payload.access_code = form.password
    } else {
      payload.password = form.password
    }

    try {
      await login(payload)
    } catch (err) {
      setError(err?.response?.data?.error || 'فشل تسجيل الدخول')
      toast.error(err?.response?.data?.error || 'فشل تسجيل الدخول')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800 px-4 py-4">
      <div className="w-full max-w-md">
        {/* ✅ Smaller logo on short screens */}
        <div className="text-center mb-4 sm:mb-6">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-[#445b7a] dark:bg-slate-700 rounded-2xl flex items-center justify-center text-white mx-auto shadow-lg shadow-[#445b7a]/20 dark:shadow-slate-700/20">
            <i className="fa-solid fa-store text-xl sm:text-2xl" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white mt-2 sm:mt-3">متجري</h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">نظام إدارة المتاجر الذكي</p>
        </div>

        {/* ✅ Smaller register button */}
        <Link
          to="/register/manager"
          className="block w-full text-center py-2 sm:py-2.5 text-xs sm:text-sm font-medium text-[#445b7a] dark:text-blue-400 border-2 border-[#445b7a]/30 dark:border-blue-400/30 rounded-xl hover:bg-[#445b7a]/5 dark:hover:bg-blue-400/10 transition-all mb-3 sm:mb-4"
        >
          <i className="fa-solid fa-store ml-1 sm:ml-2" />
          إنشاء متجر جديد
        </Link>

        {/* ✅ Smaller role buttons */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-4 sm:mb-6">
          {ROLES.map((r) => (
            <button
              key={r.value}
              type="button"
              onClick={() => setRole(r.value)}
              className={`p-3 sm:p-4 rounded-xl border-2 transition-all duration-200 ${
                role === r.value
                  ? 'border-[#445b7a] bg-[#445b7a]/5 dark:bg-[#445b7a]/20 shadow-md'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <i className={`fa-solid ${r.icon} text-lg sm:text-xl ${role === r.value ? 'text-[#445b7a]' : 'text-gray-400'}`} />
              <p className={`text-xs sm:text-sm font-medium mt-0.5 sm:mt-1 ${role === r.value ? 'text-[#445b7a]' : 'text-gray-500'}`}>
                {r.label}
              </p>
            </button>
          ))}
        </div>

        {/* ✅ Smaller form */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-4 sm:p-6">
          <form onSubmit={handleSubmit}>
            <Input
              label="رقم الهاتف"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="XXXXXXXX أو +216XXXXXXXX"
              required
              className="text-base sm:text-lg"
            />

            <div className="relative">
              <Input
                label={role === 'employee' ? 'رمز الدخول (6 أرقام)' : 'كلمة المرور'}
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder={role === 'employee' ? '••••••' : '••••••••'}
                required
                className="text-base sm:text-lg"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 bottom-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`} />
              </button>
            </div>

            {error && (
              <div className="mt-2 p-2 sm:p-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-lg">
                <p className="text-rose-600 dark:text-rose-400 text-xs sm:text-sm text-center">{error}</p>
              </div>
            )}

            <Button type="submit" className="w-full mt-3 sm:mt-4 py-2.5 sm:py-3 text-sm sm:text-base" loading={loading}>
              <i className="fa-solid fa-arrow-right-to-bracket ml-2" />
              تسجيل الدخول
            </Button>
          </form>
        </div>

        <p className="text-center text-[10px] sm:text-xs text-gray-400 mt-4 sm:mt-6">
          © 2026 متجري — جميع الحقوق محفوظة
        </p>
      </div>
    </div>
  )
}
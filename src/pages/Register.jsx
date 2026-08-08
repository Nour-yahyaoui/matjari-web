// src/pages/Register.jsx
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { registerManager } from '../api/endpoints'
import { Input } from '../components/UI/Input'
import Button from '../components/UI/Button'

export default function Register() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, label: '', color: '' })
  const [form, setForm] = useState({
    store_name: '',
    owner_name: '',
    phone: '',
    password: '',
  })

  const update = (key) => (e) => {
    const value = e.target.value
    setForm({ ...form, [key]: value })
    
    if (key === 'password') {
      checkPasswordStrength(value)
    }
  }

  const checkPasswordStrength = (password) => {
    let score = 0
    
    // Length check
    if (password.length >= 8) score++
    if (password.length >= 12) score++
    
    // Complexity checks
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++
    if (/\d/.test(password)) score++
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++
    
    // Calculate strength
    let label, color
    if (password.length === 0) {
      label = ''
      color = 'bg-gray-200 dark:bg-gray-700'
    } else if (score <= 1) {
      label = 'ضعيفة'
      color = 'bg-rose-500'
    } else if (score <= 3) {
      label = 'متوسطة'
      color = 'bg-amber-500'
    } else {
      label = 'قوية'
      color = 'bg-emerald-500'
    }
    
    setPasswordStrength({ score, label, color })
  }

  const validatePassword = (password) => {
    if (password.length < 8) {
      return { valid: false, message: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' }
    }
    if (!/[A-Z]/.test(password)) {
      return { valid: false, message: 'كلمة المرور يجب أن تحتوي على حرف كبير واحد على الأقل' }
    }
    if (!/[0-9]/.test(password)) {
      return { valid: false, message: 'كلمة المرور يجب أن تحتوي على رقم واحد على الأقل' }
    }
    return { valid: true, message: '✅ كلمة مرور قوية' }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    const passwordCheck = validatePassword(form.password)
    if (!passwordCheck.valid) {
      toast.error(passwordCheck.message)
      setLoading(false)
      return
    }

    let rawPhone = form.phone.trim().replace(/\s/g, '')
    if (!rawPhone.startsWith('+216') && rawPhone.length === 8) {
      rawPhone = `+216${rawPhone}`
    }

    try {
      const payload = {
        store_name: form.store_name,
        owner_name: form.owner_name,
        phone: rawPhone,
        password: form.password,
      }

      await registerManager(payload)
      toast.success('✅ تم إنشاء المتجر بنجاح! يمكنك تسجيل الدخول الآن.')
      navigate('/login')
    } catch (err) {
      const msg = err?.response?.data?.error || 'فشل إنشاء الحساب'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const getStrengthTextColor = () => {
    if (passwordStrength.label === 'قوية') return 'text-emerald-500'
    if (passwordStrength.label === 'متوسطة') return 'text-amber-500'
    if (passwordStrength.label === 'ضعيفة') return 'text-rose-500'
    return 'text-gray-400'
  }

  // Calculate bar width based on score (max 5)
  const barWidth = Math.min((passwordStrength.score / 5) * 100, 100)

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800 py-8 px-4 overflow-y-auto">
      <div className="w-full max-w-2xl mx-auto py-4">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-[#445b7a] dark:bg-slate-700 rounded-2xl flex items-center justify-center text-white mx-auto shadow-lg">
            <i className="fa-solid fa-store text-xl" />
          </div>
          <h1 className="text-xl font-bold text-gray-800 dark:text-white mt-3">إنشاء متجر جديد</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">اشترك الآن واحصل على 14 يوم تجريبي مجاني</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-6 sm:p-8">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="اسم المتجر *"
                value={form.store_name}
                onChange={update('store_name')}
                required
                placeholder="مثال: متجر العصرية"
              />

              <Input
                label="اسم المالك *"
                value={form.owner_name}
                onChange={update('owner_name')}
                required
                placeholder="الاسم الكامل للمالك"
              />

              <Input
                label="رقم الهاتف *"
                value={form.phone}
                onChange={update('phone')}
                required
                placeholder="XXXXXXXX (8 أرقام)"
              />

              <div className="relative sm:col-span-1">
                <Input
                  label="كلمة المرور *"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={update('password')}
                  required
                  placeholder="8 أحرف على الأقل"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 bottom-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`} />
                </button>

                {/* ✅ Password Strength Bar */}
                {form.password.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${passwordStrength.color}`}
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center">
                      <span className={`text-[10px] font-medium ${getStrengthTextColor()}`}>
                        {passwordStrength.label}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {passwordStrength.label === 'قوية' ? '✓' : 
                         passwordStrength.label === 'متوسطة' ? '! ' :
                         passwordStrength.label === 'ضعيفة' ? '⚠ ' : ''}
                        {passwordStrength.label === 'قوية' ? 'آمن' : 
                         passwordStrength.label === 'متوسطة' ? 'جيد' :
                         passwordStrength.label === 'ضعيفة' ? 'ضعيف' : ''}
                      </span>
                    </div>
                    {passwordStrength.label !== 'قوية' && (
                      <p className="text-[9px] text-gray-400">
                        استخدم 8 أحرف + حرف كبير + رقم + رمز
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            <Button type="submit" className="w-full mt-6 py-3 text-base" loading={loading}>
              <i className="fa-solid fa-rocket ml-2" />
              إنشاء المتجر
            </Button>
          </form>

          <div className="mt-5 pt-5 border-t border-gray-100 dark:border-gray-700 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              لديك حساب بالفعل؟{' '}
              <Link to="/login" className="text-[#445b7a] dark:text-blue-400 hover:underline font-medium">
                تسجيل الدخول
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6 pb-4">
          © 2026 متجري — جميع الحقوق محفوظة
        </p>
      </div>
    </div>
  )
}
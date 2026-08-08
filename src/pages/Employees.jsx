// src/pages/Employees.jsx
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { usePagination } from '../hooks/usePagination'
import PageHeader from '../components/UI/PageHeader'
import Card from '../components/UI/Card'
import Button from '../components/UI/Button'
import DataTable from '../components/UI/DataTable'
import Pagination from '../components/UI/Pagination'
import Modal from '../components/UI/Modal'
import { Input } from '../components/UI/Input'

const API_URL = 'https://opalex1234.vercel.app'

const getToken = () => localStorage.getItem('pos_token')

const apiCall = async (endpoint, options = {}) => {
  const token = getToken()
  if (!token) throw new Error('No authentication token found')

  const url = `${API_URL}${endpoint}`
  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || `HTTP ${response.status}`)
  }

  return response.json()
}

const fetchEmployees = async (params = {}) => {
  const token = getToken()
  if (!token) throw new Error('No authentication token found')

  const queryString = new URLSearchParams(params).toString()
  const url = `${API_URL}/api/employees?${queryString}`
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    }
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`HTTP ${response.status}: ${text.substring(0, 100)}`)
  }

  return response.json()
}

const EMPTY_FORM = {
  full_name: '',
  phone: '',
  access_code: '',
  daily_salary: '',
}

export default function Employees() {
  const { page, limit, offset, goToPage } = usePagination(10)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [search, setSearch] = useState('')
  const [employees, setEmployees] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [actionLoading, setActionLoading] = useState({})
  const [codeModal, setCodeModal] = useState(null)
  const [newAccessCode, setNewAccessCode] = useState('')
  const [codeError, setCodeError] = useState('')
  const [codeSubmitting, setCodeSubmitting] = useState(false)

  useEffect(() => {
    const loadEmployees = async () => {
      setLoading(true)
      setError(null)
      
      try {
        const params = { limit, offset }
        if (search) params.search = search
        
        const data = await fetchEmployees(params)
        const list = data?.employees || []
        const totalCount = data?.total ?? list.length
        
        setEmployees(list)
        setTotal(totalCount)
      } catch (err) {
        console.error('❌ Failed to load employees:', err)
        setError(err.message || 'فشل تحميل الموظفين')
      } finally {
        setLoading(false)
      }
    }

    loadEmployees()
  }, [page, limit, offset, search])

  const refreshEmployees = async () => {
    try {
      const params = { limit, offset }
      if (search) params.search = search
      
      const data = await fetchEmployees(params)
      const list = data?.employees || []
      const totalCount = data?.total ?? list.length
      setEmployees(list)
      setTotal(totalCount)
    } catch (err) {
      console.error('❌ Failed to refresh employees:', err)
    }
  }

  const createMut = async (data) => {
    try {
      await apiCall('/api/employees', {
        method: 'POST',
        body: JSON.stringify(data),
      })
      toast.success('تمت إضافة الموظف')
      closeModal()
      await refreshEmployees()
    } catch (err) {
      toast.error(err.message || 'فشلت العملية')
    }
  }

  const updateMut = async (id, data) => {
    try {
      await apiCall(`/api/employees?id=${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      })
      toast.success('تم تحديث الموظف')
      closeModal()
      await refreshEmployees()
    } catch (err) {
      toast.error(err.message || 'فشلت العملية')
    }
  }

  const toggleStatus = async (id, currentStatus) => {
    const action = currentStatus ? 'deactivate' : 'activate'
    const actionLabel = currentStatus ? 'إلغاء تفعيل' : 'تفعيل'
    
    if (!confirm(`هل أنت متأكد من ${actionLabel} هذا الموظف؟`)) return
    
    setActionLoading(prev => ({ ...prev, [id]: true }))
    
    try {
      await apiCall(`/api/employees?id=${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ action }),
      })
      toast.success(`تم ${actionLabel} الموظف`)
      await refreshEmployees()
    } catch (err) {
      toast.error(err.message || 'فشلت العملية')
    } finally {
      setActionLoading(prev => ({ ...prev, [id]: false }))
    }
  }

  const deleteMut = async (id) => {
    if (!confirm('هل أنت متأكد من حذف هذا الموظف؟')) return
    
    try {
      await apiCall(`/api/employees?id=${id}`, {
        method: 'DELETE',
      })
      toast.success('تم حذف الموظف')
      await refreshEmployees()
    } catch (err) {
      toast.error(err.message || 'فشلت العملية')
    }
  }

  const updateAccessCode = async (id, code) => {
    setCodeSubmitting(true)
    try {
      await apiCall(`/api/employees?id=${id}`, {
        method: 'PUT',
        body: JSON.stringify({ access_code: code }),
      })
      toast.success('تم تحديث رمز الدخول')
      setCodeModal(null)
      setNewAccessCode('')
      setCodeError('')
      await refreshEmployees()
    } catch (err) {
      toast.error(err.message || 'فشل تحديث الرمز')
    } finally {
      setCodeSubmitting(false)
    }
  }

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setModalOpen(true)
  }

  const openEdit = (employee) => {
    setEditing(employee)
    setForm({
      full_name: employee.full_name || '',
      phone: employee.phone || '',
      access_code: '',
      daily_salary: employee.daily_salary || '',
    })
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditing(null)
    setForm(EMPTY_FORM)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!form.full_name.trim()) {
      toast.error('اسم الموظف مطلوب')
      return
    }

    let phone = form.phone.trim()
    if (!phone.startsWith('+216') && phone.length === 8) {
      phone = `+216${phone}`
    }

    if (!editing && !form.access_code) {
      toast.error('رمز الدخول مطلوب')
      return
    }

    if (form.access_code && !/^\d{6}$/.test(form.access_code)) {
      toast.error('رمز الدخول يجب أن يتكون من 6 أرقام')
      return
    }

    const payload = {
      full_name: form.full_name.trim(),
      phone: phone,
      daily_salary: parseFloat(form.daily_salary) || 0,
    }

    if (form.access_code) {
      payload.access_code = form.access_code
    }

    if (editing) {
      await updateMut(editing.id, payload)
    } else {
      await createMut(payload)
    }
  }

  const openCodeModal = (employee) => {
    setCodeModal(employee)
    setNewAccessCode('')
    setCodeError('')
  }

  const handleCodeSubmit = () => {
    if (!newAccessCode) {
      setCodeError('يرجى إدخال رمز جديد')
      return
    }
    if (newAccessCode.length !== 6 || !/^\d{6}$/.test(newAccessCode)) {
      setCodeError('رمز الدخول يجب أن يكون 6 أرقام')
      return
    }
    updateAccessCode(codeModal.id, newAccessCode)
  }

  if (loading && employees.length === 0) {
    return (
      <Card className="p-8 text-center">
        <i className="fa-solid fa-spinner fa-spin text-2xl text-[#445b7a] block mb-3" />
        <p className="text-sm text-gray-500 dark:text-gray-400">جارِ تحميل الموظفين...</p>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="p-8 text-center">
        <i className="fa-solid fa-triangle-exclamation text-2xl text-amber-500 block mb-3" />
        <p className="text-sm text-gray-600 dark:text-gray-300">حدث خطأ في تحميل الموظفين</p>
        <p className="text-xs text-gray-400 mt-1">{error}</p>
        <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
          إعادة المحاولة
        </Button>
      </Card>
    )
  }

  const columns = [
    { 
      key: 'full_name', 
      header: 'الاسم',
      render: (r) => r.full_name || r.name || '—'
    },
    { 
      key: 'phone', 
      header: 'الهاتف',
      render: (r) => r.phone || '—'
    },
    { 
      key: 'daily_salary', 
      header: 'الراتب اليومي',
      render: (r) => r.daily_salary ? `${Number(r.daily_salary).toFixed(3)} د.ت` : '—'
    },
    {
      key: 'is_active',
      header: 'الحالة',
      render: (r) => {
        const isActive = r.is_active !== false
        return (
          <button
            onClick={() => toggleStatus(r.id, isActive)}
            disabled={actionLoading[r.id]}
            className={`px-3 py-1 rounded-full text-[10px] font-medium transition-all ${
              isActive 
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-800/30' 
                : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {actionLoading[r.id] ? (
              <i className="fa-solid fa-spinner fa-spin" />
            ) : (
              isActive ? 'نشط' : 'موقوف'
            )}
          </button>
        )
      },
    },
    {
      key: 'actions',
      header: '',
      render: (r) => (
        <div className="flex gap-2">
          <button
            onClick={() => openCodeModal(r)}
            className="text-amber-500 hover:text-amber-700 text-xs p-1 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded"
            title="تغيير رمز الدخول"
          >
            <i className="fa-solid fa-key" />
          </button>
          <button
            onClick={() => openEdit(r)}
            className="text-blue-500 hover:text-blue-700 text-xs p-1 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
          >
            <i className="fa-solid fa-pen" />
          </button>
          <button
            onClick={() => deleteMut(r.id)}
            className="text-rose-500 hover:text-rose-700 text-xs p-1 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded"
          >
            <i className="fa-solid fa-trash" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <>
      <PageHeader
        title="الموظفون"
        subtitle={`${total} موظف`}
        action={
          <Button icon="fa-solid fa-user-plus" onClick={openCreate}>
            إضافة موظف
          </Button>
        }
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <i className="fa-solid fa-magnifying-glass absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
          <input
            className="w-full pr-9 pl-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#445b7a]"
            placeholder="ابحث عن موظف..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button variant="outline" icon="fa-solid fa-rotate-right" onClick={refreshEmployees}>
          تحديث
        </Button>
      </div>

      <Card>
        <DataTable
          columns={columns}
          rows={employees}
          loading={loading}
          emptyText="لا يوجد موظفون"
        />
        <Pagination page={page} limit={limit} total={total} onPageChange={goToPage} />
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editing ? 'تعديل موظف' : 'إضافة موظف'}
        footer={
          <>
            <Button variant="ghost" onClick={closeModal}>إلغاء</Button>
            <Button onClick={handleSubmit} loading={false}>حفظ</Button>
          </>
        }
      >
        <form onSubmit={handleSubmit}>
          <Input
            label="اسم الموظف"
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            required
          />
          <Input
            label="رقم الهاتف (8 أرقام)"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            required
            placeholder="XXXXXXXX"
          />
          {!editing && (
            <Input
              label="رمز الدخول (6 أرقام)"
              value={form.access_code}
              maxLength={6}
              onChange={(e) => setForm({ ...form, access_code: e.target.value.replace(/\D/g, '') })}
              required
            />
          )}
          <Input
            label="الراتب اليومي (د.ت)"
            type="number"
            step="0.001"
            value={form.daily_salary}
            onChange={(e) => setForm({ ...form, daily_salary: e.target.value })}
          />
        </form>
      </Modal>

      {/* Access Code Modal */}
      <Modal
        open={!!codeModal}
        onClose={() => { setCodeModal(null); setNewAccessCode(''); setCodeError(''); }}
        title={`تغيير رمز الدخول - ${codeModal?.full_name || ''}`}
        footer={
          <>
            <Button variant="ghost" onClick={() => { setCodeModal(null); setNewAccessCode(''); setCodeError(''); }}>
              إلغاء
            </Button>
            <Button 
              onClick={handleCodeSubmit} 
              loading={codeSubmitting}
              variant="warning"
            >
              تحديث الرمز
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-gray-500 dark:text-gray-400">أدخل رمز دخول جديد (6 أرقام)</p>
          <Input
            label="رمز الدخول الجديد"
            value={newAccessCode}
            maxLength={6}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, '')
              if (val.length <= 6) {
                setNewAccessCode(val)
                setCodeError('')
              }
            }}
            placeholder="123456"
            required
          />
          {codeError && (
            <p className="text-sm text-rose-500">{codeError}</p>
          )}
          {newAccessCode.length === 6 && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg text-center">
              <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">✅ رمز صحيح</p>
              <p className="text-xs text-gray-400">سيستخدمه الموظف لتسجيل الدخول</p>
            </div>
          )}
        </div>
      </Modal>
    </>
  )
}
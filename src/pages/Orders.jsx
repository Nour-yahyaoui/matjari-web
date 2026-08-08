// src/pages/Orders.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { usePagination } from '../hooks/usePagination'
import PageHeader from '../components/UI/PageHeader'
import Card from '../components/UI/Card'
import Button from '../components/UI/Button'
import DataTable from '../components/UI/DataTable'
import Pagination from '../components/UI/Pagination'
import { Input } from '../components/UI/Input'
import BarcodeInput from '../components/UI/BarcodeInput'

// ✅ HARDCODED API URL
const API_URL = 'https://opalex1234.vercel.app'

const getToken = () => localStorage.getItem('pos_token')

// ✅ API CALL
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

// ✅ FETCH ORDERS
const fetchOrders = async (params = {}) => {
  const token = getToken()
  if (!token) throw new Error('No authentication token found')

  const queryString = new URLSearchParams(params).toString()
  const url = `${API_URL}/api/orders?${queryString}`
  
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

// ✅ STATUS CONSTANTS
const STATUS_LABELS = {
  pending: 'قيد الانتظار',
  confirmed: 'مؤكد',
  preparing: 'قيد التحضير',
  ready: 'جاهز للتسليم',
  delivered: 'تم التسليم',
  cancelled: 'ملغي',
}

const STATUS_STYLES = {
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  confirmed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  preparing: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  ready: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  delivered: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  cancelled: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
}

// ✅ ALLOWED TRANSITIONS
const ALLOWED_TRANSITIONS = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['preparing', 'cancelled'],
  preparing: ['ready', 'cancelled'],
  ready: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
}

export default function Orders() {
  const [tab, setTab] = useState('list')

  return (
    <>
      <PageHeader title="الطلبات" subtitle="إدارة طلبات العملاء" />

      <div className="flex gap-2 mb-4 flex-wrap">
        <button
          onClick={() => setTab('list')}
          className={`px-4 py-2 text-xs font-medium rounded-lg ${
            tab === 'list' ? 'bg-[#445b7a] text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
          }`}
        >
          <i className="fa-solid fa-list ml-1" /> قائمة الطلبات
        </button>
        <button
          onClick={() => setTab('flat')}
          className={`px-4 py-2 text-xs font-medium rounded-lg ${
            tab === 'flat' ? 'bg-[#445b7a] text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
          }`}
        >
          <i className="fa-solid fa-pen ml-1" /> طلب يدوي
        </button>
      </div>

      {tab === 'list' ? <OrderList /> : <FlatOrderForm />}
    </>
  )
}

// ============================================
// ORDER LIST - SEARCH WITH BUTTON
// ============================================
function OrderList() {
  const navigate = useNavigate()
  const { page, limit, offset, goToPage } = usePagination(10)
  
  // ✅ Search state - separate from actual query
  const [searchInput, setSearchInput] = useState('')  // What user types
  const [searchQuery, setSearchQuery] = useState('')  // What we actually search
  const [statusFilter, setStatusFilter] = useState('')
  
  const [orders, setOrders] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [actionLoading, setActionLoading] = useState({})

  // ✅ Load orders - uses searchQuery (not searchInput)
  useEffect(() => {
    const loadOrders = async () => {
      setLoading(true)
      setError(null)
      
      try {
        const params = { limit, offset }
        if (searchQuery) params.search = searchQuery
        if (statusFilter) params.status = statusFilter
        
        const data = await fetchOrders(params)
        const ordersList = data?.orders || []
        const totalCount = data?.total ?? ordersList.length
        
        setOrders(ordersList)
        setTotal(totalCount)
      } catch (err) {
        console.error('❌ Failed to load orders:', err)
        setError(err.message || 'فشل تحميل الطلبات')
      } finally {
        setLoading(false)
      }
    }

    loadOrders()
  }, [page, limit, offset, searchQuery, statusFilter])

  // ✅ Handle search - triggered by button or Enter key
  const handleSearch = () => {
    setSearchQuery(searchInput.trim())
    goToPage(1) // Reset to first page
  }

  // ✅ Handle Enter key
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSearch()
    }
  }

  // ✅ Clear search
  const clearSearch = () => {
    setSearchInput('')
    setSearchQuery('')
    goToPage(1)
  }

  const refreshOrders = async () => {
    try {
      const params = { limit, offset }
      if (searchQuery) params.search = searchQuery
      if (statusFilter) params.status = statusFilter
      
      const data = await fetchOrders(params)
      const ordersList = data?.orders || []
      const totalCount = data?.total ?? ordersList.length
      setOrders(ordersList)
      setTotal(totalCount)
    } catch (err) {
      console.error('❌ Failed to refresh orders:', err)
    }
  }

  // ✅ Handle status change
  const handleStatusChange = async (orderId, newStatus) => {
    const order = orders.find(o => o.id === orderId)
    if (!order) return

    const allowed = ALLOWED_TRANSITIONS[order.status] || []
    if (!allowed.includes(newStatus)) {
      toast.error(`لا يمكن تغيير الحالة من "${STATUS_LABELS[order.status]}" إلى "${STATUS_LABELS[newStatus]}"`)
      return
    }

    if (newStatus === 'delivered' && !order.is_price_set) {
      toast.error('⚠️ يجب تحديد الأسعار قبل تسليم الطلب')
      navigate(`/orders/${orderId}/price`)
      return
    }

    const confirmMsg = newStatus === 'delivered' 
      ? '⚠️ سيتم إنشاء عملية بيع للمنتجات. هل أنت متأكد من تسليم الطلب؟'
      : `تغيير الحالة إلى "${STATUS_LABELS[newStatus]}"؟`
    
    if (!confirm(confirmMsg)) return

    setActionLoading(prev => ({ ...prev, [orderId]: true }))

    try {
      const data = await apiCall('/api/order-status', {
        method: 'PUT',
        body: JSON.stringify({ order_id: orderId, status: newStatus }),
      })

      toast.success(data?.message || `تم تغيير الحالة إلى "${STATUS_LABELS[newStatus]}"`)
      
      if (newStatus === 'delivered' && data?.summary) {
        toast.success(`✅ تم إنشاء ${data.summary.sales_count || 0} عملية بيع`)
      }
      
      await refreshOrders()
    } catch (err) {
      toast.error(err.message || 'فشل تغيير الحالة')
    } finally {
      setActionLoading(prev => ({ ...prev, [orderId]: false }))
    }
  }

  // ✅ Cancel order
  const handleCancel = async (orderId) => {
    const order = orders.find(o => o.id === orderId)
    if (!order) return

    if (order.status === 'delivered') {
      toast.error('لا يمكن إلغاء طلب تم تسليمه')
      return
    }

    if (order.status === 'cancelled') {
      toast.error('الطلب ملغي بالفعل')
      return
    }

    if (!confirm('هل أنت متأكد من إلغاء هذا الطلب؟')) return

    setActionLoading(prev => ({ ...prev, [orderId]: true }))

    try {
      await apiCall('/api/orders/cancel', {
        method: 'POST',
        body: JSON.stringify({ order_id: orderId }),
      })
      toast.success('تم إلغاء الطلب')
      await refreshOrders()
    } catch (err) {
      toast.error(err.message || 'فشل إلغاء الطلب')
    } finally {
      setActionLoading(prev => ({ ...prev, [orderId]: false }))
    }
  }

  // ✅ Delete order
  const handleDelete = async (orderId) => {
    const order = orders.find(o => o.id === orderId)
    if (!order) return

    if (order.status !== 'pending') {
      toast.error('لا يمكن حذف طلب تم تأكيده')
      return
    }

    if (!confirm(`هل أنت متأكد من حذف الطلب #${orderId.slice(-6).toUpperCase()}؟`)) {
      return
    }

    setActionLoading(prev => ({ ...prev, [orderId]: true }))

    try {
      await apiCall(`/api/orders?id=${orderId}`, {
        method: 'DELETE',
      })
      toast.success('تم حذف الطلب')
      await refreshOrders()
    } catch (err) {
      toast.error(err.message || 'فشل حذف الطلب')
    } finally {
      setActionLoading(prev => ({ ...prev, [orderId]: false }))
    }
  }

  // ✅ Navigate to price screen
  const goToPriceScreen = (orderId) => {
    navigate(`/orders/${orderId}/price`)
  }

  // ✅ Columns
  const columns = [
    { 
      key: 'id', 
      header: 'رقم الطلب', 
      render: (r) => <span className="font-mono text-xs font-bold">{r.id.slice(-6).toUpperCase()}</span>
    },
    { 
      key: 'customer_name', 
      header: 'العميل', 
      render: (r) => r.customer_name || '—' 
    },
    { 
      key: 'customer_phone', 
      header: 'الهاتف', 
      render: (r) => r.customer_phone || '—' 
    },
    { 
      key: 'total_amount', 
      header: 'المبلغ', 
      render: (r) => r.total_amount ? `${Number(r.total_amount).toFixed(3)} د.ت` : '—'
    },
    {
      key: 'status',
      header: 'الحالة',
      render: (r) => {
        const status = r.status || 'pending'
        return (
          <span className={`px-2 py-1 rounded-full text-[10px] font-medium ${STATUS_STYLES[status]}`}>
            {STATUS_LABELS[status]}
          </span>
        )
      },
    },
    {
      key: 'actions',
      header: 'الإجراءات',
      render: (r) => {
        const status = r.status || 'pending'
        const id = r.id
        const isPriceSet = r.is_price_set || false
        const isLoading = actionLoading[id]

        if (status === 'pending' && !isPriceSet) {
          return (
            <div className="flex items-center gap-1 flex-wrap">
              <Button variant="warning" size="sm" icon="fa-solid fa-tag" onClick={() => goToPriceScreen(id)} loading={isLoading} className="text-xs py-1 px-3">تحديد السعر</Button>
              <button onClick={() => handleCancel(id)} className="text-amber-500 hover:text-amber-700 text-xs p-1.5 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-all" title="إلغاء الطلب"><i className="fa-solid fa-ban" /></button>
              <button onClick={() => handleDelete(id)} className="text-rose-500 hover:text-rose-700 text-xs p-1.5 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-all" title="حذف الطلب"><i className="fa-solid fa-trash-can" /></button>
            </div>
          )
        }

        if (status === 'pending' && isPriceSet) {
          return (
            <div className="flex items-center gap-1 flex-wrap">
              <Button variant="primary" size="sm" icon="fa-solid fa-check" onClick={() => handleStatusChange(id, 'confirmed')} loading={isLoading} className="text-xs py-1 px-3">تأكيد الطلب</Button>
              <button onClick={() => handleCancel(id)} className="text-amber-500 hover:text-amber-700 text-xs p-1.5 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-all" title="إلغاء الطلب"><i className="fa-solid fa-ban" /></button>
            </div>
          )
        }

        if (status === 'confirmed') {
          return (
            <div className="flex items-center gap-1 flex-wrap">
              <Button variant="purple" size="sm" icon="fa-solid fa-utensils" onClick={() => handleStatusChange(id, 'preparing')} loading={isLoading} className="text-xs py-1 px-3">بدء التحضير</Button>
              <button onClick={() => handleCancel(id)} className="text-amber-500 hover:text-amber-700 text-xs p-1.5 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-all" title="إلغاء الطلب"><i className="fa-solid fa-ban" /></button>
            </div>
          )
        }

        if (status === 'preparing') {
          return (
            <div className="flex items-center gap-1 flex-wrap">
              <Button variant="cyan" size="sm" icon="fa-solid fa-check-double" onClick={() => handleStatusChange(id, 'ready')} loading={isLoading} className="text-xs py-1 px-3">جاهز للتسليم</Button>
              <button onClick={() => handleCancel(id)} className="text-amber-500 hover:text-amber-700 text-xs p-1.5 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-all" title="إلغاء الطلب"><i className="fa-solid fa-ban" /></button>
            </div>
          )
        }

        if (status === 'ready') {
          return (
            <div className="flex items-center gap-1 flex-wrap">
              <Button variant="success" size="sm" icon="fa-solid fa-truck" onClick={() => handleStatusChange(id, 'delivered')} loading={isLoading} className="text-xs py-1 px-3">تسليم الطلب</Button>
            </div>
          )
        }

        if (status === 'delivered') {
          return <span className="text-xs text-green-600 dark:text-green-400 font-medium">✅ تم التسليم</span>
        }

        if (status === 'cancelled') {
          return (
            <div className="flex items-center gap-1 flex-wrap">
              <span className="text-xs text-rose-600 dark:text-rose-400 font-medium">❌ ملغي</span>
              <button onClick={() => handleDelete(id)} className="text-rose-500 hover:text-rose-700 text-xs p-1.5 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-all" title="حذف الطلب"><i className="fa-solid fa-trash-can" /></button>
            </div>
          )
        }

        return null
      },
    },
  ]

  // Loading state
  if (loading && orders.length === 0) {
    return (
      <Card className="p-8 text-center">
        <i className="fa-solid fa-spinner fa-spin text-2xl text-[#445b7a] block mb-3" />
        <p className="text-sm text-gray-500 dark:text-gray-400">جارِ تحميل الطلبات...</p>
      </Card>
    )
  }

  // Error state
  if (error) {
    return (
      <Card className="p-8 text-center">
        <i className="fa-solid fa-triangle-exclamation text-2xl text-amber-500 block mb-3" />
        <p className="text-sm text-gray-600 dark:text-gray-300">حدث خطأ في تحميل الطلبات</p>
        <p className="text-xs text-gray-400 mt-1">{error}</p>
        <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>إعادة المحاولة</Button>
      </Card>
    )
  }

  return (
    <>
      {/* ✅ SEARCH WITH BUTTON - No onInput */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <i className="fa-solid fa-magnifying-glass absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
          <input
            className="w-full pr-9 pl-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#445b7a]"
            placeholder="ابحث عن طلب..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>
        
        <div className="flex gap-2">
          <Button variant="primary" onClick={handleSearch} icon="fa-solid fa-search">
            بحث
          </Button>
          
          {searchInput && (
            <Button variant="ghost" onClick={clearSearch} icon="fa-solid fa-times">
              مسح
            </Button>
          )}
        </div>

        <select
          className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#445b7a]"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">جميع الحالات</option>
          {Object.entries(STATUS_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
        
        <Button variant="outline" icon="fa-solid fa-rotate-right" onClick={refreshOrders}>
          تحديث
        </Button>
      </div>

      <Card>
        <DataTable columns={columns} rows={orders} loading={loading} emptyText="لا توجد طلبات" />
        <Pagination page={page} limit={limit} total={total} onPageChange={goToPage} />
      </Card>
    </>
  )
}

// ============================================
// FLAT ORDER FORM
// ============================================
function FlatOrderForm() {
  const [form, setForm] = useState({
    customer_name: '',
    customer_phone: '',
    customer_address: '',
    notes: '',
    delivery_fee: 0,
  })
  const [items, setItems] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)

  const searchProducts = async (term) => {
    if (term.length < 2) return []
    try {
      const token = getToken()
      const url = `${API_URL}/api/products?search=${encodeURIComponent(term)}&limit=10`
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      return data?.products || []
    } catch {
      return []
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (items.length === 0) {
      toast.error('أضف منتجات إلى الطلب')
      return
    }
    if (!form.customer_name) {
      toast.error('اسم العميل مطلوب')
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`${API_URL}/api/orders/flat`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          customer_name: form.customer_name,
          customer_phone: form.customer_phone || undefined,
          customer_address: form.customer_address || undefined,
          notes: form.notes || undefined,
          delivery_fee: parseFloat(form.delivery_fee) || 0,
          items: items.map(item => ({
            product_id: item.product_id,
            product_name: item.product_name,
            quantity: item.quantity,
          })),
        }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'فشل إنشاء الطلب')
      }
      
      toast.success('✅ تم إنشاء الطلب اليدوي بنجاح')
      toast.info('⚠️ قم بتحديد الأسعار من قائمة الطلبات')
      
      setForm({ customer_name: '', customer_phone: '', customer_address: '', notes: '', delivery_fee: 0 })
      setItems([])
    } catch (err) {
      toast.error(err.message || 'فشلت العملية')
    } finally {
      setLoading(false)
    }
  }

  const handleBarcodeScan = async (code) => {
    try {
      const token = getToken()
      const url = `${API_URL}/api/barcode?barcode=${encodeURIComponent(code)}&action=pos-add`
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      
      if (data.success && data.data?.product) {
        const product = data.data.product
        addProduct({
          id: product.id,
          name: product.name,
          barcode: product.barcode,
        })
        toast.success(`✅ تم إضافة ${product.name}`)
      } else {
        toast.error('المنتج غير موجود')
      }
    } catch (error) {
      toast.error(error.message || 'فشل البحث عن المنتج')
    }
  }

  const addProduct = (product) => {
    const existing = items.find(i => i.product_id === product.id)
    if (existing) {
      setItems(items.map(i => i.product_id === product.id ? { ...i, quantity: i.quantity + 1 } : i))
    } else {
      setItems([...items, { product_id: product.id, product_name: product.name, quantity: 1 }])
    }
  }

  const removeItem = (index) => setItems(items.filter((_, i) => i !== index))
  const updateQuantity = (index, qty) => {
    if (qty < 1) return
    const newItems = [...items]
    newItems[index].quantity = qty
    setItems(newItems)
  }

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="اسم العميل" value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} required />
          <Input label="رقم الهاتف" value={form.customer_phone} onChange={(e) => setForm({ ...form, customer_phone: e.target.value })} placeholder="+216XXXXXXXX" />
          <Input label="العنوان" value={form.customer_address} onChange={(e) => setForm({ ...form, customer_address: e.target.value })} />
          <Input label="رسوم التوصيل (د.ت)" type="number" step="0.001" value={form.delivery_fee} onChange={(e) => setForm({ ...form, delivery_fee: parseFloat(e.target.value) || 0 })} />
        </div>

        <Input label="ملاحظات" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />

        <div className="relative">
          <BarcodeInput onScan={handleBarcodeScan} placeholder="امسح الباركود لإضافة منتج..." className="max-w-full" />
          <div className="mt-2">
            <input
              type="text"
              placeholder="أو اكتب اسم المنتج للبحث..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onBlur={() => setTimeout(() => {
                const dropdown = document.getElementById('search-dropdown')
                if (dropdown) dropdown.style.display = 'none'
              }, 300)}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#445b7a]"
            />
            <div id="search-dropdown" className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto hidden"></div>
          </div>
        </div>

        {items.length > 0 && (
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <table className="w-full text-sm text-right">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr><th className="px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400">المنتج</th><th className="px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400">الكمية</th><th className="px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400"></th></tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={idx} className="border-t border-gray-100 dark:border-gray-700/50">
                    <td className="px-4 py-2 text-gray-700 dark:text-gray-200">{item.product_name}</td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => updateQuantity(idx, item.quantity - 1)} className="w-6 h-6 rounded bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"><i className="fa-solid fa-minus text-[10px]" /></button>
                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                        <button type="button" onClick={() => updateQuantity(idx, item.quantity + 1)} className="w-6 h-6 rounded bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"><i className="fa-solid fa-plus text-[10px]" /></button>
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <button type="button" onClick={() => removeItem(idx)} className="text-rose-500 hover:text-rose-700 p-1 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded"><i className="fa-solid fa-trash" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
          <span className="text-sm text-gray-600 dark:text-gray-300">
            عدد المنتجات: <span className="font-bold text-gray-800 dark:text-white">{items.length}</span>
            {' • '}
            إجمالي القطع: <span className="font-bold text-gray-800 dark:text-white">{items.reduce((sum, i) => sum + i.quantity, 0)}</span>
          </span>
          <Button type="submit" variant="success" icon="fa-solid fa-check" loading={loading} disabled={items.length === 0 || !form.customer_name} className="min-w-[160px]">
            {loading ? 'جاري...' : 'إنشاء الطلب'}
          </Button>
        </div>
      </form>
    </Card>
  )
}
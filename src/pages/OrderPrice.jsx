// src/pages/OrderPrice.jsx
import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import PageHeader from '../components/UI/PageHeader'
import Card from '../components/UI/Card'
import Button from '../components/UI/Button'
import { Input } from '../components/UI/Input'

// ✅ HARDCODED API URL
const API_URL = 'https://opalex1234.vercel.app'

// ✅ Helper function to get token
const getToken = () => localStorage.getItem('pos_token')

// ✅ Direct fetch function
const apiCall = async (endpoint, options = {}) => {
  const token = getToken()
  if (!token) {
    throw new Error('No authentication token found')
  }

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

// ✅ Status constants (matching your RN code)
const ORDER_TYPES = {
  stock: { label: '📦 مخزون', color: 'blue' },
  request: { label: '📋 طلب', color: 'purple' },
  flat: { label: '📝 يدوي', color: 'orange' },
  sub: { label: '🔄 فرعي', color: 'teal' },
}

const STATUS_ORDER = ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled']

const STATUS_LABELS = {
  pending: 'قيد الانتظار',
  confirmed: 'مؤكد',
  preparing: 'قيد التحضير',
  ready: 'جاهز',
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

export default function OrderPrice() {
  const navigate = useNavigate()
  const { id } = useParams()
  const orderId = id

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [order, setOrder] = useState(null)
  const [items, setItems] = useState([])
  const [deliveryFee, setDeliveryFee] = useState('0')
  const [totalAmount, setTotalAmount] = useState(0)
  const [errors, setErrors] = useState({})

  // ✅ Fetch order on mount
  useEffect(() => {
    if (!orderId) {
      toast.error('معرف الطلب غير موجود')
      navigate('/orders')
      return
    }
    fetchOrder()
  }, [orderId])

  const fetchOrder = async () => {
    try {
      const data = await apiCall(`/api/orders/${orderId}/price`)
      
      if (data.success) {
        setOrder(data.order)
        const orderItems = data.order.items || []
        setItems(orderItems)
        setDeliveryFee(data.order.delivery_fee?.toString() || '0')
        calculateTotal(orderItems, data.order.delivery_fee || 0)
      } else {
        if (data.error) {
          toast.error(data.error)
        }
        if (data.status === 404) {
          toast.error('الطلب غير موجود')
          navigate('/orders')
        }
      }
    } catch (err) {
      toast.error(err.message || 'فشل في تحميل الطلب')
    } finally {
      setLoading(false)
    }
  }

  // ✅ Calculate total
  const calculateTotal = (itemsList, fee) => {
    let total = 0
    for (const item of itemsList) {
      const price = parseFloat(item.unit_price) || 0
      total += price * item.quantity
    }
    total += parseFloat(fee) || 0
    setTotalAmount(total)
  }

  // ✅ Update item price
  const updateItemPrice = (itemId, price) => {
    const updated = items.map(item => {
      if (item.id === itemId) {
        return { ...item, unit_price: parseFloat(price) || 0 }
      }
      return item
    })
    setItems(updated)
    calculateTotal(updated, deliveryFee)
    
    if (errors[itemId]) {
      const newErrors = { ...errors }
      delete newErrors[itemId]
      setErrors(newErrors)
    }
  }

  // ✅ Update delivery fee
  const updateDeliveryFee = (fee) => {
    const numFee = parseFloat(fee) || 0
    setDeliveryFee(fee)
    calculateTotal(items, numFee)
  }

  // ✅ Validate form
  const validateForm = () => {
    const newErrors = {}
    let isValid = true

    for (const item of items) {
      if (!item.unit_price || item.unit_price <= 0) {
        newErrors[item.id] = 'السعر مطلوب'
        isValid = false
      }
    }

    setErrors(newErrors)
    return isValid
  }

  // ✅ Submit - CONFIRMS the order with prices
  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error('يرجى إدخال الأسعار لجميع المنتجات')
      return
    }

    if (!confirm(`هل أنت متأكد من تأكيد الطلب بمبلغ ${totalAmount.toFixed(3)} د.ت؟`)) {
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        items: items.map(item => ({
          id: item.id,
          unit_price: parseFloat(item.unit_price) || 0,
        })),
        delivery_fee: parseFloat(deliveryFee) || 0,
      }

      const data = await apiCall(`/api/orders/${orderId}/price`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      })

      if (data.success) {
        toast.success(`✅ تم تأكيد الطلب بمبلغ ${totalAmount.toFixed(3)} د.ت`)
        // ✅ Navigate back to orders list
        navigate('/orders')
      } else {
        toast.error(data.error || 'فشل في تأكيد الأسعار')
      }
    } catch (err) {
      toast.error(err.message || 'فشل الاتصال بالخادم')
    } finally {
      setSubmitting(false)
    }
  }

  // ✅ Go back
  const handleBack = () => {
    navigate('/orders')
  }

  // ✅ Get order type label
  const getOrderTypeLabel = (type) => {
    const orderType = ORDER_TYPES[type] || { label: type || 'طلب' }
    return orderType.label
  }

  // ✅ Get status label
  const getStatusLabel = (status) => {
    return STATUS_LABELS[status] || status || 'قيد الانتظار'
  }

  // ✅ Loading state
  if (loading) {
    return (
      <>
        <PageHeader title="تحديد الأسعار" />
        <Card className="p-8 text-center">
          <i className="fa-solid fa-spinner fa-spin text-2xl text-[#445b7a] block mb-3" />
          <p className="text-sm text-gray-500 dark:text-gray-400">جارِ تحميل الطلب...</p>
        </Card>
      </>
    )
  }

  // ✅ Order not found
  if (!order) {
    return (
      <>
        <PageHeader title="تحديد الأسعار" />
        <Card className="p-8 text-center">
          <div className="text-5xl mb-3">📋</div>
          <p className="text-lg font-bold text-gray-800 dark:text-white">الطلب غير موجود</p>
          <Button variant="primary" className="mt-4" onClick={handleBack}>
            رجوع
          </Button>
        </Card>
      </>
    )
  }

  return (
    <>
      <PageHeader 
        title="تحديد الأسعار" 
        subtitle={`الطلب #${order.id?.slice(-6)?.toUpperCase() || ''}`}
        action={
          <Button variant="outline" icon="fa-solid fa-arrow-right" onClick={handleBack}>
            رجوع
          </Button>
        }
      />

      {/* Customer Info Card */}
      <Card className="p-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h3 className="text-lg font-bold text-gray-800 dark:text-white">
              {order.customer_name || 'عميل'}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              📱 {order.customer_phone || '---'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[order.status] || STATUS_STYLES.pending}`}>
              {getStatusLabel(order.status)}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
              {getOrderTypeLabel(order.order_type)}
            </span>
          </div>
        </div>
      </Card>

      {/* Items Section */}
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-gray-800 dark:text-white">
          المنتجات ({items.length})
        </h3>
      </div>

      {/* Item Cards */}
      {items.map((item) => (
        <Card key={item.id} className={`p-4 border ${errors[item.id] ? 'border-rose-500' : 'border-gray-200 dark:border-gray-700'}`}>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-400">×{item.quantity}</span>
            <span className="text-base font-bold text-gray-800 dark:text-white">{item.product_name}</span>
          </div>

          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3">
            <div className="flex-1 w-full">
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                سعر الوحدة (د.ت)
              </label>
              <input
                type="number"
                step="0.001"
                min="0"
                value={item.unit_price || ''}
                onChange={(e) => updateItemPrice(item.id, e.target.value)}
                className={`w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border rounded-lg text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#445b7a] ${
                  errors[item.id] ? 'border-rose-500' : 'border-gray-200 dark:border-gray-600'
                }`}
                placeholder="0.000"
              />
              {errors[item.id] && (
                <p className="text-xs text-rose-500 mt-1">{errors[item.id]}</p>
              )}
            </div>
            <div className="text-right sm:text-left min-w-[100px]">
              <span className="text-sm text-gray-400">الإجمالي</span>
              <p className="text-lg font-bold text-[#445b7a] dark:text-blue-400">
                {(item.unit_price * item.quantity || 0).toFixed(3)} د.ت
              </p>
            </div>
          </div>
        </Card>
      ))}

      {/* Delivery Fee */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3">
          <div className="flex-1 w-full">
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
              🚚 رسوم التوصيل (د.ت)
            </label>
            <input
              type="number"
              step="0.001"
              min="0"
              value={deliveryFee}
              onChange={(e) => updateDeliveryFee(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#445b7a]"
              placeholder="0.000"
            />
          </div>
        </div>
      </Card>

      {/* Total */}
      <Card className="p-5 bg-gradient-to-l from-[#445b7a] to-[#6c5ce7] text-white">
        <div className="text-center">
          <p className="text-sm opacity-80">الإجمالي</p>
          <p className="text-3xl font-bold">{totalAmount.toFixed(3)} د.ت</p>
        </div>
      </Card>

      {/* Submit Button */}
      <div className="flex gap-3">
        <Button
          variant="success"
          className="flex-1 py-3 text-base"
          onClick={handleSubmit}
          loading={submitting}
          disabled={submitting}
        >
          {submitting ? 'جاري...' : '✅ تأكيد الأسعار'}
        </Button>
        <Button
          variant="ghost"
          onClick={handleBack}
          disabled={submitting}
        >
          إلغاء
        </Button>
      </div>
    </>
  )
}
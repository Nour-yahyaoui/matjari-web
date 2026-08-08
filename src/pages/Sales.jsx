// src/pages/Sales.jsx
import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { usePagination } from '../hooks/usePagination'
import PageHeader from '../components/UI/PageHeader'
import Card from '../components/UI/Card'
import Button from '../components/UI/Button'
import DataTable from '../components/UI/DataTable'
import Pagination from '../components/UI/Pagination'
import Modal from '../components/UI/Modal'
import { Input } from '../components/UI/Input'

// ✅ HARDCODED API URL
const API_URL = 'https://opalex1234.vercel.app'

// ✅ Helper functions
const getToken = () => localStorage.getItem('pos_token')

const apiCall = async (endpoint, options = {}) => {
  const token = getToken()
  const url = `${API_URL}${endpoint}`
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers,
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(error.error || `HTTP ${response.status}`)
  }

  return response.json()
}

// ✅ API Functions
const getProducts = async (params) => {
  const queryString = new URLSearchParams(params).toString()
  return apiCall(`/api/products?${queryString}`)
}

const getSales = async (params) => {
  const queryString = new URLSearchParams(params).toString()
  return apiCall(`/api/sales?${queryString}`)
}

const createSale = async (data) => {
  return apiCall('/api/sales', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

const deleteSale = async (id) => {
  return apiCall(`/api/sales/${id}`, {
    method: 'DELETE',
  })
}

const scanBarcode = async (barcode) => {
  const token = getToken()
  const url = `${API_URL}/api/barcode?barcode=${encodeURIComponent(barcode)}&action=pos-add`
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
    }
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(error.error || 'Failed to scan barcode')
  }

  return response.json()
}

export default function Sales() {
  const [tab, setTab] = useState('pos')

  return (
    <>
      <PageHeader title="المبيعات" subtitle="نقطة البيع وسجل عمليات البيع" />

      <div className="flex gap-2 mb-4 flex-wrap">
        <button
          onClick={() => setTab('pos')}
          className={`px-4 py-2 text-xs font-medium rounded-lg ${
            tab === 'pos' ? 'bg-[#445b7a] text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
          }`}
        >
          <i className="fa-solid fa-cart-plus ml-1" /> نقطة البيع
        </button>
        <button
          onClick={() => setTab('history')}
          className={`px-4 py-2 text-xs font-medium rounded-lg ${
            tab === 'history' ? 'bg-[#445b7a] text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
          }`}
        >
          <i className="fa-solid fa-clock-rotate-left ml-1" /> سجل المبيعات
        </button>
      </div>

      {tab === 'pos' ? <PosPanel /> : <SalesHistory />}
    </>
  )
}

// ============================================
// ✅ POS PANEL - NO DEFAULT SELLING PRICE
// ============================================
function PosPanel() {
  const [cart, setCart] = useState([])
  const [barcodeInput, setBarcodeInput] = useState('')
  const [isScanning, setIsScanning] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const barcodeInputRef = useRef(null)
  const queryClient = useQueryClient()

  // ✅ AUTO-FOCUS on barcode input
  useEffect(() => {
    if (barcodeInputRef.current) {
      barcodeInputRef.current.focus()
    }
  }, [])

  const refocusBarcodeInput = () => {
    setTimeout(() => {
      if (barcodeInputRef.current) {
        barcodeInputRef.current.focus()
      }
    }, 50)
  }

  // Search products
  const { data: searchResults } = useQuery({
    queryKey: ['product-search-pos', searchTerm],
    queryFn: () => getProducts({ search: searchTerm, limit: 10 }),
    enabled: searchTerm.length >= 2,
  })

  // ✅ Add to cart - NO DEFAULT SELLING PRICE
  const addToCart = (product) => {
    if (!product || !product.id) {
      toast.error('منتج غير صالح')
      return
    }

    const costPrice = Number(product.latest_cost_price) || Number(product.cost_price) || 0
    
    if (costPrice <= 0) {
      toast.error(`المنتج "${product.name}" ليس له سعر شراء`)
      return
    }

    setCart((prev) => {
      const idx = prev.findIndex((item) => item.id === product.id)
      if (idx >= 0) {
        const updated = [...prev]
        updated[idx] = { 
          ...updated[idx], 
          quantity: updated[idx].quantity + 1,
        }
        return updated
      }
      return [...prev, {
        id: product.id,
        name: product.name,
        barcode: product.barcode,
        cost_price: costPrice,
        selling_price: '',  // ✅ EMPTY - USER MUST TYPE
        quantity: 1,
        stock: Number(product.current_stock) || 0,
      }]
    })
    setSearchTerm('')
    setShowSearch(false)
    toast.success(`✅ تمت إضافة ${product.name}`)
    refocusBarcodeInput()
  }

  // ✅ UPDATE SELLING PRICE
  const updateSellingPrice = (id, newPrice) => {
    setCart((prev) => prev.map((item) => 
      item.id === id ? { ...item, selling_price: newPrice } : item
    ))
  }

  // ✅ BARCODE SCAN
  const handleBarcodeScan = async () => {
    const code = barcodeInput.trim()
    
    if (!code) {
      toast.error('أدخل الباركود')
      refocusBarcodeInput()
      return
    }

    if (isScanning) return
    setIsScanning(true)

    try {
      const data = await scanBarcode(code)
      
      if (!data.success) {
        throw new Error(data.error || 'المنتج غير موجود')
      }

      const productData = data.data?.product || data.product || data.data
      
      if (!productData || !productData.id) {
        toast.error('المنتج غير موجود')
        return
      }

      const stock = Number(productData.current_stock) || Number(productData.total_stock) || 0
      if (stock <= 0) {
        toast.error(`❌ لا يوجد مخزون للمنتج "${productData.name}"`)
        return
      }

      addToCart({
        id: productData.id,
        name: productData.name,
        barcode: productData.barcode || code,
        latest_cost_price: productData.cost_price || productData.latest_cost_price || 0,
        current_stock: stock,
      })

      setBarcodeInput('')
      refocusBarcodeInput()

    } catch (error) {
      console.error('❌ Scan error:', error)
      toast.error(error.message || 'فشل البحث')
      setBarcodeInput('')
      refocusBarcodeInput()
    } finally {
      setIsScanning(false)
    }
  }

  const updateQty = (id, quantity) => {
    if (quantity < 1) {
      setCart((prev) => prev.filter((item) => item.id !== id))
      refocusBarcodeInput()
      return
    }
    setCart((prev) => prev.map((item) => (item.id === id ? { ...item, quantity } : item)))
  }

  const removeItem = (id) => {
    setCart((prev) => prev.filter((item) => item.id !== id))
    refocusBarcodeInput()
  }

  // ✅ Calculate total - ONLY if selling_price has a value
  const total = cart.reduce((sum, item) => {
    const price = parseFloat(item.selling_price) || 0
    return sum + price * item.quantity
  }, 0)
  
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0)

  // ✅ Check if all items have selling price
  const allHavePrice = cart.every(item => {
    const price = parseFloat(item.selling_price)
    return price > 0
  })

  // ✅ Checkout
  const checkoutMut = useMutation({
    mutationFn: async () => {
      if (cart.length === 0) throw new Error('السلة فارغة')
      
      // ✅ Validate all items have selling price
      for (const item of cart) {
        const price = parseFloat(item.selling_price)
        if (!price || price <= 0) {
          throw new Error(`الرجاء إدخال سعر البيع للمنتج "${item.name}"`)
        }
      }

      const results = []
      for (const item of cart) {
        const result = await createSale({
          product_id: item.id,
          quantity: item.quantity,
          selling_price: parseFloat(item.selling_price),
        })
        results.push(result)
      }
      return results.length
    },
    onSuccess: (count) => {
      toast.success(`✅ تم ${count} عملية بيع`)
      setCart([])
      queryClient.invalidateQueries({ queryKey: ['sales'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      queryClient.invalidateQueries({ queryKey: ['stock'] })
      refocusBarcodeInput()
    },
    onError: (e) => {
      const msg = e?.message || 'فشلت عملية البيع'
      toast.error(msg)
      refocusBarcodeInput()
    },
  })

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleBarcodeScan()
    }
  }

  return (
    <Card className="p-4 sm:p-6 flex flex-col gap-4">
      {/* BARCODE INPUT */}
      <div>
        <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
          <i className="fa-solid fa-barcode ml-1" /> مسح الباركود
        </label>
        <div className="flex gap-2">
          <input
            ref={barcodeInputRef}
            type="text"
            value={barcodeInput}
            onChange={(e) => setBarcodeInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="أدخل الباركود..."
            className="flex-1 px-3 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#445b7a]"
            disabled={isScanning}
            autoFocus
          />
          <Button
            onClick={handleBarcodeScan}
            loading={isScanning}
            disabled={!barcodeInput.trim() || isScanning}
          >
            بحث
          </Button>
        </div>
        <p className="text-[10px] text-gray-400 mt-1">
          <i className="fa-solid fa-arrow-left ml-1" /> اضغط Enter للمسح المستمر
        </p>
      </div>

      {/* SEARCH BY NAME */}
      <div className="relative">
        <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
          <i className="fa-solid fa-search ml-1" /> بحث بالاسم
        </label>
        <input
          type="text"
          placeholder="اكتب اسم المنتج..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setShowSearch(true)}
          onBlur={() => {
            setTimeout(() => setShowSearch(false), 300)
            refocusBarcodeInput()
          }}
          className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#445b7a]"
        />
        {showSearch && searchTerm.length >= 2 && searchResults?.products?.length > 0 && (
          <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
            {searchResults.products.map((p) => (
              <div
                key={p.id}
                onClick={() => addToCart(p)}
                className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-sm text-gray-700 dark:text-gray-200 flex justify-between"
              >
                <span>{p.name}</span>
                <span className="text-xs text-gray-400">
                  {p.category ? `${p.category} • ` : ''}
                  مخزون: {p.current_stock || 0}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ✅ CART TABLE - SELLING PRICE INPUT IS EMPTY */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-right">
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-700">
              <th className="px-3 py-2 text-xs font-medium text-gray-500">المنتج</th>
              <th className="px-3 py-2 text-xs font-medium text-gray-500">سعر الشراء</th>
              <th className="px-3 py-2 text-xs font-medium text-gray-500 min-w-[120px]">
                <span className="text-emerald-600 dark:text-emerald-400">سعر البيع *</span>
                <span className="block text-[8px] text-gray-400">(أدخل السعر)</span>
              </th>
              <th className="px-3 py-2 text-xs font-medium text-gray-500">الكمية</th>
              <th className="px-3 py-2 text-xs font-medium text-gray-500">الإجمالي</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {cart.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-10 text-xs text-gray-400">
                  <i className="fa-solid fa-barcode text-2xl mb-2 block" />
                  امسح باركود أو ابحث عن منتج
                </td>
              </tr>
            )}
            {cart.map((item) => {
              const price = parseFloat(item.selling_price) || 0
              const hasPrice = price > 0
              
              return (
                <tr key={item.id} className="border-b border-gray-50 dark:border-gray-700/50">
                  <td className="px-3 py-2 text-gray-700 dark:text-gray-200">
                    <div>
                      <span className="font-medium">{item.name}</span>
                      {item.barcode && (
                        <span className="text-[10px] text-gray-400 block">{item.barcode}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-gray-400 text-xs">
                    {item.cost_price.toFixed(3)} د.ت
                  </td>
                  <td className="px-3 py-2">
                    {/* ✅ SELLING PRICE INPUT - EMPTY, USER MUST TYPE */}
                    <input
                      type="number"
                      step="0.001"
                      min="0"
                      value={item.selling_price}
                      onChange={(e) => updateSellingPrice(item.id, e.target.value)}
                      onBlur={() => refocusBarcodeInput()}
                      className={`w-24 px-2 py-1 border rounded text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                        hasPrice 
                          ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700' 
                          : 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-700'
                      }`}
                      placeholder="السعر"
                      required
                    />
                    {!hasPrice && (
                      <span className="block text-[8px] text-rose-500 mt-0.5">مطلوب</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQty(item.id, item.quantity - 1)}
                        className="w-6 h-6 rounded bg-gray-100 dark:bg-gray-700 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600"
                      >
                        <i className="fa-solid fa-minus text-[10px]" />
                      </button>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateQty(item.id, Number(e.target.value))}
                        className="w-12 text-center bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded text-xs py-1"
                        min="1"
                      />
                      <button
                        onClick={() => updateQty(item.id, item.quantity + 1)}
                        className="w-6 h-6 rounded bg-gray-100 dark:bg-gray-700 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600"
                      >
                        <i className="fa-solid fa-plus text-[10px]" />
                      </button>
                    </div>
                  </td>
                  <td className="px-3 py-2 font-medium text-gray-800 dark:text-white">
                    {hasPrice ? `${(price * item.quantity).toFixed(3)} د.ت` : '—'}
                  </td>
                  <td className="px-3 py-2">
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-rose-500 hover:text-rose-700 text-xs p-1 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded"
                    >
                      <i className="fa-solid fa-trash" />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* FOOTER */}
      <div className="flex flex-col sm:flex-row items-center justify-between border-t border-gray-100 dark:border-gray-700 pt-4 gap-3">
        <div className="text-sm text-gray-600 dark:text-gray-300">
          عدد المنتجات: <span className="font-bold text-gray-800 dark:text-white">{cart.length}</span>
          {' • '}
          إجمالي القطع: <span className="font-bold text-gray-800 dark:text-white">{totalItems}</span>
          {' • '}
          الإجمالي: <span className="text-lg font-bold text-[#445b7a] dark:text-blue-400">{total.toFixed(3)} د.ت</span>
          {!allHavePrice && cart.length > 0 && (
            <span className="mr-3 text-xs text-rose-500">
              <i className="fa-solid fa-triangle-exclamation ml-1" />
              أدخل سعر البيع لجميع المنتجات
            </span>
          )}
        </div>
        <Button
          variant="success"
          icon="fa-solid fa-check"
          disabled={cart.length === 0 || checkoutMut.isPending || !allHavePrice}
          loading={checkoutMut.isPending}
          onClick={() => checkoutMut.mutate()}
          className="min-w-[140px]"
        >
          {checkoutMut.isPending ? 'جاري...' : 'إتمام البيع'}
        </Button>
      </div>
    </Card>
  )
}

// ============================================
// SALES HISTORY
// ============================================
function SalesHistory() {
  const { page, limit, offset, goToPage } = usePagination(10)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['sales', limit, offset, startDate, endDate],
    queryFn: () => getSales({ limit, offset, startDate: startDate || undefined, endDate: endDate || undefined }),
  })

  const deleteMut = useMutation({
    mutationFn: deleteSale,
    onSuccess: () => {
      toast.success('تم حذف البيع')
      queryClient.invalidateQueries({ queryKey: ['sales'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      queryClient.invalidateQueries({ queryKey: ['stock'] })
    },
    onError: (e) => toast.error(e?.message || 'فشل'),
  })

  const sales = data?.sales || []
  const total = data?.total ?? sales.length

  const columns = [
    { key: 'product_name', header: 'المنتج', render: (r) => r.product_name || '—' },
    { key: 'quantity_sold', header: 'الكمية', render: (r) => r.quantity_sold || 0 },
    {
      key: 'selling_price',
      header: 'سعر البيع',
      render: (r) => `${Number(r.selling_price || 0).toFixed(3)} د.ت`
    },
    {
      key: 'total',
      header: 'الإجمالي',
      render: (r) => `${(Number(r.quantity_sold || 0) * Number(r.selling_price || 0)).toFixed(3)} د.ت`
    },
    { key: 'sold_at', header: 'التاريخ', render: (r) => new Date(r.sold_at).toLocaleString('ar-TN') },
    {
      key: 'actions',
      header: '',
      render: (r) => (
        <button
          onClick={() => { if (confirm('هل أنت متأكد؟')) deleteMut.mutate(r.id) }}
          className="text-rose-500 hover:text-rose-700 text-xs p-1 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded"
        >
          <i className="fa-solid fa-trash" />
        </button>
      ),
    },
  ]

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <Input label="من تاريخ" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="max-w-xs" />
        <Input label="إلى تاريخ" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="max-w-xs" />
      </div>

      <Card>
        <DataTable columns={columns} rows={sales} loading={isLoading} emptyText="لا توجد مبيعات" />
        <Pagination page={page} limit={limit} total={total} onPageChange={goToPage} />
      </Card>
    </>
  )
}
// src/pages/Products.jsx
import { useState } from 'react'
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
import BarcodeInput from '../components/UI/BarcodeInput'

// ✅ HARDCODED API URL
const API_URL = 'https://opalex1234.vercel.app'

// ✅ Helper function to get token
const getToken = () => localStorage.getItem('pos_token')

// ✅ API calls with flat URL
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

// ✅ Product API functions
const getProducts = async (params) => {
  const queryString = new URLSearchParams(params).toString()
  return apiCall(`/api/products?${queryString}`)
}

const createProduct = async (data) => {
  return apiCall('/api/products', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

const updateProduct = async (id, data) => {
  return apiCall(`/api/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

const deleteProduct = async (id) => {
  return apiCall(`/api/products/${id}`, {
    method: 'DELETE',
  })
}

const scanBarcode = async (barcode) => {
  const token = getToken()
  const url = `${API_URL}/api/barcode?barcode=${encodeURIComponent(barcode)}&action=search`
  
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

const EMPTY_FORM = {
  name: '',
  cost_price: '',
  initial_quantity: '',
  barcode: '',
  category: '',
  min_stock_alert: '5',
}

export default function Products() {
  const { page, limit, offset, goToPage } = usePagination(10)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['products', limit, offset],
    queryFn: () => getProducts({ limit, offset }),
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['products'] })

  const createMut = useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      toast.success('تمت إضافة المنتج')
      invalidate()
      closeModal()
    },
    onError: (e) => toast.error(e?.message || 'فشلت العملية'),
  })

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => updateProduct(id, data),
    onSuccess: () => {
      toast.success('تم تحديث المنتج')
      invalidate()
      closeModal()
    },
    onError: (e) => toast.error(e?.message || 'فشلت العملية'),
  })

  const deleteMut = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      toast.success('تم حذف المنتج')
      invalidate()
    },
    onError: (e) => toast.error(e?.message || 'فشلت العملية'),
  })

  const scanLookupMut = useMutation({
    mutationFn: async (code) => {
      const data = await scanBarcode(code)
      if (data.success && data.data?.product) {
        return data.data.product
      }
      return null
    },
    onSuccess: (product, code) => {
      if (product) {
        openEdit(product)
        toast.success(`تم العثور على "${product.name}"`)
      } else {
        setEditing(null)
        setForm({ ...EMPTY_FORM, barcode: code })
        setModalOpen(true)
        toast('منتج جديد، أكمل بياناته', { icon: '🆕' })
      }
    },
    onError: () => toast.error('فشل البحث عن المنتج'),
  })

  const handleScan = (code) => {
    if (modalOpen) {
      setForm((f) => ({ ...f, barcode: code }))
      return
    }
    scanLookupMut.mutate(code)
  }

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setModalOpen(true)
  }

  const openEdit = (product) => {
    setEditing(product)
    setForm({
      name: product.name || '',
      cost_price: product.latest_cost_price || product.cost_price || '',
      initial_quantity: product.current_stock || product.initial_quantity || '0',
      barcode: product.barcode || '',
      category: product.category || '',
      min_stock_alert: product.min_stock_alert || '5',
    })
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditing(null)
    setForm(EMPTY_FORM)
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    const payload = {
      name: form.name.trim(),
      cost_price: parseFloat(form.cost_price),
      initial_quantity: parseInt(form.initial_quantity) || 0,
      barcode: form.barcode || null,
      category: form.category.trim() || null,
      min_stock_alert: parseInt(form.min_stock_alert) || 5,
    }

    if (editing) {
      updateMut.mutate({ id: editing.id, data: payload })
    } else {
      createMut.mutate(payload)
    }
  }

  const products = data?.products || []
  const total = data?.total ?? products.length

  const columns = [
    { key: 'name', header: 'المنتج' },
    { key: 'category', header: 'التصنيف', render: (r) => r.category || '—' },
    { key: 'barcode', header: 'الباركود', render: (r) => r.barcode || '—' },
    {
      key: 'latest_cost_price',
      header: 'سعر الشراء',
      render: (r) => `${Number(r.latest_cost_price || 0).toFixed(3)} د.ت`
    },
    { key: 'current_stock', header: 'الكمية' },
    {
      key: 'actions',
      header: '',
      render: (r) => (
        <div className="flex gap-2">
          <button
            onClick={() => openEdit(r)}
            className="text-blue-500 hover:text-blue-700 text-xs p-1 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
          >
            <i className="fa-solid fa-pen" />
          </button>
          <button
            onClick={() => {
              if (confirm(`هل أنت متأكد من حذف المنتج "${r.name}"؟`)) {
                deleteMut.mutate(r.id)
              }
            }}
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
        title="المنتجات"
        subtitle="إدارة قائمة المنتجات والأسعار والتصنيفات"
        action={
          <Button icon="fa-solid fa-plus" onClick={openCreate}>
            إضافة منتج
          </Button>
        }
      />

      <Card className="p-4">
        <BarcodeInput
          onScan={handleScan}
          className="max-w-sm"
          placeholder="امسح باركود منتج للإضافة أو التعديل..."
        />
      </Card>

      <Card>
        <DataTable
          columns={columns}
          rows={products}
          loading={isLoading}
          emptyText="لا توجد منتجات"
        />
        <Pagination page={page} limit={limit} total={total} onPageChange={goToPage} />
      </Card>

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editing ? 'تعديل منتج' : 'إضافة منتج'}
        footer={
          <>
            <Button variant="ghost" onClick={closeModal}>إلغاء</Button>
            <Button onClick={handleSubmit} loading={createMut.isPending || updateMut.isPending}>
              حفظ
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="اسم المنتج"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <Input
            label="الباركود"
            value={form.barcode}
            onChange={(e) => setForm({ ...form, barcode: e.target.value })}
          />
          <Input
            label="التصنيف"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            placeholder="مثلاً: إلكترونيات، ملابس، أدوات..."
          />
          <Input
            label="سعر الشراء (د.ت)"
            type="number"
            step="0.001"
            value={form.cost_price}
            onChange={(e) => setForm({ ...form, cost_price: e.target.value })}
            required
          />
          <Input
            label="الكمية الأولية"
            type="number"
            value={form.initial_quantity}
            onChange={(e) => setForm({ ...form, initial_quantity: e.target.value })}
            required
          />
          <Input
            label="حد الإنذار الأدنى"
            type="number"
            value={form.min_stock_alert}
            onChange={(e) => setForm({ ...form, min_stock_alert: e.target.value })}
          />
        </form>
      </Modal>
    </>
  )
}
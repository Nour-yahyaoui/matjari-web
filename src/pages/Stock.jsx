import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { getStock, addStock, reportDamage, getDamageList, getProducts, getStockMovements } from '../api/endpoints'
import { usePagination } from '../hooks/usePagination'
import PageHeader from '../components/UI/PageHeader'
import Card, { KpiCard } from '../components/UI/Card'
import Button from '../components/UI/Button'
import DataTable from '../components/UI/DataTable'
import Pagination from '../components/UI/Pagination'
import Modal from '../components/UI/Modal'
import { Input } from '../components/UI/Input'
import BarcodeInput from '../components/UI/BarcodeInput'

const DAMAGE_REASONS = [
  { key: 'damaged', label: 'تالف' },
  { key: 'stolen', label: 'مسروق' },
  { key: 'lost', label: 'مفقود' },
  { key: 'expired', label: 'منتهي الصلاحية' },
  { key: 'other', label: 'أخرى' },
]

const REASON_COLORS = {
  damaged: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20',
  stolen: 'text-rose-600 bg-rose-50 dark:bg-rose-900/20',
  lost: 'text-gray-600 bg-gray-50 dark:bg-gray-800',
  expired: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20',
  other: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20',
}

export default function Stock() {
  const [tab, setTab] = useState('stock')
  const stockPg = usePagination(10)
  const damagePg = usePagination(10)
  const movementsPg = usePagination(10)

  const [addModal, setAddModal] = useState(false)
  const [damageModal, setDamageModal] = useState(false)

  const [stockForm, setStockForm] = useState({ productSearch: '', product_id: '', cost_price: '', quantity: '', supplier: '', invoice_ref: '' })
  const [damageForm, setDamageForm] = useState({ productSearch: '', product_id: '', quantity: '', reason: 'damaged', notes: '' })

  const [debouncedStockSearch, setDebouncedStockSearch] = useState('')
  const [debouncedDamageSearch, setDebouncedDamageSearch] = useState('')

  const queryClient = useQueryClient()

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedStockSearch(stockForm.productSearch), 300)
    return () => clearTimeout(timer)
  }, [stockForm.productSearch])

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedDamageSearch(damageForm.productSearch), 300)
    return () => clearTimeout(timer)
  }, [damageForm.productSearch])

  // Data Queries
  const { data: stockData, isLoading: stockLoading } = useQuery({
    queryKey: ['stock', stockPg.limit, stockPg.offset],
    queryFn: () => getStock({ limit: stockPg.limit, offset: stockPg.offset }),
    enabled: tab === 'stock',
  })

  const { data: damageData, isLoading: damageLoading } = useQuery({
    queryKey: ['damage-list', damagePg.limit, damagePg.offset],
    queryFn: () => getDamageList({ limit: damagePg.limit, offset: damagePg.offset }),
    enabled: tab === 'damage',
  })

  const { data: movementsData, isLoading: movementsLoading } = useQuery({
    queryKey: ['stock-movements', movementsPg.limit, movementsPg.offset],
    queryFn: () => getStockMovements({ limit: movementsPg.limit, offset: movementsPg.offset }),
    enabled: tab === 'movements',
  })

  // Product Search
  const { data: searchResultsStock } = useQuery({
    queryKey: ['products-search-stock', debouncedStockSearch],
    queryFn: () => getProducts({ search: debouncedStockSearch, limit: 10 }),
    enabled: debouncedStockSearch.length >= 1,
  })

  const { data: searchResultsDamage } = useQuery({
    queryKey: ['products-search-damage', debouncedDamageSearch],
    queryFn: () => getProducts({ search: debouncedDamageSearch, limit: 10 }),
    enabled: debouncedDamageSearch.length >= 1,
  })

  // Mutations
  const addStockMut = useMutation({
    mutationFn: addStock,
    onSuccess: () => {
      toast.success('تمت إضافة المخزون بنجاح')
      queryClient.invalidateQueries({ queryKey: ['stock'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      setAddModal(false)
      setStockForm({ productSearch: '', product_id: '', cost_price: '', quantity: '', supplier: '', invoice_ref: '' })
    },
    onError: (e) => toast.error(e?.response?.data?.error || 'فشلت العملية'),
  })

  const damageMut = useMutation({
    mutationFn: reportDamage,
    onSuccess: () => {
      toast.success('تم تسجيل التلف بنجاح')
      queryClient.invalidateQueries({ queryKey: ['damage-list'] })
      queryClient.invalidateQueries({ queryKey: ['stock'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      setDamageModal(false)
      setDamageForm({ productSearch: '', product_id: '', quantity: '', reason: 'damaged', notes: '' })
    },
    onError: (e) => toast.error(e?.response?.data?.error || 'فشلت العملية'),
  })

  const stockItems = stockData?.batches || []
  const stockTotal = stockData?.total ?? 0
  const damageItems = damageData?.losses || []
  const damageTotal = damageData?.total ?? 0
  const damageSummary = damageData?.summary || {}
  const movements = movementsData?.movements || []

  const stockColumns = [
    { key: 'product_name', header: 'المنتج' },
    { key: 'cost_price', header: 'سعر الشراء', render: (r) => `${Number(r.cost_price || 0).toFixed(3)} د.ت` },
    { key: 'current_quantity', header: 'الكمية المتاحة' },
    { key: 'initial_quantity', header: 'الكمية الأولية' },
    { key: 'supplier', header: 'المورد', render: (r) => r.supplier || '—' },
    { key: 'date_received', header: 'تاريخ الاستلام', render: (r) => new Date(r.date_received).toLocaleDateString('ar-TN') },
  ]

  const damageColumns = [
    { key: 'product_name', header: 'المنتج' },
    { key: 'quantity', header: 'الكمية' },
    {
      key: 'reason',
      header: 'السبب',
      render: (r) => {
        const found = DAMAGE_REASONS.find(opt => opt.key === r.reason)
        const color = REASON_COLORS[r.reason] || REASON_COLORS.other
        return <span className={`px-2 py-1 rounded-full text-[10px] font-medium ${color}`}>{found ? found.label : r.reason}</span>
      }
    },
    { key: 'cost_price', header: 'سعر الشراء', render: (r) => `${Number(r.cost_price || 0).toFixed(3)} د.ت` },
    {
      key: 'total_cost',
      header: 'التكلفة الإجمالية',
      render: (r) => `${(Number(r.quantity || 0) * Number(r.cost_price || 0)).toFixed(3)} د.ت`
    },
    { key: 'occurred_at', header: 'التاريخ', render: (r) => new Date(r.occurred_at).toLocaleDateString('ar-TN') },
  ]

  const movementsColumns = [
    { key: 'product_name', header: 'المنتج' },
    { key: 'movement_type', header: 'النوع', render: (r) => {
      const types = {
        restock: 'إضافة مخزون',
        sale: 'بيع',
        loss: 'تلف',
        return: 'إرجاع',
        adjustment: 'تعديل',
      }
      return types[r.movement_type] || r.movement_type
    }},
    { key: 'quantity_change', header: 'الكمية', render: (r) => {
      const val = Number(r.quantity_change || 0)
      return <span className={val > 0 ? 'text-emerald-500' : 'text-rose-500'}>{val > 0 ? '+' : ''}{val}</span>
    }},
    { key: 'cost_price', header: 'سعر الشراء', render: (r) => `${Number(r.cost_price || 0).toFixed(3)} د.ت` },
    { key: 'notes', header: 'ملاحظات' },
    { key: 'created_at', header: 'التاريخ', render: (r) => new Date(r.created_at).toLocaleDateString('ar-TN') },
  ]

  return (
    <>
      <PageHeader
        title="المخزون"
        subtitle="إدارة دفعات المخزون والتالف والحركات"
        action={
          <div className="flex gap-2 flex-wrap">
            <Button variant="success" icon="fa-solid fa-boxes-stacked" onClick={() => setAddModal(true)}>إضافة مخزون</Button>
            <Button variant="danger" icon="fa-solid fa-bolt" onClick={() => setDamageModal(true)}>تسجيل تلف</Button>
          </div>
        }
      />

      <div className="flex gap-2 mb-4 flex-wrap">
        {['stock', 'damage', 'movements'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-xs font-medium rounded-lg ${
              tab === t
                ? 'bg-[#445b7a] text-white'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
            }`}
          >
            {t === 'stock' && <><i className="fa-solid fa-boxes-stacked ml-1" /> دفعات المخزون</>}
            {t === 'damage' && <><i className="fa-solid fa-triangle-exclamation ml-1" /> سجل التالف</>}
            {t === 'movements' && <><i className="fa-solid fa-clock-rotate-left ml-1" /> حركات المخزون</>}
          </button>
        ))}
      </div>

      {/* Damage Summary Cards */}
      {tab === 'damage' && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
          <KpiCard label="إجمالي التالف" value={damageSummary.total_count || 0} icon="fa-solid fa-list" iconBg="bg-gray-50 dark:bg-gray-700" iconColor="text-gray-600" />
          <KpiCard label="الكمية المفقودة" value={damageSummary.total_quantity || 0} icon="fa-solid fa-cubes" iconBg="bg-blue-50 dark:bg-blue-900/20" iconColor="text-blue-600" />
          <KpiCard label="التكلفة الإجمالية" value={`${(damageSummary.total_cost || 0).toFixed(3)} د.ت`} icon="fa-solid fa-coins" iconBg="bg-amber-50 dark:bg-amber-900/20" iconColor="text-amber-600" />
          <KpiCard label="تالف" value={damageSummary.damaged || 0} icon="fa-solid fa-bolt" iconBg="bg-amber-50 dark:bg-amber-900/20" iconColor="text-amber-600" />
          <KpiCard label="مسروق" value={damageSummary.stolen || 0} icon="fa-solid fa-user-secret" iconBg="bg-rose-50 dark:bg-rose-900/20" iconColor="text-rose-600" />
        </div>
      )}

      {tab === 'stock' && (
        <Card>
          <DataTable columns={stockColumns} rows={stockItems} loading={stockLoading} emptyText="لا توجد دفعات مخزون" />
          <Pagination page={stockPg.page} limit={stockPg.limit} total={stockTotal} onPageChange={stockPg.goToPage} />
        </Card>
      )}

      {tab === 'damage' && (
        <Card>
          <DataTable columns={damageColumns} rows={damageItems} loading={damageLoading} emptyText="لا توجد سجلات تلف" />
          <Pagination page={damagePg.page} limit={damagePg.limit} total={damageTotal} onPageChange={damagePg.goToPage} />
        </Card>
      )}

      {tab === 'movements' && (
        <Card>
          <DataTable columns={movementsColumns} rows={movements} loading={movementsLoading} emptyText="لا توجد حركات مخزون" />
          <Pagination page={movementsPg.page} limit={movementsPg.limit} total={movementsData?.total || 0} onPageChange={movementsPg.goToPage} />
        </Card>
      )}

      {/* ================= RESTOCK MODAL ================= */}
      <Modal
        open={addModal}
        onClose={() => setAddModal(false)}
        title="إضافة مخزون جديد"
        footer={
          <>
            <Button variant="ghost" onClick={() => setAddModal(false)}>إلغاء</Button>
            <Button
              loading={addStockMut.isPending}
              onClick={() => {
                if (!stockForm.product_id) { toast.error('يرجى اختيار منتج'); return }
                if (!stockForm.cost_price || Number(stockForm.cost_price) <= 0) { toast.error('سعر الشراء مطلوب'); return }
                if (!stockForm.quantity || Number(stockForm.quantity) <= 0) { toast.error('الكمية مطلوبة'); return }
                addStockMut.mutate({
                  product_id: stockForm.product_id,
                  cost_price: Number(stockForm.cost_price),
                  quantity: Number(stockForm.quantity),
                  supplier: stockForm.supplier || undefined,
                  invoice_ref: stockForm.invoice_ref || undefined,
                })
              }}
            >
              حفظ المخزون
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ابحث عن المنتج</label>
            <Input
              value={stockForm.productSearch}
              onChange={(e) => setStockForm({ ...stockForm, productSearch: e.target.value, product_id: '' })}
              placeholder="اكتب اسم المنتج..."
            />
            {stockForm.productSearch && !stockForm.product_id && searchResultsStock?.products?.length > 0 && (
              <ul className="mt-1 max-h-40 overflow-y-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
                {searchResultsStock.products.map((p) => (
                  <li
                    key={p.id}
                    onClick={() => setStockForm({ ...stockForm, productSearch: p.name, product_id: p.id })}
                    className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-sm text-gray-800 dark:text-gray-200 flex justify-between"
                  >
                    <span>{p.name}</span>
                    <span className="text-xs text-gray-400">مخزون: {p.current_stock || 0}</span>
                  </li>
                ))}
              </ul>
            )}
            {stockForm.product_id && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">✓ المنتج مختار: {stockForm.productSearch}</p>
            )}
          </div>

          <Input
            label="سعر الشراء (د.ت)"
            type="number"
            step="0.001"
            value={stockForm.cost_price}
            onChange={(e) => setStockForm({ ...stockForm, cost_price: e.target.value })}
            required
          />
          <Input
            label="الكمية"
            type="number"
            value={stockForm.quantity}
            onChange={(e) => setStockForm({ ...stockForm, quantity: e.target.value })}
            required
          />
          <Input
            label="المورد"
            value={stockForm.supplier}
            onChange={(e) => setStockForm({ ...stockForm, supplier: e.target.value })}
          />
          <Input
            label="رقم الفاتورة"
            value={stockForm.invoice_ref}
            onChange={(e) => setStockForm({ ...stockForm, invoice_ref: e.target.value })}
          />
        </div>
      </Modal>

      {/* ================= DAMAGE MODAL ================= */}
      <Modal
        open={damageModal}
        onClose={() => setDamageModal(false)}
        title="تسجيل تلف أو فقدان"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDamageModal(false)}>إلغاء</Button>
            <Button
              variant="danger"
              loading={damageMut.isPending}
              onClick={() => {
                if (!damageForm.product_id) { toast.error('يرجى اختيار منتج'); return }
                if (!damageForm.quantity || Number(damageForm.quantity) <= 0) { toast.error('الكمية مطلوبة'); return }
                damageMut.mutate({
                  product_id: damageForm.product_id,
                  quantity: Number(damageForm.quantity),
                  reason: damageForm.reason,
                  notes: damageForm.notes || undefined,
                })
              }}
            >
              حفظ
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ابحث عن المنتج</label>
            <Input
              value={damageForm.productSearch}
              onChange={(e) => setDamageForm({ ...damageForm, productSearch: e.target.value, product_id: '' })}
              placeholder="اكتب اسم المنتج..."
            />
            {damageForm.productSearch && !damageForm.product_id && searchResultsDamage?.products?.length > 0 && (
              <ul className="mt-1 max-h-40 overflow-y-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
                {searchResultsDamage.products.map((p) => (
                  <li
                    key={p.id}
                    onClick={() => setDamageForm({ ...damageForm, productSearch: p.name, product_id: p.id })}
                    className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-sm text-gray-800 dark:text-gray-200 flex justify-between"
                  >
                    <span>{p.name}</span>
                    <span className="text-xs text-gray-400">مخزون: {p.current_stock || 0}</span>
                  </li>
                ))}
              </ul>
            )}
            {damageForm.product_id && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">✓ المنتج مختار: {damageForm.productSearch}</p>
            )}
          </div>

          <Input
            label="الكمية المفقودة أو التالفة"
            type="number"
            value={damageForm.quantity}
            onChange={(e) => setDamageForm({ ...damageForm, quantity: e.target.value })}
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">السبب</label>
            <select
              value={damageForm.reason}
              onChange={(e) => setDamageForm({ ...damageForm, reason: e.target.value })}
              className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#445b7a] text-sm text-gray-800 dark:text-gray-200"
            >
              {DAMAGE_REASONS.map((opt) => (
                <option key={opt.key} value={opt.key}>{opt.label}</option>
              ))}
            </select>
          </div>

          <Input
            label="ملاحظات"
            value={damageForm.notes}
            onChange={(e) => setDamageForm({ ...damageForm, notes: e.target.value })}
          />
        </div>
      </Modal>
    </>
  )
}
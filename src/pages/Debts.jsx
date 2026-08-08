import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { getDebts, createDebt, updateDebt, deleteDebt, payDebt, exportDebts } from '../api/endpoints'
import { usePagination } from '../hooks/usePagination'
import { usePermissions } from '../hooks/usePermissions'
import PageHeader from '../components/UI/PageHeader'
import Card from '../components/UI/Card'
import Button from '../components/UI/Button'
import DataTable from '../components/UI/DataTable'
import Pagination from '../components/UI/Pagination'
import Modal from '../components/UI/Modal'
import { Input } from '../components/UI/Input'

const STATUS_STYLES = {
  active: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  paid: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  overdue: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
  cancelled: 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400',
}

const STATUS_LABELS = {
  active: 'نشط',
  paid: 'مدفوع',
  overdue: 'متأخر',
  cancelled: 'ملغي',
}

const EMPTY_FORM = { customer_name: '', customer_phone: '', total_amount: '', due_date: '', notes: '' }

export default function Debts() {
  const { canManageDebts } = usePermissions()
  const { page, limit, offset, goToPage } = usePagination(10)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [payModal, setPayModal] = useState(null)
  const [payAmount, setPayAmount] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['debts', limit, offset, statusFilter, search],
    queryFn: () => getDebts({ limit, offset, status: statusFilter || undefined, customer_name: search || undefined }),
    enabled: canManageDebts,
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['debts'] })

  const createMut = useMutation({
    mutationFn: createDebt,
    onSuccess: () => { toast.success('تمت إضافة الدين'); invalidate(); closeModal() },
    onError: (e) => toast.error(e?.response?.data?.error || 'فشلت العملية'),
  })

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => updateDebt(id, data),
    onSuccess: () => { toast.success('تم تحديث الدين'); invalidate(); closeModal() },
    onError: (e) => toast.error(e?.response?.data?.error || 'فشلت العملية'),
  })

  const deleteMut = useMutation({
    mutationFn: deleteDebt,
    onSuccess: () => { toast.success('تم حذف الدين'); invalidate() },
    onError: (e) => toast.error(e?.response?.data?.error || 'فشلت العملية'),
  })

  const payMut = useMutation({
    mutationFn: payDebt,
    onSuccess: () => { toast.success('تم تسجيل الدفعة'); invalidate(); setPayModal(null); setPayAmount('') },
    onError: (e) => toast.error(e?.response?.data?.error || 'فشلت العملية'),
  })

  const exportMut = useMutation({
    mutationFn: exportDebts,
    onSuccess: (data) => {
      const blob = new Blob([data], { type: 'text/csv;charset=utf-8' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `debts-${new Date().toISOString().split('T')[0]}.csv`
      link.click()
      toast.success('تم تصدير الديون')
    },
    onError: () => toast.error('فشل تصدير الديون'),
  })

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setModalOpen(true) }
  const openEdit = (debt) => {
    setEditing(debt)
    setForm({
      customer_name: debt.customer_name || '',
      customer_phone: debt.customer_phone || '',
      total_amount: debt.total_amount || '',
      due_date: debt.due_date?.split('T')[0] || '',
      notes: debt.notes || '',
    })
    setModalOpen(true)
  }
  const closeModal = () => { setModalOpen(false); setEditing(null); setForm(EMPTY_FORM) }

  const handleSubmit = (e) => {
    e.preventDefault()
    const payload = {
      customer_name: form.customer_name,
      customer_phone: form.customer_phone || undefined,
      total_amount: Number(form.total_amount),
      due_date: form.due_date || undefined,
      notes: form.notes || undefined,
    }
    editing ? updateMut.mutate({ id: editing.id, data: payload }) : createMut.mutate(payload)
  }

  if (!canManageDebts) {
    return (
      <Card className="p-8 text-center text-sm text-gray-500 dark:text-gray-400">
        لا تملك صلاحية الوصول إلى إدارة الديون
      </Card>
    )
  }

  const debts = data?.debts || []
  const total = data?.total ?? debts.length

  const columns = [
    { key: 'customer_name', header: 'العميل' },
    { key: 'customer_phone', header: 'الهاتف' },
    {
      key: 'total_amount',
      header: 'المبلغ',
      render: (r) => `${Number(r.total_amount || 0).toFixed(3)} د.ت`
    },
    {
      key: 'amount_paid',
      header: 'المدفوع',
      render: (r) => `${Number(r.amount_paid || 0).toFixed(3)} د.ت`
    },
    {
      key: 'remaining_balance',
      header: 'المتبقي',
      render: (r) => {
        const remaining = Number(r.total_amount || 0) - Number(r.amount_paid || 0)
        return `${remaining.toFixed(3)} د.ت`
      }
    },
    {
      key: 'status',
      header: 'الحالة',
      render: (r) => (
        <span className={`px-2 py-1 rounded-full text-[10px] font-medium ${STATUS_STYLES[r.status] || STATUS_STYLES.active}`}>
          {STATUS_LABELS[r.status] || r.status}
        </span>
      ),
    },
    {
      key: 'due_date',
      header: 'تاريخ الاستحقاق',
      render: (r) => r.due_date ? new Date(r.due_date).toLocaleDateString('ar-TN') : '—'
    },
    {
      key: 'actions',
      header: '',
      render: (r) => {
        const remaining = Number(r.total_amount || 0) - Number(r.amount_paid || 0)
        return (
          <div className="flex gap-2">
            {remaining > 0 && r.status !== 'paid' && (
              <button
                onClick={() => { setPayModal(r); setPayAmount('') }}
                className="text-emerald-500 hover:text-emerald-700 text-xs"
                title="سداد"
              >
                <i className="fa-solid fa-hand-holding-dollar" />
              </button>
            )}
            <button onClick={() => openEdit(r)} className="text-blue-500 hover:text-blue-700 text-xs">
              <i className="fa-solid fa-pen" />
            </button>
            <button onClick={() => deleteMut.mutate(r.id)} className="text-rose-500 hover:text-rose-700 text-xs">
              <i className="fa-solid fa-trash" />
            </button>
          </div>
        )
      },
    },
  ]

  return (
    <>
      <PageHeader
        title="الديون"
        subtitle="إدارة ديون العملاء والسداد"
        action={
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" icon="fa-solid fa-file-export" onClick={() => exportMut.mutate()}>
              تصدير
            </Button>
            <Button icon="fa-solid fa-plus" onClick={openCreate}>إضافة دين</Button>
          </div>
        }
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <i className="fa-solid fa-magnifying-glass absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
          <input
            className="w-full pr-9 pl-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#445b7a]"
            placeholder="ابحث عن عميل..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
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
      </div>

      <Card>
        <DataTable columns={columns} rows={debts} loading={isLoading} emptyText="لا توجد ديون مسجلة" />
        <Pagination page={page} limit={limit} total={total} onPageChange={goToPage} />
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editing ? 'تعديل دين' : 'إضافة دين'}
        footer={
          <>
            <Button variant="ghost" onClick={closeModal}>إلغاء</Button>
            <Button onClick={handleSubmit} loading={createMut.isPending || updateMut.isPending}>حفظ</Button>
          </>
        }
      >
        <form onSubmit={handleSubmit}>
          <Input
            label="اسم العميل"
            value={form.customer_name}
            onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
            required
          />
          <Input
            label="رقم الهاتف"
            value={form.customer_phone}
            onChange={(e) => setForm({ ...form, customer_phone: e.target.value })}
            placeholder="+216XXXXXXXX"
          />
          <Input
            label="المبلغ (د.ت)"
            type="number"
            step="0.001"
            value={form.total_amount}
            onChange={(e) => setForm({ ...form, total_amount: e.target.value })}
            required
          />
          <Input
            label="تاريخ الاستحقاق"
            type="date"
            value={form.due_date}
            onChange={(e) => setForm({ ...form, due_date: e.target.value })}
          />
          <Input
            label="ملاحظات"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
        </form>
      </Modal>

      {/* Payment Modal */}
      <Modal
        open={!!payModal}
        onClose={() => setPayModal(null)}
        title={`سداد دين — ${payModal?.customer_name || ''}`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setPayModal(null)}>إلغاء</Button>
            <Button
              variant="success"
              loading={payMut.isPending}
              onClick={() => {
                const amount = Number(payAmount)
                if (!amount || amount <= 0) {
                  toast.error('المبلغ مطلوب')
                  return
                }
                const remaining = Number(payModal.total_amount || 0) - Number(payModal.amount_paid || 0)
                if (amount > remaining) {
                  toast.error(`لا يمكن أن يتجاوز ${remaining.toFixed(3)} د.ت`)
                  return
                }
                payMut.mutate({ debt_id: payModal.id, amount_paid: amount })
              }}
            >
              تأكيد الدفع
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">المبلغ الكلي:</span>
            <span className="font-bold text-gray-800 dark:text-white">{Number(payModal?.total_amount || 0).toFixed(3)} د.ت</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">المدفوع:</span>
            <span className="font-bold text-gray-800 dark:text-white">{Number(payModal?.amount_paid || 0).toFixed(3)} د.ت</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">المتبقي:</span>
            <span className="font-bold text-rose-500">
              {(Number(payModal?.total_amount || 0) - Number(payModal?.amount_paid || 0)).toFixed(3)} د.ت
            </span>
          </div>
          <Input
            label="مبلغ الدفعة"
            type="number"
            step="0.001"
            value={payAmount}
            onChange={(e) => setPayAmount(e.target.value)}
            required
          />
        </div>
      </Modal>
    </>
  )
}
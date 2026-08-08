import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { getStores, createStore, switchStore } from '../api/endpoints'
import { usePermissions } from '../hooks/usePermissions'
import { useAuth } from '../contexts/AuthContext'
import PageHeader from '../components/UI/PageHeader'
import Card from '../components/UI/Card'
import Button from '../components/UI/Button'
import Modal from '../components/UI/Modal'
import { Input } from '../components/UI/Input'

export default function Stores() {
  const { canManageStores } = usePermissions()
  const { updateUserToken } = useAuth()
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ name: '', address: '' })
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['stores'],
    queryFn: getStores,
    enabled: canManageStores,
  })

  const createMut = useMutation({
    mutationFn: createStore,
    onSuccess: () => {
      toast.success('تم إنشاء المتجر')
      queryClient.invalidateQueries({ queryKey: ['stores'] })
      setModalOpen(false)
      setForm({ name: '', address: '' })
    },
    onError: (e) => toast.error(e?.response?.data?.error || 'فشلت العملية'),
  })

  const switchMut = useMutation({
    mutationFn: switchStore,
    onSuccess: (data) => {
      toast.success('تم التبديل إلى المتجر المحدد')
      if (data?.token) updateUserToken(data.token, data.user)
    },
    onError: (e) => toast.error(e?.response?.data?.error || 'فشلت العملية'),
  })

  if (!canManageStores) {
    return (
      <Card className="p-8 text-center text-sm text-gray-500 dark:text-gray-400">
        هذه الميزة متاحة فقط لخطة Premium
      </Card>
    )
  }

  const stores = data?.items || data?.stores || []

  return (
    <>
      <PageHeader
        title="المتاجر"
        subtitle="إدارة المتاجر المتعددة والتبديل بينها"
        action={<Button icon="fa-solid fa-plus" onClick={() => setModalOpen(true)}>إنشاء متجر</Button>}
      />

      {isLoading && <p className="text-xs text-gray-400">جارِ التحميل...</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stores.map((store) => (
          <Card key={store.id} className="p-5 flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#445b7a]/10 text-[#445b7a] dark:text-blue-400 flex items-center justify-center">
                <i className="fa-solid fa-store" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-800 dark:text-white">{store.name}</p>
                <p className="text-xs text-gray-400">{store.address}</p>
              </div>
            </div>
            <Button variant="outline" onClick={() => switchMut.mutate(store.id)} loading={switchMut.isPending}>
              التبديل لهذا المتجر
            </Button>
          </Card>
        ))}
        {!isLoading && stores.length === 0 && (
          <Card className="p-8 text-center text-sm text-gray-500 dark:text-gray-400 col-span-full">لا توجد متاجر بعد</Card>
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="إنشاء متجر جديد"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>إلغاء</Button>
            <Button loading={createMut.isPending} onClick={() => createMut.mutate(form)}>حفظ</Button>
          </>
        }
      >
        <Input label="اسم المتجر" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <Input label="العنوان" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
      </Modal>
    </>
  )
}

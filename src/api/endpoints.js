// src/api/endpoints.js
import api from './client'

// ---- AUTH ----
export const login = (data) => api.post('/api/auth/login', data).then((r) => r.data)
export const registerManager = (data) => api.post('/api/auth/manager/register', data).then((r) => r.data)
export const registerClient = (data) => api.post('/api/auth/client/register', data).then((r) => r.data)
export const validateSession = () => api.get('/api/auth/validate-session').then((r) => r.data)

// ---- DASHBOARD ----
export const getDashboardStats = () => api.get('/api/dashboard/stats').then((r) => r.data)
export const getGlobalDashboard = () => api.get('/api/dashboard/global').then((r) => r.data)

// ---- PRODUCTS ----
export const getProducts = (params) => api.get('/api/products', { params }).then((r) => r.data)
export const createProduct = (data) => api.post('/api/products', data).then((r) => r.data)
export const updateProduct = (id, data) => api.put(`/api/products/${id}`, data).then((r) => r.data)
export const deleteProduct = (id) => api.delete(`/api/products/${id}`).then((r) => r.data)

// ---- SALES ----
export const getSales = (params) => api.get('/api/sales', { params }).then((r) => r.data)
export const createSale = (data) => api.post('/api/sales', data).then((r) => r.data)
export const updateSale = (id, data) => api.put(`/api/sales/${id}`, data).then((r) => r.data)
export const deleteSale = (id) => api.delete(`/api/sales/${id}`).then((r) => r.data)

// ---- ORDERS ----
export const getOrders = (params) => api.get('/api/orders', { params }).then((r) => r.data)
export const createOrder = (data) => api.post('/api/orders', data).then((r) => r.data)
export const createFlatOrder = (data) => api.post('/api/orders/flat', data).then((r) => r.data)
export const updateOrder = (id, data) => api.put(`/api/orders/${id}`, data).then((r) => r.data)
export const deleteOrder = (id) => api.delete(`/api/orders/${id}`).then((r) => r.data)
export const cancelOrder = (data) => api.post('/api/orders/cancel', data).then((r) => r.data)
export const deliverOrder = (data) => api.post('/api/orders/deliver', data).then((r) => r.data)
export const setOrderPrice = (id, data) => api.put(`/api/orders/${id}/price`, data).then((r) => r.data)
export const updateOrderStatus = (data) => api.put('/api/order-status', data).then((r) => r.data)

// ---- STOCK ----
export const getStock = (params) => api.get('/api/stock', { params }).then((r) => r.data)
export const addStock = (data) => api.post('/api/stock', data).then((r) => r.data)
export const reportDamage = (data) => api.post('/api/stock/damage', data).then((r) => r.data)
export const getDamageList = (params) => api.get('/api/stock/damage-list', { params }).then((r) => r.data)
export const getStockMovements = (params) => api.get('/api/stock/movements', { params }).then((r) => r.data)

// ---- DEBTS ----
export const getDebts = (params) => api.get('/api/debts', { params }).then((r) => r.data)
export const createDebt = (data) => api.post('/api/debts', data).then((r) => r.data)
export const updateDebt = (id, data) => api.put(`/api/debts/${id}`, data).then((r) => r.data)
export const deleteDebt = (id) => api.delete(`/api/debts/${id}`).then((r) => r.data)
export const payDebt = (data) => api.post('/api/debt-pay', data).then((r) => r.data)
export const exportDebts = () => api.get('/api/debts/export', { responseType: 'blob' }).then((r) => r.data)

// ---- EMPLOYEES ----
export const getEmployees = (params) => api.get('/api/employees', { params }).then((r) => r.data)
export const createEmployee = (data) => api.post('/api/employees', data).then((r) => r.data)
export const updateEmployee = (id, data) => api.put(`/api/employees/${id}`, data).then((r) => r.data)
export const deleteEmployee = (id) => api.delete(`/api/employees/${id}`).then((r) => r.data)
export const toggleEmployeeStatus = (id, data) => api.patch(`/api/employees/${id}`, data).then((r) => r.data)

// ---- CLIENTS ----
export const getClients = (params) => api.get('/api/clients', { params }).then((r) => r.data)
export const createClient = (data) => api.post('/api/clients', data).then((r) => r.data)
export const updateClient = (id, data) => api.put(`/api/clients/${id}`, data).then((r) => r.data)
export const deleteClient = (id) => api.delete(`/api/clients/${id}`).then((r) => r.data)

// ---- STORES ----
export const getStores = () => api.get('/api/stores').then((r) => r.data)
export const createStore = (data) => api.post('/api/stores', data).then((r) => r.data)
export const switchStore = (id) => api.post(`/api/stores/${id}/switch`).then((r) => r.data)
export const getStoreSettings = (id) => api.get(`/api/stores/${id}/settings`).then((r) => r.data)
export const updateStoreSettings = (id, data) => api.put(`/api/stores/${id}/settings`, data).then((r) => r.data)

// ---- FINANCIALS ----
export const getDailyFinancials = (params) => api.get('/api/financials/daily', { params }).then((r) => r.data)
export const getFinancialSummary = (params) => api.get('/api/financials/summary', { params }).then((r) => r.data)

// ---- REPORTS ----
export const getDailyReport = () => api.get('/api/reports/daily').then((r) => r.data)

// ---- BARCODE ----
export const scanBarcode = async (barcode, action = 'pos-add') => {
  const token = localStorage.getItem('pos_token')
  if (!token) {
    throw new Error('No token found')
  }

  const url = `https://opalex1234.vercel.app/api/barcode?barcode=${encodeURIComponent(barcode)}&action=${action}`
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
    }
  })

  if (!response.ok) {
    const data = await response.json()
    throw new Error(data.error || 'Failed to scan barcode')
  }

  return response.json()
}
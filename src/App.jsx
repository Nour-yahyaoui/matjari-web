// src/App.jsx
import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Products from './pages/Products'
import Sales from './pages/Sales'
import Orders from './pages/Orders'
import Stock from './pages/Stock'
import Debts from './pages/Debts'
import Employees from './pages/Employees'
import Stores from './pages/Stores'
import Financials from './pages/Financials'
import Renew from './pages/Renew'  // ✅ ADD THIS
import NotFound from './pages/NotFound'
import DashboardLayout from './components/Layout/DashboardLayout'
import ProtectedRoute from './components/ProtectedRoute'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register/manager" element={<Register type="manager" />} />
      <Route path="/register/client" element={<Register type="client" />} />
      <Route path="/register/:type" element={<Register />} />

      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/products" element={<Products />} />
        <Route path="/sales" element={<Sales />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/stock" element={<Stock />} />
        <Route path="/debts" element={<Debts />} />
        <Route path="/employees" element={<Employees />} />
        <Route path="/stores" element={<Stores />} />
        <Route path="/financials" element={<Financials />} />
      </Route>

      {/* ✅ Public Renew Route */}
      <Route path="/renew" element={<Renew />} />

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
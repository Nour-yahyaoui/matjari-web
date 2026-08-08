import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, initializing } = useAuth()

  if (initializing) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#f1f5f9] dark:bg-gray-900">
        <i className="fa-solid fa-spinner fa-spin text-2xl text-[#445b7a]" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return children
}

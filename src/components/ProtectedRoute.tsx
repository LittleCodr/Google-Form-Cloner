import type { ReactNode } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAdmin } from '../contexts/AdminContext'

type ProtectedRouteProps = {
  children?: ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated } = useAdmin()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/admin" replace state={{ from: location.pathname }} />
  }

  if (children) {
    return <>{children}</>
  }

  return <Outlet />
}

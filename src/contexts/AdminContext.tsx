import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { PropsWithChildren } from 'react'

const ADMIN_PASSCODE = '140608'
const STORAGE_KEY = 'gfc_admin_session'

type AdminContextValue = {
  isAuthenticated: boolean
  login: (passcode: string) => boolean
  logout: () => void
}

const AdminContext = createContext<AdminContextValue | undefined>(undefined)

export function AdminProvider({ children }: PropsWithChildren) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const stored = window.localStorage.getItem(STORAGE_KEY)
    setIsAuthenticated(stored === ADMIN_PASSCODE)
  }, [])

  const login = useCallback((passcode: string) => {
    const isValid = passcode.trim() === ADMIN_PASSCODE

    if (typeof window !== 'undefined') {
      if (isValid) {
        window.localStorage.setItem(STORAGE_KEY, ADMIN_PASSCODE)
      } else {
        window.localStorage.removeItem(STORAGE_KEY)
      }
    }

    setIsAuthenticated(isValid)
    return isValid
  }, [])

  const logout = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(STORAGE_KEY)
    }
    setIsAuthenticated(false)
  }, [])

  const value = useMemo(
    () => ({
      isAuthenticated,
      login,
      logout,
    }),
    [isAuthenticated, login, logout],
  )

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>
}

export function useAdmin() {
  const context = useContext(AdminContext)

  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider')
  }

  return context
}

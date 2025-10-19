'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

export type UserRole = 'jobseeker' | 'employer' | null

interface UserContextType {
  userRole: UserRole
  setUserRole: (role: UserRole) => void
  isLoggedIn: boolean
  login: (role: UserRole) => void
  logout: () => void
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: ReactNode }) {
  const [userRole, setUserRole] = useState<UserRole>(null)

  const isLoggedIn = userRole !== null

  const login = (role: UserRole) => {
    setUserRole(role)
  }

  const logout = () => {
    setUserRole(null)
  }

  return (
    <UserContext.Provider value={{
      userRole,
      setUserRole,
      isLoggedIn,
      login,
      logout
    }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}
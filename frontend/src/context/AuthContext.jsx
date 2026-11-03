import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { setAuth, getToken, getStoredUser, clearAuth } from '../lib/storage.js'
import { UNAUTHORIZED_EVENT } from '../lib/api.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser)
  const [token, setToken] = useState(getToken)

  function loginUser(token, user) {
    setAuth(token, user)
    setToken(token)
    setUser(user)
  }

  const logoutUser = useCallback(() => {
    clearAuth()
    setToken('')
    setUser(null)
  }, [])

  // An expired or invalid token means the stored session is useless; drop it.
  useEffect(() => {
    window.addEventListener(UNAUTHORIZED_EVENT, logoutUser)
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, logoutUser)
  }, [logoutUser])

  return (
    <AuthContext.Provider value={{ user, token, loginUser, logoutUser, isAuthenticated: !!user && !!token }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}

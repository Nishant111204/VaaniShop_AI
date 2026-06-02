import React, { createContext, useContext, useState } from 'react'
import { setAuth, getToken, getStoredUser, clearAuth } from '../lib/storage.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser)
  const [token, setToken] = useState(getToken)

  function loginUser(token, user) {
    setAuth(token, user)
    setToken(token)
    setUser(user)
  }

  function logoutUser() {
    clearAuth()
    setToken('')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, loginUser, logoutUser, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}

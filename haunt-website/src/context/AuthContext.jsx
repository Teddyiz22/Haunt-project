import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { getCurrentUser, loginAccount, registerAccount } from '../services/authService.js'

const AuthContext = createContext(null)
const TOKEN_STORAGE_KEY = 'haunt-auth-token'

function loadStoredToken() {
  try {
    return window.localStorage.getItem(TOKEN_STORAGE_KEY) || ''
  } catch {
    return ''
  }
}

function storeToken(token) {
  try {
    if (token) window.localStorage.setItem(TOKEN_STORAGE_KEY, token)
    else window.localStorage.removeItem(TOKEN_STORAGE_KEY)
  } catch {
    // Private browsing or a full store must not break sign-in.
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(loadStoredToken)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(Boolean(loadStoredToken()))

  // Restore the session on load: a stored token is only trusted after the
  // API confirms it with /api/auth/me. A 401 clears the stored token.
  useEffect(() => {
    if (!token) {
      setLoading(false)
      return undefined
    }
    let cancelled = false
    setLoading(true)
    getCurrentUser(token)
      .then((payload) => {
        if (!cancelled) setUser(payload.data.user)
      })
      .catch(() => {
        if (!cancelled) {
          storeToken('')
          setToken('')
          setUser(null)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [token])

  const login = useCallback(async (payload) => {
    const result = await loginAccount(payload)
    const nextToken = result.data.token
    const nextUser = result.data.user
    storeToken(nextToken)
    setToken(nextToken)
    setUser(nextUser)
    return nextUser
  }, [])

  const register = useCallback(async (payload) => {
    const result = await registerAccount(payload)
    const nextToken = result.data.token
    const nextUser = result.data.user
    storeToken(nextToken)
    setToken(nextToken)
    setUser(nextUser)
    return nextUser
  }, [])

  const logout = useCallback(() => {
    storeToken('')
    setToken('')
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({ user, token, loading, isSignedIn: Boolean(user), login, register, logout }),
    [user, token, loading, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const auth = useContext(AuthContext)
  if (!auth) throw new Error('useAuth must be used inside an AuthProvider.')
  return auth
}

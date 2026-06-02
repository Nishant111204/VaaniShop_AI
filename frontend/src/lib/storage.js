const TOKEN_KEY = 'vaanishopai:token'
const USER_KEY  = 'vaanishopai:user'

export function setAuth(token, user) {
  try {
    localStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(USER_KEY, JSON.stringify(user))
  } catch { /* ignore */ }
}

export function getToken() {
  try { return localStorage.getItem(TOKEN_KEY) || '' } catch { return '' }
}

export function getStoredUser() {
  try { return JSON.parse(localStorage.getItem(USER_KEY) || 'null') } catch { return null }
}

export function clearAuth() {
  try {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  } catch { /* ignore */ }
}

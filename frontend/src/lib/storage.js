const TOKEN_KEY = 'vaanishopai:token'
const USER_KEY  = 'vaanishopai:user'
const DRAFT_KEY = 'vaanishopai:draft'
const LANG_KEY  = 'vaanishopai:speech-lang'

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

/** The unpublished shop preview, kept per tab so a refresh or sign-in doesn't lose it. */
export function saveDraft(draft) {
  try { sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft)) } catch { /* ignore */ }
}

export function loadDraft() {
  try { return JSON.parse(sessionStorage.getItem(DRAFT_KEY) || 'null') } catch { return null }
}

export function clearDraft() {
  try { sessionStorage.removeItem(DRAFT_KEY) } catch { /* ignore */ }
}

export function getSpeechLanguage() {
  try { return localStorage.getItem(LANG_KEY) || null } catch { return null }
}

export function setSpeechLanguage(code) {
  try {
    if (code) localStorage.setItem(LANG_KEY, code)
    else localStorage.removeItem(LANG_KEY)
  } catch { /* ignore */ }
}

/** Customer's basket on a shop page, kept per shop on this device. */
export function loadBasket(shopKey) {
  try { return JSON.parse(localStorage.getItem(`vaanishopai:basket:${shopKey}`) || '{}') } catch { return {} }
}

export function saveBasket(shopKey, basket) {
  try { localStorage.setItem(`vaanishopai:basket:${shopKey}`, JSON.stringify(basket)) } catch { /* ignore */ }
}

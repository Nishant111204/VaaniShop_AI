import { getToken } from './storage.js'

const BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080'

function authHeaders() {
  const token = getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function request(path, { method = 'GET', headers, body } = {}) {
  const res = await fetch(`${BASE_URL}${path}`, { method, headers, body })
  const contentType = res.headers.get('content-type') || ''
  const payload = contentType.includes('application/json') ? await res.json() : await res.text()
  if (!res.ok) {
    const msg = payload?.message || payload?.error || (typeof payload === 'string' ? payload : 'Request failed')
    const err = new Error(msg)
    err.status = res.status
    err.payload = payload
    throw err
  }
  return payload
}

// Auth
export async function register(name, phone, password) {
  return request('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, phone, password }),
  })
}

export async function login(phone, password) {
  return request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, password }),
  })
}

// Speech — language is an ISO-639-1 code e.g. "hi" | "mr" | "en" | null
export async function transcribeAudio(audioBlob, language = null) {
  const form = new FormData()
  form.append('audio', audioBlob, 'audio.webm')
  if (language) form.append('language', language)
  return request('/api/speech/transcribe', { method: 'POST', body: form })
}

// Shop
export async function createShopFromText(text) {
  return request('/api/shop/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ text }),
  })
}

export async function updateShopFromText(shopId, text) {
  return request('/api/shop/update', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ shopId, text }),
  })
}

export async function updateShopFields(shopId, fields) {
  return request(`/api/shop/${shopId}/fields`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(fields),
  })
}

/** Public shop fetch — increments view count server-side. */
export async function getShop(shopId) {
  return request(`/api/shop/${shopId}`)
}

/** Owner/manage fetch — no view count increment. */
export async function getOwnedShop(shopId) {
  return request(`/api/shop/manage/${shopId}`, { headers: authHeaders() })
}

/** Public slug-based fetch — increments view count server-side. */
export async function getShopBySlug(slug) {
  return request(`/api/shop/s/${slug}`)
}

export async function getMyShops() {
  return request('/api/shop/my', { headers: authHeaders() })
}

export async function deleteShop(shopId) {
  return request(`/api/shop/${shopId}`, { method: 'DELETE', headers: authHeaders() })
}

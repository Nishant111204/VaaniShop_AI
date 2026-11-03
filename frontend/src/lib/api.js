import { getToken } from './storage.js'

// Empty means same origin: the backend serves the built app, and Vite proxies /api in dev.
// Set VITE_BACKEND_URL only when the frontend is hosted separately from the API.
const BASE_URL = import.meta.env.VITE_BACKEND_URL || ''

/** Fired when the server rejects our token, so AuthContext can sign the user out. */
export const UNAUTHORIZED_EVENT = 'vaanishop:unauthorized'

function authHeaders() {
  const token = getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function request(path, { method = 'GET', headers, body } = {}) {
  let res
  try {
    res = await fetch(`${BASE_URL}${path}`, { method, headers, body })
  } catch {
    const err = new Error('Could not reach the server. Check your internet connection and try again.')
    err.status = 0
    throw err
  }
  const contentType = res.headers.get('content-type') || ''
  const payload = contentType.includes('application/json') ? await res.json() : await res.text()
  if (!res.ok) {
    if (res.status === 401 && headers?.Authorization) {
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT))
    }
    const msg = payload?.message || payload?.error || (typeof payload === 'string' && payload) || 'Request failed'
    const err = new Error(msg)
    err.status = res.status
    err.payload = payload
    throw err
  }
  return payload
}

function json(method, path, data, auth = true) {
  return request(path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(auth ? authHeaders() : {}) },
    body: JSON.stringify(data),
  })
}

/** Uploaded photos are stored as "/api/images/{id}"; this makes them loadable. */
export function imageUrl(path) {
  return path ? `${BASE_URL}${path}` : ''
}

// Auth
export function register(name, phone, password) {
  return json('POST', '/api/auth/register', { name, phone, password }, false)
}

export function login(phone, password) {
  return json('POST', '/api/auth/login', { phone, password }, false)
}

// Speech — language is an ISO-639-1 code e.g. "hi" | "mr" | "en" | null
export function transcribeAudio(audioBlob, language = null, extension = 'webm') {
  const form = new FormData()
  form.append('audio', audioBlob, `audio.${extension}`)
  if (language) form.append('language', language)
  return request('/api/speech/transcribe', { method: 'POST', body: form })
}

// Shop
/** Builds a shop preview from a description. Works without an account; nothing is saved. */
export function generateShop(text) {
  return json('POST', '/api/shop/generate', { text }, false)
}

/** Saves a previewed shop under the signed-in account. */
export function publishShop(draft) {
  return json('POST', '/api/shop', draft)
}

/** Applies a spoken or typed change ("add mango juice for ₹30") to a saved shop. */
export function updateShopFromText(shopId, text) {
  return json('POST', '/api/shop/update', { shopId, text })
}

export function updateShopFields(shopId, fields) {
  return json('PUT', `/api/shop/${shopId}/fields`, fields)
}

export function uploadShopImage(shopId, blob) {
  const form = new FormData()
  form.append('image', blob, 'photo.jpg')
  return request(`/api/shop/${shopId}/images`, { method: 'POST', headers: authHeaders(), body: form })
}

/** Public shop fetch — increments view count server-side. */
export function getShop(shopId) {
  return request(`/api/shop/${shopId}`)
}

/** Public slug-based fetch — increments view count server-side. */
export function getShopBySlug(slug) {
  return request(`/api/shop/s/${encodeURIComponent(slug)}`)
}

/** Owner/manage fetch — no view count increment. */
export function getOwnedShop(shopId) {
  return request(`/api/shop/manage/${shopId}`, { headers: authHeaders() })
}

/** Daily visits and customer taps for one of your shops, oldest day first. */
export function getShopStats(shopId, days = 30) {
  return request(`/api/shop/${shopId}/stats?days=${days}`, { headers: authHeaders() })
}

/**
 * Tells the shop owner's insights that a customer tapped Order, WhatsApp, Call,
 * Directions or Share. Fire-and-forget: it must never slow down or break the tap.
 */
export function trackEvent(shopId, type) {
  const url = `${BASE_URL}/api/shop/${shopId}/events`
  const body = JSON.stringify({ type })
  try {
    if (navigator.sendBeacon?.(url, new Blob([body], { type: 'application/json' }))) return
  } catch { /* fall through to fetch */ }
  fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true }).catch(() => {})
}

export function getMyShops() {
  return request('/api/shop/my', { headers: authHeaders() })
}

export function deleteShop(shopId) {
  return request(`/api/shop/${shopId}`, { method: 'DELETE', headers: authHeaders() })
}

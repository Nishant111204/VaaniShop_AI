/**
 * Helpers shared by every place a shop is shown: themes, links, opening hours,
 * prices and the WhatsApp order message.
 */

/** Theme keys come from the AI and the backend; `accent` keeps white text at 4.5:1 or better. */
export const THEMES = {
  green:  { name: 'Tulsi green',  awning: '#2E9A5F', accent: '#1E7B4F', ink: '#0F3D27', soft: '#EAF5EE' },
  orange: { name: 'Genda orange', awning: '#F07D1E', accent: '#B85309', ink: '#5A2A06', soft: '#FFF1E3' },
  blue:   { name: 'Mor blue',     awning: '#2F6BE0', accent: '#2358C4', ink: '#0F2557', soft: '#EAF0FC' },
  purple: { name: 'Jamun purple', awning: '#8E4CCB', accent: '#7A3DB5', ink: '#35174F', soft: '#F3EBFA' },
  rose:   { name: 'Gulab pink',   awning: '#E2507A', accent: '#C42F5C', ink: '#5C1229', soft: '#FCECF1' },
  slate:  { name: 'Slate',        awning: '#4A5875', accent: '#3B4862', ink: '#19212F', soft: '#EEF0F4' },
}

export function getTheme(key) {
  return THEMES[key] || THEMES.slate
}

/** CSS variables a shop page reads its colours from. */
export function themeVars(key) {
  const t = getTheme(key)
  return { '--awning': t.awning, '--accent': t.accent, '--ink': t.ink, '--soft': t.soft }
}

const CATEGORY_EMOJI = {
  grocery: '🛒', kirana: '🛒', bakery: '🥐', sweets: '🍬', pharmacy: '💊', medical: '💊',
  electronics: '🔌', mobile: '📱', clothing: '👗', fashion: '👗', tailor: '🧵', footwear: '👟',
  restaurant: '🍛', cafe: '☕', food: '🍛', salon: '💇', beauty: '💄', hardware: '🔧',
  dairy: '🥛', stationery: '✏️', jewellery: '💍', jewelry: '💍', florist: '💐', flowers: '💐',
  gifts: '🎁', services: '🛠️', fruits: '🍎', vegetables: '🥬',
}

export function categoryEmoji(category) {
  return CATEGORY_EMOJI[(category || '').toLowerCase()] || '🛍️'
}

export function shopPath(shop) {
  return shop?.slug ? `/s/${shop.slug}` : `/shop/${shop?.shopId}`
}

export function shopUrl(shop) {
  return `${window.location.origin}${shopPath(shop)}`
}

/** wa.me needs the country code; Indian numbers are usually spoken without it. */
export function waNumber(contact) {
  let digits = (contact || '').replace(/\D/g, '')
  if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1)
  if (digits.length === 10) digits = `91${digits}`
  return digits.length >= 10 ? digits : ''
}

export function whatsappLink(contact, text = '') {
  const n = waNumber(contact)
  if (!n) return ''
  return `https://wa.me/${n}${text ? `?text=${encodeURIComponent(text)}` : ''}`
}

/** Opens WhatsApp's share sheet with no recipient, for sending a link to anyone. */
export function whatsappShareLink(text) {
  return `https://wa.me/?text=${encodeURIComponent(text)}`
}

export function telLink(phone) {
  const v = (phone || '').replace(/[^\d+]/g, '')
  return v ? `tel:${v}` : ''
}

export function mapsLink(address) {
  return address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}` : ''
}

export function mapsEmbedUrl(address) {
  return address ? `https://maps.google.com/maps?q=${encodeURIComponent(address)}&output=embed` : ''
}

export function instagramLink(handle) {
  const h = (handle || '').replace(/^@/, '')
  return h ? `https://instagram.com/${encodeURIComponent(h)}` : ''
}

export function shareText(shopName, url) {
  return `${shopName} is now online! See our rate list and order on WhatsApp: ${url}`
}

/**
 * The first rupee amount in a price string, or null when it can't be added up
 * (ranges like "₹250–₹400", or "price on request").
 */
export function parsePrice(price) {
  if (!price) return null
  if (/\d\s*(?:–|—|-|to)\s*(?:₹|rs\.?)?\s*\d/i.test(price)) return null
  const marked = price.match(/(?:₹|rs\.?|inr)\s*(\d[\d,]*(?:\.\d+)?)/i)
  const raw = marked ? marked[1] : (price.trim().match(/^\d[\d,]*(?:\.\d+)?/) || [])[0]
  if (!raw) return null
  const n = parseFloat(raw.replace(/,/g, ''))
  return Number.isFinite(n) ? n : null
}

export function formatRupees(n) {
  return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
}

export function orderMessage(shopName, lines, total, hasUnpriced) {
  const items = lines.map(l => `• ${l.qty} × ${l.name}${l.price ? ` (${l.price})` : ''}`).join('\n')
  let msg = `Hello ${shopName}! I'd like to order:\n${items}`
  if (total > 0) msg += `\n\nEstimated total: ${formatRupees(total)}${hasUnpriced ? ' + items to be priced' : ''}`
  return `${msg}\n\nPlease confirm. Thank you!`
}

// ── Opening hours ──────────────────────────────────────────────────────────

const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const DAY_RE = '(sun|mon|tue|wed|thu|fri|sat)[a-z]*'

function toMinutes(h, m, ampm) {
  let hh = Number(h)
  const ap = (ampm || '').replace(/\./g, '')
  if (ap === 'pm' && hh < 12) hh += 12
  if (ap === 'am' && hh === 12) hh = 0
  return hh * 60 + (m ? Number(m) : 0)
}

function formatTime(minutes) {
  const total = minutes % (24 * 60)
  const h = Math.floor(total / 60)
  const m = total % 60
  return `${h % 12 || 12}${m ? `:${String(m).padStart(2, '0')}` : ''} ${h < 12 ? 'AM' : 'PM'}`
}

/** Days the shop opens, from text like "Mon–Sat", "daily" or "closed on Sunday". */
function openDays(t) {
  let days = new Set([0, 1, 2, 3, 4, 5, 6])
  const range = t.match(new RegExp(`${DAY_RE}\\s*(?:–|—|-|to)\\s*${DAY_RE}`))
  if (range) {
    days = new Set()
    const from = DAY_KEYS.indexOf(range[1])
    const to = DAY_KEYS.indexOf(range[2])
    for (let d = from; ; d = (d + 1) % 7) {
      days.add(d)
      if (d === to) break
    }
  }
  const closed = [
    ...t.matchAll(new RegExp(`(?:closed|band|holiday|off)\\s*(?:on\\s*)?${DAY_RE}`, 'g')),
    ...t.matchAll(new RegExp(`${DAY_RE}\\s*(?:closed|band|holiday|off)`, 'g')),
  ]
  for (const c of closed) days.delete(DAY_KEYS.indexOf(c[1]))
  return days
}

/**
 * Best-effort "open now" from a free-text timing string. Returns null when the
 * text can't be understood, so callers just show the timing as written.
 */
export function openStatus(timing, now = new Date()) {
  if (!timing) return null
  const t = timing.toLowerCase()
  if (/24\s*(?:hours|hrs|x\s*7|\/\s*7)/.test(t)) return { open: true, label: 'Open 24 hours' }

  const times = [...t.matchAll(/(\d{1,2})(?:[:.](\d{2}))?\s*(a\.?m\.?|p\.?m\.?)?/g)]
    .filter(m => Number(m[1]) <= 24 && (m[2] || m[3]))
  if (times.length < 2) return null
  const [a, b] = times
  const apB = b[3]?.replace(/\./g, '')
  let apA = a[3]?.replace(/\./g, '')
  if (!apA && apB) apA = apB === 'pm' && Number(a[1]) < Number(b[1]) ? 'pm' : 'am'
  const open = toMinutes(a[1], a[2], apA)
  let close = toMinutes(b[1], b[2], apB)
  if (close <= open) close += 24 * 60

  const days = openDays(t)
  const today = now.getDay()
  const cur = now.getHours() * 60 + now.getMinutes()
  const yesterday = (today + 6) % 7

  if (days.has(today) && cur >= open && cur < close) {
    return { open: true, label: `Open now, closes ${formatTime(close)}` }
  }
  if (close > 24 * 60 && days.has(yesterday) && cur + 24 * 60 < close) {
    return { open: true, label: `Open now, closes ${formatTime(close)}` }
  }
  if (days.has(today) && cur < open) {
    return { open: false, label: `Closed now, opens ${formatTime(open)}` }
  }
  for (let i = 1; i <= 7; i++) {
    const d = (today + i) % 7
    if (days.has(d)) {
      const when = i === 1 ? 'tomorrow' : DAY_NAMES[d]
      return { open: false, label: `Closed now, opens ${when} ${formatTime(open)}` }
    }
  }
  return null
}

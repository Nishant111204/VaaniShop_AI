import { describe, expect, it } from 'vitest'
import {
  getTheme, instagramLink, openStatus, orderMessage, parsePrice, shopPath, waNumber, whatsappLink,
} from './shop.js'

// 1 Nov 2026 is a Sunday, so day 0 = Sunday, 1 = Monday, …
const at = (day, hour, minute = 0) => new Date(2026, 10, 1 + day, hour, minute)

describe('openStatus', () => {
  const weekdays = '8:00 AM – 10:00 PM, Mon–Sat'

  it('is open inside hours on an open day', () => {
    expect(openStatus(weekdays, at(1, 9))).toEqual({ open: true, label: 'Open now, closes 10 PM' })
  })

  it('points to the next open day when closed', () => {
    expect(openStatus(weekdays, at(0, 9)).label).toBe('Closed now, opens tomorrow 8 AM')
    expect(openStatus(weekdays, at(6, 23)).label).toBe('Closed now, opens Monday 8 AM')
  })

  it('says when today opens before opening time', () => {
    expect(openStatus('9am-9pm', at(2, 7)).label).toBe('Closed now, opens 9 AM')
  })

  it('understands closed days and 24-hour shops', () => {
    expect(openStatus('10:00 AM – 8:00 PM, closed on Sunday', at(0, 12)).open).toBe(false)
    expect(openStatus('Open 24 hours', at(3, 3))).toEqual({ open: true, label: 'Open 24 hours' })
  })

  it('handles hours that run past midnight', () => {
    expect(openStatus('6 PM – 1 AM', at(4, 0, 30))).toEqual({ open: true, label: 'Open now, closes 1 AM' })
  })

  it('gives up quietly on text it cannot read', () => {
    expect(openStatus('whenever we like', at(1, 9))).toBeNull()
    expect(openStatus('', at(1, 9))).toBeNull()
  })
})

describe('parsePrice', () => {
  it.each([
    ['₹60/kg', 60], ['Rs. 1,200', 1200], ['₹120/250g', 120], ['45', 45], ['2 for ₹50', 50],
  ])('reads %s as %d', (text, value) => expect(parsePrice(text)).toBe(value))

  it.each(['₹250–₹400', 'price on request', ''])('refuses to total %s', text => expect(parsePrice(text)).toBeNull())
})

describe('WhatsApp links', () => {
  it('adds the India country code to 10-digit numbers', () => {
    expect(waNumber('9876543210')).toBe('919876543210')
    expect(waNumber('09876543210')).toBe('919876543210')
    expect(waNumber('+91 98765 43210')).toBe('919876543210')
  })

  it('rejects numbers too short to be real', () => {
    expect(waNumber('12345')).toBe('')
    expect(whatsappLink('12345', 'hi')).toBe('')
  })

  it('encodes the message', () => {
    expect(whatsappLink('9876543210', 'Hi & bye')).toBe('https://wa.me/919876543210?text=Hi%20%26%20bye')
  })

  it('writes an order with quantities and an estimated total', () => {
    const msg = orderMessage('Ganesh Sweets', [{ qty: 2, name: 'Samosa', price: '₹25' }], 50, true)
    expect(msg).toContain('• 2 × Samosa (₹25)')
    expect(msg).toContain('Estimated total: ₹50 + items to be priced')
  })
})

describe('small helpers', () => {
  it('prefers the readable link', () => {
    expect(shopPath({ slug: 'ganesh-sweets', shopId: 'abc' })).toBe('/s/ganesh-sweets')
    expect(shopPath({ shopId: 'abc' })).toBe('/shop/abc')
  })

  it('builds Instagram links without the @', () => {
    expect(instagramLink('@my.shop')).toBe('https://instagram.com/my.shop')
  })

  it('falls back to slate for unknown themes', () => {
    expect(getTheme('neon')).toBe(getTheme('slate'))
  })
})

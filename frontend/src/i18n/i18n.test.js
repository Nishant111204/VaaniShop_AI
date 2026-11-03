import { describe, expect, it } from 'vitest'
import en from './en.js'
import hi from './hi.js'

describe('interface translations', () => {
  it('has the same keys in English and Hindi', () => {
    expect(Object.keys(hi).sort()).toEqual(Object.keys(en).sort())
  })

  it('keeps the same placeholders in both languages', () => {
    const vars = s => (typeof s === 'string' ? (s.match(/\{\w+\}/g) || []).sort() : [])
    for (const key of Object.keys(en)) {
      if (typeof en[key] === 'string' && hi[key] !== '') expect(vars(hi[key]), key).toEqual(vars(en[key]))
    }
  })

  it('writes plurals for one and many', () => {
    expect(en['dash.visits']({ n: 1 })).toBe('1 visit')
    expect(en['dash.visits']({ n: 3 })).toBe('3 visits')
    expect(hi['dash.summary']({ shops: 2, views: 5 })).toContain('दुकानें')
  })
})

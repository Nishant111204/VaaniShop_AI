import React from 'react'
import { Check } from 'lucide-react'
import { THEMES } from '../lib/shop.js'

/** Colour choice, shown as the awning each colour would give the shop. */
export default function ThemePicker({ value, onChange, labelledBy }) {
  return (
    <div role="radiogroup" aria-labelledby={labelledBy} className="grid grid-cols-3 gap-2.5 sm:grid-cols-6">
      {Object.entries(THEMES).map(([key, t]) => {
        const active = value === key
        return (
          <button
            key={key}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(key)}
            className={`relative overflow-hidden rounded-2xl border-2 bg-white pb-2.5 text-left transition-colors ${active ? 'border-neel' : 'border-neel-100 hover:border-neel-200'}`}
          >
            <span className="awning awning-sm block" style={{ '--awning': t.awning }} aria-hidden="true" />
            <span className="mt-4 block px-2.5 text-sm font-semibold leading-tight text-neel-900">{t.name}</span>
            {active && <Check className="absolute right-2 top-5 h-4 w-4 text-neel" aria-hidden="true" />}
          </button>
        )
      })}
    </div>
  )
}

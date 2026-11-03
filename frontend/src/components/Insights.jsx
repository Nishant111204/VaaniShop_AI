import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { ArrowDown, ArrowUp, Eye, MessageCircle, Navigation, Phone, Share2, ShoppingBasket, Table2 } from 'lucide-react'
import Spinner from './Spinner.jsx'
import { getShopStats } from '../lib/api.js'

// Mid step of the indigo ramp: passes the chart palette checks against white (dataviz validator).
const BAR = '#5A67A6'
const BAR_ACTIVE = '#2F3C7E'
const CHART_DAYS = 14

const KPIS = [
  { key: 'visits', label: 'Visits', icon: Eye },
  { key: 'orders', label: 'WhatsApp orders', icon: ShoppingBasket },
  { key: 'whatsapp', label: 'WhatsApp chats', icon: MessageCircle },
  { key: 'calls', label: 'Calls', icon: Phone },
  { key: 'directions', label: 'Directions', icon: Navigation },
  { key: 'shares', label: 'Shares', icon: Share2 },
]

function sum(days, key) {
  return days.reduce((n, d) => n + d[key], 0)
}

function dayLabel(iso, opts) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('en-IN', opts)
}

/** What customers did on the shop page: last-7-day totals against the week before, and daily visits. */
export default function Insights({ shopId, onShare }) {
  const [days, setDays] = useState(null)
  const [error, setError] = useState('')
  const [table, setTable] = useState(false)

  useEffect(() => {
    getShopStats(shopId, 30).then(r => setDays(r.days)).catch(e => setError(e.message || 'Could not load insights'))
  }, [shopId])

  if (error) return <p className="rounded-2xl bg-sindoor-soft px-4 py-3 text-sindoor-deep">{error}</p>
  if (!days) return <Spinner label="Loading insights…" className="py-12" />

  const thisWeek = days.slice(-7)
  const lastWeek = days.slice(-14, -7)
  const recent = days.slice(-CHART_DAYS)
  const anything = days.some(d => KPIS.some(k => d[k.key] > 0))

  if (!anything) {
    return (
      <div className="panel p-6 text-center sm:p-8">
        <h2 className="text-xl font-semibold text-neel-900">No visits yet</h2>
        <p className="mx-auto mt-1 max-w-sm text-neel-500">
          Share your link in your WhatsApp groups and put the QR poster on your counter. Visits and orders will show up here.
        </p>
        {onShare && <button type="button" onClick={onShare} className="btn-ink mt-5">Share my shop</button>}
      </div>
    )
  }

  return (
    <div className="grid gap-6">
      <section aria-labelledby="week-title">
        <h2 id="week-title" className="text-lg font-semibold text-neel-900">Last 7 days</h2>
        <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {KPIS.map(k => {
            const now = sum(thisWeek, k.key)
            const before = sum(lastWeek, k.key)
            return (
              <li key={k.key} className="panel p-4">
                <p className="flex items-center gap-1.5 text-sm font-medium text-neel-500">
                  <k.icon className="h-4 w-4" aria-hidden="true" /> {k.label}
                </p>
                <p className="mt-1 text-3xl font-semibold text-neel-900">{now.toLocaleString('en-IN')}</p>
                <Delta now={now} before={before} />
              </li>
            )
          })}
        </ul>
      </section>

      <section aria-labelledby="daily-title" className="panel p-5 sm:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="daily-title" className="text-lg font-semibold text-neel-900">Visits per day</h2>
          <button type="button" onClick={() => setTable(t => !t)} aria-pressed={table} className="btn-ghost btn-sm -mr-2">
            <Table2 className="h-4 w-4" aria-hidden="true" /> {table ? 'Show chart' : 'Show as table'}
          </button>
        </div>
        {table ? <DailyTable days={recent} /> : <VisitsChart days={recent} />}
      </section>
    </div>
  )
}

function Delta({ now, before }) {
  if (now === before) return <p className="mt-0.5 text-sm text-neel-500">Same as the week before</p>
  const up = now > before
  const Icon = up ? ArrowUp : ArrowDown
  return (
    <p className={`mt-0.5 flex items-center gap-1 text-sm font-medium ${up ? 'text-paan-deep' : 'text-sindoor-deep'}`}>
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {up ? '+' : '−'}{Math.abs(now - before)} vs the week before
    </p>
  )
}

/** A clean upper bound for the y-axis: 1, 2, 5 or 10 times a power of ten. */
function niceMax(v) {
  if (v <= 4) return 4
  const p = 10 ** Math.floor(Math.log10(v))
  return [1, 2, 5, 10].map(m => m * p).find(m => m >= v)
}

function VisitsChart({ days }) {
  const box = useRef(null)
  const [width, setWidth] = useState(600)
  const [active, setActive] = useState(null)

  useLayoutEffect(() => {
    const el = box.current
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const height = 220
  const pad = { top: 12, right: 4, bottom: 28, left: 32 }
  const plotW = Math.max(100, width - pad.left - pad.right)
  const plotH = height - pad.top - pad.bottom
  const max = niceMax(Math.max(...days.map(d => d.visits)))
  const band = plotW / days.length
  const barW = Math.min(24, band * 0.6)
  const y = v => pad.top + plotH - (v / max) * plotH
  const ticks = [0, max / 2, max]
  const hovered = active == null ? null : days[active]

  return (
    <div ref={box} className="relative mt-4" onPointerLeave={() => setActive(null)}>
      <svg width={width} height={height} role="img" aria-label={`Visits per day for the last ${days.length} days. Use Show as table for exact numbers.`}>
        {ticks.map(t => (
          <g key={t}>
            <line x1={pad.left} x2={pad.left + plotW} y1={y(t)} y2={y(t)} stroke="#E8EBF6" strokeWidth="1" />
            <text x={pad.left - 8} y={y(t)} textAnchor="end" dominantBaseline="middle" fontSize="12" fill="#5A67A6" style={{ fontVariantNumeric: 'tabular-nums' }}>
              {Number.isInteger(t) ? t : t.toFixed(1)}
            </text>
          </g>
        ))}
        {days.map((d, i) => {
          const cx = pad.left + band * i + band / 2
          const top = y(d.visits)
          const h = pad.top + plotH - top
          const r = Math.min(4, h)
          const x = cx - barW / 2
          // Rounded data end, square at the baseline.
          const path = h <= 0 ? '' : `M${x},${pad.top + plotH} V${top + r} Q${x},${top} ${x + r},${top} H${x + barW - r} Q${x + barW},${top} ${x + barW},${top + r} V${pad.top + plotH} Z`
          const showLabel = days.length <= 7 || i % 2 === (days.length - 1) % 2
          return (
            <g key={d.day}>
              {path && <path d={path} fill={active === i ? BAR_ACTIVE : BAR} />}
              {showLabel && (
                <text x={cx} y={height - 8} textAnchor="middle" fontSize="12" fill="#5A67A6">{dayLabel(d.day, { day: 'numeric' })}</text>
              )}
              {/* The whole column is the hit target, so short bars are easy to hover and tap. */}
              <rect
                x={pad.left + band * i}
                y={pad.top}
                width={band}
                height={plotH}
                fill="transparent"
                tabIndex={0}
                role="img"
                aria-label={`${dayLabel(d.day, { weekday: 'long', day: 'numeric', month: 'long' })}: ${d.visits} visits, ${d.orders} orders`}
                onPointerEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                onBlur={() => setActive(null)}
                style={{ outline: 'none' }}
              />
            </g>
          )
        })}
        {active != null && (
          <rect x={pad.left + band * active + 1} y={pad.top} width={band - 2} height={plotH} fill="none" stroke="#FFC53D" strokeWidth="2" rx="6" pointerEvents="none" />
        )}
      </svg>

      {hovered && (
        <div
          className="pointer-events-none absolute z-10 min-w-[9rem] rounded-xl bg-neel-900 px-3 py-2 text-sm text-white shadow-lift"
          style={{
            left: Math.min(Math.max(pad.left + band * active + band / 2, 72), width - 72),
            top: Math.max(0, y(hovered.visits) - 12),
            transform: 'translate(-50%, -100%)',
          }}
        >
          <p className="text-white/70">{dayLabel(hovered.day, { weekday: 'short', day: 'numeric', month: 'short' })}</p>
          <p><strong className="text-base">{hovered.visits}</strong> visits</p>
          <p><strong>{hovered.orders}</strong> orders, <strong>{hovered.calls}</strong> calls</p>
        </div>
      )}
    </div>
  )
}

function DailyTable({ days }) {
  return (
    <div className="mt-4 overflow-x-auto">
      <table className="w-full min-w-[32rem] text-left text-sm">
        <thead className="text-neel-500">
          <tr className="border-b border-neel-100">
            <th scope="col" className="py-2 pr-3 font-medium">Day</th>
            {KPIS.map(k => <th key={k.key} scope="col" className="px-2 py-2 text-right font-medium">{k.label}</th>)}
          </tr>
        </thead>
        <tbody className="tabular-nums">
          {[...days].reverse().map(d => (
            <tr key={d.day} className="border-b border-neel-50 last:border-0">
              <th scope="row" className="py-2 pr-3 font-medium text-neel-900">{dayLabel(d.day, { weekday: 'short', day: 'numeric', month: 'short' })}</th>
              {KPIS.map(k => <td key={k.key} className="px-2 py-2 text-right text-neel-700">{d[k.key]}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

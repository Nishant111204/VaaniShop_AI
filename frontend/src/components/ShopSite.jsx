import React, { useMemo, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import toast from 'react-hot-toast'
import {
  AtSign, Clock, Mail, MapPin, MessageCircle, Minus, Navigation, Phone, Plus, Search, Share2, ShoppingBasket, X,
} from 'lucide-react'
import { imageUrl } from '../lib/api.js'
import {
  categoryEmoji, formatRupees, instagramLink, mapsEmbedUrl, mapsLink, openStatus, orderMessage, parsePrice,
  telLink, themeVars, whatsappLink,
} from '../lib/shop.js'
import { loadBasket, saveBasket } from '../lib/storage.js'

/**
 * A shop's own website: what customers see. Used live on the public page and as a
 * preview while creating and editing.
 *
 * @param url          public link, or null for an unpublished draft (hides share and QR)
 * @param basketKey    where the customer's basket is remembered; null keeps it in memory
 * @param live         true on the real public page (adds the map and QR code)
 * @param showSuggested tag items the AI added, so the owner can review them
 * @param onTrack      called with "order", "whatsapp", "call", "directions" or "share" when a customer taps one
 */
export default function ShopSite({ data: d, url = null, basketKey = null, live = false, showSuggested = false, onTrack = () => {} }) {
  const [basket, setBasket] = useState(() => (basketKey ? loadBasket(basketKey) : {}))
  const [query, setQuery] = useState('')
  const [group, setGroup] = useState(null)

  const products = d.products || []
  const waContact = d.whatsapp || d.phone
  const canOrder = !!whatsappLink(waContact)
  const status = openStatus(d.timing)
  const fallbackEmoji = categoryEmoji(d.category)

  const groups = useMemo(() => {
    const seen = []
    for (const p of products) if (p.category && !seen.includes(p.category)) seen.push(p.category)
    return seen.length >= 2 && products.length >= 5 ? seen : []
  }, [products])

  const visible = products.filter(p =>
    (!group || p.category === group) &&
    (!query || `${p.name} ${p.description} ${p.category}`.toLowerCase().includes(query.toLowerCase())))

  function setQty(name, qty) {
    setBasket(prev => {
      const next = { ...prev }
      if (qty > 0) next[name] = qty
      else delete next[name]
      if (basketKey) saveBasket(basketKey, next)
      return next
    })
  }

  const lines = products.filter(p => basket[p.name] > 0).map(p => ({ ...p, qty: basket[p.name] }))
  const count = lines.reduce((n, l) => n + l.qty, 0)
  let total = 0
  let hasUnpriced = false
  for (const l of lines) {
    const each = parsePrice(l.price)
    if (each == null) hasUnpriced = true
    else total += each * l.qty
  }

  function share() {
    if (!url) return
    onTrack('share')
    if (navigator.share) {
      navigator.share({ title: d.shopName, text: d.tagline || d.shopName, url }).catch(() => {})
    } else {
      navigator.clipboard?.writeText(url)
      toast.success('Link copied')
    }
  }

  const actions = [
    telLink(d.phone) && { label: 'Call', icon: Phone, href: telLink(d.phone), track: 'call' },
    canOrder && { label: 'WhatsApp', icon: MessageCircle, href: whatsappLink(waContact, `Hello ${d.shopName}!`), whatsapp: true, track: 'whatsapp' },
    mapsLink(d.address) && { label: 'Directions', icon: Navigation, href: mapsLink(d.address), track: 'directions' },
    url && { label: 'Share', icon: Share2, onClick: share },
  ].filter(Boolean)

  return (
    <div style={themeVars(d.theme)} className="shop-root relative flex min-h-full flex-col bg-[var(--soft)] text-neel-900">
      <div className="awning print-exact" />

      {/* Signboard */}
      <header className="bg-white px-5 pb-8 pt-12 text-center">
        <p className="inline-flex items-center gap-1.5 rounded-full bg-[var(--soft)] px-3 py-1 text-sm font-semibold capitalize text-[var(--ink)]">
          <span aria-hidden="true">{fallbackEmoji}</span> {d.category || 'Shop'}
        </p>
        <h1 className="shop-title sign mx-auto mt-4 max-w-[16ch] break-words text-[var(--ink)]">{d.shopName}</h1>
        {d.tagline && <p className="mx-auto mt-3 max-w-[34ch] text-lg leading-snug text-neel-700">{d.tagline}</p>}
        {status && (
          <p className={`mt-4 inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold ${status.open ? 'bg-paan-soft text-paan-deep' : 'bg-sindoor-soft text-sindoor-deep'}`}>
            <span className={`h-2 w-2 rounded-full ${status.open ? 'bg-paan' : 'bg-sindoor'}`} aria-hidden="true" />
            {status.label}
          </p>
        )}

        {actions.length > 0 && (
          <nav aria-label="Contact the shop" className="mx-auto mt-7 grid max-w-md gap-2" style={{ gridTemplateColumns: `repeat(${actions.length}, minmax(0, 1fr))` }}>
            {actions.map(a => {
              const Icon = a.icon
              const inner = (
                <>
                  <span className={`grid h-12 w-12 place-items-center rounded-2xl text-white ${a.whatsapp ? 'bg-paan' : 'bg-[var(--accent)]'}`}>
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="text-sm font-semibold text-neel-700">{a.label}</span>
                </>
              )
              const cls = 'flex flex-col items-center gap-1.5 rounded-2xl py-2 transition-colors hover:bg-[var(--soft)]'
              return a.href ? (
                <a key={a.label} href={a.href} target={a.href.startsWith('tel:') ? undefined : '_blank'} rel="noreferrer" className={cls} onClick={() => onTrack(a.track)}>{inner}</a>
              ) : (
                <button key={a.label} type="button" onClick={a.onClick} className={cls}>{inner}</button>
              )
            })}
          </nav>
        )}
      </header>

      {d.coverImage && (
        <img src={imageUrl(d.coverImage)} alt={`${d.shopName}`} className="aspect-[16/9] w-full object-cover" />
      )}

      <main className="mx-auto w-full max-w-2xl flex-1 px-3 py-6 sm:px-5">
        {/* Price list */}
        <section aria-labelledby="price-list" className="rounded-[28px] bg-white px-4 pb-2 pt-5 sm:px-6">
          <h2 id="price-list" className="text-2xl font-bold text-[var(--ink)] condensed">Price list</h2>
          {canOrder && products.length > 0 && <p className="text-sm text-neel-500">Add items, then order on WhatsApp</p>}

          {products.length > 10 && (
            <label className="relative mt-4 block">
              <span className="sr-only">Search items</span>
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neel-300" aria-hidden="true" />
              <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search items" className="field pl-10" />
            </label>
          )}

          {groups.length > 0 && (
            <div className="-mx-4 mt-4 flex gap-2 overflow-x-auto px-4 scrollbar-none sm:-mx-6 sm:px-6">
              {[null, ...groups].map(g => (
                <button key={g ?? 'all'} type="button" onClick={() => setGroup(g)} aria-pressed={group === g}
                  className={group === g ? 'chip border-[var(--accent)] bg-[var(--accent)] text-white' : 'chip-off'}>
                  {g ?? 'All'}
                </button>
              ))}
            </div>
          )}

          {products.length === 0 ? (
            <p className="py-8 text-center text-neel-500">Items and prices will appear here.</p>
          ) : visible.length === 0 ? (
            <p className="py-8 text-center text-neel-500">No items match “{query}”.</p>
          ) : (
            <ul className="mt-2 divide-y divide-neel-100">
              {visible.map((p, i) => {
                const qty = basket[p.name] || 0
                return (
                  <li key={`${p.name}-${i}`} className="flex items-center gap-3.5 py-3.5">
                    <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-2xl bg-[var(--soft)] text-3xl">
                      {p.image
                        ? <img src={imageUrl(p.image)} alt="" loading="lazy" className="h-full w-full object-cover" />
                        : <span aria-hidden="true">{p.emoji || fallbackEmoji}</span>}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold leading-snug">
                        {p.name}
                        {showSuggested && p.suggested && (
                          <span className="ml-2 inline-block rounded-full bg-haldi-soft px-2 py-0.5 align-middle text-xs font-semibold text-neel-700">Suggested</span>
                        )}
                      </p>
                      {p.description && <p className="mt-0.5 text-sm leading-snug text-neel-500 line-clamp-2">{p.description}</p>}
                      {p.price && <p className="mt-1 font-bold text-[var(--ink)]">{p.price}</p>}
                    </div>
                    {canOrder && (
                      qty > 0 ? (
                        <div className="flex shrink-0 items-center rounded-xl border border-[var(--accent)] text-[var(--accent)]">
                          <button type="button" onClick={() => setQty(p.name, qty - 1)} aria-label={`Remove one ${p.name}`} className="grid h-10 w-9 place-items-center"><Minus className="h-4 w-4" /></button>
                          <span className="w-6 text-center font-bold tabular-nums" aria-live="polite">{qty}</span>
                          <button type="button" onClick={() => setQty(p.name, qty + 1)} aria-label={`Add one more ${p.name}`} className="grid h-10 w-9 place-items-center"><Plus className="h-4 w-4" /></button>
                        </div>
                      ) : (
                        <button type="button" onClick={() => setQty(p.name, 1)} aria-label={`Add ${p.name}`}
                          className="flex h-10 shrink-0 items-center gap-1 rounded-xl border border-neel-200 px-3 text-sm font-semibold text-[var(--accent)] hover:border-[var(--accent)]">
                          <Plus className="h-4 w-4" aria-hidden="true" /> Add
                        </button>
                      )
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        {d.description && (
          <section aria-labelledby="about" className="px-2 pt-10">
            <h2 id="about" className="text-2xl font-bold text-[var(--ink)] condensed">About us</h2>
            <p className="mt-2 max-w-[60ch] text-lg leading-relaxed text-neel-700">{d.description}</p>
          </section>
        )}

        {(d.timing || d.address || d.phone || d.email || d.instagram) && (
          <section aria-labelledby="visit" className="mt-10 rounded-[28px] bg-white p-5 sm:p-6">
            <h2 id="visit" className="text-2xl font-bold text-[var(--ink)] condensed">Visit us</h2>
            <dl className="mt-4 grid gap-4">
              {d.timing && <Row icon={Clock} label="Timings">{d.timing}</Row>}
              {d.address && (
                <Row icon={MapPin} label="Address">
                  <a href={mapsLink(d.address)} target="_blank" rel="noreferrer" onClick={() => onTrack('directions')} className="underline decoration-neel-200 underline-offset-4 hover:decoration-[var(--accent)]">{d.address}</a>
                </Row>
              )}
              {d.phone && <Row icon={Phone} label="Phone"><a href={telLink(d.phone)} onClick={() => onTrack('call')} className="font-semibold tabular-nums">{d.phone}</a></Row>}
              {d.email && <Row icon={Mail} label="Email"><a href={`mailto:${d.email}`} className="break-all">{d.email}</a></Row>}
              {d.instagram && (
                <Row icon={AtSign} label="Instagram">
                  <a href={instagramLink(d.instagram)} target="_blank" rel="noreferrer">{d.instagram}</a>
                </Row>
              )}
            </dl>
            {live && d.address && (
              <iframe
                title={`Map showing ${d.shopName}`}
                src={mapsEmbedUrl(d.address)}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="mt-5 h-56 w-full rounded-2xl border-0 bg-neel-50"
              />
            )}
          </section>
        )}

        {live && url && (
          <section className="mt-10 flex items-center gap-5 rounded-[28px] bg-white p-5 sm:p-6">
            <div className="shrink-0 rounded-2xl border border-neel-100 p-2">
              <QRCodeSVG value={url} size={112} fgColor="#141B3D" marginSize={0} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[var(--ink)] condensed">Open this page on your phone</h2>
              <p className="mt-1 text-neel-500">Scan the code with your phone camera, or share the link with family.</p>
            </div>
          </section>
        )}
      </main>

      <footer className="px-5 pb-8 pt-4 text-center text-sm text-neel-500">
        {live ? (
          <a href="/" className="font-medium hover:text-neel">Made with VaaniShop. Get a free page for your shop</a>
        ) : (
          <span>Made with VaaniShop</span>
        )}
      </footer>

      {count > 0 && (
        <div className="sticky bottom-0 z-30 px-3 pb-safe pt-2">
          <div className="mx-auto flex max-w-2xl items-center gap-2 rounded-[22px] bg-neel-900 p-2 pl-4 text-white shadow-lift">
            <ShoppingBasket className="h-5 w-5 shrink-0 text-haldi" aria-hidden="true" />
            <div className="min-w-0 flex-1 leading-tight">
              <p className="font-semibold">{count} {count === 1 ? 'item' : 'items'}</p>
              <p className="truncate text-sm text-white/70">
                {total > 0 ? `About ${formatRupees(total)}${hasUnpriced ? ' + more' : ''}` : 'Shop will confirm the price'}
              </p>
            </div>
            <button type="button" onClick={() => { setBasket({}); if (basketKey) saveBasket(basketKey, {}) }} aria-label="Empty the basket"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-white/70 hover:bg-white/10 hover:text-white">
              <X className="h-5 w-5" />
            </button>
            <a href={whatsappLink(waContact, orderMessage(d.shopName, lines, total, hasUnpriced))} target="_blank" rel="noreferrer" onClick={() => onTrack('order')} className="btn-paan btn-sm shrink-0">
              <MessageCircle className="h-4 w-4" aria-hidden="true" /> Order
            </a>
          </div>
        </div>
      )}
    </div>
  )
}

function Row({ icon: Icon, label, children }) {
  return (
    <div className="flex gap-3.5">
      <dt className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--soft)] text-[var(--accent)]">
        <Icon className="h-5 w-5" aria-hidden="true" />
        <span className="sr-only">{label}</span>
      </dt>
      <dd className="min-w-0 self-center text-neel-900">{children}</dd>
    </div>
  )
}

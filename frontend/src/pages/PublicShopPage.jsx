import React, { useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import toast from 'react-hot-toast'
import { Link, useParams } from 'react-router-dom'
import Spinner from '../components/Spinner.jsx'
import { getShop } from '../lib/api.js'

const THEME_STYLES = {
  green:  { header: 'from-green-700 to-green-900',   badge: 'bg-green-100 text-green-800',   btn: 'bg-green-700 hover:bg-green-800',   accent: 'text-green-700' },
  orange: { header: 'from-orange-500 to-orange-700', badge: 'bg-orange-100 text-orange-800', btn: 'bg-orange-600 hover:bg-orange-700', accent: 'text-orange-600' },
  blue:   { header: 'from-blue-700 to-blue-900',     badge: 'bg-blue-100 text-blue-800',     btn: 'bg-blue-700 hover:bg-blue-800',     accent: 'text-blue-700' },
  purple: { header: 'from-purple-700 to-purple-900', badge: 'bg-purple-100 text-purple-800', btn: 'bg-purple-700 hover:bg-purple-800', accent: 'text-purple-700' },
  rose:   { header: 'from-rose-500 to-rose-700',     badge: 'bg-rose-100 text-rose-800',     btn: 'bg-rose-600 hover:bg-rose-700',     accent: 'text-rose-600' },
  slate:  { header: 'from-slate-700 to-slate-900',   badge: 'bg-slate-100 text-slate-700',   btn: 'bg-slate-800 hover:bg-slate-900',   accent: 'text-slate-700' },
}

function getTheme(t) { return THEME_STYLES[t] || THEME_STYLES.slate }

function waLink(contact) {
  const digits = (contact || '').replace(/[^\d]/g, '')
  return digits ? `https://wa.me/${digits}` : ''
}

function instagramLink(handle) {
  if (!handle) return ''
  return `https://instagram.com/${handle.replace(/^@/, '')}`
}

function mapsLink(address) {
  if (!address) return ''
  return `https://maps.google.com/?q=${encodeURIComponent(address)}`
}

export default function PublicShopPage() {
  const { id } = useParams()
  const [loading, setLoading] = useState(true)
  const [shop, setShop] = useState(null)
  const [showQr, setShowQr] = useState(false)

  const pageUrl = window.location.href

  useEffect(() => {
    let cancelled = false
    async function run() {
      setLoading(true)
      try {
        const res = await getShop(id)
        if (!cancelled) setShop(res)
      } catch (e) {
        if (!cancelled) setShop(null)
        toast.error(e.message || 'Failed to load shop')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    run()
    return () => { cancelled = true }
  }, [id])

  function handleShare() {
    if (navigator.share) {
      navigator.share({ title: shop?.data?.shopName, url: pageUrl }).catch(() => {})
    } else {
      navigator.clipboard.writeText(pageUrl)
      toast.success('Link copied!')
    }
  }

  if (loading) return <Spinner label="Loading shop…" />

  if (!shop) {
    return (
      <div className="rounded-2xl border bg-white p-12 text-center shadow-sm">
        <div className="text-5xl mb-4">🔍</div>
        <h2 className="text-lg font-semibold text-slate-900">Shop not found</h2>
        <p className="mt-2 text-sm text-slate-500">This link may be incorrect or the shop was removed.</p>
        <Link to="/" className="mt-5 inline-block rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white">Go home</Link>
      </div>
    )
  }

  const d = shop.data
  const t = getTheme(d.theme)
  const wa = waLink(d.whatsapp || d.phone)
  const ig = instagramLink(d.instagram)
  const maps = mapsLink(d.address)

  return (
    <div className="grid gap-0 max-w-4xl mx-auto">
      {/* Hero banner */}
      <div className={`bg-gradient-to-br ${t.header} text-white rounded-2xl p-8 mb-6 shadow-lg`}>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-5">
          <div className="min-w-0">
            <h1 className="text-3xl font-bold tracking-tight truncate">{d.shopName}</h1>
            <div className="flex flex-wrap gap-2 mt-3">
              {d.category && (
                <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-medium capitalize">
                  {d.category}
                </span>
              )}
              {shop.viewCount > 0 && (
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs">
                  👁 {shop.viewCount} {shop.viewCount === 1 ? 'view' : 'views'}
                </span>
              )}
            </div>
            {d.description && (
              <p className="mt-3 text-sm text-white/80 max-w-lg leading-relaxed">{d.description}</p>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2 shrink-0">
            {wa && (
              <a
                href={wa}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors shadow-md"
              >
                <span>💬</span> WhatsApp
              </a>
            )}
            {ig && (
              <a
                href={ig}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 rounded-xl bg-white/20 hover:bg-white/30 px-4 py-2.5 text-sm font-semibold text-white transition-colors"
              >
                <span>📸</span> Instagram
              </a>
            )}
            <button
              onClick={handleShare}
              className="flex items-center gap-2 rounded-xl bg-white/20 hover:bg-white/30 px-4 py-2.5 text-sm font-semibold text-white transition-colors"
            >
              <span>🔗</span> Share
            </button>
            <button
              onClick={() => setShowQr(q => !q)}
              className="flex items-center gap-2 rounded-xl bg-white/20 hover:bg-white/30 px-4 py-2.5 text-sm font-semibold text-white transition-colors"
            >
              <span>📱</span> QR Code
            </button>
          </div>
        </div>

        {/* QR Code drawer */}
        {showQr && (
          <div className="mt-5 pt-5 border-t border-white/20 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="bg-white rounded-xl p-3 shadow-lg">
              <QRCodeSVG value={pageUrl} size={120} level="M" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Scan to visit this shop</p>
              <p className="text-xs text-white/60 mt-1 max-w-xs">Customers can scan this QR code with their phone camera to open your shop page instantly.</p>
              <button
                onClick={() => { navigator.clipboard.writeText(pageUrl); toast.success('Link copied!') }}
                className="mt-3 text-xs font-medium text-white/80 hover:text-white underline"
              >
                Copy link instead
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Products */}
        <div className="lg:col-span-2 grid gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700">
              Products & Services
              {d.products?.length ? <span className="ml-1.5 text-slate-400 font-normal">({d.products.length})</span> : ''}
            </h2>
          </div>
          {d.products?.length ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {d.products.map((p, idx) => (
                <div key={idx} className="rounded-xl border bg-white p-4 hover:shadow-sm transition-shadow">
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-medium text-slate-900 leading-snug">{p.name || 'Product'}</div>
                    {p.price && (
                      <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${t.badge}`}>
                        {p.price}
                      </span>
                    )}
                  </div>
                  {p.description && <p className="mt-2 text-xs text-slate-500 leading-relaxed">{p.description}</p>}
                  {p.category && (
                    <span className="mt-2 inline-block text-xs text-slate-400 capitalize">{p.category}</span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border bg-white p-6 text-sm text-slate-400 text-center">
              No products listed yet.
            </div>
          )}

          {/* WhatsApp CTA at bottom */}
          {wa && (
            <a
              href={wa}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl bg-emerald-500 hover:bg-emerald-600 p-4 text-center text-sm font-semibold text-white flex items-center justify-center gap-2 transition-colors shadow-md"
            >
              💬 Chat on WhatsApp to order
            </a>
          )}
        </div>

        {/* Sidebar */}
        <div className="grid gap-4 content-start">
          {/* Shop details */}
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-700 mb-4">Shop Details</h2>
            <div className="grid gap-3.5">
              {d.timing && (
                <Detail icon="🕐" label="Hours" value={d.timing} />
              )}
              {d.address && (
                <div className="flex gap-2.5">
                  <span className="text-base shrink-0 mt-0.5">📍</span>
                  <div>
                    <div className="text-xs text-slate-400 mb-0.5">Address</div>
                    {maps ? (
                      <a
                        href={maps}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        {d.address}
                      </a>
                    ) : (
                      <span className="text-sm text-slate-800">{d.address}</span>
                    )}
                  </div>
                </div>
              )}
              {d.phone && (
                <div className="flex gap-2.5">
                  <span className="text-base shrink-0 mt-0.5">📞</span>
                  <div>
                    <div className="text-xs text-slate-400 mb-0.5">Phone</div>
                    <a href={`tel:${d.phone}`} className="text-sm text-blue-600 hover:underline">{d.phone}</a>
                  </div>
                </div>
              )}
              {d.email && <Detail icon="✉️" label="Email" value={d.email} />}
            </div>
          </div>

          {/* QR code mini */}
          <div className="rounded-2xl border bg-white p-5 text-center shadow-sm">
            <p className="text-xs font-medium text-slate-600 mb-3">Scan to visit</p>
            <div className="inline-block bg-white p-2 rounded-lg border">
              <QRCodeSVG value={pageUrl} size={100} level="M" />
            </div>
            <p className="text-xs text-slate-400 mt-2">Share this page</p>
          </div>

          {/* Powered by */}
          <div className="rounded-2xl border bg-slate-50 p-4 text-center">
            <p className="text-xs text-slate-400 mb-1.5">Own a shop?</p>
            <Link to="/" className="text-xs font-semibold text-slate-700 hover:text-slate-900">
              Create yours free on VaaniShop AI →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

function Detail({ icon, label, value }) {
  return (
    <div className="flex gap-2.5">
      <span className="text-base shrink-0 mt-0.5">{icon}</span>
      <div>
        <div className="text-xs text-slate-400 mb-0.5">{label}</div>
        <div className="text-sm text-slate-800">{value}</div>
      </div>
    </div>
  )
}

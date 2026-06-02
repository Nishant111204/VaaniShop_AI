import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Link, useNavigate } from 'react-router-dom'
import Spinner from '../components/Spinner.jsx'
import { deleteShop, getMyShops } from '../lib/api.js'
import { useAuth } from '../context/AuthContext.jsx'

const CATEGORY_STYLES = {
  grocery:    'bg-green-100 text-green-800',
  bakery:     'bg-orange-100 text-orange-800',
  restaurant: 'bg-red-100 text-red-800',
  pharmacy:   'bg-blue-100 text-blue-800',
  electronics:'bg-slate-100 text-slate-700',
  clothing:   'bg-purple-100 text-purple-800',
  salon:      'bg-pink-100 text-pink-800',
  hardware:   'bg-yellow-100 text-yellow-800',
  dairy:      'bg-sky-100 text-sky-800',
  mobile:     'bg-indigo-100 text-indigo-800',
  default:    'bg-slate-100 text-slate-600',
}

function categoryClass(cat) {
  return CATEGORY_STYLES[cat?.toLowerCase()] || CATEGORY_STYLES.default
}

function ShopCard({ shop, onDelete, deleting }) {
  const publicUrl = `${window.location.origin}/shop/${shop.shopId}`

  function copyLink() {
    navigator.clipboard.writeText(publicUrl)
    toast.success('Link copied!')
  }

  return (
    <div className="rounded-2xl border bg-white shadow-sm hover:shadow-md transition-shadow flex flex-col">
      {/* Card header strip */}
      <div className="h-1.5 rounded-t-2xl bg-slate-900" />

      <div className="p-5 flex flex-col gap-3 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 className="font-semibold text-slate-900 leading-tight truncate">{shop.shopName}</h2>
            {shop.category && (
              <span className={`mt-1.5 inline-block rounded-full px-2 py-0.5 text-xs font-medium capitalize ${categoryClass(shop.category)}`}>
                {shop.category}
              </span>
            )}
          </div>
          {shop.viewCount > 0 && (
            <div className="shrink-0 flex items-center gap-1 rounded-lg bg-slate-50 px-2 py-1 text-xs text-slate-500">
              <span>👁</span>
              <span>{shop.viewCount}</span>
            </div>
          )}
        </div>

        {shop.description && (
          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{shop.description}</p>
        )}

        {shop.slug && (
          <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-50 rounded-lg px-2.5 py-1.5">
            <span>🔗</span>
            <span className="truncate font-mono">/shop/{shop.slug}</span>
          </div>
        )}

        <div className="text-xs text-slate-400 mt-auto">
          Created {new Date(shop.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
          <Link
            to={`/manage/${shop.shopId}`}
            className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-medium text-white text-center hover:bg-slate-700 transition-colors"
          >
            Manage
          </Link>
          <Link
            to={`/shop/${shop.shopId}`}
            target="_blank"
            className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 text-center hover:bg-slate-50 transition-colors"
          >
            View Page
          </Link>
          <button
            onClick={copyLink}
            className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Copy Link
          </button>
          <button
            onClick={() => onDelete(shop.shopId, shop.shopName)}
            disabled={deleting === shop.shopId}
            className="rounded-lg border border-rose-200 px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 disabled:opacity-50 transition-colors"
          >
            {deleting === shop.shopId ? '…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ShopListPage() {
  const { user } = useAuth()
  const [shops, setShops] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(null)

  async function load() {
    setLoading(true)
    try {
      const res = await getMyShops()
      setShops(res)
    } catch (e) {
      toast.error(e.message || 'Failed to load shops')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function handleDelete(shopId, shopName) {
    if (!window.confirm(`Delete "${shopName}"? This cannot be undone.`)) return
    setDeleting(shopId)
    try {
      await deleteShop(shopId)
      setShops(prev => prev.filter(s => s.shopId !== shopId))
      toast.success('Shop deleted')
    } catch (e) {
      toast.error(e.message || 'Failed to delete')
    } finally {
      setDeleting(null)
    }
  }

  const totalViews = shops.reduce((sum, s) => sum + (s.viewCount || 0), 0)

  return (
    <div className="grid gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">My Shops</h1>
          <p className="mt-1 text-sm text-slate-500">
            Welcome back, <span className="font-medium text-slate-700">{user?.name}</span>
          </p>
        </div>
        <Link
          to="/create"
          className="flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 transition-colors shadow-md shadow-slate-900/20"
        >
          <span>+</span> New Shop
        </Link>
      </div>

      {/* Stats bar */}
      {shops.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border bg-white p-4 text-center">
            <div className="text-2xl font-bold text-slate-900">{shops.length}</div>
            <div className="text-xs text-slate-500 mt-0.5">Total Shops</div>
          </div>
          <div className="rounded-xl border bg-white p-4 text-center">
            <div className="text-2xl font-bold text-slate-900">{totalViews}</div>
            <div className="text-xs text-slate-500 mt-0.5">Total Views</div>
          </div>
          <div className="rounded-xl border bg-white p-4 text-center">
            <div className="text-2xl font-bold text-slate-900">{shops.filter(s => s.viewCount > 0).length}</div>
            <div className="text-xs text-slate-500 mt-0.5">Active Shops</div>
          </div>
        </div>
      )}

      {loading ? (
        <Spinner label="Loading your shops…" />
      ) : shops.length === 0 ? (
        <div className="rounded-2xl border bg-white p-16 text-center shadow-sm">
          <div className="text-5xl mb-4">🛍️</div>
          <h2 className="text-lg font-semibold text-slate-900">No shops yet</h2>
          <p className="mt-2 text-sm text-slate-500 max-w-xs mx-auto">
            Create your first shop website using your voice. Takes less than 30 seconds.
          </p>
          <Link
            to="/create"
            className="mt-6 inline-block rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-700 transition-colors"
          >
            Create your first shop
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {shops.map(shop => (
            <ShopCard
              key={shop.shopId}
              shop={shop}
              onDelete={handleDelete}
              deleting={deleting}
            />
          ))}
        </div>
      )}
    </div>
  )
}

import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'
import { Copy, ExternalLink, Eye, Mic, Package, Pencil, Trash2 } from 'lucide-react'
import Modal from '../components/Modal.jsx'
import Spinner from '../components/Spinner.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { deleteShop, getMyShops } from '../lib/api.js'
import { categoryEmoji, getTheme, shopPath, shopUrl } from '../lib/shop.js'

function ShopCard({ shop, onDelete }) {
  const t = getTheme(shop.theme)
  return (
    <article className="panel flex flex-col overflow-hidden">
      <div className="awning awning-sm" style={{ '--awning': t.awning }} />
      <div className="flex flex-1 flex-col p-5 pt-7">
        <p className="text-sm font-medium capitalize text-neel-500">
          <span aria-hidden="true">{categoryEmoji(shop.category)}</span> {shop.category || 'Shop'}
        </p>
        <h2 className="sign mt-1 break-words text-[1.9rem]" style={{ color: t.ink }}>{shop.shopName}</h2>
        {shop.tagline && <p className="mt-1 text-neel-500 line-clamp-2">{shop.tagline}</p>}
        <p className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-sm font-medium text-neel-700">
          <span className="inline-flex items-center gap-1.5"><Eye className="h-4 w-4 text-neel-300" aria-hidden="true" /> {shop.viewCount} {shop.viewCount === 1 ? 'visit' : 'visits'}</span>
          <span className="inline-flex items-center gap-1.5"><Package className="h-4 w-4 text-neel-300" aria-hidden="true" /> {shop.productCount} {shop.productCount === 1 ? 'item' : 'items'}</span>
        </p>
        <div className="mt-auto flex gap-2 pt-5">
          <Link to={`/manage/${shop.shopId}`} className="btn-ink btn-sm flex-1"><Pencil className="h-4 w-4" aria-hidden="true" /> Edit</Link>
          <a href={shopPath(shop)} target="_blank" rel="noreferrer" className="btn-line btn-sm"><ExternalLink className="h-4 w-4" aria-hidden="true" /> Open</a>
          <button type="button" onClick={() => { navigator.clipboard?.writeText(shopUrl(shop)); toast.success('Link copied') }} className="btn-line btn-sm px-3" aria-label={`Copy link to ${shop.shopName}`} title="Copy link">
            <Copy className="h-4 w-4" />
          </button>
          <button type="button" onClick={() => onDelete(shop)} className="btn-line btn-sm px-3 text-sindoor hover:border-sindoor/40 hover:bg-sindoor-soft" aria-label={`Delete ${shop.shopName}`} title="Delete">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </article>
  )
}

export default function ShopListPage() {
  const { user } = useAuth()
  const [shops, setShops] = useState([])
  const [loading, setLoading] = useState(true)
  const [toDelete, setToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    getMyShops()
      .then(setShops)
      .catch(e => toast.error(e.message || 'Could not load your shops'))
      .finally(() => setLoading(false))
  }, [])

  async function confirmDelete() {
    setDeleting(true)
    try {
      await deleteShop(toDelete.shopId)
      setShops(prev => prev.filter(s => s.shopId !== toDelete.shopId))
      toast.success(`Deleted ${toDelete.shopName}`)
      setToDelete(null)
    } catch (e) {
      toast.error(e.message || 'Could not delete. Try again.')
    } finally {
      setDeleting(false)
    }
  }

  const firstName = (user?.name || '').split(' ')[0]
  const totalViews = shops.reduce((sum, s) => sum + (s.viewCount || 0), 0)

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-lg text-neel-500">Namaste{firstName ? `, ${firstName}` : ''}</p>
          <h1 className="text-[clamp(2.2rem,5vw,3rem)] font-bold leading-tight text-neel-900 condensed">Your shops</h1>
          {shops.length > 0 && (
            <p className="mt-1 text-neel-700">
              {shops.length} {shops.length === 1 ? 'shop' : 'shops'} online, visited {totalViews} {totalViews === 1 ? 'time' : 'times'} so far.
            </p>
          )}
        </div>
        {shops.length > 0 && <Link to="/create" className="btn-ink"><Mic className="h-4 w-4" aria-hidden="true" /> New shop</Link>}
      </div>

      {loading ? (
        <Spinner label="Loading your shops…" />
      ) : shops.length === 0 ? (
        <div className="on-haldi mt-10 flex flex-col items-center rounded-[32px] bg-haldi px-6 py-14 text-center">
          <h2 className="sign text-[clamp(2rem,5vw,3rem)] text-neel-900">Your first shop page is one voice note away</h2>
          <p className="mt-3 max-w-md text-lg text-neel-700">Tell us your shop name, what you sell and your prices. We will build the page while you wait.</p>
          <Link to="/create" className="btn-ink mt-8 px-8 py-4 text-lg"><Mic className="h-5 w-5" aria-hidden="true" /> Make my shop page</Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {shops.map(shop => <ShopCard key={shop.shopId} shop={shop} onDelete={setToDelete} />)}
        </div>
      )}

      <Modal open={!!toDelete} onClose={() => !deleting && setToDelete(null)} labelledBy="delete-title">
        {toDelete && (
          <div className="p-6 sm:p-8">
            <h2 id="delete-title" className="text-2xl font-bold text-neel-900 condensed">Delete {toDelete.shopName}?</h2>
            <p className="mt-2 text-neel-700">The page, its link and its QR code will stop working for customers. This can’t be undone.</p>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" data-autofocus onClick={() => setToDelete(null)} className="btn-line">Keep shop</button>
              <button type="button" onClick={confirmDelete} disabled={deleting} className="btn-danger">
                <Trash2 className="h-4 w-4" aria-hidden="true" /> {deleting ? 'Deleting…' : 'Delete shop'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

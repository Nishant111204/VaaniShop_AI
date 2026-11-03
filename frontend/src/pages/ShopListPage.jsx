import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'
import { Copy, ExternalLink, Eye, Mic, Package, Pencil, ShoppingBasket, Trash2 } from 'lucide-react'
import Modal from '../components/Modal.jsx'
import Spinner from '../components/Spinner.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { deleteShop, getMyShops } from '../lib/api.js'
import { categoryEmoji, getTheme, shopPath, shopUrl } from '../lib/shop.js'
import { useI18n } from '../i18n/index.jsx'

function ShopCard({ shop, onDelete }) {
  const { t } = useI18n()
  const theme = getTheme(shop.theme)
  return (
    <article className="panel flex flex-col overflow-hidden">
      <div className="awning awning-sm" style={{ '--awning': theme.awning }} />
      <div className="flex flex-1 flex-col p-5 pt-7">
        <p className="text-sm font-medium capitalize text-neel-500">
          <span aria-hidden="true">{categoryEmoji(shop.category)}</span> {shop.category || t('common.shop')}
        </p>
        <h2 className="sign mt-1 break-words text-[1.9rem]" style={{ color: theme.ink }}>{shop.shopName}</h2>
        {shop.tagline && <p className="mt-1 text-neel-500 line-clamp-2">{shop.tagline}</p>}
        <div className="mt-4 rounded-2xl bg-neel-50 px-3.5 py-2.5">
          <p className="text-xs font-medium text-neel-500">{t('dash.thisWeek')}</p>
          <p className="mt-0.5 flex flex-wrap gap-x-4 gap-y-1 text-sm font-semibold text-neel-900">
            <span className="inline-flex items-center gap-1.5"><Eye className="h-4 w-4 text-neel-500" aria-hidden="true" /> {t('dash.visits', { n: shop.visitsLast7Days })}</span>
            <span className="inline-flex items-center gap-1.5"><ShoppingBasket className="h-4 w-4 text-neel-500" aria-hidden="true" /> {t('dash.orders', { n: shop.ordersLast7Days })}</span>
          </p>
        </div>
        <p className="mt-2 flex items-center gap-1.5 text-sm text-neel-500">
          <Package className="h-4 w-4" aria-hidden="true" /> {t('dash.items', { n: shop.productCount })}
        </p>
        <div className="mt-auto flex gap-2 pt-5">
          <Link to={`/manage/${shop.shopId}`} className="btn-ink btn-sm flex-1"><Pencil className="h-4 w-4" aria-hidden="true" /> {t('common.edit')}</Link>
          <a href={shopPath(shop)} target="_blank" rel="noreferrer" className="btn-line btn-sm"><ExternalLink className="h-4 w-4" aria-hidden="true" /> {t('common.open')}</a>
          <button type="button" onClick={() => { navigator.clipboard?.writeText(shopUrl(shop)); toast.success(t('common.linkCopied')) }} className="btn-line btn-sm px-3" aria-label={t('dash.copyLinkTo', { name: shop.shopName })} title={t('common.copyLink')}>
            <Copy className="h-4 w-4" />
          </button>
          <button type="button" onClick={() => onDelete(shop)} className="btn-line btn-sm px-3 text-sindoor hover:border-sindoor/40 hover:bg-sindoor-soft" aria-label={t('dash.deleteShop', { name: shop.shopName })} title={t('dash.deleteShop', { name: shop.shopName })}>
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </article>
  )
}

export default function ShopListPage() {
  const { user } = useAuth()
  const { t } = useI18n()
  const [shops, setShops] = useState([])
  const [loading, setLoading] = useState(true)
  const [toDelete, setToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    getMyShops()
      .then(setShops)
      .catch(e => toast.error(e.message || t('dash.loadErr')))
      .finally(() => setLoading(false))
  }, [])

  async function confirmDelete() {
    setDeleting(true)
    try {
      await deleteShop(toDelete.shopId)
      setShops(prev => prev.filter(s => s.shopId !== toDelete.shopId))
      toast.success(t('dash.deleted', { name: toDelete.shopName }))
      setToDelete(null)
    } catch (e) {
      toast.error(e.message || t('dash.deleteErr'))
    } finally {
      setDeleting(false)
    }
  }

  const firstName = (user?.name || '').split(' ')[0]
  const totalViews = shops.reduce((sum, s) => sum + (s.viewCount || 0), 0)
  const weekOrders = shops.reduce((sum, s) => sum + (s.ordersLast7Days || 0), 0)

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-lg text-neel-500">{t('dash.namaste', { name: firstName ? `, ${firstName}` : '' })}</p>
          <h1 className="text-[clamp(2.2rem,5vw,3rem)] font-bold leading-tight text-neel-900 condensed">{t('dash.title')}</h1>
          {shops.length > 0 && (
            <p className="mt-1 text-neel-700">
              {t('dash.summary', { shops: shops.length, views: totalViews })}
              {weekOrders > 0 && t('dash.weekOrders', { n: weekOrders })}
            </p>
          )}
        </div>
        {shops.length > 0 && <Link to="/create" className="btn-ink"><Mic className="h-4 w-4" aria-hidden="true" /> {t('nav.newShop')}</Link>}
      </div>

      {loading ? (
        <Spinner label={t('dash.loading')} />
      ) : shops.length === 0 ? (
        <div className="on-haldi mt-10 flex flex-col items-center rounded-[32px] bg-haldi px-6 py-14 text-center">
          <h2 className="sign text-[clamp(2rem,5vw,3rem)] text-neel-900">{t('dash.emptyTitle')}</h2>
          <p className="mt-3 max-w-md text-lg text-neel-700">{t('dash.emptyBody')}</p>
          <Link to="/create" className="btn-ink mt-8 px-8 py-4 text-lg"><Mic className="h-5 w-5" aria-hidden="true" /> {t('nav.makePage')}</Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {shops.map(shop => <ShopCard key={shop.shopId} shop={shop} onDelete={setToDelete} />)}
        </div>
      )}

      <Modal open={!!toDelete} onClose={() => !deleting && setToDelete(null)} labelledBy="delete-title">
        {toDelete && (
          <div className="p-6 sm:p-8">
            <h2 id="delete-title" className="text-2xl font-bold text-neel-900 condensed">{t('dash.del.title', { name: toDelete.shopName })}</h2>
            <p className="mt-2 text-neel-700">{t('dash.del.body')}</p>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" data-autofocus onClick={() => setToDelete(null)} className="btn-line">{t('dash.del.keep')}</button>
              <button type="button" onClick={confirmDelete} disabled={deleting} className="btn-danger">
                <Trash2 className="h-4 w-4" aria-hidden="true" /> {deleting ? t('dash.del.deleting') : t('dash.del.confirm')}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

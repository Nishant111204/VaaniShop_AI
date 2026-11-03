import React, { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import ShopSite from '../components/ShopSite.jsx'
import Spinner from '../components/Spinner.jsx'
import { getShop, getShopBySlug, trackEvent } from '../lib/api.js'
import { getTheme, shopPath, shopUrl } from '../lib/shop.js'

/** The shop's own website, without any VaaniShop navigation around it. */
export default function PublicShopPage() {
  const { id, slug } = useParams()
  const [state, setState] = useState({ loading: true, shop: null, error: null })

  useEffect(() => {
    let cancelled = false
    setState({ loading: true, shop: null, error: null })
    ;(slug ? getShopBySlug(slug) : getShop(id))
      .then(shop => {
        if (cancelled) return
        setState({ loading: false, shop, error: null })
        // Old /shop/{uuid} links still work, but show the friendlier address.
        if (!slug && shop.slug) window.history.replaceState(window.history.state, '', shopPath(shop))
      })
      .catch(error => { if (!cancelled) setState({ loading: false, shop: null, error }) })
    return () => { cancelled = true }
  }, [id, slug])

  const shop = state.shop
  useEffect(() => {
    if (!shop) return undefined
    const d = shop.data
    const meta = document.querySelector('meta[name="theme-color"]')
    const previous = { title: document.title, color: meta?.getAttribute('content') }
    document.title = d.tagline ? `${d.shopName} | ${d.tagline}` : d.shopName
    meta?.setAttribute('content', getTheme(d.theme).awning)
    return () => {
      document.title = previous.title
      if (previous.color) meta?.setAttribute('content', previous.color)
    }
  }, [shop])

  if (state.loading) return <Spinner label="Opening shop…" className="min-h-dvh" />

  if (!shop) {
    const notFound = state.error?.status === 404 || state.error?.status === 400
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-neel-50 px-4 text-center">
        <div className="awning w-48 rounded-t-lg" style={{ '--awning': '#A9B2D9' }} aria-hidden="true" />
        <h1 className="sign mt-10 text-4xl text-neel-900">{notFound ? 'This shop isn’t here' : 'Couldn’t open this shop'}</h1>
        <p className="mt-3 max-w-sm text-lg text-neel-500">
          {notFound
            ? 'The link may be mistyped, or the owner may have removed the page. Ask the shop for their link again.'
            : 'Check your internet connection and reload the page.'}
        </p>
        <Link to="/" className="btn-ink mt-8">Go to VaaniShop</Link>
      </div>
    )
  }

  return (
    <div className="min-h-dvh">
      <ShopSite data={shop.data} url={shopUrl(shop)} basketKey={shop.shopId} live onTrack={type => trackEvent(shop.shopId, type)} />
    </div>
  )
}

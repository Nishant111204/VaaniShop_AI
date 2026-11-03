import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Link, useParams } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { ArrowLeft, MessageCircle, Printer } from 'lucide-react'
import Spinner from '../components/Spinner.jsx'
import { getOwnedShop } from '../lib/api.js'
import { categoryEmoji, getTheme, shopUrl } from '../lib/shop.js'

/** An A4 poster with the shop's QR code, for sticking on the counter or shutter. */
export default function PosterPage() {
  const { id } = useParams()
  const [shop, setShop] = useState(null)

  useEffect(() => {
    getOwnedShop(id).then(setShop).catch(e => toast.error(e.message || 'Could not load shop'))
  }, [id])

  if (!shop) return <Spinner label="Preparing poster…" className="min-h-dvh" />

  const d = shop.data
  const t = getTheme(d.theme)
  const url = shopUrl(shop)
  const wa = d.whatsapp || d.phone

  return (
    <div className="min-h-dvh bg-neel-100 py-6 print:bg-white print:p-0">
      <div className="no-print mx-auto mb-5 flex max-w-[210mm] items-center justify-between gap-3 px-4">
        <Link to={`/manage/${id}`} className="btn-line btn-sm"><ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to shop</Link>
        <button type="button" onClick={() => window.print()} className="btn-ink btn-sm"><Printer className="h-4 w-4" aria-hidden="true" /> Print poster</button>
      </div>

      <article
        className="poster print-exact mx-auto flex aspect-[210/297] w-full max-w-[210mm] flex-col overflow-hidden bg-white text-center shadow-lift print:shadow-none"
        style={{ '--awning': t.awning, containerType: 'inline-size' }}
      >
        <div className="awning shrink-0" style={{ '--stripe': '6cqi', height: '9cqi' }} />
        <div className="flex flex-1 flex-col items-center justify-between gap-[3cqi] px-[8cqi] pb-[5cqi] pt-[7cqi]">
          <div>
            <p className="font-semibold capitalize" style={{ fontSize: '3.2cqi', color: t.accent }}>
              <span aria-hidden="true">{categoryEmoji(d.category)}</span> {d.category || 'Shop'}
            </p>
            <h1 className="sign mt-[2cqi] break-words" style={{ fontSize: d.shopName.length > 22 ? '7.5cqi' : '9.5cqi', color: t.ink }}>{d.shopName}</h1>
            {d.tagline && <p className="mt-[2cqi] text-neel-700" style={{ fontSize: '3.6cqi' }}>{d.tagline}</p>}
          </div>

          <div className="flex flex-col items-center">
            <div className="rounded-[4cqi] border-[0.6cqi] p-[3cqi]" style={{ borderColor: t.awning }}>
              <QRCodeSVG value={url} size={512} fgColor="#141B3D" marginSize={0} style={{ width: '36cqi', height: '36cqi' }} />
            </div>
            <p className="mt-[3cqi] font-bold text-neel-900" style={{ fontSize: '4.6cqi' }}>Scan for our price list</p>
            <p className="mt-[1cqi] text-neel-700" lang="hi" style={{ fontSize: '3.8cqi' }}>स्कैन करें, व्हाट्सऐप पर ऑर्डर करें</p>
          </div>

          <div className="w-full">
            {wa && (
              <p className="inline-flex items-center gap-[1.5cqi] rounded-full bg-paan px-[4cqi] py-[1.6cqi] font-bold text-white" style={{ fontSize: '4cqi' }}>
                <MessageCircle style={{ width: '4.4cqi', height: '4.4cqi' }} aria-hidden="true" /> {wa}
              </p>
            )}
            <p className="mt-[3cqi] break-all text-neel-500" style={{ fontSize: '2.6cqi' }}>{url.replace(/^https?:\/\//, '')}</p>
          </div>
        </div>
      </article>
      <p className="no-print mt-4 text-center text-sm text-neel-500">Prints on one A4 sheet. Laminate it to keep it fresh.</p>
    </div>
  )
}

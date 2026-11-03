import React, { useRef } from 'react'
import { Link } from 'react-router-dom'
import { QRCodeCanvas, QRCodeSVG } from 'qrcode.react'
import { Download, Printer } from 'lucide-react'
import { useI18n } from '../i18n/index.jsx'

/** The shop's QR code, with a high-resolution PNG download and a link to the printable poster. */
export default function QrCard({ url, fileName = 'shop-qr', posterTo }) {
  const canvasRef = useRef(null)
  const { t } = useI18n()

  function download() {
    const a = document.createElement('a')
    a.href = canvasRef.current.toDataURL('image/png')
    a.download = `${fileName}.png`
    a.click()
  }

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
      <div className="shrink-0 rounded-3xl border border-neel-100 bg-white p-3">
        <QRCodeSVG value={url} size={148} fgColor="#141B3D" marginSize={0} />
      </div>
      <QRCodeCanvas ref={canvasRef} value={url} size={1024} marginSize={4} fgColor="#141B3D" className="hidden" aria-hidden="true" />
      <div className="text-center sm:text-left">
        <p className="text-lg font-semibold text-neel-900">{t('qr.title')}</p>
        <p className="mt-1 text-neel-500">{t('qr.body')}</p>
        <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
          <button type="button" onClick={download} className="btn-line btn-sm"><Download className="h-4 w-4" aria-hidden="true" /> {t('qr.download')}</button>
          {posterTo && (
            <Link to={posterTo} className="btn-line btn-sm"><Printer className="h-4 w-4" aria-hidden="true" /> {t('qr.poster')}</Link>
          )}
        </div>
      </div>
    </div>
  )
}

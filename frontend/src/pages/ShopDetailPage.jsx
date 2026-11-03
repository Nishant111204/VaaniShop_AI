import React, { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft, Camera, Check, Copy, ExternalLink, ImagePlus, Loader2, MessageCircle, Plus, Send, Sparkles, Trash2, Wand2, X,
} from 'lucide-react'
import Insights from '../components/Insights.jsx'
import PhoneFrame from '../components/PhoneFrame.jsx'
import QrCard from '../components/QrCard.jsx'
import ShopSite from '../components/ShopSite.jsx'
import Spinner from '../components/Spinner.jsx'
import ThemePicker from '../components/ThemePicker.jsx'
import VoiceCapture from '../components/VoiceCapture.jsx'
import {
  getOwnedShop, imageUrl, transcribeAudio, updateShopFields, updateShopFromText, uploadShopImage,
} from '../lib/api.js'
import { resizeImage } from '../lib/image.js'
import { categoryEmoji, shopPath, shopUrl, shareText, whatsappShareLink } from '../lib/shop.js'
import { useI18n } from '../i18n/index.jsx'

const TABS = [
  { key: 'details' },
  { key: 'items' },
  { key: 'look' },
  { key: 'share' },
  { key: 'insights' },
  { key: 'preview', mobileOnly: true },
]

const EMPTY_PRODUCT = { name: '', price: '', description: '', category: '', emoji: '', image: '', suggested: false }

export default function ShopDetailPage() {
  const { id } = useParams()
  const { t } = useI18n()
  const [shop, setShop] = useState(null)
  const [form, setForm] = useState(null)
  const [loadError, setLoadError] = useState(null)
  const [tab, setTab] = useState('details')
  const [saving, setSaving] = useState(false)
  const [lastChange, setLastChange] = useState('')

  const dirty = !!shop && !!form && JSON.stringify(form) !== JSON.stringify(shop.data)

  useEffect(() => {
    getOwnedShop(id)
      .then(res => { setShop(res); setForm(res.data) })
      .catch(e => setLoadError(e))
  }, [id])

  useEffect(() => {
    if (!dirty) return undefined
    const warn = e => { e.preventDefault(); e.returnValue = '' }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  function set(patch) {
    setForm(prev => ({ ...prev, ...patch }))
  }

  async function save(next = form, { quiet = false } = {}) {
    setSaving(true)
    try {
      const res = await updateShopFields(id, next)
      setShop(res)
      setForm(res.data)
      if (!quiet) toast.success(t('edit.saved'))
      return res
    } catch (e) {
      toast.error(e.message || t('edit.saveErr'))
      return null
    } finally {
      setSaving(false)
    }
  }

  /** Applies a spoken or typed change. Unsaved edits are saved first so the AI sees them. */
  async function applyChange(instruction) {
    if (dirty && !(await save(form, { quiet: true }))) return false
    try {
      const res = await updateShopFromText(id, instruction)
      setShop(res)
      setForm(res.data)
      setLastChange(res.changeSummary || t('edit.updated'))
      toast.success(res.changeSummary || t('edit.updated'))
      return true
    } catch (e) {
      toast.error(e.message || t('edit.changeErr'))
      return false
    }
  }

  if (loadError) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <h1 className="text-3xl font-bold condensed">{loadError.status === 403 ? t('edit.err.notYours') : t('edit.err.open')}</h1>
        <p className="mt-2 text-neel-500">{loadError.message}</p>
        <Link to="/dashboard" className="btn-ink mt-6">{t('edit.backToShops')}</Link>
      </div>
    )
  }
  if (!shop || !form) return <Spinner label={t('edit.opening')} />

  const url = shopUrl(shop)

  return (
    <div className="mx-auto max-w-6xl px-4 pb-32 pt-6 sm:px-6">
      <Link to="/dashboard" className="btn-ghost btn-sm -ml-3"><ArrowLeft className="h-4 w-4" aria-hidden="true" /> {t('nav.myShops')}</Link>

      <header className="mt-2 flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="sign break-words text-[clamp(2.2rem,5vw,3.4rem)] text-neel-900">{shop.data.shopName}</h1>
          <p className="mt-1 text-neel-500">{t('edit.visitsSoFar', { n: shop.viewCount })}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => { navigator.clipboard?.writeText(url); toast.success(t('common.linkCopied')) }} className="btn-line btn-sm">
            <Copy className="h-4 w-4" aria-hidden="true" /> {t('common.copyLink')}
          </button>
          <a href={shopPath(shop)} target="_blank" rel="noreferrer" className="btn-line btn-sm">
            <ExternalLink className="h-4 w-4" aria-hidden="true" /> {t('edit.openPage')}
          </a>
        </div>
      </header>

      <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0">
          <VoiceEdit onApply={applyChange} lastChange={lastChange} busy={saving} />

          <div role="tablist" aria-label={t('edit.sections')} className="-mx-4 mt-8 flex gap-1 overflow-x-auto border-b border-neel-100 px-4 scrollbar-none sm:mx-0 sm:px-0">
            {TABS.map(section => (
              <button
                key={section.key}
                role="tab"
                id={`tab-${section.key}`}
                aria-selected={tab === section.key}
                aria-controls={`panel-${section.key}`}
                onClick={() => setTab(section.key)}
                className={`-mb-px shrink-0 border-b-[3px] px-4 py-3 font-semibold transition-colors ${section.mobileOnly ? 'lg:hidden' : ''} ${tab === section.key ? 'border-sindoor text-neel-900' : 'border-transparent text-neel-500 hover:text-neel'}`}
              >
                {t(`edit.tab.${section.key}`)}{section.key === 'items' ? ` (${form.products.length})` : ''}
              </button>
            ))}
          </div>

          <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} className="pt-6">
            {tab === 'details' && <DetailsTab form={form} set={set} />}
            {tab === 'items' && <ItemsTab form={form} set={set} shopId={id} onPhotoSaved={next => save(next, { quiet: true })} />}
            {tab === 'look' && <LookTab form={form} set={set} shopId={id} onPhotoSaved={next => save(next, { quiet: true })} />}
            {tab === 'share' && <ShareTab shop={shop} url={url} />}
            {tab === 'insights' && <Insights shopId={id} onShare={() => setTab('share')} />}
            {tab === 'preview' && (
              <PhoneFrame responsive>
                <ShopSite data={form} url={url} />
              </PhoneFrame>
            )}
          </div>
        </div>

        <aside className="hidden lg:block" aria-label={t('edit.livePreview')}>
          <div className="sticky top-24">
            <PhoneFrame responsive>
              <ShopSite data={form} url={url} />
            </PhoneFrame>
            <p className="mt-3 text-center text-sm text-neel-500">{dirty ? t('edit.previewUnsaved') : t('edit.previewLive')}</p>
          </div>
        </aside>
      </div>

      {dirty && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-neel-100 bg-white/95 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 pb-safe pt-3 sm:px-6">
            <p className="font-medium text-neel-700">{t('edit.unsaved')}</p>
            <div className="flex gap-2">
              <button type="button" onClick={() => setForm(shop.data)} className="btn-ghost btn-sm">{t('edit.discard')}</button>
              <button type="button" onClick={() => save()} disabled={saving} className="btn-ink btn-sm px-5">
                {saving ? <Loader2 className="h-4 w-4 spin-slow" aria-hidden="true" /> : <Check className="h-4 w-4" aria-hidden="true" />}
                {t('edit.save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function VoiceEdit({ onApply, lastChange, busy }) {
  const { t } = useI18n()
  const [text, setText] = useState('')
  const [working, setWorking] = useState(false)

  async function run(instruction) {
    setWorking(true)
    const ok = await onApply(instruction)
    if (ok) setText('')
    setWorking(false)
  }

  async function handleAudio(blob, language, extension) {
    setWorking(true)
    try {
      const { text: heard } = await transcribeAudio(blob, language, extension)
      if (!heard?.trim()) {
        toast.error(t('edit.noWords'))
        setWorking(false)
        return
      }
      await run(heard)
    } catch (e) {
      toast.error(e.message || t('edit.notUnderstood'))
      setWorking(false)
    }
  }

  return (
    <section aria-labelledby="voice-edit" className="on-haldi rounded-[28px] bg-haldi p-5 sm:p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <VoiceCapture onAudio={handleAudio} disabled={working || busy} size="md" layout="row" showLanguages={false}
          idleLabel={working ? t('edit.voice.working') : t('edit.voice.idle')} />
      </div>
      <h2 id="voice-edit" className="sr-only">{t('edit.voice.heading')}</h2>
      <form onSubmit={e => { e.preventDefault(); if (text.trim()) run(text.trim()) }} className="mt-5 flex gap-2">
        <label htmlFor="change-text" className="sr-only">{t('edit.voice.typeLabel')}</label>
        <input id="change-text" value={text} onChange={e => setText(e.target.value)} disabled={working} maxLength={2000}
          placeholder={t('edit.voice.placeholder')} className="field border-0" />
        <button type="submit" disabled={working || !text.trim()} className="btn-ink shrink-0 px-4" aria-label={t('edit.voice.apply')}>
          {working ? <Loader2 className="h-5 w-5 spin-slow" /> : <Send className="h-5 w-5" />}
        </button>
      </form>
      {lastChange ? (
        <p className="mt-3 flex items-center gap-2 font-medium text-neel-900" aria-live="polite">
          <Wand2 className="h-4 w-4 shrink-0" aria-hidden="true" /> {lastChange}
        </p>
      ) : (
        <p className="mt-3 text-sm text-neel-700">{t('edit.voice.examples')}</p>
      )}
    </section>
  )
}

function Field({ id, label, value, onChange, textarea = false, hint, ...rest }) {
  const Tag = textarea ? 'textarea' : 'input'
  return (
    <div>
      <label htmlFor={id} className="field-label">{label}</label>
      <Tag id={id} value={value || ''} onChange={e => onChange(e.target.value)} className={`field ${textarea ? 'min-h-[7rem] resize-y' : ''}`} {...rest} />
      {hint && <p className="mt-1 text-sm text-neel-500">{hint}</p>}
    </div>
  )
}

function DetailsTab({ form, set }) {
  const { t } = useI18n()
  return (
    <div className="grid gap-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="edit-name" label={t('edit.f.shopName')} value={form.shopName} onChange={v => set({ shopName: v })} maxLength={100} />
        <Field id="edit-category" label={t('edit.f.category')} value={form.category} onChange={v => set({ category: v })} placeholder={t('edit.f.categoryHint')} maxLength={40} />
      </div>
      <Field id="edit-tagline" label={t('edit.f.tagline')} value={form.tagline} onChange={v => set({ tagline: v })} maxLength={140} hint={t('edit.f.taglineHint')} />
      <Field id="edit-about" label={t('edit.f.about')} value={form.description} onChange={v => set({ description: v })} textarea maxLength={1500} />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="edit-whatsapp" label={t('edit.f.whatsapp')} value={form.whatsapp} onChange={v => set({ whatsapp: v })} type="tel" inputMode="tel" hint={t('edit.f.whatsappHint')} />
        <Field id="edit-phone" label={t('edit.f.phone')} value={form.phone} onChange={v => set({ phone: v })} type="tel" inputMode="tel" />
      </div>
      <Field id="edit-address" label={t('edit.f.address')} value={form.address} onChange={v => set({ address: v })} maxLength={300} placeholder={t('edit.f.addressHint')} />
      <Field id="edit-hours" label={t('edit.f.hours')} value={form.timing} onChange={v => set({ timing: v })} maxLength={120} placeholder="8:00 AM – 10:00 PM, Mon–Sat"
        hint={t('edit.f.hoursHint')} />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="edit-email" label={t('edit.f.email')} value={form.email} onChange={v => set({ email: v })} type="email" />
        <Field id="edit-instagram" label={t('edit.f.instagram')} value={form.instagram} onChange={v => set({ instagram: v })} placeholder="@yourshop" />
      </div>
    </div>
  )
}

function ItemsTab({ form, set, shopId, onPhotoSaved }) {
  const { t } = useI18n()
  const products = form.products

  function update(i, patch) {
    set({ products: products.map((p, idx) => (idx === i ? { ...p, ...patch } : p)) })
  }

  function remove(i) {
    set({ products: products.filter((_, idx) => idx !== i) })
  }

  async function setPhoto(i, image) {
    const next = { ...form, products: products.map((p, idx) => (idx === i ? { ...p, image } : p)) }
    set(next)
    await onPhotoSaved(next)
  }

  const suggestedCount = products.filter(p => p.suggested).length

  return (
    <div className="grid gap-4">
      {suggestedCount > 0 && (
        <p className="flex items-start gap-2 rounded-2xl bg-haldi-soft px-4 py-3 text-neel-900">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{t('edit.items.suggested', { n: suggestedCount })}</span>
        </p>
      )}

      {products.length === 0 && <p className="rounded-2xl bg-white p-6 text-center text-neel-500">{t('edit.items.empty')}</p>}

      <ul className="grid gap-3">
        {products.map((p, i) => (
          <li key={i} className={`panel p-4 ${p.suggested ? 'border-haldi' : ''}`}>
            <div className="flex gap-4">
              <PhotoButton shopId={shopId} image={p.image} emoji={p.emoji || categoryEmoji(form.category)} label={p.name || t('edit.items.thisItem')}
                onUploaded={url => setPhoto(i, url)} onRemove={() => setPhoto(i, '')} />
              <div className="grid min-w-0 flex-1 gap-3 sm:grid-cols-[1fr_9rem]">
                <input aria-label={t('edit.items.name')} value={p.name} onChange={e => update(i, { name: e.target.value })} placeholder={t('edit.items.name')} maxLength={100} className="field py-2.5 font-semibold" />
                <input aria-label={t('edit.items.price')} value={p.price} onChange={e => update(i, { price: e.target.value })} placeholder="₹50/kg" maxLength={40} className="field py-2.5" />
                <input aria-label={t('edit.items.description')} value={p.description} onChange={e => update(i, { description: e.target.value })} placeholder={t('edit.items.description')} maxLength={300} className="field py-2.5 sm:col-span-2" />
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-neel-100 pt-3">
              <label className="flex items-center gap-2 text-sm text-neel-500">
                {t('edit.items.group')}
                <input value={p.category} onChange={e => update(i, { category: e.target.value })} placeholder={t('edit.items.groupHint')} maxLength={40} className="field w-32 px-2.5 py-1.5 text-sm" />
              </label>
              <label className="flex items-center gap-2 text-sm text-neel-500">
                {t('edit.items.icon')}
                <input value={p.emoji} onChange={e => update(i, { emoji: e.target.value })} placeholder="🍚" maxLength={8} className="field w-14 px-2 py-1.5 text-center text-lg" />
              </label>
              <span className="flex-1" />
              {p.suggested && (
                <button type="button" onClick={() => update(i, { suggested: false })} className="btn-haldi btn-sm"><Check className="h-4 w-4" aria-hidden="true" /> {t('edit.items.keep')}</button>
              )}
              <button type="button" onClick={() => remove(i)} className="btn-ghost btn-sm text-sindoor hover:bg-sindoor-soft" aria-label={t('edit.items.deleteNamed', { name: p.name || t('edit.items.thisItem') })}>
                <Trash2 className="h-4 w-4" aria-hidden="true" /> {t('edit.items.delete')}
              </button>
            </div>
          </li>
        ))}
      </ul>

      <button type="button" onClick={() => set({ products: [...products, { ...EMPTY_PRODUCT }] })} className="btn-line border-dashed py-4">
        <Plus className="h-5 w-5" aria-hidden="true" /> {t('edit.items.add')}
      </button>
    </div>
  )
}

function PhotoButton({ shopId, image, emoji, label, onUploaded, onRemove, wide = false }) {
  const { t } = useI18n()
  const inputRef = useRef(null)
  const [uploading, setUploading] = useState(false)

  async function handleFile(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploading(true)
    try {
      const blob = await resizeImage(file, wide ? 1600 : 900)
      const res = await uploadShopImage(shopId, blob)
      await onUploaded(res.url)
      toast.success(t('edit.photo.added'))
    } catch (err) {
      toast.error(err.message || t('edit.photo.err'))
    } finally {
      setUploading(false)
    }
  }

  const size = wide ? 'aspect-[16/9] w-full rounded-3xl' : 'h-20 w-20 rounded-2xl'
  return (
    <div className={`relative shrink-0 ${wide ? 'w-full' : ''}`}>
      <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading}
        className={`group relative grid place-items-center overflow-hidden bg-neel-50 text-3xl ${size}`}
        aria-label={t(image ? 'edit.photo.change' : 'edit.photo.add', { label })}>
        {image ? <img src={imageUrl(image)} alt="" className="h-full w-full object-cover" /> : <span aria-hidden="true">{wide ? <ImagePlus className="h-8 w-8 text-neel-300" /> : emoji}</span>}
        <span className={`absolute inset-0 grid place-items-center bg-neel-900/55 text-white transition-opacity ${uploading ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100'}`}>
          {uploading ? <Loader2 className="h-6 w-6 spin-slow" /> : <Camera className="h-6 w-6" />}
        </span>
      </button>
      {image && !uploading && (
        <button type="button" onClick={onRemove} aria-label={t('edit.photo.remove', { label })}
          className="absolute -right-2 -top-2 grid h-7 w-7 place-items-center rounded-full bg-white text-neel-700 shadow-lift hover:text-sindoor">
          <X className="h-4 w-4" />
        </button>
      )}
      <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
    </div>
  )
}

function LookTab({ form, set, shopId, onPhotoSaved }) {
  const { t } = useI18n()
  async function setCover(coverImage) {
    const next = { ...form, coverImage }
    set(next)
    await onPhotoSaved(next)
  }
  return (
    <div className="grid gap-8">
      <section>
        <h2 id="look-colour" className="text-lg font-semibold">{t('edit.look.colour')}</h2>
        <p className="mb-4 text-neel-500">{t('edit.look.colourHint')}</p>
        <ThemePicker value={form.theme} onChange={theme => set({ theme })} labelledBy="look-colour" />
      </section>
      <section>
        <h2 className="text-lg font-semibold">{t('edit.look.photo')}</h2>
        <p className="mb-4 text-neel-500">{t('edit.look.photoHint')}</p>
        <PhotoButton wide shopId={shopId} image={form.coverImage} label={t('edit.look.yourShop')} onUploaded={setCover} onRemove={() => setCover('')} />
      </section>
    </div>
  )
}

function ShareTab({ shop, url }) {
  const { t } = useI18n()
  return (
    <div className="grid gap-6">
      <section className="panel p-5 sm:p-6">
        <h2 className="text-lg font-semibold">{t('edit.share.link')}</h2>
        <div className="mt-3 flex items-center gap-2 rounded-2xl border border-neel-100 bg-neel-50 p-1.5 pl-4">
          <span className="min-w-0 flex-1 truncate font-medium text-neel-700">{url.replace(/^https?:\/\//, '')}</span>
          <button type="button" onClick={() => { navigator.clipboard?.writeText(url); toast.success(t('common.linkCopied')) }} className="btn-line btn-sm shrink-0">
            <Copy className="h-4 w-4" aria-hidden="true" /> {t('common.copy')}
          </button>
        </div>
        <a href={whatsappShareLink(shareText(shop.data.shopName, url))} target="_blank" rel="noreferrer" className="btn-paan mt-4 w-full py-4 sm:w-auto">
          <MessageCircle className="h-5 w-5" aria-hidden="true" /> {t('common.shareWhatsApp')}
        </a>
      </section>
      <section className="panel p-5 sm:p-6">
        <QrCard url={url} fileName={shop.slug || 'shop'} posterTo={`/manage/${shop.shopId}/poster`} />
      </section>
    </div>
  )
}

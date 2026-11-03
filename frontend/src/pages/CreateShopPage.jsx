import React, { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft, AudioLines, Check, CircleCheck, Clock, Copy, ExternalLink, IndianRupee, Keyboard, Loader2, MapPin,
  MessageCircle, Mic, Pencil, RotateCcw, Store,
} from 'lucide-react'
import Logo from '../components/Logo.jsx'
import Modal from '../components/Modal.jsx'
import AuthForm from '../components/AuthForm.jsx'
import PhoneFrame from '../components/PhoneFrame.jsx'
import QrCard from '../components/QrCard.jsx'
import ShopSite from '../components/ShopSite.jsx'
import ThemePicker from '../components/ThemePicker.jsx'
import VoiceCapture from '../components/VoiceCapture.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { generateShop, publishShop, transcribeAudio } from '../lib/api.js'
import { takePendingInput } from '../lib/pendingInput.js'
import { clearDraft, loadDraft, saveDraft } from '../lib/storage.js'
import { getTheme, shopPath, shopUrl, shareText, whatsappShareLink } from '../lib/shop.js'

const MENTION = [
  { icon: Store, text: 'Shop name' },
  { icon: IndianRupee, text: 'Items and prices' },
  { icon: Clock, text: 'Opening hours' },
  { icon: MapPin, text: 'Area and city' },
  { icon: MessageCircle, text: 'WhatsApp number' },
]

const EXAMPLES = [
  {
    label: 'हिंदी',
    lang: 'hi',
    text: 'मेरी दुकान का नाम शर्मा किराना स्टोर है, कोथरूड पुणे में। चावल 60 रुपये किलो, तूर दाल 120 रुपये किलो, फॉर्च्यून तेल 150 रुपये लीटर। सुबह 8 से रात 10 बजे तक खुला, रविवार बंद। व्हाट्सऐप 98765 43210।',
  },
  {
    label: 'Hinglish',
    lang: 'en',
    text: 'Hamari bakery ka naam Ganesh Bakery hai, Nashik Road pe. Pav 40 rupaye, cream roll 15 rupaye, birthday cake 450 rupaye kilo. Subah 7 se raat 9 tak. Phone 91234 56789.',
  },
  {
    label: 'English',
    lang: 'en',
    text: 'Star Mobile Repair in Jayanagar, Bangalore. Screen replacement from ₹1,500, battery change ₹800, phone covers ₹199. Open 10am to 8pm, Monday to Saturday. WhatsApp 99887 76655.',
  },
]

export default function CreateShopPage() {
  const nav = useNavigate()
  const { isAuthenticated } = useAuth()
  const [params] = useSearchParams()
  const [stage, setStage] = useState('input') // input | working | preview | published
  const [mode, setMode] = useState(params.get('mode') === 'type' ? 'type' : 'voice')
  const [text, setText] = useState('')
  const [step, setStep] = useState(null) // transcribing | generating
  const [transcript, setTranscript] = useState('')
  const [draft, setDraft] = useState(null)
  const [published, setPublished] = useState(null)
  const [authOpen, setAuthOpen] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true
    const pending = takePendingInput()
    if (pending?.audio) {
      fromAudio(pending.audio, pending.language, pending.extension)
    } else if (pending?.text) {
      fromText(pending.text)
    } else {
      const saved = loadDraft()
      if (saved) {
        setDraft(saved)
        setStage('preview')
      }
    }
  }, [])

  useEffect(() => { window.scrollTo(0, 0) }, [stage])

  async function fromAudio(blob, language, extension) {
    setStage('working')
    setStep('transcribing')
    setTranscript('')
    let heard = ''
    try {
      const res = await transcribeAudio(blob, language, extension)
      heard = (res.text || '').trim()
    } catch (e) {
      toast.error(e.message || 'Could not understand the recording. Try again.')
      setStage('input')
      return
    }
    if (!heard) {
      toast.error('We could not hear any words. Try again somewhere quieter, or type instead.')
      setStage('input')
      return
    }
    setTranscript(heard)
    await build(heard)
  }

  async function fromText(value) {
    const trimmed = value.trim()
    if (trimmed.length < 15) {
      toast.error('Tell us a little more: your shop name and a few items with prices.')
      return
    }
    setStage('working')
    setTranscript(trimmed)
    await build(trimmed)
  }

  async function build(description) {
    setStep('generating')
    try {
      const shop = await generateShop(description)
      setDraft(shop)
      saveDraft(shop)
      setStage('preview')
    } catch (e) {
      toast.error(e.message || 'Could not build the page. Try again.')
      // Keep what they said, so trying again doesn't mean repeating themselves.
      setText(description)
      setMode('type')
      setStage('input')
    }
  }

  function updateDraft(patch) {
    setDraft(prev => {
      const next = { ...prev, ...patch }
      saveDraft(next)
      return next
    })
  }

  function requestPublish() {
    if (isAuthenticated) publish()
    else setAuthOpen(true)
  }

  // Called directly after signing up in the sheet, where `isAuthenticated` is still
  // the pre-sign-in value from this render, so it must not re-check it.
  async function publish() {
    setPublishing(true)
    try {
      const res = await publishShop(draft)
      clearDraft()
      setAuthOpen(false)
      setPublished(res)
      setStage('published')
    } catch (e) {
      toast.error(e.message || 'Could not publish. Try again.')
    } finally {
      setPublishing(false)
    }
  }

  function startOver() {
    clearDraft()
    setDraft(null)
    setTranscript('')
    setStage('input')
  }

  return (
    <div className={`min-h-dvh ${stage === 'input' || stage === 'working' ? 'on-haldi bg-haldi' : 'bg-neel-50'}`}>
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Logo />
        <Link to={isAuthenticated ? '/dashboard' : '/'} className="btn-ghost btn-sm">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> {isAuthenticated ? 'My shops' : 'Home'}
        </Link>
      </header>

      {stage === 'input' && (
        <InputStage
          mode={mode}
          setMode={setMode}
          text={text}
          setText={setText}
          onAudio={fromAudio}
          onText={() => fromText(text)}
        />
      )}
      {stage === 'working' && <WorkingStage step={step} transcript={transcript} fromVoice={mode === 'voice'} />}
      {stage === 'preview' && draft && (
        <PreviewStage draft={draft} update={updateDraft} onPublish={requestPublish} publishing={publishing} onStartOver={startOver} />
      )}
      {stage === 'published' && published && <PublishedStage shop={published} onManage={() => nav(`/manage/${published.shopId}`)} />}

      <Modal open={authOpen} onClose={() => setAuthOpen(false)} labelledBy="save-title">
        <div className="p-6 sm:p-8">
          <h2 id="save-title" className="text-2xl font-bold text-neel-900 condensed">Save your shop page</h2>
          <p className="mb-6 mt-1 text-neel-500">Use your mobile number. You will sign in with it to change prices and add photos later.</p>
          <AuthForm onDone={publish} submitLabel="Continue and publish" />
        </div>
      </Modal>
    </div>
  )
}

function InputStage({ mode, setMode, text, setText, onAudio, onText }) {
  return (
    <section className="mx-auto max-w-2xl px-4 pb-16 pt-6 text-center sm:pt-10">
      <h1 className="sign text-[clamp(2.4rem,7vw,4rem)] text-neel-900">Tell us about your shop</h1>
      <p className="mt-2 text-xl text-neel-700" lang="hi">अपनी दुकान के बारे में बताइए</p>

      <div role="tablist" aria-label="How to describe your shop" className="mx-auto mt-8 inline-flex rounded-2xl bg-neel/10 p-1">
        {[
          { key: 'voice', label: 'Speak', icon: Mic },
          { key: 'type', label: 'Type', icon: Keyboard },
        ].map(t => (
          <button key={t.key} role="tab" type="button" aria-selected={mode === t.key} onClick={() => setMode(t.key)}
            className={`flex items-center gap-2 rounded-xl px-5 py-2.5 font-semibold transition-colors ${mode === t.key ? 'bg-white text-neel shadow-sm' : 'text-neel-700 hover:text-neel'}`}>
            <t.icon className="h-4 w-4" aria-hidden="true" /> {t.label}
          </button>
        ))}
      </div>

      <div className="mt-8">
        {mode === 'voice' ? (
          <VoiceCapture onAudio={onAudio} />
        ) : (
          <div className="text-left">
            <label htmlFor="describe" className="sr-only">Describe your shop</label>
            <textarea
              id="describe"
              value={text}
              onChange={e => setText(e.target.value)}
              rows={6}
              maxLength={4000}
              placeholder="Example: Sharma Kirana Store in Kothrud, Pune. Rice ₹60/kg, toor dal ₹120/kg. Open 8 AM to 10 PM. WhatsApp 98765 43210."
              className="field resize-y rounded-2xl border-0 p-4 text-lg leading-relaxed shadow-lift"
            />
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-neel-700">Try an example:</span>
              {EXAMPLES.map(ex => (
                <button key={ex.label} type="button" onClick={() => setText(ex.text)} className="chip-off" lang={ex.lang}>{ex.label}</button>
              ))}
            </div>
            <button type="button" onClick={onText} disabled={!text.trim()} className="btn-ink mt-6 w-full py-4 text-lg">
              Build my shop page
            </button>
          </div>
        )}
      </div>

      <div className="mx-auto mt-12 max-w-xl rounded-3xl bg-white/60 p-5 text-left">
        <h2 className="font-semibold text-neel-900">Mention these, in any order</h2>
        <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2.5 sm:grid-cols-3">
          {MENTION.map(m => (
            <li key={m.text} className="flex items-center gap-2 text-neel-700">
              <m.icon className="h-4 w-4 shrink-0 text-sindoor" aria-hidden="true" /> {m.text}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

function WorkingStage({ step, transcript, fromVoice }) {
  const steps = [
    fromVoice && { key: 'transcribing', label: 'Turning your voice into text' },
    { key: 'generating', label: 'Writing your shop page' },
  ].filter(Boolean)
  const currentIndex = steps.findIndex(s => s.key === step)

  return (
    <section className="mx-auto max-w-xl px-4 pb-16 pt-10" aria-live="polite">
      <h1 className="sign text-center text-[clamp(2.2rem,6vw,3.4rem)] text-neel-900">Building your shop</h1>

      {transcript && (
        <figure className="rise mt-8 rounded-[24px] rounded-bl-md bg-white p-5 shadow-lift">
          <figcaption className="mb-2 flex items-center gap-2 text-sm font-semibold text-neel-500">
            <AudioLines className="h-4 w-4 text-sindoor" aria-hidden="true" /> {fromVoice ? 'We heard' : 'You wrote'}
          </figcaption>
          <blockquote className="text-lg leading-relaxed text-neel-900">{transcript}</blockquote>
        </figure>
      )}

      <ol className="mt-8 grid gap-3">
        {steps.map((s, i) => {
          const done = i < currentIndex
          const active = i === currentIndex
          return (
            <li key={s.key} className={`flex items-center gap-3 rounded-2xl px-4 py-3.5 ${active ? 'bg-white' : 'bg-white/50'}`}>
              {done ? <CircleCheck className="h-6 w-6 text-paan" aria-hidden="true" />
                : active ? <Loader2 className="h-6 w-6 text-sindoor spin-slow" aria-hidden="true" />
                  : <span className="h-6 w-6 rounded-full border-2 border-neel-200" aria-hidden="true" />}
              <span className={`text-lg ${active ? 'font-semibold text-neel-900' : 'text-neel-700'}`}>{s.label}</span>
            </li>
          )
        })}
      </ol>
    </section>
  )
}

function PreviewStage({ draft, update, onPublish, publishing, onStartOver }) {
  // Fixed at first render so rows don't jump around as the owner ticks and unticks.
  const [reviewable] = useState(() => (draft.products || []).filter(p => p.suggested))

  function toggleSuggested(p, keep) {
    update({ products: keep ? [...draft.products, p] : draft.products.filter(x => x !== p) })
  }

  return (
    <section className="mx-auto grid max-w-6xl gap-8 px-4 pb-28 pt-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-14 lg:pb-16">
      <div className="lg:order-2">
        <div className="lg:sticky lg:top-6">
          <PhoneFrame responsive>
            <ShopSite data={draft} showSuggested />
          </PhoneFrame>
          <p className="mt-3 text-center text-sm text-neel-500">This is how customers will see it. Scroll to see more.</p>
        </div>
      </div>

      <div className="lg:order-1 lg:pt-6">
        <h1 className="sign text-[clamp(2.2rem,5vw,3.5rem)] text-neel-900">Your shop page is ready</h1>
        <p className="mt-2 max-w-prose text-lg text-neel-700">Check the details below, then publish to get your link and QR code.</p>

        <div className="panel mt-8 p-5 sm:p-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold"><Pencil className="h-4 w-4 text-sindoor" aria-hidden="true" /> Check the important details</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Shop name" value={draft.shopName} onChange={v => update({ shopName: v })} />
            <Field label="WhatsApp number" value={draft.whatsapp} onChange={v => update({ whatsapp: v })} type="tel" inputMode="tel" />
            <Field label="Area and city" value={draft.address} onChange={v => update({ address: v })} placeholder="Kothrud, Pune" />
            <Field label="Opening hours" value={draft.timing} onChange={v => update({ timing: v })} />
          </div>
        </div>

        {reviewable.length > 0 && (
          <div className="panel mt-4 p-5 sm:p-6">
            <h2 className="text-lg font-semibold">We added {reviewable.length} items shops like yours often sell</h2>
            <p className="mt-1 text-neel-500">Untick anything you don’t sell. You can change prices after publishing.</p>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {reviewable.map((p, i) => {
                const keep = draft.products.includes(p)
                return (
                  <li key={`${p.name}-${i}`}>
                    <label className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-3.5 py-3 transition-colors ${keep ? 'border-neel-200 bg-white' : 'border-dashed border-neel-200 bg-neel-50 text-neel-500'}`}>
                      <input type="checkbox" checked={keep} onChange={e => toggleSuggested(p, e.target.checked)} className="h-5 w-5 accent-neel" />
                      <span className="text-xl" aria-hidden="true">{p.emoji}</span>
                      <span className="min-w-0 flex-1">
                        <span className={`block truncate font-semibold ${keep ? '' : 'line-through'}`}>{p.name}</span>
                        <span className="text-sm text-neel-500">{p.price}</span>
                      </span>
                    </label>
                  </li>
                )
              })}
            </ul>
          </div>
        )}

        <div className="panel mt-4 p-5 sm:p-6">
          <h2 id="colour-label" className="text-lg font-semibold">Colour</h2>
          <div className="mt-4">
            <ThemePicker value={draft.theme} onChange={theme => update({ theme })} labelledBy="colour-label" />
          </div>
        </div>

        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-neel-100 bg-white/95 px-4 pb-safe pt-3 backdrop-blur lg:static lg:mt-8 lg:border-0 lg:bg-transparent lg:p-0">
          <div className="mx-auto flex max-w-6xl flex-col-reverse gap-2 sm:flex-row lg:max-w-none">
            <button type="button" onClick={onStartOver} className="btn-ghost">
              <RotateCcw className="h-4 w-4" aria-hidden="true" /> Start again
            </button>
            <button type="button" onClick={onPublish} disabled={publishing} className="btn-ink flex-1 py-4 text-lg sm:flex-none sm:px-10">
              {publishing ? <Loader2 className="h-5 w-5 spin-slow" aria-hidden="true" /> : <Check className="h-5 w-5" aria-hidden="true" />}
              Publish my shop page
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

function Field({ label, value, onChange, ...rest }) {
  const id = `f-${label.replace(/\s+/g, '-').toLowerCase()}`
  return (
    <div>
      <label htmlFor={id} className="field-label">{label}</label>
      <input id={id} value={value || ''} onChange={e => onChange(e.target.value)} className="field" {...rest} />
    </div>
  )
}

function PublishedStage({ shop, onManage }) {
  const url = shopUrl(shop)
  const d = shop.data

  return (
    <section className="mx-auto max-w-2xl px-4 pb-16 pt-6">
      <div className="pop overflow-hidden rounded-[32px] bg-white shadow-lift">
        <div className="awning" style={{ '--awning': getTheme(d.theme).awning }} />
        <div className="px-6 pb-8 pt-12 text-center sm:px-10">
          <p className="inline-flex items-center gap-2 rounded-full bg-paan-soft px-3 py-1 font-semibold text-paan-deep">
            <CircleCheck className="h-4 w-4" aria-hidden="true" /> Your shop is online
          </p>
          <h1 className="sign mt-4 break-words text-[clamp(2.4rem,8vw,4rem)] text-neel-900">{d.shopName}</h1>

          <div className="mt-6 flex items-center gap-2 rounded-2xl border border-neel-100 bg-neel-50 p-1.5 pl-4 text-left">
            <span className="min-w-0 flex-1 truncate font-medium text-neel-700">{url.replace(/^https?:\/\//, '')}</span>
            <button type="button" onClick={() => { navigator.clipboard?.writeText(url); toast.success('Link copied') }} className="btn-line btn-sm shrink-0">
              <Copy className="h-4 w-4" aria-hidden="true" /> Copy
            </button>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <a href={whatsappShareLink(shareText(d.shopName, url))} target="_blank" rel="noreferrer" className="btn-paan py-4">
              <MessageCircle className="h-5 w-5" aria-hidden="true" /> Share on WhatsApp
            </a>
            <a href={shopPath(shop)} target="_blank" rel="noreferrer" className="btn-line py-4">
              <ExternalLink className="h-5 w-5" aria-hidden="true" /> Open my page
            </a>
          </div>
        </div>
        <div className="border-t border-neel-100 px-6 py-6 sm:px-10">
          <QrCard url={url} fileName={shop.slug || 'shop'} posterTo={`/manage/${shop.shopId}/poster`} />
        </div>
      </div>

      <div className="mt-6 rounded-3xl bg-white p-5 text-center sm:flex sm:items-center sm:justify-between sm:text-left">
        <div>
          <p className="font-semibold text-neel-900">Add photos, change prices, or update by voice</p>
          <p className="text-neel-500">Your page updates the moment you save.</p>
        </div>
        <button type="button" onClick={onManage} className="btn-ink mt-4 sm:mt-0">Edit my shop</button>
      </div>
    </section>
  )
}

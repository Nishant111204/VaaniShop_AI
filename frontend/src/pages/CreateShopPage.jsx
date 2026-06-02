import React, { useState } from 'react'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import VoiceRecorder from '../components/VoiceRecorder.jsx'
import Spinner from '../components/Spinner.jsx'
import { createShopFromText, transcribeAudio } from '../lib/api.js'

const EXAMPLE_PROMPTS = [
  {
    lang: 'Hindi',
    flag: '🇮🇳',
    text: '"Mera shop Ramesh General Store hai Pune mein. Hum rice ₹60 kilo, dal ₹120 kilo, aur cooking oil ₹150 litre mein bechte hain. Timing subah 8 baje se raat 10 baje tak. WhatsApp 9876543210."',
  },
  {
    lang: 'Marathi',
    flag: '🇮🇳',
    text: '"Aamcha shop Ganesh Bakery ahe Nashik madhe. Aamy bread ₹40, cake ₹200 rupaye la deto. Vel sakal 7 te sandhyakal 9 paryant. Phone 9123456789."',
  },
  {
    lang: 'English',
    flag: '🇬🇧',
    text: '"My shop is Star Electronics in Bangalore. We sell mobile phones, accessories, and repair services. Open 10am to 8pm Monday to Saturday. Call or WhatsApp 9988776655."',
  },
]

export default function CreateShopPage() {
  const nav = useNavigate()
  const [busy, setBusy] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [activeExample, setActiveExample] = useState(null)

  async function handleAudio(blob, language) {
    setBusy(true)
    setTranscript('')
    try {
      const { text } = await transcribeAudio(blob, language)
      setTranscript(text || '')
      if (!text?.trim()) {
        toast.error('No speech detected. Please try again.')
        return
      }
      const res = await createShopFromText(text)
      toast.success('Your shop website is ready!')
      nav(`/manage/${res.shopId}`)
    } catch (e) {
      toast.error(e.message || 'Failed to create shop. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl grid gap-8">
      {/* Header */}
      <div>
        <div className="inline-block rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 mb-3">
          Step 1 of 1 — just speak
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Create your shop website</h1>
        <p className="mt-2 text-sm text-slate-500 leading-relaxed">
          Speak your shop details in any language. Include name, products with prices, address, timings, and WhatsApp number for best results.
        </p>
      </div>

      {/* Voice recorder card */}
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg">🎙️</span>
          <h2 className="text-sm font-semibold text-slate-900">Voice description</h2>
        </div>
        <p className="text-xs text-slate-400 mb-5">
          Choose your language and start recording. Speak naturally — as if telling a friend about your shop.
        </p>
        <VoiceRecorder disabled={busy} onAudioReady={handleAudio} showLanguage={true} />
        {busy && (
          <div className="mt-5 rounded-xl bg-slate-50 p-4 flex items-center gap-3">
            <Spinner />
            <div>
              <div className="text-sm font-medium text-slate-700">Processing your voice…</div>
              <div className="text-xs text-slate-400">Transcribing → Extracting shop details → Building website</div>
            </div>
          </div>
        )}
      </div>

      {/* Transcript preview */}
      {transcript && (
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
            <span>✅</span> What we heard
          </h2>
          <p className="text-sm text-slate-700 bg-slate-50 rounded-xl p-4 leading-relaxed">{transcript}</p>
        </div>
      )}

      {/* Example prompts */}
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900 mb-1">Not sure what to say?</h2>
        <p className="text-xs text-slate-400 mb-4">Tap an example to see what a good voice input looks like.</p>
        <div className="flex gap-2 mb-4">
          {EXAMPLE_PROMPTS.map((ex, i) => (
            <button
              key={i}
              onClick={() => setActiveExample(activeExample === i ? null : i)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium border transition-colors ${
                activeExample === i
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'border-slate-200 text-slate-600 hover:border-slate-400'
              }`}
            >
              {ex.flag} {ex.lang}
            </button>
          ))}
        </div>
        {activeExample !== null && (
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs text-slate-500 italic leading-relaxed">{EXAMPLE_PROMPTS[activeExample].text}</p>
          </div>
        )}
      </div>

      {/* Tips */}
      <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
        <h3 className="text-xs font-semibold text-blue-800 mb-2">💡 Tips for best results</h3>
        <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
          <li>Speak in a quiet environment</li>
          <li>Mention your shop name clearly at the start</li>
          <li>Include product names and prices (e.g. "Rice ₹60 per kg")</li>
          <li>Say your WhatsApp number digit by digit</li>
          <li>Mention your area or locality for address</li>
        </ul>
      </div>
    </div>
  )
}

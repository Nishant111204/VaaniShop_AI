import React, { useEffect, useMemo, useRef, useState } from 'react'
import toast from 'react-hot-toast'

const LANGUAGES = [
  { code: null,  label: 'Auto-detect' },
  { code: 'hi',  label: 'हिंदी (Hindi)' },
  { code: 'mr',  label: 'मराठी (Marathi)' },
  { code: 'en',  label: 'English' },
  { code: 'gu',  label: 'ગુજરાતી (Gujarati)' },
  { code: 'ta',  label: 'தமிழ் (Tamil)' },
  { code: 'te',  label: 'తెలుగు (Telugu)' },
  { code: 'kn',  label: 'ಕನ್ನಡ (Kannada)' },
  { code: 'bn',  label: 'বাংলা (Bengali)' },
]

function pickMimeType() {
  const candidates = ['audio/webm;codecs=opus', 'audio/webm']
  for (const t of candidates) {
    if (window.MediaRecorder && MediaRecorder.isTypeSupported(t)) return t
  }
  return ''
}

export default function VoiceRecorder({ disabled, onAudioReady, showLanguage = true }) {
  const [isRecording, setIsRecording] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [language, setLanguage] = useState(null)
  const [audioLevel, setAudioLevel] = useState(0)
  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const streamRef = useRef(null)
  const analyserRef = useRef(null)
  const rafRef = useRef(null)

  const mimeType = useMemo(() => pickMimeType(), [])

  useEffect(() => {
    let timer
    if (isRecording) {
      timer = setInterval(() => setSeconds(s => s + 1), 1000)
    } else {
      setSeconds(0)
    }
    return () => { if (timer) clearInterval(timer) }
  }, [isRecording])

  function startAudioAnalysis(stream) {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)()
      const source = ctx.createMediaStreamSource(stream)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 256
      source.connect(analyser)
      analyserRef.current = analyser
      const data = new Uint8Array(analyser.frequencyBinCount)
      function tick() {
        analyser.getByteFrequencyData(data)
        const avg = data.reduce((a, b) => a + b, 0) / data.length
        setAudioLevel(Math.min(1, avg / 80))
        rafRef.current = requestAnimationFrame(tick)
      }
      tick()
    } catch {
      // analyser is optional; ignore errors
    }
  }

  function stopAudioAnalysis() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    setAudioLevel(0)
  }

  async function start() {
    if (disabled) return
    if (!navigator.mediaDevices?.getUserMedia) {
      toast.error('Microphone not supported in this browser')
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      chunksRef.current = []
      startAudioAnalysis(stream)
      const rec = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      mediaRecorderRef.current = rec
      rec.ondataavailable = e => { if (e.data?.size > 0) chunksRef.current.push(e.data) }
      rec.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: mimeType || 'audio/webm' })
        chunksRef.current = []
        try { await onAudioReady(blob, language) } catch { /* handled by caller */ }
      }
      rec.start()
      setIsRecording(true)
    } catch {
      toast.error('Could not access microphone. Please allow microphone access.')
    }
  }

  function stop() {
    stopAudioAnalysis()
    try { mediaRecorderRef.current?.stop() } catch { /* ignore */ }
    try { streamRef.current?.getTracks()?.forEach(t => t.stop()) } catch { /* ignore */ }
    streamRef.current = null
    mediaRecorderRef.current = null
    setIsRecording(false)
  }

  const bars = Array.from({ length: 5 })

  return (
    <div className="flex flex-col gap-4">
      {showLanguage && (
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-slate-500 shrink-0">Language:</label>
          <select
            value={language ?? ''}
            onChange={e => setLanguage(e.target.value || null)}
            disabled={isRecording || disabled}
            className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 disabled:opacity-50"
          >
            {LANGUAGES.map(l => (
              <option key={l.code ?? 'auto'} value={l.code ?? ''}>{l.label}</option>
            ))}
          </select>
        </div>
      )}

      <div className="flex items-center gap-4">
        {!isRecording ? (
          <button
            onClick={start}
            disabled={disabled}
            className="flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50 transition-colors shadow-md shadow-slate-900/20"
          >
            <span className="text-base">🎙️</span>
            Start Recording
          </button>
        ) : (
          <button
            onClick={stop}
            className="flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-3 text-sm font-semibold text-white hover:bg-rose-700 transition-colors shadow-md shadow-rose-600/30 animate-pulse"
          >
            <span className="h-2.5 w-2.5 rounded-full bg-white" />
            Stop · {seconds}s
          </button>
        )}

        {/* Waveform bars */}
        {isRecording && (
          <div className="flex items-end gap-0.5 h-8">
            {bars.map((_, i) => {
              const delay = i * 0.07
              const height = isRecording
                ? `${Math.max(20, Math.min(100, (audioLevel + (i % 2 === 0 ? 0.1 : 0)) * 100))}%`
                : '20%'
              return (
                <div
                  key={i}
                  className="w-1 rounded-full bg-rose-500 transition-all duration-75"
                  style={{ height, opacity: 0.7 + (i % 2) * 0.3 }}
                />
              )
            })}
          </div>
        )}
      </div>

      <p className="text-xs text-slate-400 leading-relaxed">
        Tip: Speak clearly — include shop name, products with prices, address, timings, and your WhatsApp number.
      </p>
    </div>
  )
}

import { useCallback, useEffect, useRef, useState } from 'react'

const MIME_CANDIDATES = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus']

function pickMimeType() {
  if (typeof window === 'undefined' || !window.MediaRecorder) return ''
  return MIME_CANDIDATES.find(t => MediaRecorder.isTypeSupported(t)) || ''
}

function extensionFor(mime) {
  if (mime.includes('mp4')) return 'mp4'
  if (mime.includes('ogg')) return 'ogg'
  return 'webm'
}

/**
 * Records from the microphone and reports a live input level (0–1) for visualising.
 * onAudio(blob, extension) is called once recording stops normally; onError gets a code:
 * "unsupported", "blocked" (microphone permission) or "short".
 */
export function useVoiceRecorder({ onAudio, maxSeconds = 120, onError }) {
  const [recording, setRecording] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [level, setLevel] = useState(0)
  const recorderRef = useRef(null)
  const streamRef = useRef(null)
  const ctxRef = useRef(null)
  const rafRef = useRef(0)
  const chunksRef = useRef([])
  const startedAtRef = useRef(0)
  const discardRef = useRef(false)
  const onAudioRef = useRef(onAudio)
  onAudioRef.current = onAudio

  const supported = typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia && !!window.MediaRecorder

  const cleanup = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    ctxRef.current?.close().catch(() => {})
    ctxRef.current = null
    setLevel(0)
  }, [])

  const stop = useCallback(() => {
    const rec = recorderRef.current
    if (rec && rec.state !== 'inactive') rec.stop()
    recorderRef.current = null
    setRecording(false)
    cleanup()
  }, [cleanup])

  const start = useCallback(async () => {
    if (!supported) {
      onError?.('unsupported')
      return
    }
    let stream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } })
    } catch {
      onError?.('blocked')
      return
    }
    streamRef.current = stream
    chunksRef.current = []
    discardRef.current = false

    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)()
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 512
      ctx.createMediaStreamSource(stream).connect(analyser)
      ctxRef.current = ctx
      const data = new Uint8Array(analyser.fftSize)
      const tick = () => {
        analyser.getByteTimeDomainData(data)
        let sum = 0
        for (let i = 0; i < data.length; i++) {
          const v = (data[i] - 128) / 128
          sum += v * v
        }
        setLevel(Math.min(1, Math.sqrt(sum / data.length) * 4))
        rafRef.current = requestAnimationFrame(tick)
      }
      tick()
    } catch {
      // The level meter is decoration; recording works without it.
    }

    const mimeType = pickMimeType()
    const rec = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
    rec.ondataavailable = e => { if (e.data?.size) chunksRef.current.push(e.data) }
    rec.onstop = () => {
      if (discardRef.current) return
      const type = rec.mimeType || mimeType || 'audio/webm'
      const blob = new Blob(chunksRef.current, { type })
      chunksRef.current = []
      if (Date.now() - startedAtRef.current < 1200 || blob.size < 1000) {
        onError?.('short')
        return
      }
      onAudioRef.current?.(blob, extensionFor(type))
    }
    recorderRef.current = rec
    startedAtRef.current = Date.now()
    rec.start(250)
    setSeconds(0)
    setRecording(true)
  }, [supported, onError])

  useEffect(() => {
    if (!recording) return undefined
    const id = setInterval(() => {
      const s = Math.floor((Date.now() - startedAtRef.current) / 1000)
      setSeconds(s)
      if (s >= maxSeconds) stop()
    }, 250)
    return () => clearInterval(id)
  }, [recording, maxSeconds, stop])

  // Leaving the page mid-recording releases the mic and throws the audio away.
  useEffect(() => () => {
    discardRef.current = true
    const rec = recorderRef.current
    if (rec && rec.state !== 'inactive') rec.stop()
    cleanup()
  }, [cleanup])

  return { supported, recording, seconds, level, start, stop }
}

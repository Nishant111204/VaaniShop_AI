import React, { useState } from 'react'
import toast from 'react-hot-toast'
import { Mic, Square } from 'lucide-react'
import { useVoiceRecorder } from '../lib/useVoiceRecorder.js'
import { getSpeechLanguage, setSpeechLanguage } from '../lib/storage.js'
import { useI18n } from '../i18n/index.jsx'

export const LANGUAGES = [
  { code: null, label: 'Any language', name: 'Detect automatically' },
  { code: 'hi', label: 'हिंदी', name: 'Hindi' },
  { code: 'mr', label: 'मराठी', name: 'Marathi' },
  { code: 'en', label: 'English', name: 'English' },
  { code: 'gu', label: 'ગુજરાતી', name: 'Gujarati' },
  { code: 'ta', label: 'தமிழ்', name: 'Tamil' },
  { code: 'te', label: 'తెలుగు', name: 'Telugu' },
  { code: 'kn', label: 'ಕನ್ನಡ', name: 'Kannada' },
  { code: 'bn', label: 'বাংলা', name: 'Bengali' },
  { code: 'pa', label: 'ਪੰਜਾਬੀ', name: 'Punjabi' },
  { code: 'ml', label: 'മലയാളം', name: 'Malayalam' },
  { code: 'ur', label: 'اردو', name: 'Urdu' },
]

function clock(s) {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

/**
 * The big red microphone. Records, shows the voice level as rings, and hands the
 * audio back with the chosen language. `size` is "lg" for the main create flow and
 * "md" inside panels.
 */
export default function VoiceCapture({ onAudio, disabled = false, size = 'lg', showLanguages = true, idleLabel, layout = 'column' }) {
  const { t } = useI18n()
  const [language, setLanguage] = useState(getSpeechLanguage)
  const { recording, seconds, level, start, stop } = useVoiceRecorder({
    onAudio: (blob, ext) => onAudio(blob, language, ext),
    onError: code => toast.error(t(`voice.err.${code}`)),
  })

  function chooseLanguage(code) {
    setLanguage(code)
    setSpeechLanguage(code)
  }

  const orb = size === 'lg' ? 'h-36 w-36 sm:h-40 sm:w-40' : 'h-24 w-24'
  const icon = size === 'lg' ? 'h-12 w-12' : 'h-8 w-8'
  const row = layout === 'row'

  return (
    <div className={row ? 'flex items-center gap-6' : 'flex flex-col items-center gap-6'}>
      {showLanguages && (
        <div className="w-full">
          <p id="speak-language" className="sr-only">{t('voice.languageLabel')}</p>
          <div
            role="radiogroup"
            aria-labelledby="speak-language"
            className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-none sm:mx-0 sm:flex-wrap sm:justify-center sm:px-0"
          >
            {LANGUAGES.map(l => {
              const active = language === l.code
              return (
                <button
                  key={l.code ?? 'auto'}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  title={l.name}
                  lang={l.code || undefined}
                  disabled={recording || disabled}
                  onClick={() => chooseLanguage(l.code)}
                  className={`${active ? 'chip-on' : 'chip-off'} disabled:opacity-60`}
                >
                  {l.code ? l.label : t('voice.anyLanguage')}
                </button>
              )
            })}
          </div>
        </div>
      )}

      <div className={`relative grid shrink-0 place-items-center ${orb}`}>
        {recording ? (
          <>
            <span className="mic-ring" style={{ '--level': level, '--spread': 0.35 }} />
            <span className="mic-ring" style={{ '--level': level, '--spread': 0.7, opacity: 0.6 }} />
            <span className="mic-ring" style={{ '--level': level, '--spread': 1.05, opacity: 0.3 }} />
          </>
        ) : (
          !disabled && (
            <>
              <span className="mic-ring mic-idle-ring" />
              <span className="mic-ring mic-idle-ring" />
            </>
          )
        )}
        <button
          type="button"
          onClick={recording ? stop : start}
          disabled={disabled}
          aria-pressed={recording}
          aria-label={recording ? t('voice.stop') : t('voice.start')}
          className={`mic-orb relative grid h-full w-full place-items-center rounded-full text-white transition-transform active:scale-95 disabled:grayscale disabled:opacity-60`}
        >
          {recording ? <Square className={`${icon} fill-white`} strokeWidth={0} /> : <Mic className={icon} strokeWidth={2.2} />}
        </button>
      </div>

      <div className={`min-h-[3.25rem] ${row ? 'text-left' : 'text-center'}`} aria-live="polite">
        {recording ? (
          <>
            <p className="text-lg font-semibold tabular-nums text-sindoor">{t('voice.listening', { time: clock(seconds) })}</p>
            <p className="text-sm text-neel-500">{t('voice.tapAgain')}</p>
          </>
        ) : (
          <>
            <p className="text-lg font-semibold text-neel">{idleLabel || t('voice.tapToSpeak')}</p>
            {t('voice.tapToSpeakAlt') && <p className="text-sm text-neel-500" lang="hi">{t('voice.tapToSpeakAlt')}</p>}
          </>
        )}
      </div>
    </div>
  )
}

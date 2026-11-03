import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import en from './en.js'
import hi from './hi.js'

const DICTS = { en, hi }
const KEY = 'vaanishopai:ui-lang'

function initialLang() {
  try {
    const saved = localStorage.getItem(KEY)
    if (saved && DICTS[saved]) return saved
  } catch { /* ignore */ }
  return (navigator.language || '').toLowerCase().startsWith('hi') ? 'hi' : 'en'
}

const I18nContext = createContext(null)

/**
 * Interface language for shop owners (English or Hindi). Entries are strings with
 * {placeholders}, or functions of the values for plurals. Missing Hindi entries fall
 * back to English, so a forgotten key never shows a raw key name.
 */
export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(initialLang)

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  const setLang = useCallback(next => {
    setLangState(next)
    try { localStorage.setItem(KEY, next) } catch { /* ignore */ }
  }, [])

  const t = useCallback((key, vars = {}) => {
    const entry = DICTS[lang][key] ?? en[key]
    if (entry == null) return key
    const text = typeof entry === 'function' ? entry(vars) : entry
    return text.replace(/\{(\w+)\}/g, (_, name) => (vars[name] ?? `{${name}}`))
  }, [lang])

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t])
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  return useContext(I18nContext)
}

/** "English | हिंदी" switch. */
export function LanguageToggle({ className = '' }) {
  const { lang, setLang } = useI18n()
  return (
    <div role="group" aria-label="Language / भाषा" className={`inline-flex rounded-xl bg-neel/10 p-0.5 ${className}`}>
      {[['en', 'English'], ['hi', 'हिंदी']].map(([code, label]) => (
        <button
          key={code}
          type="button"
          lang={code}
          aria-pressed={lang === code}
          onClick={() => setLang(code)}
          className={`rounded-[10px] px-2.5 py-1.5 text-sm font-semibold transition-colors ${lang === code ? 'bg-white text-neel shadow-sm' : 'text-neel-700 hover:text-neel'}`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

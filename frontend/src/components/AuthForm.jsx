import React, { useId, useState } from 'react'
import toast from 'react-hot-toast'
import { Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { login, register } from '../lib/api.js'

/**
 * Phone + password sign-up / sign-in. Used on its own pages and inside the
 * publish sheet, so a visitor can save their shop without leaving the preview.
 */
export default function AuthForm({ initialMode = 'register', onDone, submitLabel }) {
  const { loginUser } = useAuth()
  const [mode, setMode] = useState(initialMode)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const id = useId()
  const isRegister = mode === 'register'

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    const digits = phone.replace(/\D/g, '').replace(/^91(?=\d{10}$)/, '')
    if (digits.length < 10) {
      setError('Enter your 10-digit mobile number.')
      return
    }
    setBusy(true)
    try {
      const res = isRegister ? await register(name.trim(), digits, password) : await login(digits, password)
      loginUser(res.token, { userId: res.userId, name: res.name, phone: res.phone })
      toast.success(isRegister ? `Welcome, ${res.name}!` : `Welcome back, ${res.name}!`)
      await onDone?.(res)
    } catch (err) {
      setError(err.message || 'Something went wrong. Try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4" noValidate>
      {isRegister && (
        <div>
          <label htmlFor={`${id}-name`} className="field-label">Your name</label>
          <input id={`${id}-name`} data-autofocus value={name} onChange={e => setName(e.target.value)} required autoComplete="name" placeholder="Ramesh Patil" className="field" />
        </div>
      )}
      <div>
        <label htmlFor={`${id}-phone`} className="field-label">Mobile number</label>
        <div className="flex rounded-xl border border-neel-200 bg-white transition-colors focus-within:border-neel focus-within:ring-4 focus-within:ring-haldi/40">
          <span className="grid place-items-center border-r border-neel-100 px-3.5 font-semibold text-neel-500">+91</span>
          <input
            id={`${id}-phone`}
            data-autofocus={isRegister ? undefined : true}
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            required
            placeholder="98765 43210"
            className="w-full rounded-r-xl bg-transparent px-3.5 py-3 text-base tabular-nums placeholder:text-neel-300 focus:outline-none"
          />
        </div>
      </div>
      <div>
        <label htmlFor={`${id}-password`} className="field-label">{isRegister ? 'Choose a password' : 'Password'}</label>
        <div className="relative">
          <input
            id={`${id}-password`}
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={6}
            autoComplete={isRegister ? 'new-password' : 'current-password'}
            placeholder={isRegister ? 'At least 6 characters' : ''}
            className="field pr-12"
          />
          <button type="button" onClick={() => setShowPassword(s => !s)} aria-label={showPassword ? 'Hide password' : 'Show password'}
            className="absolute right-1.5 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-lg text-neel-500 hover:bg-neel-50">
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {error && <p role="alert" className="rounded-xl bg-sindoor-soft px-3.5 py-2.5 text-sm font-medium text-sindoor-deep">{error}</p>}

      <button type="submit" disabled={busy} className="btn-ink mt-1 w-full py-3.5 text-base">
        {busy ? 'Please wait…' : submitLabel || (isRegister ? 'Create account' : 'Sign in')}
      </button>

      <p className="text-center text-sm text-neel-500">
        {isRegister ? 'Already have an account? ' : 'New to VaaniShop? '}
        <button type="button" onClick={() => { setMode(isRegister ? 'login' : 'register'); setError('') }} className="font-semibold text-neel underline underline-offset-4">
          {isRegister ? 'Sign in' : 'Create an account'}
        </button>
      </p>
    </form>
  )
}

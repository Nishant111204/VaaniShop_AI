import React, { useState } from 'react'
import toast from 'react-hot-toast'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { register } from '../lib/api.js'

export default function RegisterPage() {
  const { loginUser } = useAuth()
  const nav = useNavigate()

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim() || !phone.trim() || !password) return
    setBusy(true)
    try {
      const res = await register(name.trim(), phone.trim(), password)
      loginUser(res.token, { userId: res.userId, name: res.name, phone: res.phone })
      toast.success(`Welcome, ${res.name}! Your account is ready.`)
      nav('/create', { replace: true })
    } catch (e) {
      toast.error(e.message || 'Registration failed. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-md py-8">
      <div className="text-center mb-8">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white text-xl font-bold mb-4">
          V
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Create your account</h1>
        <p className="mt-1.5 text-sm text-slate-500">Get your shop website online in under 30 seconds</p>
      </div>

      <div className="rounded-2xl border bg-white p-8 shadow-sm">
        <form onSubmit={handleSubmit} className="grid gap-5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Your name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ramesh Kumar"
              required
              autoComplete="name"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Phone number</label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="9876543210"
              required
              pattern="\d{10,15}"
              title="10 to 15 digits"
              autoComplete="tel"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
            />
            <p className="text-xs text-slate-400 mt-1">Used as your login username</p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              required
              minLength={6}
              autoComplete="new-password"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
            />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50 transition-colors shadow-md shadow-slate-900/20"
          >
            {busy ? 'Creating account…' : 'Create free account'}
          </button>
        </form>

        <p className="mt-5 text-center text-xs text-slate-500">
          Already registered?{' '}
          <Link to="/login" className="font-semibold text-slate-900 hover:underline">
            Sign in
          </Link>
        </p>

        <p className="mt-4 text-center text-xs text-slate-400">
          By registering you agree to our terms of service
        </p>
      </div>
    </div>
  )
}

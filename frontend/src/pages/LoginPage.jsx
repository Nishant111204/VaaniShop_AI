import React, { useState } from 'react'
import toast from 'react-hot-toast'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { login } from '../lib/api.js'

export default function LoginPage() {
  const { loginUser } = useAuth()
  const nav = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/dashboard'

  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!phone.trim() || !password) return
    setBusy(true)
    try {
      const res = await login(phone.trim(), password)
      loginUser(res.token, { userId: res.userId, name: res.name, phone: res.phone })
      toast.success(`Welcome back, ${res.name}!`)
      nav(from, { replace: true })
    } catch (e) {
      toast.error(e.message || 'Login failed. Check your phone number and password.')
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
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Welcome back</h1>
        <p className="mt-1.5 text-sm text-slate-500">Sign in to manage your shop websites</p>
      </div>

      <div className="rounded-2xl border bg-white p-8 shadow-sm">
        <form onSubmit={handleSubmit} className="grid gap-5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Phone number</label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="9876543210"
              required
              autoComplete="tel"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
            />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50 transition-colors shadow-md shadow-slate-900/20"
          >
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="mt-5 text-center text-xs text-slate-500">
          New here?{' '}
          <Link to="/register" className="font-semibold text-slate-900 hover:underline">
            Create a free account
          </Link>
        </p>
      </div>
    </div>
  )
}

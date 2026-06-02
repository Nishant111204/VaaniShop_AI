import React from 'react'
import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="text-6xl mb-5">🔍</div>
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">Page not found</h1>
      <p className="mt-3 text-slate-500 max-w-sm">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <div className="mt-8 flex gap-3">
        <Link
          to="/"
          className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-700 transition-colors"
        >
          Go home
        </Link>
        <Link
          to="/dashboard"
          className="rounded-xl border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
        >
          My shops
        </Link>
      </div>
    </div>
  )
}

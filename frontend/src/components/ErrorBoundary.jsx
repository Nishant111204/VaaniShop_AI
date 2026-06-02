import React from 'react'
import { Link } from 'react-router-dom'

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-dvh flex items-center justify-center p-4 bg-slate-50">
          <div className="rounded-2xl border bg-white p-10 text-center max-w-md shadow-sm">
            <div className="text-5xl mb-4">⚠️</div>
            <h1 className="text-lg font-bold text-slate-900">Something went wrong</h1>
            <p className="mt-2 text-sm text-slate-500 leading-relaxed">
              An unexpected error occurred. Please try refreshing the page.
            </p>
            {this.state.error?.message && (
              <p className="mt-3 text-xs font-mono text-slate-400 bg-slate-50 rounded-lg p-3 text-left">
                {this.state.error.message}
              </p>
            )}
            <div className="mt-6 flex flex-col sm:flex-row gap-2 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 transition-colors"
              >
                Refresh page
              </button>
              <Link
                to="/"
                className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Go home
              </Link>
            </div>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

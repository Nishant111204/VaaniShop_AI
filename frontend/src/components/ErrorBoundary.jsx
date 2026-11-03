import React from 'react'

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info)
  }

  render() {
    if (!this.state.hasError) return this.props.children
    return (
      <div className="flex min-h-dvh items-center justify-center bg-neel-50 p-4">
        <div className="panel max-w-md p-10 text-center">
          <h1 className="text-2xl font-bold text-neel-900">This page stopped working</h1>
          <p className="mt-2 text-neel-500">
            Your shops are safe. Reload the page to continue, or go back to the start.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
            <button onClick={() => window.location.reload()} className="btn-ink">Reload page</button>
            {/* A full navigation, since the router state may be what broke. */}
            <a href="/" className="btn-line">Go to home</a>
          </div>
        </div>
      </div>
    )
  }
}

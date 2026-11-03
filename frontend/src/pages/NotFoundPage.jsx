import React from 'react'
import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center">
      <div className="awning w-48 rounded-t-lg" style={{ '--awning': '#A9B2D9' }} aria-hidden="true" />
      <h1 className="sign mt-10 text-5xl text-neel-900">Shutter’s down here</h1>
      <p className="mt-3 text-lg text-neel-500">There’s no page at this address. Check the link, or start from the home page.</p>
      <Link to="/" className="btn-ink mt-8">Go to home</Link>
    </div>
  )
}

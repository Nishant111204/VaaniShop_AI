import React from 'react'
import { Loader2 } from 'lucide-react'

export default function Spinner({ label = 'Loading…', className = 'py-24' }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 text-neel-500 ${className}`} role="status">
      <Loader2 className="h-7 w-7 spin-slow" aria-hidden="true" />
      <span className="text-sm font-medium">{label}</span>
    </div>
  )
}

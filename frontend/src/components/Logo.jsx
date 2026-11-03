import React from 'react'
import { Link } from 'react-router-dom'

export function LogoMark({ className = 'h-9 w-9' }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="9" fill="#1F2A5C" />
      <g fill="#FFC53D">
        <rect x="7" y="13" width="3" height="6" rx="1.5" />
        <rect x="12" y="9" width="3" height="14" rx="1.5" />
        <rect x="17" y="11" width="3" height="10" rx="1.5" />
        <rect x="22" y="14" width="3" height="4" rx="1.5" />
      </g>
    </svg>
  )
}

export default function Logo({ to = '/' }) {
  return (
    <Link to={to} className="flex items-center gap-2.5 rounded-xl" aria-label="VaaniShop home">
      <LogoMark />
      <span className="text-xl font-bold tracking-tight text-neel condensed">
        Vaani<span className="text-sindoor">Shop</span>
      </span>
    </Link>
  )
}

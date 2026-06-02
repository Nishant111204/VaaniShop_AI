import React, { useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext.jsx'

function NavLink({ to, children, onClick }) {
  const loc = useLocation()
  const active = loc.pathname === to || loc.pathname.startsWith(to + '/')
  return (
    <Link
      to={to}
      onClick={onClick}
      className={[
        'text-sm font-medium transition-colors',
        active ? 'text-slate-900' : 'text-slate-500 hover:text-slate-900',
      ].join(' ')}
    >
      {children}
    </Link>
  )
}

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2 group">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white text-sm font-bold group-hover:bg-slate-700 transition-colors">
        V
      </span>
      <span className="font-semibold tracking-tight text-slate-900 hidden sm:block">
        VaaniShop <span className="text-slate-400 font-normal">AI</span>
      </span>
    </Link>
  )
}

export default function Layout() {
  const { user, isAuthenticated, logoutUser } = useAuth()
  const nav = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  function handleLogout() {
    logoutUser()
    toast.success('Signed out')
    nav('/')
    setMobileOpen(false)
  }

  return (
    <div className="min-h-dvh flex flex-col bg-slate-50">
      <header className="border-b bg-white sticky top-0 z-20 shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Logo />

          {/* Desktop nav */}
          <nav className="hidden sm:flex items-center gap-5">
            {isAuthenticated ? (
              <>
                <NavLink to="/dashboard">My Shops</NavLink>
                <Link
                  to="/create"
                  className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 transition-colors"
                >
                  <span>+</span> New Shop
                </Link>
                <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-700">
                    {user?.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <span className="text-xs text-slate-500 max-w-[100px] truncate">{user?.name}</span>
                  <button
                    onClick={handleLogout}
                    className="text-xs font-medium text-slate-400 hover:text-slate-800 transition-colors"
                  >
                    Sign out
                  </button>
                </div>
              </>
            ) : (
              <>
                <NavLink to="/login">Sign in</NavLink>
                <Link
                  to="/register"
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 transition-colors"
                >
                  Get started free
                </Link>
              </>
            )}
          </nav>

          {/* Mobile hamburger */}
          <button
            className="sm:hidden p-2 rounded-lg hover:bg-slate-100"
            onClick={() => setMobileOpen(o => !o)}
            aria-label="Toggle menu"
          >
            <span className="block w-5 h-0.5 bg-slate-700 mb-1"></span>
            <span className="block w-5 h-0.5 bg-slate-700 mb-1"></span>
            <span className="block w-5 h-0.5 bg-slate-700"></span>
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="sm:hidden border-t bg-white px-4 py-3 flex flex-col gap-3">
            {isAuthenticated ? (
              <>
                <NavLink to="/dashboard" onClick={() => setMobileOpen(false)}>My Shops</NavLink>
                <NavLink to="/create" onClick={() => setMobileOpen(false)}>+ New Shop</NavLink>
                <div className="pt-2 border-t flex items-center justify-between">
                  <span className="text-xs text-slate-500">{user?.name}</span>
                  <button onClick={handleLogout} className="text-xs font-medium text-slate-500">Sign out</button>
                </div>
              </>
            ) : (
              <>
                <NavLink to="/login" onClick={() => setMobileOpen(false)}>Sign in</NavLink>
                <Link
                  to="/register"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white text-center"
                >
                  Get started free
                </Link>
              </>
            )}
          </div>
        )}
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        <Outlet />
      </main>

      <footer className="border-t bg-white mt-auto">
        <div className="mx-auto max-w-6xl px-4 py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded bg-slate-900 text-white text-xs font-bold">V</span>
            <span>VaaniShop AI</span>
          </div>
          <span>Voice-driven shop websites for every shopkeeper · Built with ♥ for India</span>
        </div>
      </footer>
    </div>
  )
}

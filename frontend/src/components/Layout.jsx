import React, { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { LogOut, Menu, Mic, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import Logo from './Logo.jsx'

function navClass({ isActive }) {
  return `rounded-xl px-3 py-2 text-[15px] font-semibold transition-colors ${isActive ? 'text-neel' : 'text-neel-500 hover:text-neel'}`
}

export default function Layout() {
  const { user, isAuthenticated, logoutUser } = useAuth()
  const nav = useNavigate()
  const { pathname } = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const onHome = pathname === '/'

  useEffect(() => { setMenuOpen(false) }, [pathname])

  function handleLogout() {
    logoutUser()
    toast.success('Signed out')
    nav('/')
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <header className={`sticky top-0 z-40 ${onHome ? 'on-haldi bg-haldi' : 'border-b border-neel-100 bg-white/90 backdrop-blur'}`}>
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Logo />

          <nav className="hidden items-center gap-1 sm:flex" aria-label="Main">
            {isAuthenticated ? (
              <>
                <NavLink to="/dashboard" className={navClass}>My shops</NavLink>
                <Link to="/create" className="btn-ink btn-sm ml-2"><Mic className="h-4 w-4" aria-hidden="true" /> New shop</Link>
                <div className="ml-3 flex items-center gap-2 border-l border-neel-100 pl-3">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-neel-100 font-bold text-neel" aria-hidden="true">
                    {user?.name?.[0]?.toUpperCase() || 'U'}
                  </span>
                  <span className="max-w-[9rem] truncate text-sm font-medium text-neel-700">{user?.name}</span>
                  <button onClick={handleLogout} className="grid h-9 w-9 place-items-center rounded-xl text-neel-500 hover:bg-neel-100 hover:text-neel" aria-label="Sign out" title="Sign out">
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              </>
            ) : (
              <>
                <NavLink to="/login" className={navClass}>Sign in</NavLink>
                <Link to="/create" className="btn-ink btn-sm ml-2"><Mic className="h-4 w-4" aria-hidden="true" /> Make my shop page</Link>
              </>
            )}
          </nav>

          <button
            className="grid h-11 w-11 place-items-center rounded-xl text-neel hover:bg-neel/5 sm:hidden"
            onClick={() => setMenuOpen(o => !o)}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          >
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {menuOpen && (
          <nav id="mobile-menu" aria-label="Main" className="grid gap-1 border-t border-neel-100 bg-white px-4 pb-4 pt-2 sm:hidden">
            {isAuthenticated ? (
              <>
                <p className="px-3 py-2 text-sm text-neel-500">Signed in as <span className="font-semibold text-neel">{user?.name}</span></p>
                <NavLink to="/dashboard" className={navClass}>My shops</NavLink>
                <Link to="/create" className="btn-ink mt-1"><Mic className="h-4 w-4" aria-hidden="true" /> New shop</Link>
                <button onClick={handleLogout} className="btn-ghost justify-start"><LogOut className="h-4 w-4" aria-hidden="true" /> Sign out</button>
              </>
            ) : (
              <>
                <Link to="/create" className="btn-ink"><Mic className="h-4 w-4" aria-hidden="true" /> Make my shop page</Link>
                <NavLink to="/login" className={navClass}>Sign in</NavLink>
              </>
            )}
          </nav>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-neel-100 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-neel-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <Logo />
          <p>Shop websites made by voice, for every bazaar in India.</p>
        </div>
      </footer>
    </div>
  )
}

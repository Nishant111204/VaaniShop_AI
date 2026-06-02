import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

const STEPS = [
  {
    step: '01',
    icon: '🎙️',
    title: 'Speak your shop details',
    desc: 'Just say your shop name, products, timing, address, and WhatsApp in any language — Hindi, Marathi, or English.',
  },
  {
    step: '02',
    icon: '🤖',
    title: 'AI builds your website',
    desc: 'Our AI instantly extracts every detail — products, prices, hours, contact info — and structures it perfectly.',
  },
  {
    step: '03',
    icon: '🌐',
    title: 'Share your shop link',
    desc: 'Get a professional shop page with WhatsApp button and QR code. Share it anywhere in under 30 seconds.',
  },
]

const CATEGORIES = [
  { icon: '🛒', name: 'Grocery', color: 'bg-green-50 border-green-200 text-green-700' },
  { icon: '🍞', name: 'Bakery', color: 'bg-orange-50 border-orange-200 text-orange-700' },
  { icon: '💊', name: 'Pharmacy', color: 'bg-blue-50 border-blue-200 text-blue-700' },
  { icon: '📱', name: 'Electronics', color: 'bg-slate-50 border-slate-200 text-slate-700' },
  { icon: '✂️', name: 'Salon', color: 'bg-purple-50 border-purple-200 text-purple-700' },
  { icon: '🍽️', name: 'Restaurant', color: 'bg-red-50 border-red-200 text-red-700' },
  { icon: '👗', name: 'Clothing', color: 'bg-pink-50 border-pink-200 text-pink-700' },
  { icon: '🔧', name: 'Hardware', color: 'bg-yellow-50 border-yellow-200 text-yellow-700' },
]

const TESTIMONIALS = [
  {
    name: 'Ramesh Patil',
    shop: 'Patil General Store, Pune',
    quote: 'Maine 2 minute mein meri dukaan ki website bana di. Ab customers WhatsApp pe order karte hain!',
    avatar: 'RP',
    theme: 'bg-green-600',
  },
  {
    name: 'Sunita Sharma',
    shop: 'Sunita Bakery, Mumbai',
    quote: 'Voice mein bola aur poori website ban gayi. Products, timing sab kuch. Bahut aasan hai!',
    avatar: 'SS',
    theme: 'bg-orange-600',
  },
  {
    name: 'Vinod Kumar',
    shop: 'VK Electronics, Delhi',
    quote: 'My shop now looks professional online. Customers can see all our products and call directly.',
    avatar: 'VK',
    theme: 'bg-blue-700',
  },
]

const STATS = [
  { value: '30s', label: 'to create a shop' },
  { value: '10+', label: 'shop categories' },
  { value: '3', label: 'languages supported' },
  { value: '100%', label: 'voice-powered' },
]

export default function HomePage() {
  const { isAuthenticated } = useAuth()

  return (
    <div className="grid gap-0">
      {/* Hero */}
      <section className="relative text-center py-16 sm:py-24 overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-slate-50 to-white pointer-events-none" />
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-slate-900/[0.03] blur-3xl -z-10 pointer-events-none" />

        <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-medium text-slate-600 mb-6 shadow-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
          Voice-powered · AI-driven · Instant websites
        </div>

        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-slate-900 leading-tight max-w-3xl mx-auto">
          Your shop website,<br />
          <span className="text-slate-400">built by your voice</span>
        </h1>

        <p className="mt-6 text-lg text-slate-500 max-w-xl mx-auto leading-relaxed">
          Speak about your business in Hindi, Marathi, or English — VaaniShop AI creates a complete, shareable website for your shop in under 30 seconds.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
          {isAuthenticated ? (
            <>
              <Link
                to="/create"
                className="rounded-xl bg-slate-900 px-8 py-3.5 text-sm font-semibold text-white hover:bg-slate-700 transition-colors shadow-lg shadow-slate-900/20"
              >
                Create a new shop
              </Link>
              <Link
                to="/dashboard"
                className="rounded-xl border border-slate-200 bg-white px-8 py-3.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                View my shops
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/register"
                className="rounded-xl bg-slate-900 px-8 py-3.5 text-sm font-semibold text-white hover:bg-slate-700 transition-colors shadow-lg shadow-slate-900/20"
              >
                Get started free
              </Link>
              <Link
                to="/login"
                className="rounded-xl border border-slate-200 bg-white px-8 py-3.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Sign in
              </Link>
            </>
          )}
        </div>

        {/* Mini demo snippet */}
        <div className="mt-12 mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10 p-5 text-left">
          <div className="flex items-center gap-2 mb-3">
            <span className="h-2 w-2 rounded-full bg-rose-400" />
            <span className="h-2 w-2 rounded-full bg-yellow-400" />
            <span className="h-2 w-2 rounded-full bg-green-400" />
            <span className="text-xs text-slate-400 ml-2">Voice Input Preview</span>
          </div>
          <p className="text-sm text-slate-600 italic leading-relaxed">
            "Mera naam Ramesh General Store hai Pune mein. Hum rice, dal, oil, aur atta bechte hain.
            Timing 8 baje se 10 baje tak hai. WhatsApp number 9876543210 hai..."
          </p>
          <div className="mt-3 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-slate-400">AI extracting shop details…</span>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y bg-white py-10 mb-16">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-3xl mx-auto px-4">
          {STATS.map(s => (
            <div key={s.label} className="text-center">
              <div className="text-3xl font-bold text-slate-900">{s.value}</div>
              <div className="text-xs text-slate-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="mb-20">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">How it works</h2>
          <p className="mt-2 text-slate-500">Three simple steps to your online shop presence</p>
        </div>
        <div className="grid gap-6 sm:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.step} className="relative rounded-2xl border bg-white p-7 hover:shadow-md transition-shadow">
              <div className="text-3xl mb-4">{s.icon}</div>
              <div className="absolute top-5 right-5 text-xs font-bold text-slate-200 text-4xl font-mono leading-none select-none">
                {s.step}
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">{s.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="mb-20">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-slate-900">Works for every shop</h2>
          <p className="mt-2 text-sm text-slate-500">From kirana stores to salons — any business can get online</p>
        </div>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
          {CATEGORIES.map(c => (
            <div
              key={c.name}
              className={`rounded-xl border p-3 text-center ${c.color}`}
            >
              <div className="text-2xl mb-1">{c.icon}</div>
              <div className="text-xs font-medium">{c.name}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="mb-20">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-slate-900">Loved by shopkeepers</h2>
          <p className="mt-2 text-sm text-slate-500">Real shops, real results</p>
        </div>
        <div className="grid gap-5 sm:grid-cols-3">
          {TESTIMONIALS.map(t => (
            <div key={t.name} className="rounded-2xl border bg-white p-6">
              <p className="text-sm text-slate-700 leading-relaxed italic mb-5">"{t.quote}"</p>
              <div className="flex items-center gap-3">
                <div className={`${t.theme} h-9 w-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                  {t.avatar}
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">{t.name}</div>
                  <div className="text-xs text-slate-500">{t.shop}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="rounded-3xl bg-slate-900 text-white p-10 sm:p-16 text-center mb-8">
        <h2 className="text-3xl font-bold">Ready to take your shop online?</h2>
        <p className="mt-3 text-slate-400 max-w-xl mx-auto">
          No typing, no technical skills needed. Just speak and your shop website is live in seconds.
        </p>
        {!isAuthenticated ? (
          <Link
            to="/register"
            className="mt-8 inline-block rounded-xl bg-white text-slate-900 px-8 py-3.5 text-sm font-semibold hover:bg-slate-100 transition-colors"
          >
            Create your free shop website →
          </Link>
        ) : (
          <Link
            to="/create"
            className="mt-8 inline-block rounded-xl bg-white text-slate-900 px-8 py-3.5 text-sm font-semibold hover:bg-slate-100 transition-colors"
          >
            Create a new shop →
          </Link>
        )}
      </section>
    </div>
  )
}

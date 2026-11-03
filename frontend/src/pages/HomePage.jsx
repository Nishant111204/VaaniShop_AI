import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AudioLines, Camera, CheckCheck, Keyboard, MessageCircle, Mic, QrCode } from 'lucide-react'
import PhoneFrame from '../components/PhoneFrame.jsx'
import ShopSite from '../components/ShopSite.jsx'
import VoiceCapture from '../components/VoiceCapture.jsx'
import { setPendingInput } from '../lib/pendingInput.js'
import { orderMessage } from '../lib/shop.js'

const SAMPLE_SHOP = {
  shopName: 'Sharma Kirana Store',
  tagline: 'Fresh staples, fair prices, since 1998',
  description: 'Your neighbourhood kirana in Kothrud for daily rations, dals, oils and household needs. Order on WhatsApp and pick up in five minutes, or ask about home delivery nearby.',
  category: 'grocery',
  address: 'Karve Road, Kothrud, Pune',
  phone: '9876543210',
  whatsapp: '9876543210',
  timing: '8:00 AM – 10:00 PM, Mon–Sat',
  theme: 'green',
  products: [
    { name: 'Sona Masoori Rice', price: '₹60/kg', description: 'Everyday rice, cleaned and sorted.', category: 'Staples', emoji: '🍚' },
    { name: 'Toor Dal', price: '₹120/kg', description: 'Unpolished, cooks soft.', category: 'Staples', emoji: '🫘' },
    { name: 'Fortune Sunflower Oil', price: '₹150 per litre', description: '1 litre pouch.', category: 'Staples', emoji: '🛢️' },
    { name: 'Chakki Atta', price: '₹45/kg', description: 'Freshly ground wheat flour.', category: 'Staples', emoji: '🌾' },
    { name: 'Amul Butter', price: '₹58', description: '100 g pack.', category: 'Dairy', emoji: '🧈' },
  ],
}

const SAMPLE_ORDER = orderMessage(
  SAMPLE_SHOP.shopName,
  [
    { qty: 2, name: 'Sona Masoori Rice', price: '₹60/kg' },
    { qty: 1, name: 'Toor Dal', price: '₹120/kg' },
    { qty: 1, name: 'Fortune Sunflower Oil', price: '₹150 per litre' },
  ],
  390,
  false,
)

const LANGUAGE_WALL = [
  ['हिंदी', 'hi'], ['मराठी', 'mr'], ['ગુજરાતી', 'gu'], ['தமிழ்', 'ta'], ['తెలుగు', 'te'], ['ಕನ್ನಡ', 'kn'],
  ['বাংলা', 'bn'], ['ਪੰਜਾਬੀ', 'pa'], ['മലയാളം', 'ml'], ['اردو', 'ur'], ['English', 'en'],
]

export default function HomePage() {
  const nav = useNavigate()

  function handleAudio(audio, language, extension) {
    setPendingInput({ audio, language, extension })
    nav('/create')
  }

  return (
    <>
      {/* Hero: the microphone works right here */}
      <section className="on-haldi overflow-hidden bg-haldi">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-16 pt-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_400px] lg:pb-24 lg:pt-14">
          <div>
            <h1 className="sign rise text-[clamp(3.2rem,10vw,6.6rem)] text-neel-900" lang="hi">
              बोलिए,<br />दुकान ऑनलाइन।
            </h1>
            <p className="rise mt-5 max-w-[34ch] text-[clamp(1.25rem,2.4vw,1.6rem)] font-medium leading-snug text-neel-900" style={{ '--i': 1 }}>
              Speak about your shop in your own language. Get a website with your price list, WhatsApp orders and a QR code for the counter.
            </p>

            <div className="rise mt-10" style={{ '--i': 2 }}>
              <VoiceCapture onAudio={handleAudio} size="md" layout="row" showLanguages={false} idleLabel="Tap and tell us about your shop" />
            </div>
            <p className="rise mt-5 text-neel-700" style={{ '--i': 3 }}>
              <Link to="/create?mode=type" className="inline-flex items-center gap-1.5 font-semibold text-neel underline underline-offset-4">
                <Keyboard className="h-4 w-4" aria-hidden="true" /> Prefer typing? Type it instead
              </Link>
              <span className="ml-1">Free, and no account needed to try.</span>
            </p>
          </div>

          <div className="relative mx-auto">
            <figure className="pop absolute -left-10 top-[23rem] z-30 hidden w-64 rounded-[22px] rounded-bl-md bg-white p-4 shadow-lift sm:block lg:-left-44" style={{ '--i': 2 }}>
              <figcaption className="flex items-center gap-2 text-sm font-semibold text-neel-500">
                <AudioLines className="h-4 w-4 text-sindoor" aria-hidden="true" /> Voice note, 0:24
              </figcaption>
              <blockquote className="mt-2 leading-snug text-neel-900" lang="hi">
                “शर्मा किराना, कोथरूड। चावल साठ रुपये किलो, तूर दाल एक सौ बीस…”
              </blockquote>
            </figure>
            <div className="pop" style={{ '--i': 4 }}>
              <PhoneFrame screenClassName="h-[560px] sm:h-[620px]">
                <ShopSite data={SAMPLE_SHOP} />
              </PhoneFrame>
            </div>
          </div>
        </div>
      </section>

      {/* WhatsApp ordering */}
      <section className="bg-white">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:py-28">
          <div>
            <h2 className="text-[clamp(2.2rem,4.5vw,3.5rem)] font-bold leading-[1.05] text-neel-900 condensed">
              Customers fill a basket. You get the order on WhatsApp.
            </h2>
            <p className="mt-5 max-w-[46ch] text-xl leading-relaxed text-neel-700">
              Every item on your page has an Add button. When the customer taps Order, WhatsApp opens with the full list and the total, already written. You reply, pack and they pick up.
            </p>
            <p className="mt-4 max-w-[46ch] text-lg text-neel-500">No app to install for you or your customers. No commission on any order.</p>
          </div>
          <div className="mx-auto w-full max-w-md rounded-[32px] bg-[#EFE7DD] p-5 sm:p-8">
            <div className="ml-auto max-w-[88%] rounded-2xl rounded-tr-md bg-[#D9FDD3] p-4 text-[15px] leading-relaxed text-neel-900 shadow-sm">
              <p className="whitespace-pre-line">{SAMPLE_ORDER}</p>
              <p className="mt-1 flex items-center justify-end gap-1 text-xs text-neel-500">
                10:42 AM <CheckCheck className="h-4 w-4 text-[#53BDEB]" aria-label="Read" />
              </p>
            </div>
            <div className="mt-3 max-w-[70%] rounded-2xl rounded-tl-md bg-white p-4 text-[15px] text-neel-900 shadow-sm">
              Ready in 10 minutes 🙏
              <p className="mt-1 text-right text-xs text-neel-500">10:43 AM</p>
            </div>
          </div>
        </div>
      </section>

      {/* Steps: a real sequence, so numbered */}
      <section className="bg-neel-50">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-24">
          <h2 className="text-[clamp(2rem,4vw,3rem)] font-bold leading-tight text-neel-900 condensed">Online in two minutes</h2>
          <ol className="mt-10 grid gap-8 md:grid-cols-3">
            {[
              { icon: Mic, title: 'Speak', body: 'Tap the mic and talk about your shop the way you would tell a new customer: name, items, prices, timings, WhatsApp number.' },
              { icon: CheckCheck, title: 'Check', body: 'See your page right away. Fix the shop name or number, untick items you don’t sell, pick a colour.' },
              { icon: MessageCircle, title: 'Share', body: 'Publish, then send the link to your WhatsApp groups and put the QR code on your counter.' },
            ].map((s, i) => (
              <li key={s.title} className="flex gap-4">
                <span className="sign grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-haldi text-3xl text-neel-900">{i + 1}</span>
                <div>
                  <h3 className="flex items-center gap-2 text-2xl font-bold text-neel-900">{s.title}</h3>
                  <p className="mt-1.5 text-lg leading-relaxed text-neel-700">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Languages as type */}
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
          <h2 className="max-w-[24ch] text-[clamp(2rem,4vw,3rem)] font-bold leading-tight text-neel-900 condensed">
            Speak the language you speak to your customers
          </h2>
          <p className="mt-3 max-w-[52ch] text-xl text-neel-700">Mix languages if you like. Your page is written in clear English that every customer can read.</p>
          <ul className="mt-10 flex flex-wrap gap-x-8 gap-y-3" aria-label="Supported languages">
            {LANGUAGE_WALL.map(([label, lang], i) => (
              <li key={lang} lang={lang} className={`text-[clamp(2rem,5.5vw,4.25rem)] font-semibold leading-tight ${i % 3 === 0 ? 'text-sindoor' : i % 3 === 1 ? 'text-neel' : 'text-neel-300'}`}>
                {label}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Counter tools */}
      <section className="bg-neel-50">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-24">
          <h2 className="text-[clamp(2rem,4vw,3rem)] font-bold leading-tight text-neel-900 condensed">Made for the counter, not the computer</h2>
          <div className="mt-10 grid gap-5 lg:grid-cols-[1.1fr_1fr]">
            <div className="panel flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:p-8">
              <div className="mx-auto w-40 shrink-0 overflow-hidden rounded-xl border border-neel-100 bg-white text-center shadow-lift" aria-hidden="true">
                <div className="awning awning-sm" style={{ '--awning': '#2E9A5F' }} />
                <p className="sign mt-5 px-2 text-xl leading-tight text-[#0F3D27]">Sharma Kirana</p>
                <div className="mx-auto my-3 grid h-20 w-20 place-items-center rounded-lg border-2 border-[#2E9A5F]"><QrCode className="h-14 w-14 text-neel-900" /></div>
                <p className="pb-4 text-[11px] font-semibold text-neel-700">Scan for our price list</p>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-neel-900">A QR poster for your shutter</h3>
                <p className="mt-2 text-lg leading-relaxed text-neel-700">Print it on A4 and stick it on the counter. Customers scan, see today’s prices and order next time from home.</p>
              </div>
            </div>
            <div className="grid gap-5">
              <div className="panel p-6 sm:p-8">
                <h3 className="text-2xl font-bold text-neel-900">Change prices by voice</h3>
                <p className="mt-2 text-lg text-neel-700">Say what changed. Everything else stays as it is.</p>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span className="rounded-2xl rounded-bl-md bg-neel-50 px-3.5 py-2 font-medium text-neel-900" lang="hi">“आज से संडे बंद रहेगा”</span>
                  <span className="rounded-full bg-paan-soft px-3 py-1 text-sm font-semibold text-paan-deep">Timings now Mon–Sat</span>
                </div>
              </div>
              <div className="panel flex items-start gap-4 p-6 sm:p-8">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-haldi"><Camera className="h-6 w-6 text-neel-900" aria-hidden="true" /></span>
                <div>
                  <h3 className="text-2xl font-bold text-neel-900">Photos straight from your phone</h3>
                  <p className="mt-2 text-lg text-neel-700">Snap your shelves and products. We shrink each photo so your page loads fast on any network.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Closing call */}
      <section className="bg-neel-900">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-8 px-4 py-20 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:py-24">
          <div>
            <p className="sign text-[clamp(2.6rem,6vw,4.5rem)] text-haldi" lang="hi">शटर उठाइए, दुकान ऑनलाइन।</p>
            <p className="mt-3 max-w-[40ch] text-xl text-white/80">Open your shop online today. It takes one voice note.</p>
          </div>
          <Link to="/create" className="btn-haldi shrink-0 whitespace-nowrap px-8 py-5 text-lg">
            <Mic className="h-5 w-5" aria-hidden="true" /> Make my shop page
          </Link>
        </div>
      </section>
    </>
  )
}

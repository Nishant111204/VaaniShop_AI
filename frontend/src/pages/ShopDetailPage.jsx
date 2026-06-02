import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Link, useParams } from 'react-router-dom'
import VoiceRecorder from '../components/VoiceRecorder.jsx'
import Spinner from '../components/Spinner.jsx'
import { getOwnedShop, transcribeAudio, updateShopFromText, updateShopFields } from '../lib/api.js'

function Field({ label, value, onChange, type = 'text', placeholder = '' }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
      <input
        type={type}
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
      />
    </div>
  )
}

function TextArea({ label, value, onChange, placeholder = '' }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
      <textarea
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 resize-none bg-white"
      />
    </div>
  )
}

const THEMES = ['slate', 'green', 'orange', 'blue', 'purple', 'rose']
const THEME_DOT = {
  slate: 'bg-slate-700', green: 'bg-green-600', orange: 'bg-orange-500',
  blue: 'bg-blue-600', purple: 'bg-purple-600', rose: 'bg-rose-500',
}

export default function ShopDetailPage() {
  const { id } = useParams()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [shop, setShop] = useState(null)
  const [editMode, setEditMode] = useState(false)
  const [form, setForm] = useState(null)

  async function load() {
    setLoading(true)
    try {
      const res = await getOwnedShop(id)
      setShop(res)
      setForm({ ...res.data, products: res.data.products || [] })
    } catch (e) {
      toast.error(e.message || 'Failed to load shop')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [id])

  function setField(key, val) { setForm(prev => ({ ...prev, [key]: val })) }

  function setProductField(idx, key, val) {
    setForm(prev => {
      const products = [...(prev.products || [])]
      products[idx] = { ...products[idx], [key]: val }
      return { ...prev, products }
    })
  }

  function addProduct() {
    setForm(prev => ({
      ...prev,
      products: [...(prev.products || []), { name: '', price: '', description: '', category: '' }],
    }))
  }

  function removeProduct(idx) {
    setForm(prev => {
      const products = [...(prev.products || [])]
      products.splice(idx, 1)
      return { ...prev, products }
    })
  }

  async function handleSave() {
    setSaving(true)
    try {
      const res = await updateShopFields(id, form)
      setShop(res)
      setForm({ ...res.data, products: res.data.products || [] })
      setEditMode(false)
      toast.success('Shop saved')
    } catch (e) {
      toast.error(e.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  async function handleVoiceUpdate(blob, language) {
    setUpdating(true)
    try {
      const { text } = await transcribeAudio(blob, language)
      if (!text?.trim()) { toast.error('No speech detected'); return }
      const res = await updateShopFromText(id, text)
      setShop(res)
      setForm({ ...res.data, products: res.data.products || [] })
      toast.success('Shop updated by voice')
    } catch (e) {
      toast.error(e.message || 'Failed to update')
    } finally {
      setUpdating(false)
    }
  }

  if (loading) return <Spinner label="Loading shop…" />
  if (!shop) return (
    <div className="rounded-2xl border bg-white p-8 shadow-sm">
      <p className="text-sm text-slate-600">Shop not found or access denied.</p>
      <Link to="/dashboard" className="text-sm underline mt-2 block text-blue-600">Back to dashboard</Link>
    </div>
  )

  const publicUrl = `/shop/${id}`
  const fullPublicUrl = `${window.location.origin}${publicUrl}`

  return (
    <div className="grid gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link to="/dashboard" className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 mb-2">
            ← My Shops
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{shop.data.shopName}</h1>
          <div className="flex items-center gap-3 mt-1">
            {shop.data.category && (
              <span className="text-xs text-slate-500 capitalize bg-slate-100 rounded-full px-2.5 py-0.5">
                {shop.data.category}
              </span>
            )}
            {shop.viewCount > 0 && (
              <span className="text-xs text-slate-400">👁 {shop.viewCount} views</span>
            )}
            {shop.slug && (
              <span className="text-xs text-slate-400 font-mono">/shop/{shop.slug}</span>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to={publicUrl}
            target="_blank"
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium hover:bg-slate-50 transition-colors"
          >
            View Public Page
          </Link>
          {editMode ? (
            <>
              <button
                onClick={() => { setEditMode(false); setForm({ ...shop.data, products: shop.data.products || [] }) }}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50 transition-colors"
              >
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </>
          ) : (
            <button
              onClick={() => setEditMode(true)}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 transition-colors"
            >
              Edit Details
            </button>
          )}
        </div>
      </div>

      {editMode ? (
        <div className="grid gap-6">
          {/* Shop details form */}
          <div className="rounded-2xl border bg-white p-6 shadow-sm grid gap-5">
            <h2 className="text-sm font-semibold text-slate-900">Shop Details</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Shop Name" value={form.shopName} onChange={v => setField('shopName', v)} placeholder="Ramesh General Store" />
              <Field label="Category" value={form.category} onChange={v => setField('category', v)} placeholder="grocery, bakery, electronics…" />
            </div>
            <TextArea label="Description" value={form.description} onChange={v => setField('description', v)} placeholder="What you sell or offer…" />
            <Field label="Address" value={form.address} onChange={v => setField('address', v)} placeholder="Shop no. 5, Main Bazaar, Pune" />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Phone" value={form.phone} onChange={v => setField('phone', v)} placeholder="9876543210" type="tel" />
              <Field label="WhatsApp" value={form.whatsapp} onChange={v => setField('whatsapp', v)} placeholder="9876543210" type="tel" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Email" value={form.email} onChange={v => setField('email', v)} placeholder="shop@example.com" type="email" />
              <Field label="Instagram" value={form.instagram} onChange={v => setField('instagram', v)} placeholder="@myshop" />
            </div>
            <Field label="Business Hours" value={form.timing} onChange={v => setField('timing', v)} placeholder="9am–9pm Mon–Sat" />
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-2">Theme Color</label>
              <div className="flex gap-2 flex-wrap">
                {THEMES.map(th => (
                  <button
                    key={th}
                    onClick={() => setField('theme', th)}
                    className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium border capitalize transition-colors ${
                      form.theme === th ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 hover:border-slate-400'
                    }`}
                  >
                    <span className={`h-2.5 w-2.5 rounded-full ${THEME_DOT[th]}`} />
                    {th}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Products form */}
          <div className="rounded-2xl border bg-white p-6 shadow-sm grid gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">Products / Services</h2>
              <button
                onClick={addProduct}
                className="text-xs font-medium text-slate-700 border border-slate-200 rounded-lg px-3 py-1.5 hover:bg-slate-50 transition-colors"
              >
                + Add Product
              </button>
            </div>
            {form.products?.length === 0 && (
              <p className="text-sm text-slate-400">No products yet. Add one above.</p>
            )}
            {form.products?.map((p, idx) => (
              <div key={idx} className="rounded-xl border border-slate-100 bg-slate-50 p-4 grid gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500">Product {idx + 1}</span>
                  <button onClick={() => removeProduct(idx)} className="text-xs text-rose-500 hover:underline">Remove</button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Name" value={p.name} onChange={v => setProductField(idx, 'name', v)} placeholder="Product name" />
                  <Field label="Price" value={p.price} onChange={v => setProductField(idx, 'price', v)} placeholder="₹50" />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Category" value={p.category} onChange={v => setProductField(idx, 'category', v)} placeholder="e.g. vegetables" />
                  <Field label="Description" value={p.description} onChange={v => setProductField(idx, 'description', v)} placeholder="Short description" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main content */}
          <div className="lg:col-span-2 grid gap-5">
            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-900 mb-4">Shop Info</h2>
              <div className="grid gap-3">
                <InfoRow label="Description" value={shop.data.description} />
                <InfoRow label="Address" value={shop.data.address} />
                <InfoRow label="Phone" value={shop.data.phone} />
                <InfoRow label="WhatsApp" value={shop.data.whatsapp} />
                <InfoRow label="Email" value={shop.data.email} />
                <InfoRow label="Instagram" value={shop.data.instagram} />
                <InfoRow label="Hours" value={shop.data.timing} />
                <InfoRow label="Theme" value={shop.data.theme} />
              </div>
            </div>

            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-900 mb-4">
                Products <span className="text-slate-400 font-normal">({shop.data.products?.length || 0})</span>
              </h2>
              {shop.data.products?.length ? (
                <div className="grid gap-2 sm:grid-cols-2">
                  {shop.data.products.map((p, idx) => (
                    <div key={idx} className="rounded-xl border bg-slate-50 p-3.5">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="font-medium text-sm text-slate-900">{p.name || '—'}</span>
                        {p.price && <span className="text-xs font-semibold text-slate-600 shrink-0">{p.price}</span>}
                      </div>
                      {p.description && <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{p.description}</p>}
                      {p.category && <span className="mt-1.5 inline-block text-xs text-slate-400 capitalize">{p.category}</span>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400">No products listed. Click "Edit Details" to add some.</p>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="grid gap-4 content-start">
            {/* Voice update */}
            <div className="rounded-2xl border bg-white p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-900 mb-1">Update by Voice</h2>
              <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                Say something like "Change timing to 10am–8pm" or "Add mango juice for ₹30" or "Update address to MG Road".
              </p>
              <VoiceRecorder disabled={updating} onAudioReady={handleVoiceUpdate} showLanguage={true} />
              {updating && (
                <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                  <Spinner /> Updating your shop…
                </div>
              )}
            </div>

            {/* Public link */}
            <div className="rounded-2xl border bg-white p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-900 mb-3">Public Link</h2>
              <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs font-mono text-slate-600 break-all mb-2">
                {fullPublicUrl}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to={publicUrl}
                  target="_blank"
                  className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-center hover:bg-slate-50 transition-colors"
                >
                  Open Page
                </Link>
                <button
                  onClick={() => { navigator.clipboard.writeText(fullPublicUrl); toast.success('Link copied!') }}
                  className="rounded-lg bg-slate-900 text-white px-3 py-2 text-xs font-medium hover:bg-slate-700 transition-colors"
                >
                  Copy Link
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function InfoRow({ label, value }) {
  if (!value) return null
  return (
    <div className="grid grid-cols-3 gap-2 text-sm py-2 border-b border-slate-50 last:border-0">
      <span className="text-xs font-medium text-slate-400 pt-0.5">{label}</span>
      <span className="col-span-2 text-slate-800">{value}</span>
    </div>
  )
}

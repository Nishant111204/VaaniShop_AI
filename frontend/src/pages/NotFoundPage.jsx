import React from 'react'
import { Link } from 'react-router-dom'
import { useI18n } from '../i18n/index.jsx'

export default function NotFoundPage() {
  const { t } = useI18n()
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center">
      <div className="awning w-48 rounded-t-lg" style={{ '--awning': '#A9B2D9' }} aria-hidden="true" />
      <h1 className="sign mt-10 text-5xl text-neel-900">{t('notFound.title')}</h1>
      <p className="mt-3 text-lg text-neel-500">{t('notFound.body')}</p>
      <Link to="/" className="btn-ink mt-8">{t('notFound.home')}</Link>
    </div>
  )
}

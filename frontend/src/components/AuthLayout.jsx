import React from 'react'
import AuthForm from './AuthForm.jsx'

/** Shared frame for the sign-in and sign-up pages: a signboard panel beside the form. */
export default function AuthLayout({ title, subtitle, signText, mode, onDone }) {
  return (
    <div className="mx-auto grid max-w-5xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:items-center lg:py-16">
      <div className="on-haldi hidden overflow-hidden rounded-[32px] bg-haldi lg:block">
        <div className="awning" style={{ '--awning': '#E5412D' }} />
        <div className="px-10 pb-12 pt-16">
          <p className="sign text-6xl text-neel-900" lang="hi">{signText}</p>
          <p className="mt-6 max-w-sm text-xl text-neel-700">
            Change prices, add photos and share your page from any phone, whenever you like.
          </p>
        </div>
      </div>
      <div className="mx-auto w-full max-w-md">
        <h1 className="text-[clamp(2.2rem,5vw,3rem)] font-bold leading-tight text-neel-900 condensed">{title}</h1>
        <p className="mt-1 text-lg text-neel-500">{subtitle}</p>
        <div className="panel mt-6 p-6 sm:p-8">
          <AuthForm initialMode={mode} onDone={onDone} />
        </div>
      </div>
    </div>
  )
}

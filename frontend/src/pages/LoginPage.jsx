import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout.jsx'
import { useI18n } from '../i18n/index.jsx'

export default function LoginPage() {
  const nav = useNavigate()
  const { t } = useI18n()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/dashboard'
  return (
    <AuthLayout
      mode="login"
      title={t('login.title')}
      subtitle={t('login.subtitle')}
      signText="फिर से स्वागत है"
      onDone={() => nav(from, { replace: true })}
    />
  )
}

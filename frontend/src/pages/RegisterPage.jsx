import React from 'react'
import { useNavigate } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout.jsx'
import { useI18n } from '../i18n/index.jsx'

export default function RegisterPage() {
  const nav = useNavigate()
  const { t } = useI18n()
  return (
    <AuthLayout
      mode="register"
      title={t('register.title')}
      subtitle={t('register.subtitle')}
      signText="आपका स्वागत है"
      onDone={() => nav('/create')}
    />
  )
}

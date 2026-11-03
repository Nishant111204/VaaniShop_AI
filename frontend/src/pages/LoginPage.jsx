import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout.jsx'

export default function LoginPage() {
  const nav = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/dashboard'
  return (
    <AuthLayout
      mode="login"
      title="Welcome back"
      subtitle="Sign in with the mobile number you used to make your shop."
      signText="फिर से स्वागत है"
      onDone={() => nav(from, { replace: true })}
    />
  )
}

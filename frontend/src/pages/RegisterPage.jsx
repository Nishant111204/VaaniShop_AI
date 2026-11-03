import React from 'react'
import { useNavigate } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout.jsx'

export default function RegisterPage() {
  const nav = useNavigate()
  return (
    <AuthLayout
      mode="register"
      title="Create your account"
      subtitle="Free. Just your name, mobile number and a password."
      signText="आपका स्वागत है"
      onDone={() => nav('/create')}
    />
  )
}

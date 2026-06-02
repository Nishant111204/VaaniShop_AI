import React from 'react'
import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import HomePage from './pages/HomePage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'
import ShopListPage from './pages/ShopListPage.jsx'
import CreateShopPage from './pages/CreateShopPage.jsx'
import ShopDetailPage from './pages/ShopDetailPage.jsx'
import PublicShopPage from './pages/PublicShopPage.jsx'
import NotFoundPage from './pages/NotFoundPage.jsx'

export default function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route path="/dashboard" element={<ProtectedRoute><ShopListPage /></ProtectedRoute>} />
          <Route path="/create" element={<ProtectedRoute><CreateShopPage /></ProtectedRoute>} />
          <Route path="/manage/:id" element={<ProtectedRoute><ShopDetailPage /></ProtectedRoute>} />

          <Route path="/shop/:id" element={<PublicShopPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </ErrorBoundary>
  )
}

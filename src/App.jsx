// src/App.jsx
import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

// layouts & pages
import Header       from './components/Header'
import Slider       from './components/Slider'
import ProductList  from './components/ProductList'
import Footer       from './components/Footer'
import ChatWidget   from './components/ChatWidget'
import ChatPage     from './components/ChatPage'

// auth
import Login        from './auth/Login'
import SignUp       from './auth/SignUp'

// admin
import Dashboard    from './admin/pages/Dashboard'
import Tickets      from './admin/pages/Tickets'
import NewTicket    from './admin/pages/NewTicket'

function ClientLayout() {
  return (
    <>
      <Header />
      <main>
        <Slider />
        <ProductList />
      </main>
      <Footer />
      <ChatWidget />
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public auth */}
        <Route path="/login"  element={<Login  />} />
        <Route path="/signup" element={<SignUp />} />

        {/* Full-page chat */}
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/chat/:ticketId" element={<ChatPage />} />

        {/* Client storefront */}
        <Route path="/" element={<ClientLayout />} />

        {/* Admin area */}
        <Route path="/admin"             element={<Dashboard />} />
        <Route path="/admin/tickets"     element={<Tickets   />} />
        <Route path="/admin/tickets/new" element={<NewTicket />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

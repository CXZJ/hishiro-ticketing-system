import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import Header       from './components/Header';
import CategoryNav  from './components/CategoryNav';
import Slider       from './components/Slider';
import ProductList  from './components/ProductList';
import Footer       from './components/Footer';
import ChatWidget   from './components/ChatWidget';

import Login        from './auth/Login';
import SignUp       from './auth/SignUp';

import Dashboard    from './admin/pages/Dashboard';
import Tickets      from './admin/pages/Tickets';
import NewTicket    from './admin/pages/NewTicket';

function ClientLayout() {
  return (
    <>
      <Header />
      <CategoryNav />
      <main>
        <Slider />
        <ProductList />
      </main>
      <Footer />
      <ChatWidget />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public auth */}
        <Route path="/login"  element={<Login  />} />
        <Route path="/signup" element={<SignUp />} />

        {/* Client storefront */}
        <Route path="/" element={<ClientLayout />} />

        {/* Admin panel */}
        <Route path="/admin"             element={<Dashboard />} />
        <Route path="/admin/tickets"     element={<Tickets   />} />
        <Route path="/admin/tickets/new" element={<NewTicket />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

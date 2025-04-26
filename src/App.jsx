import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import Header       from './components/Header';
import CategoryNav  from './components/CategoryNav';
import Slider       from './components/Slider';
import ProductList  from './components/ProductList';
import Footer       from './components/Footer';
import ChatWidget   from './components/ChatWidget';

// Admin pages
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
        {/* Client side uses its own layout */}
        <Route path="/" element={<ClientLayout />} />

        {/* Admin pages render without client Header/Footer */}
        <Route path="/admin" element={<Dashboard />} />
        <Route path="/admin/tickets" element={<Tickets />} />
        <Route path="/admin/tickets/new" element={<NewTicket />} />

        {/* Fallback to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

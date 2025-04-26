import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../UI/AdminLayout';
import TicketCard  from '../UI/TicketCard';

export default function Tickets() {
  const [tickets, setTickets] = useState([]);

  useEffect(() => {
    fetch('/api/tickets')
      .then(r => r.json())
      .then(setTickets)
      .catch(console.error);
  }, []);

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">All Tickets</h1>
        {/* 👉 use Link so it actually navigates */}
        <Link
          to="/admin/tickets/new"
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          New Ticket
        </Link>
      </div>
      <div className="space-y-4">
        {tickets.map(t => (
          <TicketCard key={t.id} ticket={t} />
        ))}
      </div>
    </AdminLayout>
  );
}

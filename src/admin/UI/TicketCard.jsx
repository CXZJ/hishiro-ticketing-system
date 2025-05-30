import React from 'react';
import { Link } from 'react-router-dom';

export default function TicketCard({ ticket }) {
  const color =
    ticket.status === 'New'        ? 'bg-blue-500'   :
    ticket.status === 'On-Going'   ? 'bg-yellow-500' :
                                     'bg-green-500';

  return (
    <div className="bg-white rounded shadow p-4 flex justify-between items-center">
      <div>
        <span className={`inline-block w-3 h-3 mr-2 rounded-full ${color}`} />
        <strong>#{ticket.id}</strong> – {ticket.subject}
        <div className="text-sm text-gray-500">
          {ticket.author} · {new Date(ticket.createdAt).toLocaleString()}
        </div>
      </div>
      <Link 
        to={`/admin/tickets/${ticket.id}`}
        className="text-purple-600 hover:text-purple-800 transition-colors"
      >
        Open
      </Link>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from '../ui/AdminLayout';
import {
  ArrowLeftIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

export default function TicketDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`/api/tickets/${id}`)
      .then(r => r.json())
      .then(data => {
        setTicket(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="text-center text-red-600">
          <p>Error loading ticket: {error}</p>
        </div>
      </AdminLayout>
    );
  }

  if (!ticket) {
    return (
      <AdminLayout>
        <div className="text-center text-gray-600">
          <p>Ticket not found</p>
        </div>
      </AdminLayout>
    );
  }

  const getStatusIcon = (status) => {
    switch (status.toLowerCase()) {
      case 'new':
        return <ClockIcon className="w-5 h-5 text-blue-500" />;
      case 'ongoing':
        return <ClockIcon className="w-5 h-5 text-yellow-500" />;
      case 'resolved':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      default:
        return <XCircleIcon className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate('/admin/tickets')}
          className="flex items-center text-gray-600 hover:text-gray-800 mb-6"
        >
          <ArrowLeftIcon className="w-5 h-5 mr-2" />
          Back to Tickets
        </button>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-2xl font-semibold mb-2">#{ticket.id} - {ticket.subject}</h1>
              <div className="flex items-center text-gray-600">
                <span className="mr-4">By {ticket.author}</span>
                <span>{new Date(ticket.createdAt).toLocaleString()}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon(ticket.status)}
              <span className="font-medium">{ticket.status}</span>
            </div>
          </div>

          <div className="border-t pt-6">
            <h2 className="text-lg font-medium mb-4">Description</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{ticket.body}</p>
          </div>

          {ticket.priority && (
            <div className="mt-6">
              <h2 className="text-lg font-medium mb-4">Priority</h2>
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium
                ${ticket.priority === 'High' ? 'bg-red-100 text-red-800' :
                  ticket.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'}`}>
                {ticket.priority} Priority
              </span>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
} 
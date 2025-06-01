import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/sidebar';
import { Header } from '../components/header';
import {
  ArrowLeftIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../firebase';

export default function TicketDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user] = useAuthState(auth);
  const [messages, setMessages] = useState([]);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    const fetchTicket = async () => {
      try {
        const token = await user.getIdToken();
        const res = await fetch(`/api/tickets/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Failed to fetch ticket: ${res.status} ${res.statusText}\nResponse body: ${text}`);
        }
        const data = await res.json();
        setTicket(data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };
    fetchTicket();
  }, [id, user]);

  useEffect(() => {
    if (!user) return;
    const fetchMessages = async () => {
      try {
        const token = await user.getIdToken();
        const res = await fetch(`/api/tickets/${id}/messages`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          setMessages(data);
        }
      } catch (err) {
        // Optionally handle error
      }
    };
    fetchMessages();
  }, [id, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!reply.trim()) return;
    setSending(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/tickets/${id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ text: reply })
      });
      if (res.ok) {
        setReply('');
        // Refresh messages
        const data = await res.json();
        setMessages(data);
      }
    } catch (err) {
      // Optionally handle error
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar className="border-r" />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </main>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar className="border-r" />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1">
            <div className="text-center text-red-600">
              <p>Error loading ticket: {error}</p>
              <button
                onClick={() => navigate('/admin/tickets')}
                className="mt-4 text-blue-600 hover:text-blue-800"
              >
                Back to Tickets
              </button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar className="border-r" />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1">
            <div className="text-center text-gray-600">
              <p>Ticket not found</p>
              <button
                onClick={() => navigate('/admin/tickets')}
                className="mt-4 text-blue-600 hover:text-blue-800"
              >
                Back to Tickets
              </button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const getStatusIcon = (status) => {
    switch (status.toLowerCase()) {
      case 'new':
        return <ClockIcon className="w-5 h-5 text-blue-500" />;
      case 'in-progress':
        return <ClockIcon className="w-5 h-5 text-yellow-500" />;
      case 'resolved':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      default:
        return <XCircleIcon className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar className="border-r" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1">
          <div className="w-full px-2 sm:px-4 md:px-8">
            <button
              onClick={() => navigate('/admin/tickets')}
              className="flex items-center text-gray-600 hover:text-gray-800 mb-6"
            >
              <ArrowLeftIcon className="w-5 h-5 mr-2" />
              Back to Tickets
            </button>

            <div className="bg-white rounded-lg shadow-sm p-6 mb-6 w-full">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h1 className="text-2xl font-semibold mb-2">#{ticket._id.substring(0, 8)} - {ticket.subject}</h1>
                  <div className="flex items-center text-gray-600">
                    <span className="mr-4">User ID: {ticket.userId}</span>
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
                <p className="text-gray-700 whitespace-pre-wrap">{ticket.message}</p>
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

            {/* Conversation History */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6 max-h-96 overflow-y-auto w-full">
              <h2 className="text-lg font-medium mb-4">Conversation</h2>
              {messages.length === 0 ? (
                <div className="text-gray-500">No messages yet.</div>
              ) : (
                <div className="space-y-4">
                  {messages.map((msg, idx) => (
                    <div key={msg._id || idx} className={`flex ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`rounded-lg px-4 py-2 max-w-[70%] ${msg.sender === 'admin' ? 'bg-blue-100 text-blue-900' : 'bg-gray-100 text-gray-800'}`}>
                        <div className="text-xs mb-1 font-semibold">{msg.sender === 'admin' ? 'You' : 'User'}</div>
                        <div>{msg.text}</div>
                        <div className="text-xs opacity-60 mt-1">{msg.time ? new Date(msg.time).toLocaleString() : ''}</div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Reply Box */}
            <form onSubmit={handleSend} className="bg-white rounded-lg shadow-sm p-4 flex gap-2 items-end w-full">
              <textarea
                className="flex-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring focus:border-black/30 resize-none"
                rows={2}
                placeholder="Type your reply..."
                value={reply}
                onChange={e => setReply(e.target.value)}
                disabled={sending}
              />
              <button
                type="submit"
                className="bg-black text-white px-6 py-2 rounded-lg font-semibold shadow hover:scale-105 hover:shadow-lg transition-all duration-150 disabled:opacity-50"
                disabled={sending || !reply.trim()}
              >
                {sending ? 'Sending...' : 'Send'}
              </button>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
} 
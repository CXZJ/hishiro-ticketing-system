import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from '../AdminLayout';
import {
  ArrowLeftIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../firebase';
import { io } from 'socket.io-client';

export default function TicketDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user] = useAuthState(auth);
  const [reply, setReply] = useState('');
  const [status, setStatus] = useState('');
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);

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
        setStatus(data.status || 'new');
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

  // Real-time updates with Socket.IO
  useEffect(() => {
    if (!user) return;
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
    const sock = io(API_URL);
    socketRef.current = sock;
    sock.on('connect', () => {
      sock.emit('joinTicketRoom', id);
    });
    sock.on('ticketMessage', (data) => {
      if (data.ticketId === id) {
        setMessages(prev => {
          // Fix deduplication: always check for tempId if present
          const exists = prev.some(m => (m.tempId && data.tempId && m.tempId === data.tempId) || (!data.tempId && m.text === data.message && m.sender === data.sender && new Date(m.time).getTime() === new Date(data.time).getTime()));
          if (exists) return prev;
          return [...prev, {
            text: data.message,
            sender: data.sender,
            time: data.time,
            tempId: data.tempId
          }];
        });
      }
    });
    return () => {
      sock.disconnect();
    };
  }, [id, user]);

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
        body: JSON.stringify({ text: reply, status })
      });
      if (res.ok) {
        setReply('');
        // Refresh messages and ticket status
        const data = await res.json();
        setMessages(data.messages || []);
        setTicket(data.ticket || ticket);
      }
    } catch (err) {
      // Optionally handle error
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <main className="flex-1">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </main>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <main className="flex-1">
          <div className="bg-red-100 text-red-800 p-4 rounded-lg">Error: {error}</div>
        </main>
      </AdminLayout>
    );
  }

  if (!ticket) {
    return (
      <AdminLayout>
        <main className="flex-1">
          <div className="bg-yellow-100 text-yellow-800 p-4 rounded-lg">Ticket not found</div>
        </main>
      </AdminLayout>
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
    <AdminLayout>
      <main className="flex-1 max-w-3xl mx-auto py-8 px-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Back
        </button>
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="mb-2 text-xs text-gray-400">Ticket #{ticket._id.substring(0, 8)}</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{ticket.subject || 'Untitled Ticket'}</h1>
          <div className="text-sm text-gray-500 mb-4">From: {ticket.userEmail || ticket.userId}</div>
          <div className="prose max-w-none mb-4">
            <p className="text-gray-600 whitespace-pre-line">{ticket.message}</p>
          </div>
          <div className="mt-2 text-xs text-gray-400">Created: {new Date(ticket.createdAt).toLocaleString()}</div>
          <div className="mt-2 text-xs text-gray-400">Status: {ticket.status}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Conversation</h2>
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
        <form onSubmit={handleSend} className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Reply to Ticket</h2>
          <div className="mb-4">
            <textarea
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring focus:border-blue-300"
              rows={4}
              placeholder="Type your reply here..."
              value={reply}
              onChange={e => setReply(e.target.value)}
              required
              disabled={sending}
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Status</label>
            <select
              className="border rounded px-2 py-1"
              value={status}
              onChange={e => setStatus(e.target.value)}
              disabled={sending}
            >
              <option value="new">New</option>
              <option value="in-progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
            disabled={sending || !reply.trim()}
          >
            {sending ? 'Sending...' : 'Submit Reply'}
          </button>
        </form>
      </main>
    </AdminLayout>
  );
} 
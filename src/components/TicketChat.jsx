import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { io } from 'socket.io-client';
import { v4 as uuidv4 } from 'uuid';

export default function TicketChat() {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user] = useAuthState(auth);
  const [isAdmin, setIsAdmin] = useState(false);
  const [reply, setReply] = useState('');
  const [status, setStatus] = useState('');
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState('');
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);
  const [newMessage, setNewMessage] = useState('');

  // Fetch ticket details
  useEffect(() => {
    if (!user) return;
    const fetchTicket = async () => {
      try {
        const token = await user.getIdToken();
        const res = await fetch(`/api/tickets/${ticketId}`, {
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
  }, [ticketId, user]);

  // Fetch initial messages
  const fetchMessages = async () => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/tickets/${ticketId}/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (err) {
      // Optionally handle error
    }
  };

  useEffect(() => {
    fetchMessages();
    // eslint-disable-next-line
  }, [ticketId, user]);

  // Real-time updates with Socket.IO
  useEffect(() => {
    if (!user) return;
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
    const sock = io(API_URL);
    sock.on('connect', () => {
      sock.emit('userJoinTicketRoom', ticketId);
    });
    sock.on('ticketMessage', (data) => {
      if (data.ticketId === ticketId) {
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
  }, [ticketId, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!user) return;
    const checkAdmin = async () => {
      try {
        const token = await user.getIdToken();
        const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";
        const url = new URL('/api/admin/check', API_URL).toString();
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        if (response.status === 403) {
          setIsAdmin(false);
          return;
        }
        const data = await response.json();
        setIsAdmin(data.isAdmin === true);
      } catch (e) {
        setIsAdmin(false);
      }
    };
    checkAdmin();
  }, [user]);

  const handleSend = async (e) => {
    e.preventDefault();
    setSuccess('');
    if (!reply.trim()) return;
    setSending(true);
    const tempId = Date.now() + '-' + Math.random();
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/tickets/${ticketId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ text: reply, status, tempId })
      });
      if (res.ok) {
        // Add message to state immediately with tempId
        const newMessageObj = {
          text: reply,
          sender: 'admin',
          time: new Date(),
          tempId
        };
        setMessages(prev => [...prev, newMessageObj]);
        setReply('');
        setSuccess('Reply sent successfully!');
        // Optionally, refresh ticket data
        const data = await res.json();
        setTicket(data.ticket || ticket);
      } else {
        setSuccess('Failed to send reply.');
      }
    } catch (err) {
      setSuccess('Failed to send reply.');
    } finally {
      setSending(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const tempId = Date.now() + '-' + Math.random();
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/tickets/${ticketId}/user-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ text: newMessage, tempId })
      });

      if (!res.ok) {
        throw new Error('Failed to send message');
      }

      // Add message to state immediately with tempId
      const newMessageObj = {
        text: newMessage,
        sender: 'user',
        time: new Date(),
        tempId
      };
      setMessages(prev => [...prev, newMessageObj]);
      setNewMessage('');
    } catch (err) {
      console.error('Error sending message:', err);
      // Optionally show error to user
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="bg-red-100 text-red-800 p-4 rounded-lg">
          Error: {error}
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="bg-yellow-100 text-yellow-800 p-4 rounded-lg">
          Ticket not found
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with back button */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back
          </button>
        </div>
      </div>

      {/* Ticket Details */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {ticket.subject || 'Untitled Ticket'}
              </h1>
              <div className="text-sm text-gray-500 mb-4">
                Ticket #{ticket._id.substring(0, 8)}
              </div>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold border-2
              ${ticket.status === "resolved"
                ? "border-green-500 text-green-700 bg-white"
                : ticket.status === "in-progress"
                ? "border-blue-500 text-blue-700 bg-white"
                : ticket.status === "closed"
                ? "border-zinc-400 text-zinc-700 bg-white"
                : "border-purple-500 text-purple-700 bg-white" // default for 'new'
              }`}>
              {ticket.status === "resolved" ? "Resolved"
                : ticket.status === "in-progress" ? "In Progress"
                : ticket.status === "closed" ? "Closed"
                : "New"}
            </span>
          </div>
          <div className="prose max-w-none">
            <p className="text-gray-600 whitespace-pre-line">{ticket.message}</p>
          </div>
          <div className="mt-4 text-sm text-gray-500">
            Created: {new Date(ticket.createdAt).toLocaleString()}
          </div>
        </div>
        {/* Conversation */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Conversation</h2>
          {messages.length === 0 ? (
            <div className="text-gray-500">No messages yet.</div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg, idx) => (
                <div key={msg._id || idx} className={`flex ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`rounded-lg px-4 py-2 max-w-[70%] ${msg.sender === 'admin' ? 'bg-blue-100 text-blue-900' : 'bg-gray-100 text-gray-800'}`}>
                    <div className="text-xs mb-1 font-semibold">{msg.sender === 'admin' ? 'Admin' : 'You'}</div>
                    <div>{msg.text}</div>
                    <div className="text-xs mt-1 text-gray-500">
                      {new Date(msg.time).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Message Input Form */}
        {!isAdmin && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <form onSubmit={handleSubmit} className="flex gap-4">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={!newMessage.trim()}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send
              </button>
            </form>
          </div>
        )}

        {/* Admin-only reply form */}
        {isAdmin && (
          <form onSubmit={handleSend} className="bg-white rounded-lg shadow-sm p-6 max-w-xl mx-auto">
            <h2 className="text-lg font-semibold mb-4">Reply to Ticket</h2>
            {success && <div className={`mb-4 ${success.includes('success') ? 'text-green-600' : 'text-red-600'}`}>{success}</div>}
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
        )}
      </div>
    </div>
  );
} 
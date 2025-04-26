// src/admin/pages/NewTicket.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../UI/AdminLayout';

export default function NewTicket() {
  const nav = useNavigate();
  const [email,    setEmail]    = useState('');
  const [type,     setType]     = useState('');
  const [priority, setPriority] = useState('');
  const [body,     setBody]     = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, type, priority, body }),
      });
      if (!res.ok) throw new Error('Network error');
      nav('/admin/tickets');
    } catch (err) {
      alert('Failed to create ticket: ' + err.message);
    }
  };

  return (
    <AdminLayout>
      <h1 className="text-2xl font-semibold mb-6">New Ticket</h1>
      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded shadow">
        <div className="grid grid-cols-3 gap-4">
          <input
            type="email"
            placeholder="Type Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="border p-2 rounded"
            required
          />
          <select
            value={type}
            onChange={e => setType(e.target.value)}
            className="border p-2 rounded"
            required
          >
            <option value="">Choose Type</option>
            <option value="bug">Bug</option>
            <option value="feature">Feature Request</option>
          </select>
          <select
            value={priority}
            onChange={e => setPriority(e.target.value)}
            className="border p-2 rounded"
            required
          >
            <option value="">Select Priority</option>
            <option value="low">Low Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="high">High Priority</option>
          </select>
        </div>
        <textarea
          placeholder="Type ticket issue here…"
          value={body}
          onChange={e => setBody(e.target.value)}
          className="w-full border p-2 rounded h-32"
          required
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded ml-auto block"
        >
          Send Ticket
        </button>
      </form>
    </AdminLayout>
  );
}

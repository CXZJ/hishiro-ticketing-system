import React, { useEffect, useState } from 'react';
import AdminLayout from '../UI/AdminLayout';
import AdminChat from '../components/AdminChat';

export default function Dashboard() {
  // optional: fetch real stats
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    resolved: 0,
  });

  useEffect(() => {
    // example fetch – adjust to your real endpoint
    fetch('/api/tickets/stats')
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {
        // fallback/demo values
        setStats({ total: 123, open: 45, resolved: 78 });
      });
  }, []);

  return (
    <AdminLayout>
      <h1 className="text-2xl font-semibold mb-6">Dashboard</h1>

      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="p-4 bg-white rounded shadow">
          <p className="text-sm text-gray-500">Total Tickets</p>
          <p className="text-3xl font-bold">{stats.total}</p>
        </div>

        <div className="p-4 bg-white rounded shadow">
          <p className="text-sm text-gray-500">Open Tickets</p>
          <p className="text-3xl font-bold">{stats.open}</p>
        </div>

        <div className="p-4 bg-white rounded shadow">
          <p className="text-sm text-gray-500">Resolved Tickets</p>
          <p className="text-3xl font-bold">{stats.resolved}</p>
        </div>
      </div>

      {/* Admin Chat Panel */}
      <AdminChat />
    </AdminLayout>
  );
}

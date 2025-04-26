// src/admin/pages/Tickets.jsx

import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../ui/AdminLayout';
import TicketCard  from '../ui/TicketCard';

import {
  MagnifyingGlassIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';
import {
  InboxIcon,
  ClockIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/solid';

const STATUS_TABS = [
  { key: 'all',      label: 'All Tickets', icon: InboxIcon },
  { key: 'new',      label: 'New',         icon: InboxIcon },
  { key: 'ongoing',  label: 'On-Going',    icon: ClockIcon },
  { key: 'resolved', label: 'Resolved',    icon: CheckCircleIcon },
];

const PRIORITY_OPTIONS = ['', 'Low', 'Medium', 'High'];
const DATE_OPTIONS     = ['This Week', 'This Month', 'All Time'];

export default function Tickets() {
  const [tickets, setTickets]         = useState([]);
  const [search, setSearch]           = useState('');
  const [tab, setTab]                 = useState('all');
  const [priority, setPriority]       = useState('');
  const [dateRange, setDateRange]     = useState('This Week');
  const [page, setPage]               = useState(1);
  const PAGE_SIZE = 5;

  useEffect(() => {
    fetch('/api/tickets')
      .then(r => r.json())
      .then(setTickets)
      .catch(console.error);
  }, []);

  const filtered = useMemo(() => {
    return tickets.filter(t => {
      if (tab !== 'all' && t.status.toLowerCase() !== tab) return false;
      if (priority && t.priority !== priority) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        if (
          !t.subject.toLowerCase().includes(q) &&
          !t.body.toLowerCase().includes(q)
        ) return false;
      }
      if (dateRange === 'This Week') {
        const oneWeekAgo = Date.now() - 7*24*60*60*1000;
        if (new Date(t.createdAt).getTime() < oneWeekAgo) return false;
      }
      return true;
    });
  }, [tickets, search, tab, priority, dateRange]);

  const pageCount = Math.ceil(filtered.length / PAGE_SIZE);
  const paged     = filtered.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE);

  return (
    <AdminLayout>
      <h1 className="text-2xl font-semibold mb-6">Tickets</h1>
      <div className="flex flex-wrap items-center gap-4 mb-6">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search for ticket"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded focus:outline-none"
          />
        </div>

        {/* Priority */}
        <div className="relative">
          <select
            value={priority}
            onChange={e => setPriority(e.target.value)}
            className="appearance-none border px-3 py-2 rounded pr-8 bg-white focus:outline-none"
          >
            <option value="">Select Priority</option>
            {PRIORITY_OPTIONS.slice(1).map(opt => (
              <option key={opt} value={opt}>
                {opt} Priority
              </option>
            ))}
          </select>
          <ChevronDownIcon className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
        </div>

        {/* Date Range */}
        <div className="relative">
          <select
            value={dateRange}
            onChange={e => setDateRange(e.target.value)}
            className="appearance-none border px-3 py-2 rounded pr-8 bg-white focus:outline-none"
          >
            {DATE_OPTIONS.map(opt => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          <ChevronDownIcon className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
        </div>

        {/* New Ticket */}
        <Link
          to="/admin/tickets/new"
          className="ml-auto bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
          New Ticket
        </Link>
      </div>

      {/* Tabs */}
      <nav className="flex gap-8 border-b mb-4">
        {STATUS_TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => { setTab(key); setPage(1); }}
            className={`flex items-center gap-2 pb-2 ${
              tab === key
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <Icon className="w-5 h-5" />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      {/* Ticket list */}
      <div className="space-y-4 mb-6">
        {paged.map(t => (
          <TicketCard key={t.id} ticket={t} />
        ))}
        {filtered.length === 0 && (
          <p className="text-center text-gray-500">No tickets found.</p>
        )}
      </div>

      {/* Pagination */}
      {pageCount > 1 && (
        <div className="flex justify-end items-center space-x-2">
          <button
            disabled={page === 1}
            onClick={() => setPage(p => p-1)}
            className="px-3 py-1 rounded disabled:opacity-50"
          >
            Prev
          </button>
          {[...Array(pageCount)].map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i+1)}
              className={`px-3 py-1 rounded ${
                page === i+1
                  ? 'bg-blue-600 text-white'
                  : 'hover:bg-gray-200'
              }`}
            >
              {i+1}
            </button>
          ))}
          <button
            disabled={page === pageCount}
            onClick={() => setPage(p => p+1)}
            className="px-3 py-1 rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </AdminLayout>
  );
}

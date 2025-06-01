// src/admin/pages/Tickets.jsx

import { useState } from 'react';
import { Header } from "../components/header"
import { Sidebar } from "../components/sidebar"
import { TicketList } from "../components/ticket-list"
import { Filters } from "../components/filters"
import { Input } from "../../components/ui/input"
import { useLocation } from 'react-router-dom';
import React from 'react';

export default function Tickets() {
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const initialStatus = query.get('status') || 'all';
  const initialAssignee = query.get('assignee') || 'all';
  const [status, setStatus] = useState(initialStatus);
  const [priority, setPriority] = useState('all');
  const [assignee, setAssignee] = useState(initialAssignee);
  const [search, setSearch] = useState('');

  // Update filters if URL changes
  React.useEffect(() => {
    setStatus(query.get('status') || 'all');
    setAssignee(query.get('assignee') || 'all');
  }, [location.search]);

  return (
    <div className="flex flex-col md:flex-row h-screen bg-background">
      <Sidebar className="border-r" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-2 sm:p-4 md:p-6">
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Tickets</h1>
              <p className="text-muted-foreground text-sm sm:text-base">Manage and track support tickets</p>
            </div>
            <div className="space-y-4">
              <Input
                placeholder="Search tickets..."
                className="mb-2"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <Filters
                status={status}
                setStatus={setStatus}
                priority={priority}
                setPriority={setPriority}
                assignee={assignee}
                setAssignee={setAssignee}
                onClear={() => {
                  setStatus('all');
                  setPriority('all');
                  setAssignee('all');
                }}
              />
              <TicketList status={status} priority={priority} assignee={assignee} search={search} />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

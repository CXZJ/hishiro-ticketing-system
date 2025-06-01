import { useState } from 'react';
import { Header } from "../components/header"
import { Sidebar } from "../components/sidebar"
import { TicketStats } from "../components/ticket-stats"
import { TicketList } from "../components/ticket-list"
import { Filters } from "../components/filters"

export default function Dashboard() {
  const [status, setStatus] = useState('all');
  const [priority, setPriority] = useState('all');
  const [assignee, setAssignee] = useState('all');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800">
      {/* Sidebar overlay for mobile */}
      <Sidebar className={`border-r fixed z-40 inset-y-0 left-0 bg-white transform transition-transform duration-200 w-64 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:static md:translate-x-0`} onClose={() => setSidebarOpen(false)} />
      {/* Backdrop for mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-30 z-30 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-2 sm:p-4 md:p-6 flex justify-center items-start">
          <div className="w-full max-w-5xl mx-auto bg-white/90 rounded-2xl shadow-2xl p-4 sm:p-8 mt-4 mb-8">
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                <p className="text-muted-foreground">Overview of your support ticket system</p>
              </div>

              <TicketStats status={status} priority={priority} assignee={assignee} />

              <div className="space-y-4">
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
                <TicketList status={status} priority={priority} assignee={assignee} />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

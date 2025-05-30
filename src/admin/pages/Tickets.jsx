// src/admin/pages/Tickets.jsx

import { Header } from "../components/header"
import { Sidebar } from "../components/sidebar"
import { TicketList } from "../components/ticket-list"
import { Filters } from "../components/filters"

export default function Tickets() {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar className="border-r" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Tickets</h1>
              <p className="text-muted-foreground">Manage and track support tickets</p>
            </div>

            <div className="space-y-4">
              <Filters />
              <TicketList />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

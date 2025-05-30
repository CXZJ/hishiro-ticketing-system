import { Header } from "../components/header"
import { Sidebar } from "../components/sidebar"
import { TicketStats } from "../components/ticket-stats"
import { TicketList } from "../components/ticket-list"
import { Filters } from "../components/filters"

export default function Dashboard() {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar className="border-r" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
              <p className="text-muted-foreground">Overview of your support ticket system</p>
            </div>

            <TicketStats />

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

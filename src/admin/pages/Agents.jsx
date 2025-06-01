import { Header } from "../components/header"
import { Sidebar } from "../components/sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar"
import { Badge } from "../../components/ui/badge"
import { Button } from "../../components/ui/button"
import { Mail, Phone, Clock, CheckCircle, Users, MessageSquare } from 'lucide-react'

const admins = [
  {
    id: 1,
    name: "Sarah Wilson",
    email: "sarah@company.com",
    phone: "+1 (555) 123-4567",
    role: "Senior Support",
    status: "Online",
    ticketsResolved: 156,
    responseTime: "2h 15m",
    activeTickets: 3,
    avatar: "/placeholder-user.jpg",
  },
  {
    id: 2,
    name: "Mike Johnson",
    email: "mike@company.com",
    phone: "+1 (555) 234-5678",
    role: "Support Agent",
    status: "Busy",
    ticketsResolved: 89,
    responseTime: "3h 45m",
    activeTickets: 5,
    avatar: "/placeholder-user.jpg",
  },
  {
    id: 3,
    name: "Emily Chen",
    email: "emily@company.com",
    phone: "+1 (555) 345-6789",
    role: "Junior Support",
    status: "Offline",
    ticketsResolved: 45,
    responseTime: "4h 30m",
    activeTickets: 0,
    avatar: "/placeholder-user.jpg",
  },
  {
    id: 4,
    name: "David Kim",
    email: "david@company.com",
    phone: "+1 (555) 456-7890",
    role: "Support Agent",
    status: "Online",
    ticketsResolved: 112,
    responseTime: "2h 30m",
    activeTickets: 2,
    avatar: "/placeholder-user.jpg",
  },
]

function getStatusColor(status) {
  switch (status) {
    case "Online":
      return "bg-green-100 text-green-800"
    case "Busy":
      return "bg-yellow-100 text-yellow-800"
    case "Offline":
      return "bg-gray-100 text-gray-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

export default function Admins() {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar className="border-r" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Admins</h1>
              <p className="text-muted-foreground">Manage your admin team and their performance</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Admins</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{admins.length}</div>
                  <p className="text-xs text-muted-foreground">Active admin team members</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Online Admins</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {admins.filter(admin => admin.status === "Online").length}
                  </div>
                  <p className="text-xs text-muted-foreground">Currently available</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Tickets</CardTitle>
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {admins.reduce((sum, admin) => sum + admin.activeTickets, 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">Currently being handled</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg. Response Time</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">3h 15m</div>
                  <p className="text-xs text-muted-foreground">Team average</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Admin List</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {admins.map((admin) => (
                    <div
                      key={admin.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={admin.avatar} alt={admin.name} />
                          <AvatarFallback>{admin.name.split(" ").map(n => n[0]).join("")}</AvatarFallback>
                        </Avatar>
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-semibold">{admin.name}</h3>
                            <Badge variant="secondary" className={getStatusColor(admin.status)}>
                              {admin.status}
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <div className="flex items-center space-x-1">
                              <Mail className="h-3 w-3" />
                              <span>{admin.email}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Phone className="h-3 w-3" />
                              <span>{admin.phone}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-6">
                        <div className="text-sm text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <CheckCircle className="h-3 w-3" />
                            <span>{admin.ticketsResolved} resolved</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span>{admin.responseTime} avg. response</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="secondary">
                            {admin.activeTickets} active tickets
                          </Badge>
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
} 
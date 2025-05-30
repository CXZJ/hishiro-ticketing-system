import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Eye, MessageSquare, Clock } from 'lucide-react'
import { Link } from 'react-router-dom'

const tickets = [
  {
    id: "TK-001",
    title: "Login issues with mobile app",
    customer: "John Doe",
    email: "john@example.com",
    priority: "High",
    status: "Open",
    assignee: "Sarah Wilson",
    created: "2 hours ago",
    messages: 3,
  },
  {
    id: "TK-002",
    title: "Payment processing error",
    customer: "Jane Smith",
    email: "jane@example.com",
    priority: "Critical",
    status: "In Progress",
    assignee: "Mike Johnson",
    created: "4 hours ago",
    messages: 7,
  },
  {
    id: "TK-003",
    title: "Feature request: Dark mode",
    customer: "Bob Wilson",
    email: "bob@example.com",
    priority: "Low",
    status: "Open",
    assignee: "Unassigned",
    created: "1 day ago",
    messages: 1,
  },
  {
    id: "TK-004",
    title: "Account deletion request",
    customer: "Alice Brown",
    email: "alice@example.com",
    priority: "Medium",
    status: "Pending",
    assignee: "Sarah Wilson",
    created: "2 days ago",
    messages: 2,
  },
  {
    id: "TK-005",
    title: "API documentation unclear",
    customer: "David Lee",
    email: "david@example.com",
    priority: "Medium",
    status: "Resolved",
    assignee: "Mike Johnson",
    created: "3 days ago",
    messages: 5,
  },
]

function getPriorityColor(priority) {
  switch (priority) {
    case "Critical":
      return "bg-red-500 hover:bg-red-600"
    case "High":
      return "bg-orange-500 hover:bg-orange-600"
    case "Medium":
      return "bg-yellow-500 hover:bg-yellow-600"
    case "Low":
      return "bg-green-500 hover:bg-green-600"
    default:
      return "bg-gray-500 hover:bg-gray-600"
  }
}

function getStatusColor(status) {
  switch (status) {
    case "Open":
      return "bg-blue-100 text-blue-800 hover:bg-blue-200"
    case "In Progress":
      return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
    case "Pending":
      return "bg-orange-100 text-orange-800 hover:bg-orange-200"
    case "Resolved":
      return "bg-green-100 text-green-800 hover:bg-green-200"
    default:
      return "bg-gray-100 text-gray-800 hover:bg-gray-200"
  }
}

export function TicketList() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Tickets</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {tickets.map((ticket) => (
            <div
              key={ticket.id}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center space-x-4 flex-1">
                <div className="flex flex-col space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-sm">{ticket.id}</span>
                    <Badge className={getPriorityColor(ticket.priority)}>{ticket.priority}</Badge>
                    <Badge variant="secondary" className={getStatusColor(ticket.status)}>
                      {ticket.status}
                    </Badge>
                  </div>
                  <h3 className="font-semibold">{ticket.title}</h3>
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <span>{ticket.customer}</span>
                    <span>•</span>
                    <span>{ticket.email}</span>
                    <span>•</span>
                    <div className="flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>{ticket.created}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-sm text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <MessageSquare className="h-3 w-3" />
                    <span>{ticket.messages}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src="/placeholder-user.jpg" />
                    <AvatarFallback className="text-xs">
                      {ticket.assignee === "Unassigned"
                        ? "?"
                        : ticket.assignee
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-muted-foreground">{ticket.assignee}</span>
                </div>
                <Link to={`/admin/tickets/${ticket.id}`}>
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
} 
import { Header } from "../components/header"
import { Sidebar } from "../components/sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Users,
  MessageSquare,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'

const ticketStats = {
  total: 1234,
  open: 89,
  resolved: 1123,
  highPriority: 7,
  avgResponseTime: "2h 15m",
  avgResolutionTime: "4h 30m",
  satisfactionRate: 92,
  monthlyTrend: "+12%",
  weeklyTrend: "-5%",
}

const recentActivity = [
  {
    id: 1,
    type: "ticket_resolved",
    title: "Login issues with mobile app",
    agent: "Sarah Wilson",
    time: "2 hours ago",
    status: "success",
  },
  {
    id: 2,
    type: "ticket_created",
    title: "Payment processing error",
    customer: "Jane Smith",
    time: "4 hours ago",
    priority: "high",
  },
  {
    id: 3,
    type: "ticket_assigned",
    title: "Feature request: Dark mode",
    agent: "Mike Johnson",
    time: "1 day ago",
    status: "info",
  },
  {
    id: 4,
    type: "ticket_updated",
    title: "Account deletion request",
    agent: "Emily Chen",
    time: "2 days ago",
    status: "warning",
  },
]

function getActivityIcon(type) {
  switch (type) {
    case "ticket_resolved":
      return <CheckCircle className="h-4 w-4 text-green-500" />
    case "ticket_created":
      return <MessageSquare className="h-4 w-4 text-blue-500" />
    case "ticket_assigned":
      return <Users className="h-4 w-4 text-purple-500" />
    case "ticket_updated":
      return <AlertCircle className="h-4 w-4 text-yellow-500" />
    default:
      return <MessageSquare className="h-4 w-4 text-gray-500" />
  }
}

export default function Analytics() {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar className="border-r" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
              <p className="text-muted-foreground">Track ticket performance and team metrics</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{ticketStats.total}</div>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <TrendingUp className="mr-1 h-3 w-3" />
                    <span>{ticketStats.monthlyTrend} from last month</span>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{ticketStats.open}</div>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <ArrowDownRight className="mr-1 h-3 w-3 text-green-500" />
                    <span>{ticketStats.weeklyTrend} from last week</span>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Resolution Rate</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {Math.round((ticketStats.resolved / ticketStats.total) * 100)}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {ticketStats.resolved} tickets resolved
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Satisfaction Rate</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{ticketStats.satisfactionRate}%</div>
                  <p className="text-xs text-muted-foreground">
                    Based on customer feedback
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Response Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Average Response Time</p>
                        <p className="text-2xl font-bold">{ticketStats.avgResponseTime}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Average Resolution Time</p>
                        <p className="text-2xl font-bold">{ticketStats.avgResolutionTime}</p>
                      </div>
                    </div>
                    <div className="h-[200px] bg-muted rounded-lg flex items-center justify-center">
                      <p className="text-sm text-muted-foreground">Response time chart will be displayed here</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Ticket Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">High Priority</p>
                        <p className="text-2xl font-bold">{ticketStats.highPriority}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Open Tickets</p>
                        <p className="text-2xl font-bold">{ticketStats.open}</p>
                      </div>
                    </div>
                    <div className="h-[200px] bg-muted rounded-lg flex items-center justify-center">
                      <p className="text-sm text-muted-foreground">Ticket distribution chart will be displayed here</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        {getActivityIcon(activity.type)}
                        <div className="space-y-1">
                          <p className="text-sm font-medium">{activity.title}</p>
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            {activity.agent && (
                              <span>Assigned to {activity.agent}</span>
                            )}
                            {activity.customer && (
                              <span>From {activity.customer}</span>
                            )}
                            <span>•</span>
                            <span>{activity.time}</span>
                          </div>
                        </div>
                      </div>
                      {activity.priority && (
                        <Badge variant="secondary" className="bg-red-100 text-red-800">
                          {activity.priority} priority
                        </Badge>
                      )}
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
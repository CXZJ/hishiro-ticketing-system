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
import { useState, useEffect } from "react";
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../firebase';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Chart, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend } from 'chart.js';

Chart.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

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
  const [tickets, setTickets] = useState([]);
  const [user] = useAuthState(auth);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchTickets = async () => {
      const token = await user.getIdToken();
      const res = await fetch('/api/tickets', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setTickets(await res.json());
      }
      setLoading(false);
    };
    fetchTickets();
  }, [user]);

  // Calculate stats
  const total = tickets.length;
  const open = tickets.filter(t => t.status === "new" || t.status === "open").length;
  const resolved = tickets.filter(t => t.status === "resolved").length;
  const highPriority = tickets.filter(t => t.priority?.toLowerCase() === "high").length;
  const mediumPriority = tickets.filter(t => t.priority?.toLowerCase() === "medium").length;
  const lowPriority = tickets.filter(t => t.priority?.toLowerCase() === "low").length;

  // For demo, set these as placeholders
  const avgResponseTime = "-";
  const avgResolutionTime = "-";
  const satisfactionRate = "-";
  const monthlyTrend = "-";
  const weeklyTrend = "-";

  // Chart data
  const statusBarData = {
    labels: ['Open', 'Resolved'],
    datasets: [
      {
        label: 'Tickets',
        data: [open, resolved],
        backgroundColor: [
          'rgba(59, 130, 246, 0.7)', // blue
          'rgba(34, 197, 94, 0.7)', // green
        ],
        borderRadius: 6,
      },
    ],
  };

  const priorityDoughnutData = {
    labels: ['High', 'Medium', 'Low'],
    datasets: [
      {
        label: 'Priority',
        data: [highPriority, mediumPriority, lowPriority],
        backgroundColor: [
          'rgba(239, 68, 68, 0.7)', // red
          'rgba(251, 191, 36, 0.7)', // yellow
          'rgba(34, 197, 94, 0.7)', // green
        ],
        borderWidth: 1,
      },
    ],
  };

  // Recent activity: show last 5 tickets
  const recentActivity = tickets.slice(0, 5).map(t => ({
    id: t._id,
    type: t.status === 'resolved' ? 'ticket_resolved' : 'ticket_created',
    title: t.subject,
    agent: t.assignedTo || null,
    customer: t.userId,
    time: new Date(t.createdAt).toLocaleString(),
    priority: t.priority,
  }));

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
                  <div className="text-2xl font-bold">{total}</div>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <TrendingUp className="mr-1 h-3 w-3" />
                    <span>{monthlyTrend} from last month</span>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{open}</div>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <ArrowDownRight className="mr-1 h-3 w-3 text-green-500" />
                    <span>{weeklyTrend} from last week</span>
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
                    {total > 0 ? Math.round((resolved / total) * 100) : 0}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {resolved} tickets resolved
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Satisfaction Rate</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{satisfactionRate}</div>
                  <p className="text-xs text-muted-foreground">
                    Based on customer feedback
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Ticket Status Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-center items-center" style={{ height: 250 }}>
                    <div style={{ width: 250, height: 250 }}>
                      <Bar data={statusBarData} options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: { y: { beginAtZero: true } }
                      }} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Priority Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-center items-center" style={{ height: 250 }}>
                    <div style={{ width: 250, height: 250 }}>
                      <Doughnut data={priorityDoughnutData} options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { position: 'bottom' } }
                      }} />
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
                  {recentActivity.length === 0 && (
                    <div className="text-center text-muted-foreground">No recent activity</div>
                  )}
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
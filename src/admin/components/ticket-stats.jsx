import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, CheckCircle, AlertCircle, Users } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../firebase';

export function TicketStats({ status, priority, assignee }) {
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    resolved: 0,
    inProgress: 0
  });
  const [user] = useAuthState(auth);

  useEffect(() => {
    if (!user) return;
    const fetchStats = async () => {
      try {
        const token = await user.getIdToken();
        const res = await fetch('/api/tickets', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        const tickets = await res.json();
        const stats = {
          total: tickets.length,
          open: tickets.filter(t => t.status === 'new').length,
          resolved: tickets.filter(t => t.status === 'resolved').length,
          inProgress: tickets.filter(t => t.status === 'in-progress').length
        };
        setStats(stats);
      } catch (err) {
        setStats({ total: 0, open: 0, resolved: 0, inProgress: 0 });
      }
    };
    fetchStats();
  }, [status, priority, user]);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-semibold">Total Tickets</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total}</div>
          <p className="text-xs text-gray-500">All time tickets</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-semibold">Open Tickets</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.open}</div>
          <p className="text-xs text-gray-500">New tickets</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-semibold">In Progress</CardTitle>
          <AlertCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.inProgress}</div>
          <p className="text-xs text-gray-500">Active tickets</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-semibold">Resolved</CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.resolved}</div>
          <p className="text-xs text-gray-500">Completed tickets</p>
        </CardContent>
      </Card>
    </div>
  )
} 
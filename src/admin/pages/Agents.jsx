import { Header } from "../components/header"
import { Sidebar } from "../components/sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar"
import { Badge } from "../../components/ui/badge"
import { Button } from "../../components/ui/button"
import { Mail, Phone, Clock, CheckCircle, Users, MessageSquare } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getAuth } from "firebase/auth";

export default function Admins() {
  const [admins, setAdmins] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchAdmins = async () => {
      try {
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) throw new Error("No authenticated user");
        const token = await user.getIdToken();
        const res = await fetch('/api/users?role=admin', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) throw new Error('Failed to fetch admins');
        const data = await res.json();
        // Only keep users who are admins
        setAdmins(data.filter(admin => admin.role === 'admin' || admin.isAdmin));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAdmins();
  }, []);

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

  return (
    <div className="flex flex-col md:flex-row h-screen bg-background">
      <Sidebar className="border-r" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-2 sm:p-4 md:p-6">
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Admins</h1>
              <p className="text-muted-foreground text-sm sm:text-base">Manage your admin team and their performance</p>
            </div>

            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
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
                    {admins.reduce((sum, admin) => sum + (admin.activeTickets || 0), 0)}
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
                {loading ? (
                  <div className="p-8 text-center text-muted-foreground">Loading...</div>
                ) : error ? (
                  <div className="p-8 text-center text-red-500">{error}</div>
                ) : (
                <div className="space-y-4">
                  {admins.map((admin) => (
                    <div
                      key={admin.id || admin._id || admin.email}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors gap-4"
                    >
                      <div className="flex items-center space-x-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={admin.photoURL ? admin.photoURL : (admin.email ? `https://ui-avatars.com/api/?name=${admin.email}` : "/placeholder-user.jpg")} alt={admin.name || admin.username || admin.email} />
                          <AvatarFallback>{(admin.name || admin.username || admin.email).split(" ").map(n => n[0]).join("")}</AvatarFallback>
                        </Avatar>
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-semibold">{admin.name || admin.username || admin.email}</h3>
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
                            <span>{admin.ticketsResolved || 0} resolved</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span>{admin.responseTime || '-'} avg. response</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="secondary">
                            {(admin.activeTickets || 0) + ' active tickets'}
                          </Badge>
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
} 
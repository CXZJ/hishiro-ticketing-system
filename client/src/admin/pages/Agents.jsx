import AdminLayout from '../AdminLayout'
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar"
import { Badge } from "../../components/ui/badge"
import { Button } from "../../components/ui/button"
import { Mail, Phone, Clock, CheckCircle, Users, MessageSquare, MapPin, User } from 'lucide-react'
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
    <AdminLayout>
      <main className="flex-1 overflow-y-auto p-2 sm:p-4 md:p-6">
        <div className="w-full max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Admin List</h1>
              <p className="text-muted-foreground">Manage your admin team and their performance</p>
            </div>
          </div>

          {/* Admins Grid */}
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : error ? (
            <div className="text-red-600 bg-red-50 p-4 rounded-lg">{error}</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {admins.map((admin) => (
                <div
                  key={admin.id || admin._id || admin.email}
                  className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12 border-2 border-primary/20">
                          <AvatarImage src={admin.photoURL ? admin.photoURL : (admin.email ? `https://ui-avatars.com/api/?name=${admin.email}` : "/placeholder-user.jpg")} alt={admin.name || admin.username || admin.email} />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {(admin.name || admin.username || admin.email)?.[0]?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold text-lg">{admin.name || admin.username || admin.email}</h3>
                          <p className="text-sm text-muted-foreground">{admin.email}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{admin.phone || 'No phone number'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{admin.address || 'No address'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>{admin.gender || 'Not specified'}</span>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t">
                      <div className="flex items-center justify-between">
                        <Badge variant="default">
                          Admin
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          Joined {admin.createdAt ? new Date(admin.createdAt).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </AdminLayout>
  )
} 
import { useEffect, useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter, Mail, Phone, MapPin, User, Shield, MoreVertical, Edit, Trash2, UserPlus } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from 'react-hot-toast';
import AdminLayout from '../AdminLayout';
import { getAuth } from 'firebase/auth';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({ username: '', phone: '', address: '', gender: '', photoURL: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) {
          throw new Error('No authenticated user');
        }
        const token = await user.getIdToken();
        const res = await fetch('/api/users', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        if (!res.ok) throw new Error('Failed to fetch users');
        const data = await res.json();
        setUsers(data);
      } catch (err) {
        setError(err.message);
        toast.error('Failed to fetch users');
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const handleRowClick = (user) => {
    setSelectedUser(user);
    setEditForm({
      username: user.username || '',
      phone: user.phone || '',
      address: user.address || '',
      gender: user.gender || '',
      photoURL: user.photoURL || '',
    });
    setEditMode(false);
    setDrawerOpen(true);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setEditForm((prev) => ({ ...prev, photoURL: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleEditSave = async () => {
    setSaving(true);
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        throw new Error('No authenticated user');
      }
      const token = await user.getIdToken();
      const res = await fetch(`/api/users/${selectedUser._id || selectedUser.uid}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(editForm),
      });
      if (!res.ok) throw new Error('Failed to update user');
      const updated = await res.json();
      setUsers((prev) => prev.map((u) => (u._id === updated._id || u.uid === updated.uid ? updated : u)));
      setSelectedUser(updated);
      setEditMode(false);
      toast.success('User updated successfully');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setSelectedUser(null);
  };

  const filteredUsers = users
    .filter(user => !user.isAdmin)
    .filter(user => {
      const matchesSearch = 
        user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.phone?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesRole = filterRole === 'all' || user.role === filterRole;
      
      return matchesSearch && matchesRole;
    });

  return (
    <AdminLayout>
      <main className="flex-1 overflow-y-auto p-2 sm:p-4 md:p-6">
        <div className="w-full max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Users List</h1>
              <p className="text-muted-foreground">Manage your registered users</p>
            </div>
            <Button className="bg-primary hover:bg-primary/90">
              <UserPlus className="mr-2 h-4 w-4" />
              Add New User
            </Button>
          </div>

          {/* Search and Filter Section */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Users Grid */}
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : error ? (
            <div className="text-red-600 bg-red-50 p-4 rounded-lg">{error}</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {filteredUsers.map(user => (
                <div
                  key={user._id || user.uid || user.email}
                  className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12 border-2 border-primary/20">
                          <AvatarImage src={user.photoURL} alt={user.username || user.email} />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {user.username?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold text-lg">{user.username || user.displayName || 'No Name'}</h3>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleRowClick(user)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit User
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{user.phone || 'No phone number'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{user.address || 'No address'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>{user.gender || 'Not specified'}</span>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t">
                      <div className="flex items-center justify-between">
                        <Badge variant={user.role === 'agent' ? 'default' : 'secondary'}>
                          {user.role || 'User'}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          Joined {new Date(user.createdAt).toLocaleDateString()}
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

      {/* User Details Drawer */}
      {drawerOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/50" onClick={closeDrawer} />
          <div className="w-full max-w-md bg-white shadow-2xl h-full p-6 overflow-y-auto relative animate-slide-in-right">
            <button onClick={closeDrawer} className="absolute top-4 right-4 text-gray-500 hover:text-black text-2xl">&times;</button>
            <div className="flex flex-col items-center mt-8">
              <Avatar className="h-24 w-24 border-4 border-primary/20 mb-4">
                <AvatarImage src={editMode ? editForm.photoURL : selectedUser.photoURL} alt={selectedUser.username || selectedUser.email} />
                <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                  {selectedUser.username?.[0]?.toUpperCase() || selectedUser.email?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {editMode ? (
                <>
                  <input type="file" accept="image/*" onChange={handlePhotoChange} className="mb-4" />
                  <input
                    name="username"
                    value={editForm.username}
                    onChange={handleEditChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-2"
                    placeholder="Username"
                  />
                  <input
                    name="email"
                    value={selectedUser.email}
                    disabled
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 mb-2 bg-gray-100"
                    placeholder="Email"
                  />
                  <input
                    name="phone"
                    value={editForm.phone}
                    onChange={handleEditChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-2"
                    placeholder="Phone"
                  />
                  <input
                    name="address"
                    value={editForm.address}
                    onChange={handleEditChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-2"
                    placeholder="Address"
                  />
                  <input
                    name="gender"
                    value={editForm.gender}
                    onChange={handleEditChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-2"
                    placeholder="Gender"
                  />
                  <div className="flex gap-2 mt-4 w-full">
                    <Button onClick={handleEditSave} className="flex-1" disabled={saving}>
                      {saving ? 'Saving...' : 'Save'}
                    </Button>
                    <Button variant="outline" className="flex-1" onClick={() => setEditMode(false)} disabled={saving}>
                      Cancel
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <h2 className="text-2xl font-bold mb-2">{selectedUser.username || selectedUser.displayName || 'No Name'}</h2>
                  <p className="text-gray-600 mb-6">{selectedUser.email}</p>
                  <div className="w-full space-y-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-semibold mb-3">Contact Information</h3>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span>{selectedUser.phone || 'No phone number'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span>{selectedUser.address || 'No address'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-semibold mb-3">Account Information</h3>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span>Gender: {selectedUser.gender || 'Not specified'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-muted-foreground" />
                          <span>Role: {selectedUser.role || 'User'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span>Joined: {new Date(selectedUser.createdAt).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-6">
                      <Button variant="outline" className="flex-1" onClick={() => setEditMode(true)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Profile
                      </Button>
                      <Button variant="destructive" className="flex-1">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete User
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
} 
import { useEffect, useState } from 'react';
import { Sidebar } from '../components/sidebar';
import { Header } from '../components/header';
import { getAuth } from 'firebase/auth';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

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
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const handleRowClick = (user) => {
    setSelectedUser(user);
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setSelectedUser(null);
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800">
      <Sidebar className="border-r" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-2 sm:p-4 md:p-6 flex justify-center items-start">
          <div className="w-full max-w-4xl mx-auto bg-white/90 rounded-2xl shadow-2xl p-4 sm:p-8 mt-4 mb-8">
            <h1 className="text-2xl font-bold mb-6">Registered Users</h1>
            {loading ? (
              <div>Loading users...</div>
            ) : error ? (
              <div className="text-red-600">{error}</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Gender</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Address</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Photo</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Registered</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users
                      .filter(user => !user.isAdmin)
                      .map(user => (
                        <tr key={user._id || user.uid || user.email} className="cursor-pointer hover:bg-gray-100" onClick={() => handleRowClick(user)}>
                          <td className="px-4 py-2 whitespace-nowrap">{user.username || user.displayName || '-'}</td>
                          <td className="px-4 py-2 whitespace-nowrap">{user.email}</td>
                          <td className="px-4 py-2 whitespace-nowrap">{user.gender || '-'}</td>
                          <td className="px-4 py-2 whitespace-nowrap">{user.phone || '-'}</td>
                          <td className="px-4 py-2 whitespace-nowrap">{user.address || '-'}</td>
                          <td className="px-4 py-2 whitespace-nowrap">
                            {user.photoURL ? (
                              <img src={user.photoURL} alt="Profile" className="w-8 h-8 rounded-full object-cover" />
                            ) : '-'}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap">{user.role || (user.isAdmin ? 'Admin' : 'User')}</td>
                          <td className="px-4 py-2 whitespace-nowrap">{user.createdAt ? new Date(user.createdAt).toLocaleString() : '-'}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          {/* Drawer/Sidebar for user details */}
          {drawerOpen && selectedUser && (
            <div className="fixed inset-0 z-50 flex">
              <div className="flex-1" onClick={closeDrawer} />
              <div className="w-full max-w-sm bg-white shadow-2xl h-full p-6 overflow-y-auto relative animate-slide-in-right">
                <button onClick={closeDrawer} className="absolute top-4 right-4 text-gray-500 hover:text-black text-2xl">&times;</button>
                <div className="flex flex-col items-center mt-8">
                  {selectedUser.photoURL ? (
                    <img src={selectedUser.photoURL} alt="Profile" className="w-24 h-24 rounded-full object-cover mb-4" />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center mb-4 text-3xl">-</div>
                  )}
                  <h2 className="text-xl font-bold mb-2">{selectedUser.username || selectedUser.displayName || '-'}</h2>
                  <p className="text-gray-600 mb-2">{selectedUser.email}</p>
                  <div className="w-full mt-4">
                    <div className="mb-2"><span className="font-semibold">Gender:</span> {selectedUser.gender || '-'}</div>
                    <div className="mb-2"><span className="font-semibold">Phone:</span> {selectedUser.phone || '-'}</div>
                    <div className="mb-2"><span className="font-semibold">Address:</span> {selectedUser.address || '-'}</div>
                    <div className="mb-2"><span className="font-semibold">Role:</span> {selectedUser.role || (selectedUser.isAdmin ? 'Admin' : 'User')}</div>
                    <div className="mb-2"><span className="font-semibold">Registered:</span> {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleString() : '-'}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
} 
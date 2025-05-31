import React, { useState, useEffect } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { useNavigate, Link } from "react-router-dom";
import { auth, logout } from "../firebase";
import {
  TicketIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
  CheckCircleIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  BellIcon,
  MoonIcon,
  Bars3Icon,
  XMarkIcon,
  HomeIcon,
} from "@heroicons/react/24/outline";
import logo from "../assets/logo.png";
import NotificationBell from '../components/NotificationBell';

export default function Dashboard() {
  const [user, loading] = useAuthState(auth);
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [userInfo, setUserInfo] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({ username: '', gender: '', phone: '', address: '', photoURL: '' });
  const [saving, setSaving] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);

  useEffect(() => {
    if (loading) return;
    
    if (!user) {
      navigate("/login");
      return;
    }

    // Get the Firebase ID token
    const getToken = async () => {
      try {
        const token = await user.getIdToken();
        const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";
        
        // Fetch user's tickets
        const ticketsRes = await fetch(`${API_URL}/api/tickets/user`.replace(/([^:]\/)\/+/g, "$1"), {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!ticketsRes.ok) {
          if (ticketsRes.status === 401) {
            navigate("/login");
            return;
          }
          throw new Error('Failed to fetch tickets');
        }
        
        const ticketsData = await ticketsRes.json();
        setTickets(Array.isArray(ticketsData) ? ticketsData : []);

        // Fetch user info
        const userRes = await fetch(`${API_URL}/api/users/me`.replace(/([^:]\/)\/+/g, "$1"), {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!userRes.ok) {
          if (userRes.status === 401) {
            navigate("/login");
            return;
          }
          throw new Error('Failed to fetch user info');
        }

        const userData = await userRes.json();
        setUserInfo(userData);
        setEditForm({
          username: userData.username || '',
          gender: userData.gender || '',
          phone: userData.phone || '',
          address: userData.address || '',
          photoURL: userData.photoURL || ''
        });
      } catch (error) {
        console.error('Error fetching data:', error);
        setTickets([]);
        setUserInfo(null);
      }
    };

    getToken();

    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [user, loading, navigate, darkMode]);

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handleEditChange = e => {
    const { name, value } = e.target;
    setEditForm(f => ({ ...f, [name]: value }));
  };

  // Handle profile picture upload
  const handlePhotoChange = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setEditForm(f => ({ ...f, photoURL: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleEditSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.accessToken}`
        },
        body: JSON.stringify(editForm)
      });
      if (!res.ok) throw new Error('Failed to update profile');
      const updated = await res.json();
      setUserInfo(updated);
      setEditMode(false);
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Initialize stats with empty array if tickets is not an array
  const stats = {
    total: Array.isArray(tickets) ? tickets.length : 0,
    open: Array.isArray(tickets) ? tickets.filter((t) => t.status === "new" || t.status === "in-progress").length : 0,
    resolved: Array.isArray(tickets) ? tickets.filter((t) => t.status === "resolved").length : 0,
  };

  const menuItems = [
    { id: "home", label: "Home", icon: HomeIcon, action: () => { navigate('/'); setShowSidebar(false); } },
    { id: "overview", label: "Overview", icon: UserCircleIcon },
    { id: "tickets", label: "My Tickets", icon: TicketIcon },
    { id: "chat", label: "Support Chat", icon: ChatBubbleLeftRightIcon },
    { id: "notifications", label: "Notifications", icon: BellIcon },
    { id: "settings", label: "Settings", icon: Cog6ToothIcon },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Tickets</p>
                    <p className="text-2xl font-semibold">{stats.total}</p>
                  </div>
                  <TicketIcon className="h-8 w-8 text-blue-500" />
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Open Tickets</p>
                    <p className="text-2xl font-semibold">{stats.open}</p>
                  </div>
                  <ClockIcon className="h-8 w-8 text-yellow-500" />
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Resolved</p>
                    <p className="text-2xl font-semibold">{stats.resolved}</p>
                  </div>
                  <CheckCircleIcon className="h-8 w-8 text-green-500" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
              {tickets.length > 0 ? (
                <div className="space-y-4">
                  {tickets.slice(0, 5).map((ticket) => (
                    <div
                      key={ticket._id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <div>
                        <p className="font-medium">Ticket #{ticket._id.substring(0, 8)}</p>
                        <p className="text-sm text-gray-500">{ticket.subject}</p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-sm ${
                          ticket.status === "resolved"
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {ticket.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No recent activity</p>
              )}
            </div>
          </div>
        );

      case "tickets":
        return (
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold">My Tickets</h3>
              <button
                onClick={() => navigate("/chat")}
                className="bg-black text-white px-4 py-2 rounded-lg font-semibold shadow hover:bg-white hover:text-black hover:border hover:border-black transition-all duration-150"
              >
                New Ticket
              </button>
            </div>
            {tickets.length > 0 ? (
              <div className="space-y-4">
                {tickets.map((ticket) => (
                  <div
                    key={ticket._id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div>
                      <p className="font-medium">Ticket #{ticket._id.substring(0, 8)}</p>
                      <p className="text-sm text-gray-500">{ticket.subject}</p>
                      <p className="text-xs text-gray-400">
                        Created: {new Date(ticket.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span
                        className={`px-3 py-1 rounded-full text-sm ${
                          ticket.status === "resolved"
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {ticket.status}
                      </span>
                      <button
                        onClick={() => navigate(`/chat/${ticket._id}`)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        View
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No tickets found</p>
            )}
          </div>
        );

      case "chat":
        return (
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Support Chat</h3>
            <div className="text-center py-8">
              <ChatBubbleLeftRightIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">Need help? Start a conversation with our support team.</p>
              <button
                onClick={() => navigate("/chat")}
                className="bg-black text-white px-6 py-2 rounded-lg font-semibold shadow hover:bg-white hover:text-black hover:border hover:border-black transition-all duration-150"
              >
                Start Chat
              </button>
            </div>
          </div>
        );

      case "notifications":
        return (
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Notifications</h3>
            <div className="text-center py-8">
              <BellIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">You have no notifications at the moment.</p>
            </div>
          </div>
        );

      case "settings":
        return (
          <div className="p-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">Account Settings</h3>
              {!editMode && (
                <button
                  onClick={() => setEditMode(true)}
                  className="text-black font-medium underline underline-offset-4 hover:opacity-70 transition-all duration-150"
                >
                  Edit
                </button>
              )}
            </div>
            <div className="space-y-8">
              <div className="flex flex-col items-center justify-center space-y-2 mb-4">
                {editMode ? (
                  <label htmlFor="profile-pic-upload" className="cursor-pointer group flex flex-col items-center">
                    <img
                      src={editForm.photoURL || userInfo?.photoURL || user.photoURL || `https://ui-avatars.com/api/?name=${user.email}`}
                      alt="Profile"
                      className="w-20 h-20 rounded-full border-2 border-gray-200 shadow mb-2 object-cover"
                    />
                    <span className="text-xs text-gray-500 group-hover:underline">Change Photo</span>
                    <input
                      id="profile-pic-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePhotoChange}
                    />
                  </label>
                ) : (
                  <img
                    src={userInfo?.photoURL || user.photoURL || `https://ui-avatars.com/api/?name=${user.email}`}
                    alt="Profile"
                    className="w-20 h-20 rounded-full border-2 border-gray-200 shadow mb-2 object-cover"
                  />
                )}
                <p className="font-semibold text-lg text-gray-900 text-center">{user.displayName || userInfo?.username || "No Name"}</p>
                <span className="block w-full flex justify-center">
                  <span className="inline-block max-w-full overflow-x-auto whitespace-nowrap text-xs sm:text-sm text-center" style={{ display: 'block' }}>
                    {userInfo?.email || user.email}
                  </span>
                </span>
              </div>
              {editMode ? (
                <form className="grid grid-cols-1 md:grid-cols-2 gap-6" onSubmit={e => { e.preventDefault(); handleEditSave(); }}>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Username</label>
                    <input name="username" value={editForm.username} onChange={handleEditChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-black focus:ring-2 focus:ring-black/10 transition-all duration-150 shadow-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Email</label>
                    <input value={userInfo?.email || user.email} disabled className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-gray-100" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Gender</label>
                    <select name="gender" value={editForm.gender} onChange={handleEditChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-black focus:ring-2 focus:ring-black/10 transition-all duration-150 shadow-sm">
                      <option value="">-</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Phone</label>
                    <input name="phone" value={editForm.phone} onChange={handleEditChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-black focus:ring-2 focus:ring-black/10 transition-all duration-150 shadow-sm" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs text-gray-400 mb-1 block">Address</label>
                    <input name="address" value={editForm.address} onChange={handleEditChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-black focus:ring-2 focus:ring-black/10 transition-all duration-150 shadow-sm" />
                  </div>
                  <div className="md:col-span-2 flex gap-3 mt-2">
                    <button type="submit" disabled={saving} className="bg-black text-white px-6 py-2 rounded-lg font-semibold shadow hover:scale-105 hover:shadow-lg transition-all duration-150 disabled:opacity-50">{saving ? 'Saving...' : 'Save'}</button>
                    <button type="button" onClick={() => { setEditMode(false); setEditForm({ username: userInfo?.username || '', gender: userInfo?.gender || '', phone: userInfo?.phone || '', address: userInfo?.address || '', photoURL: userInfo?.photoURL || '' }); }} className="bg-white text-black border border-black px-6 py-2 rounded-lg font-semibold shadow hover:bg-black hover:text-white hover:scale-105 hover:shadow-lg transition-all duration-150">Cancel</button>
                  </div>
                </form>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Username</p>
                    <p className="font-medium">{userInfo?.username || user.displayName || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Email</p>
                    <p className="font-medium text-xs sm:text-sm block mt-1 text-left">
                      {userInfo?.email || user.email}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Gender</p>
                    <p className="font-medium">{userInfo?.gender || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Phone</p>
                    <p className="font-medium">{userInfo?.phone || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Address</p>
                    <p className="font-medium">{userInfo?.address || "-"}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Debug: log activeTab to ensure it's always a string
  console.log('Sidebar activeTab:', activeTab);

  return (
    <div className="min-h-screen w-full bg-gray-50 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white/70 backdrop-blur-md shadow-xl py-4 px-2 sm:py-6 sm:px-0 rounded-b-2xl border-b border-gray-200 flex items-center relative">
        <div className="max-w-7xl mx-auto flex items-center justify-between w-full relative">
          {/* Left: Hamburger */}
          <div className="flex items-center">
            <button
              className="block xl:hidden p-2 rounded hover:bg-gray-200 focus:outline-none mr-2"
              onClick={() => setShowSidebar(true)}
              aria-label="Open sidebar"
              style={{ position: 'relative' }}
            >
              <Bars3Icon className="h-7 w-7 text-gray-700" />
            </button>
          </div>
          {/* Center: Logo (absolutely centered) */}
          <div className="hidden xl:block absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <Link to="/" className="transition-transform duration-200 hover:scale-105">
              <img src={logo} alt="Logo" className="h-12 sm:h-14 drop-shadow-xl cursor-pointer" />
            </Link>
          </div>
          {/* Right: Notification and Welcome */}
          <div className="flex items-center space-x-4">
            <NotificationBell />
            <div className="flex items-center space-x-3">
              <img
                src={userInfo?.photoURL || user.photoURL || `https://ui-avatars.com/api/?name=${user.email}`}
                alt="Profile"
                className="w-10 h-10 rounded-full border-2 border-gray-200 shadow object-cover"
              />
              <p className="font-medium">{user?.displayName || user?.email?.split('@')[0]}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto w-full px-2 sm:px-4 md:px-6 lg:px-8 mb-4 sm:mb-8">
        <div className="flex flex-col sm:flex-row items-center gap-4 py-4 sm:py-6">
          <div className="text-center sm:text-left w-full">
            <div className="mb-2 text-lg font-medium text-gray-700">
              Welcome, <span className="font-bold">{user?.displayName || user?.email?.split('@')[0] || 'User'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 mb-1 flex items-center gap-2 justify-center sm:justify-start">
              Your Dashboard
            </h1>
            <p className="text-gray-500 text-base sm:text-lg font-medium">Manage your tickets, profile, and support.</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8 flex flex-col xl:flex-row gap-4 xl:gap-8">
        {/* Sidebar for desktop and overlay for mobile */}
        <div>
          {/* Overlay for mobile sidebar */}
          {showSidebar && (
            <div
              className="fixed inset-0 bg-black bg-opacity-30 z-40 xl:hidden"
              onClick={() => setShowSidebar(false)}
            />
          )}
          <aside
            className={`fixed xl:static top-0 left-0 z-50 xl:z-auto h-full xl:h-auto w-64 xl:w-full transition-transform duration-300 bg-white shadow-lg xl:shadow-xl rounded-none xl:rounded-2xl xl:rounded-3xl p-2 xl:p-4 ${showSidebar ? 'translate-x-0' : '-translate-x-full'} xl:translate-x-0`}
            style={{ maxWidth: '100vw' }}
          >
            {/* Logo at the top of sidebar on mobile */}
            {showSidebar && (
              <div className="flex items-center justify-between py-4 xl:hidden">
                <img src={logo} alt="Logo" className="h-12 drop-shadow-xl" />
                <button
                  className="p-2 rounded hover:bg-gray-200 focus:outline-none ml-2"
                  onClick={() => setShowSidebar(false)}
                  aria-label="Close sidebar"
                >
                  <XMarkIcon className="h-7 w-7 text-gray-700" />
                </button>
              </div>
            )}
            <nav className="flex flex-col w-full relative z-10 bg-transparent rounded-2xl xl:rounded-3xl shadow-none border-none xl:border border-gray-200">
              <div className="flex flex-col w-full space-y-2">
                {menuItems.map((item, idx) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (item.id === 'home' && item.action) {
                        item.action();
                      } else {
                        setActiveTab(item.id); setShowSidebar(false);
                      }
                    }}
                    className={`flex items-center gap-4 px-4 py-3 rounded-xl border font-semibold text-base transition-all duration-200 shadow w-full
                      ${typeof activeTab === 'string' && activeTab === item.id
                        ? 'bg-black text-white border-black'
                        : 'bg-white text-black border-black/10 hover:bg-black hover:text-white'}
                    `}
                  >
                    <item.icon className="h-6 w-6" />
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
              <div className="mt-2 xl:mt-6">
                <button
                  onClick={() => {
                    logout();
                    navigate("/login");
                  }}
                  className="w-full flex items-center justify-center xl:justify-start gap-2 xl:gap-3 text-red-500 hover:text-white border border-red-500 hover:bg-red-500/80 hover:scale-105 transition-all duration-200 px-2 xl:px-6 py-2 xl:py-3 rounded-xl font-semibold text-base xl:text-lg shadow relative z-10 bg-white"
                >
                  <ArrowRightOnRectangleIcon className="h-5 w-5 xl:h-6 xl:w-6" />
                  <span>Sign Out</span>
                </button>
              </div>
            </nav>
          </aside>
        </div>

        {/* Content Area with widgets and accent headers */}
        <section className="flex-1 flex flex-col">
          <div className="w-full rounded-2xl xl:rounded-3xl bg-white/70 backdrop-blur-md shadow-2xl p-4 sm:p-6 xl:p-8 min-h-[400px] xl:min-h-[500px] border border-gray-200">
            {renderContent()}
          </div>
        </section>
      </main>
    </div>
  );
} 

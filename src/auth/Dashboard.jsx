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
} from "@heroicons/react/24/outline";
import logo from "../assets/logo.png";

export default function Dashboard() {
  const [user] = useAuthState(auth);
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [userInfo, setUserInfo] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({ username: '', gender: '', phone: '', address: '' });
  const [saving, setSaving] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    // Fetch user's tickets
    fetch("/api/tickets/user")
      .then((res) => res.json())
      .then((data) => setTickets(data))
      .catch(console.error);

    // Fetch user info from backend
    fetch(`/api/users/me`, {
      headers: { Authorization: `Bearer ${user.accessToken}` }
    })
      .then(res => res.json())
      .then(data => {
        setUserInfo(data);
        setEditForm({
          username: data.username || '',
          gender: data.gender || '',
          phone: data.phone || '',
          address: data.address || ''
        });
      })
      .catch(() => setUserInfo(null));

    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [user, navigate, darkMode]);

  const handleEditChange = e => {
    const { name, value } = e.target;
    setEditForm(f => ({ ...f, [name]: value }));
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

  const stats = {
    total: tickets.length,
    open: tickets.filter((t) => t.status === "new" || t.status === "in-progress").length,
    resolved: tickets.filter((t) => t.status === "resolved").length,
  };

  const menuItems = [
    { id: "overview", label: "Overview", icon: UserCircleIcon },
    { id: "tickets", label: "My Tickets", icon: TicketIcon },
    { id: "chat", label: "Support Chat", icon: ChatBubbleLeftRightIcon },
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
              <div className="flex items-center space-x-4">
                <img
                  src={user.photoURL || `https://ui-avatars.com/api/?name=${user.email}`}
                  alt="Profile"
                  className="w-16 h-16 rounded-full border-2 border-gray-200 shadow"
                />
                <div>
                  <p className="font-semibold text-lg text-gray-900">{user.displayName || userInfo?.username || "No Name"}</p>
                  <p className="text-sm text-gray-500">{user.email}</p>
                </div>
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
                    <button type="button" onClick={() => { setEditMode(false); setEditForm({ username: userInfo?.username || '', gender: userInfo?.gender || '', phone: userInfo?.phone || '', address: userInfo?.address || '' }); }} className="bg-white text-black border border-black px-6 py-2 rounded-lg font-semibold shadow hover:bg-black hover:text-white hover:scale-105 hover:shadow-lg transition-all duration-150">Cancel</button>
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
                    <p className="font-medium">{userInfo?.email || user.email}</p>
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

  return (
    <div className="min-h-screen w-full bg-gray-50 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white/70 backdrop-blur-md shadow-xl py-4 px-2 sm:py-6 sm:px-0 rounded-b-2xl border-b border-gray-200 flex items-center">
        <div className="max-w-7xl mx-auto flex justify-between items-center w-full">
          <Link to="/" className="transition-transform duration-200 hover:scale-105">
            <img src={logo} alt="Logo" className="h-12 sm:h-14 drop-shadow-xl cursor-pointer" />
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Notification Bell Button */}
            <button
              onClick={() => setShowNotifications((v) => !v)}
              className="relative p-2 rounded-full hover:bg-gray-200 transition-colors"
              aria-label="Notifications"
            >
              <BellIcon className="h-6 w-6 text-gray-700" />
            </button>
            <span className="text-base sm:text-lg text-gray-700 font-medium tracking-wide flex items-center gap-2">
              Welcome, 
              <span className="font-bold text-black px-2 sm:px-3 py-1 rounded-lg">
                {user?.displayName || user?.email?.split('@')[0]}
              </span>
            </span>
          </div>
        </div>
        {/* Notification Dropdown/Panel */}
        {showNotifications && (
          <div className="absolute right-4 top-20 bg-white rounded-xl shadow-xl border border-gray-200 w-80 z-50">
            <div className="p-4">
              <h3 className="text-lg font-semibold mb-2">Notifications</h3>
              <div className="text-gray-500 text-center py-4">No notifications yet.</div>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section (minimal, but with accent) */}
      <div className="max-w-7xl mx-auto w-full px-2 sm:px-4 md:px-6 lg:px-8 mb-4 sm:mb-8">
        <div className="flex flex-col sm:flex-row items-center gap-4 py-4 sm:py-6">
          <div className="bg-gray-200 rounded-full p-1 shadow">
            <div className="bg-white rounded-full p-1">
              <img
                src={user.photoURL || `https://ui-avatars.com/api/?name=${user.email}`}
                alt="Profile"
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-full ring-4 ring-gray-300 shadow-lg object-cover"
              />
            </div>
          </div>
          <div className="text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 mb-1 flex items-center gap-2 justify-center sm:justify-start">
              Your Dashboard
            </h1>
            <p className="text-gray-500 text-base sm:text-lg font-medium">Manage your tickets, profile, and support.</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8 flex flex-col md:flex-row gap-4 md:gap-8">
        {/* Sidebar with glassmorphism and monochrome highlight */}
        <aside className="w-full md:w-72 flex-shrink-0 pt-2 md:pt-4 relative mb-4 md:mb-0">
          <nav className="flex flex-col w-full relative z-10 bg-white/60 backdrop-blur-md rounded-2xl md:rounded-3xl p-2 md:p-4 shadow-xl border border-gray-200">
            <div className="flex flex-row md:flex-col w-full space-y-0 md:space-y-2 space-x-2 md:space-x-0">
              {menuItems.map((item, idx) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`group flex-1 md:w-full flex items-center gap-2 md:gap-4 px-2 md:px-6 py-2 md:py-3 rounded-xl border font-semibold text-base md:text-lg transition-all duration-200 shadow relative overflow-hidden
                    ${activeTab === item.id
                      ? 'bg-black text-white scale-105 border-black shadow-lg'
                      : 'bg-white/80 text-black border-black/10 hover:bg-black hover:text-white hover:scale-105'}
                  `}
                  style={{ zIndex: 1 }}
                >
                  {/* Monochrome highlight bar */}
                  {activeTab === item.id && (
                    <span className="hidden md:block absolute left-0 top-0 h-full w-1 bg-black rounded-r-xl transition-all duration-300" />
                  )}
                  <span className={`relative z-10 flex items-center`}>
                    <item.icon className={`h-5 w-5 md:h-6 md:w-6 transition-transform duration-200 ${activeTab === item.id ? 'text-white scale-110' : 'text-black group-hover:text-white group-hover:scale-110'}`} />
                  </span>
                  <span className="relative z-10 hidden md:inline">{item.label}</span>
                  <span className="relative z-10 md:hidden text-xs font-medium">{item.label}</span>
                </button>
              ))}
            </div>
            <button
              onClick={() => {
                logout();
                navigate("/login");
              }}
              className="w-full flex items-center justify-center gap-2 md:gap-3 text-red-500 hover:text-white border border-red-500 hover:bg-red-500/80 hover:scale-105 transition-all duration-200 px-2 md:px-6 py-2 md:py-3 rounded-xl mt-4 md:mt-6 font-semibold text-base md:text-lg shadow relative z-10"
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5 md:h-6 md:w-6" />
              <span className="hidden md:inline">Sign Out</span>
              <span className="md:hidden text-xs font-medium">Sign Out</span>
            </button>
          </nav>
        </aside>

        {/* Content Area with widgets and accent headers */}
        <section className="flex-1 flex flex-col">
          <div className="w-full rounded-2xl md:rounded-3xl bg-white/70 backdrop-blur-md shadow-2xl p-4 sm:p-6 md:p-8 min-h-[400px] md:min-h-[500px] border border-gray-200">
            {renderContent()}
          </div>
        </section>
      </main>
    </div>
  );
} 
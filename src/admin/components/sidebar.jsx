import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { LayoutDashboard, Ticket, Users, Settings, BarChart3, MessageSquare, Archive, X, LogOut, Bell } from 'lucide-react'
import logo from '../../assets/logo.png';

export function Sidebar({ className = '', open = false, onClose }) {
  const navigate = useNavigate();
  const location = useLocation();
  // Menu items
  const mainMenu = [
    { to: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/admin/tickets', icon: Ticket, label: 'All Tickets' },
    { to: '/admin/tickets?status=open', icon: MessageSquare, label: 'Open Tickets' },
    { to: '/admin/tickets?status=resolved', icon: Archive, label: 'Resolved' },
    { to: '/admin/users', icon: Users, label: 'Users' },
    { to: '/admin/notifications', icon: Bell, label: 'Notifications' },
  ];
  const managementMenu = [
    { to: '/admin/agents', icon: Users, label: 'Admins' },
    { to: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
    { to: '/admin/settings', icon: Settings, label: 'Settings' },
  ];

  const isActive = (to) => {
    // For exact match or query param match
    if (to === '/admin') return location.pathname === '/admin';
    return location.pathname + location.search === to;
  };

  // Sidebar content
  const sidebarContent = (
    <aside
      className={cn(
        `fixed xl:static top-0 left-0 z-50 xl:z-auto h-full xl:h-auto w-64 xl:w-64 transition-transform duration-300 bg-white border border-gray-200 shadow-2xl rounded-none xl:rounded-2xl flex flex-col justify-between p-2 xl:p-4 ${open ? 'translate-x-0' : '-translate-x-full'} xl:translate-x-0`,
        className
      )}
      style={{ maxWidth: '100vw' }}
    >
      {/* Mobile: Logo and Close button */}
      {open && (
        <div className="flex items-center justify-between py-4 xl:hidden px-4">
          <img src={logo} alt="Logo" className="h-12 drop-shadow-xl" />
          <button
            className="p-2 rounded hover:bg-gray-200 focus:outline-none ml-2"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <X className="h-7 w-7 text-gray-700" />
          </button>
        </div>
      )}
      <div className="flex flex-col flex-1">
        <nav className="flex flex-col w-full relative z-10 bg-transparent rounded-2xl xl:rounded-2xl shadow-none border-none xl:border xl:border-gray-200">
          <div className="flex flex-col w-full space-y-2 mt-2 xl:mt-4">
            {[...mainMenu, ...managementMenu].map((item) => (
              <Link to={item.to} key={item.to} className="mx-0">
                <div className={`flex items-center gap-4 px-4 py-3 rounded-xl border font-semibold text-base transition-all duration-200 shadow w-full
                  ${isActive(item.to)
                    ? 'bg-black text-white border-black'
                    : 'bg-white text-black border-black/10 hover:bg-black hover:text-white'}
                `}>
                  <item.icon className="h-6 w-6" />
                  <span>{item.label}</span>
                </div>
              </Link>
            ))}
          </div>
        </nav>
        {/* Logout button pinned to bottom */}
        <div className="mt-4 mb-2 xl:mb-0 px-4 mt-auto">
          <button
            onClick={() => { navigate('/admin/login'); }}
            className="w-full flex items-center justify-center gap-2 text-red-500 hover:text-white border border-red-500 hover:bg-red-500/80 hover:scale-105 transition-all duration-200 px-4 py-3 rounded-xl font-semibold text-base shadow bg-white"
          >
            <LogOut className="h-5 w-5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </aside>
  );

  return <>{sidebarContent}</>;
} 
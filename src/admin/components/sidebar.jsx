import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Link, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Ticket, Users, Settings, BarChart3, MessageSquare, Archive, X, LogOut } from 'lucide-react'
import logo from '../../assets/logo.png';

export function Sidebar({ className = '', open = false, onClose }) {
  const navigate = useNavigate();
  // Menu items
  const mainMenu = [
    { to: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/admin/tickets', icon: Ticket, label: 'All Tickets' },
    { to: '/admin/tickets?status=open', icon: MessageSquare, label: 'Open Tickets' },
    { to: '/admin/tickets?status=resolved', icon: Archive, label: 'Resolved' },
    { to: '/admin/users', icon: Users, label: 'Users' },
  ];
  const managementMenu = [
    { to: '/admin/agents', icon: Users, label: 'Admins' },
    { to: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
    { to: '/admin/settings', icon: Settings, label: 'Settings' },
  ];

  // Sidebar content
  const sidebarContent = (
    <div
      className={cn(
        `fixed z-50 top-0 left-0 h-full w-56 bg-white shadow-lg transition-transform duration-300
        ${open ? 'translate-x-0' : '-translate-x-full'} xl:static xl:z-auto xl:h-auto xl:w-64 xl:border-r xl:bg-white flex flex-col xl:translate-x-0`,
        className
      )}
      style={{ maxWidth: '100vw' }}
    >
      {/* Mobile: Close button and logo */}
      <div className="flex items-center justify-between py-4 xl:hidden px-4">
        <img src={logo} alt="Logo" className="h-10 drop-shadow-xl" />
        <button
          className="p-2 rounded hover:bg-gray-200 focus:outline-none ml-2"
          onClick={onClose}
          aria-label="Close sidebar"
        >
          <X className="h-7 w-7 text-gray-700" />
        </button>
      </div>
      {/* Desktop: Logo */}
      <div className="hidden xl:flex flex-col items-center py-4">
        <img src={logo} alt="Logo" className="h-12 drop-shadow-xl mb-2" />
      </div>
      <nav className="flex-1 flex flex-col gap-8 mt-2 px-2 xl:px-4">
        <div>
          <h2 className="mb-3 px-2 text-xs font-semibold tracking-widest text-gray-400 uppercase">Support Admin</h2>
          <div className="flex flex-col gap-1">
            {mainMenu.map((item) => (
              <Link to={item.to} key={item.to} className="mx-0">
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-base transition-all duration-200 hover:bg-black hover:text-white cursor-pointer">
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
        <div>
          <h2 className="mb-3 px-2 text-xs font-semibold tracking-widest text-gray-400 uppercase">Management</h2>
          <div className="flex flex-col gap-1">
            {managementMenu.map((item) => (
              <Link to={item.to} key={item.to} className="mx-0">
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-base transition-all duration-200 hover:bg-black hover:text-white cursor-pointer">
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </nav>
      {/* Logout button at the bottom */}
      <div className="mt-auto mb-2 xl:mb-0 px-4">
        <button
          onClick={() => { navigate('/admin/login'); }}
          className="w-full flex items-center justify-center gap-2 text-red-500 hover:text-white border border-red-500 hover:bg-red-500/80 hover:scale-105 transition-all duration-200 px-4 py-3 rounded-xl font-semibold text-base shadow bg-white"
        >
          <LogOut className="h-5 w-5" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return <>{sidebarContent}</>;
} 
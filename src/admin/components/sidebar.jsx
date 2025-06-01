import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, Ticket, Users, Settings, BarChart3, MessageSquare, Archive } from 'lucide-react'
import logo from '../../assets/logo.png';

export function Sidebar({ className }) {
  const location = useLocation()

  const isActive = (path) => {
    if (path === '/admin') {
      return location.pathname === path
    }
    if (path.includes('?')) {
      const [pathname, search] = path.split('?')
      return location.pathname === pathname && location.search === `?${search}`
    }
    if (path === '/admin/tickets') {
      return location.pathname === path && !location.search
    }
    return location.pathname.startsWith(path)
  }

  return (
    <>
      {/* Top bar for mobile */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex md:hidden bg-white border-t shadow-lg justify-around items-center h-16">
        <Link to="/admin">
          <Button variant={isActive('/admin') ? "secondary" : "ghost"} size="icon">
            <LayoutDashboard className="h-5 w-5" />
          </Button>
        </Link>
        <Link to="/admin/tickets">
          <Button variant={isActive('/admin/tickets') ? "secondary" : "ghost"} size="icon">
            <Ticket className="h-5 w-5" />
          </Button>
        </Link>
        <Link to="/admin/analytics">
          <Button variant={isActive('/admin/analytics') ? "secondary" : "ghost"} size="icon">
            <BarChart3 className="h-5 w-5" />
          </Button>
        </Link>
        <Link to="/admin/users">
          <Button variant={isActive('/admin/users') ? "secondary" : "ghost"} size="icon">
            <Users className="h-5 w-5" />
          </Button>
        </Link>
        <Link to="/admin/settings">
          <Button variant={isActive('/admin/settings') ? "secondary" : "ghost"} size="icon">
            <Settings className="h-5 w-5" />
          </Button>
        </Link>
      </nav>
      {/* Sidebar for desktop */}
      <div className={cn("hidden md:flex pb-12 w-64 flex-col border-r bg-white", className)}>
        <div className="flex flex-col items-center py-6">
          <Link to="/admin">
            <img src={logo} alt="Logo" className="h-10 mb-4 drop-shadow-xl" />
          </Link>
        </div>
        <div className="space-y-4 py-4">
          <div className="px-3 py-2">
            <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">Support Admin</h2>
            <div className="space-y-1">
              <Link to="/admin">
                <Button 
                  variant={isActive('/admin') ? "secondary" : "ghost"} 
                  className={cn(
                    "w-full justify-start transition-colors",
                    isActive('/admin') ? "bg-secondary" : "hover:bg-secondary/50"
                  )}
                >
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Dashboard
                </Button>
              </Link>
              <Link to="/admin/tickets">
                <Button 
                  variant={isActive('/admin/tickets') ? "secondary" : "ghost"} 
                  className={cn(
                    "w-full justify-start transition-colors",
                    isActive('/admin/tickets') ? "bg-secondary" : "hover:bg-secondary/50"
                  )}
                >
                  <Ticket className="mr-2 h-4 w-4" />
                  All Tickets
                </Button>
              </Link>
              <Link to="/admin/tickets?status=open">
                <Button 
                  variant={isActive('/admin/tickets?status=open') ? "secondary" : "ghost"} 
                  className={cn(
                    "w-full justify-start transition-colors",
                    isActive('/admin/tickets?status=open') ? "bg-secondary" : "hover:bg-secondary/50"
                  )}
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Open Tickets
                </Button>
              </Link>
              <Link to="/admin/tickets?status=resolved">
                <Button 
                  variant={isActive('/admin/tickets?status=resolved') ? "secondary" : "ghost"} 
                  className={cn(
                    "w-full justify-start transition-colors",
                    isActive('/admin/tickets?status=resolved') ? "bg-secondary" : "hover:bg-secondary/50"
                  )}
                >
                  <Archive className="mr-2 h-4 w-4" />
                  Resolved
                </Button>
              </Link>
              <Link to="/admin/users">
                <Button 
                  variant={isActive('/admin/users') ? "secondary" : "ghost"} 
                  className={cn(
                    "w-full justify-start transition-colors",
                    isActive('/admin/users') ? "bg-secondary" : "hover:bg-secondary/50"
                  )}
                >
                  <Users className="mr-2 h-4 w-4" />
                  Users
                </Button>
              </Link>
            </div>
          </div>
          <div className="px-3 py-2">
            <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">Management</h2>
            <div className="space-y-1">
              <Link to="/admin/agents">
                <Button 
                  variant={isActive('/admin/agents') ? "secondary" : "ghost"} 
                  className={cn(
                    "w-full justify-start transition-colors",
                    isActive('/admin/agents') ? "bg-secondary" : "hover:bg-secondary/50"
                  )}
                >
                  <Users className="mr-2 h-4 w-4" />
                  Admins
                </Button>
              </Link>
              <Link to="/admin/analytics">
                <Button 
                  variant={isActive('/admin/analytics') ? "secondary" : "ghost"} 
                  className={cn(
                    "w-full justify-start transition-colors",
                    isActive('/admin/analytics') ? "bg-secondary" : "hover:bg-secondary/50"
                  )}
                >
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Analytics
                </Button>
              </Link>
              <Link to="/admin/settings">
                <Button 
                  variant={isActive('/admin/settings') ? "secondary" : "ghost"} 
                  className={cn(
                    "w-full justify-start transition-colors",
                    isActive('/admin/settings') ? "bg-secondary" : "hover:bg-secondary/50"
                  )}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  )
} 
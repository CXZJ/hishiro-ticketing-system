import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar"
import { Link, useNavigate } from 'react-router-dom'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu"
import { Bell, Search, Shield, Settings, LogOut, Menu } from 'lucide-react'
import { useAuthState } from 'react-firebase-hooks/auth'
import { auth } from '../../firebase'
import { signOut } from 'firebase/auth'
import { toast } from 'react-hot-toast'
import { useEffect, useState } from 'react'
import NotificationBell from '../../components/NotificationBell'
import { useNotifications } from '../../contexts/NotificationContext'

export function Header({ onMenuClick }) {
  const [user] = useAuthState(auth)
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [showNotificationsPanel, setShowNotificationsPanel] = useState(false)
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications()

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return
      try {
        const token = await user.getIdToken()
        const res = await fetch('/api/users/me', {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (!res.ok) throw new Error('Failed to fetch profile')
        const data = await res.json()
        setProfile(data)
      } catch (err) {
        setProfile(null)
      }
    }
    fetchProfile()
  }, [user])

  const handleSignOut = async () => {
    try {
      await signOut(auth)
      toast.success('Signed out successfully')
      navigate('/admin/login')
    } catch (error) {
      toast.error('Error signing out')
    }
  }

  return (
    <header className="border-b">
      <div className="flex h-16 items-center px-4 gap-4">
        {/* Hamburger menu for mobile only */}
        <button
          className="block xl:hidden p-2 rounded hover:bg-gray-200 focus:outline-none"
          onClick={onMenuClick}
          aria-label="Open sidebar"
        >
          <Menu className="h-6 w-6 text-gray-700" />
        </button>
        <div className="flex items-center space-x-4 flex-1">
          <span className="text-lg font-semibold text-gray-800">
            {`Welcome, ${profile?.username || user?.displayName || (user?.email ? user.email.split('@')[0] : 'Admin')}`}
          </span>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowNotificationsPanel(true)}
            className="relative p-2 rounded-full hover:bg-gray-100 focus:outline-none"
          >
            <Bell className="h-6 w-6 text-gray-600" />
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
                {unreadCount}
              </span>
            )}
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8 border-2 border-primary">
                  <AvatarImage src={profile?.photoURL ? profile.photoURL : (user?.photoURL ? user.photoURL : (user?.email ? `https://ui-avatars.com/api/?name=${user.email}` : "/placeholder-user.jpg"))} alt="Admin" />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    <Shield className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <div className="flex items-center space-x-2">
                    <Avatar className="h-8 w-8 border-2 border-primary">
                      <AvatarImage src={profile?.photoURL ? profile.photoURL : (user?.photoURL ? user.photoURL : (user?.email ? `https://ui-avatars.com/api/?name=${user.email}` : "/placeholder-user.jpg"))} alt="Admin" />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        <Shield className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium leading-none">{user?.displayName || 'Admin User'}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user?.email || 'admin@company.com'}</p>
                    </div>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/admin/settings" className="flex items-center">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      {/* Notification Drawer */}
      {showNotificationsPanel && (
        <>
          {/* Overlay */}
          <div
            className="fixed left-0 right-0 z-50 bg-black/30"
            style={{ top: '64px', bottom: 0 }}
            onClick={() => setShowNotificationsPanel(false)}
          />
          {/* Drawer */}
          <div
            className="fixed z-50 right-0 bg-white shadow-2xl flex flex-col overflow-y-auto animate-slide-in-right"
            style={{
              top: '64px',
              height: 'calc(100vh - 80px)',
              width: '100%',
              maxWidth: '28rem',
            }}
          >
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">Notifications</h3>
              <button onClick={() => setShowNotificationsPanel(false)} className="text-gray-500 hover:text-black text-2xl">&times;</button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {notifications.length > 0 ? (
                <>
                  {unreadCount > 0 && (
                    <div className="p-4 border-b flex justify-end">
                      <button
                        onClick={markAllAsRead}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        Mark all as read
                      </button>
                    </div>
                  )}
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      onClick={() => markAsRead(notification.id)}
                      className={`p-4 border-b hover:bg-gray-50 cursor-pointer ${!notification.read ? 'bg-blue-50' : ''}`}
                    >
                      <div className="flex items-start">
                        <div className="flex-shrink-0">{notification.icon}</div>
                        <div className="ml-3 flex-1">
                          <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                          <p className="text-sm text-gray-500">{notification.message}</p>
                          <p className="text-xs text-gray-400 mt-1">{new Date(notification.timestamp).toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                <div className="p-8 text-center text-gray-500">No notifications</div>
              )}
            </div>
          </div>
        </>
      )}
    </header>
  )
} 
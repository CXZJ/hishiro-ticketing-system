// src/admin/ui/Sidebar.jsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  HomeIcon,
  TicketIcon,
  UsersIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';
import logo from '../../assets/logo.png';

export default function Sidebar() {
  const links = [
    { to: '/admin',         icon: HomeIcon,      label: 'Dashboard' },
    { to: '/admin/tickets', icon: TicketIcon,    label: 'Tickets'   },
    { to: '/admin/users',   icon: UsersIcon,     label: 'Users'     },
    { to: '/admin/settings',icon: Cog6ToothIcon, label: 'Settings'  },
  ];

  return (
    <aside className="w-60 bg-white border-r flex flex-col">
      <div className="flex justify-center p-4">
        <img src={logo} alt="Ticket Lead Logo" className="h-10 w-auto" />
      </div>


      {/* Navigation Links */}
      <nav className="flex-1">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center px-4 py-3 hover:bg-gray-50 ${
                isActive ? 'bg-gray-200' : ''
              }`
            }
          >
            <Icon className="h-5 w-5 mr-3 text-gray-600" />
            <span className="text-gray-800">{label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

import { Sidebar } from './components/sidebar';
import { Header } from './components/header';
import { useState } from 'react';

export default function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar for desktop and drawer for mobile */}
      <Sidebar
        className={`border-r fixed z-40 inset-y-0 left-0 bg-white transform transition-transform duration-200 w-64 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:static md:translate-x-0`}
        onClose={() => setSidebarOpen(false)}
      />
      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-30 z-30 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Hamburger menu for mobile */}
        <div className="md:hidden flex items-center h-16 px-4 border-b bg-white z-20">
          <button
            className="p-2 rounded hover:bg-gray-200 focus:outline-none"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
        </div>
        {/* Header for desktop */}
        <div className="hidden md:block">
          <Header />
        </div>
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
} 
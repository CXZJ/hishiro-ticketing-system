import React from 'react';
import { BellIcon } from '@heroicons/react/24/outline';

export default function Topbar() {
  return (
    <header className="flex items-center justify-between bg-white px-6 py-3 border-b">
      <span className="text-gray-700">Welcome, Admin</span>
      <div className="flex items-center space-x-4">
        <button className="p-1 hover:bg-gray-100 rounded-full">
          <BellIcon className="h-6 w-6 text-gray-600" />
        </button>
        <img
          src="/assets/logo-white.png"
          alt="Admin Avatar"
          className="h-8 w-8 rounded-full border"
        />
      </div>
    </header>
  );
}

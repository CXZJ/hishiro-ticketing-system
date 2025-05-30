import React from 'react';
import NotificationBell from '../../components/NotificationBell';

export default function Topbar() {
  return (
    <header className="bg-white border-b px-6 py-4">
      <div className="flex justify-end items-center">
        <NotificationBell />
      </div>
    </header>
  );
}

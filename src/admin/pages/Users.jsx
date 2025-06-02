import React from 'react';
import UserManagement from '../components/UserManagement';

export default function Users() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <p className="mt-1 text-sm text-gray-500">
          Create, view, and manage user accounts
        </p>
      </div>
      
      <UserManagement />
    </div>
  );
} 
// src/components/Header.jsx
import React from 'react';
import logo from '../assets/logo.png';
import {
  MagnifyingGlassIcon,
  ShoppingBagIcon,
  UserIcon,
} from '@heroicons/react/24/outline';

export default function Header() {
  return (
    <header className="bg-white shadow">
      <div className="container mx-auto px-6 py-4">
        <div className="grid grid-cols-3 items-center">
          {/* left spacer */}
          <div />

          {/* center: logo */}
          <div className="flex justify-center">
            <img src={logo} alt="Hishiro Logo" className="h-20 object-contain" />
          </div>

          {/* right: icons */}
          <div className="flex justify-end items-center space-x-6">
            <MagnifyingGlassIcon className="w-6 h-6 text-gray-700 hover:text-black cursor-pointer" />
            <ShoppingBagIcon className="w-6 h-6 text-gray-700 hover:text-black cursor-pointer" />
            <UserIcon className="w-6 h-6 text-gray-700 hover:text-black cursor-pointer" />
          </div>
        </div>
      </div>
    </header>
  );
}

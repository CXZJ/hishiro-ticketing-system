// src/components/Header.jsx
import React, { useState } from 'react'
import {
  Bars3Icon,
  XMarkIcon,
  MagnifyingGlassIcon,
  ShoppingBagIcon,
  UserIcon,
} from '@heroicons/react/24/outline'
import { Link } from 'react-router-dom'

import logo from '../assets/logo.png'
import CategoryNav from './CategoryNav'

export default function Header({ onSearchClick }) {
  const [open, setOpen] = useState(false)

  return (
    <header className="bg-white">
      {/* Top bar with logo and icons */}
      <div className="relative max-w-screen-xl mx-auto flex items-center h-20 px-4 border-b">
        {/* Mobile hamburger */}
        <button
          onClick={() => setOpen(o => !o)}
          className="p-2 show-below-1120"
          aria-label="Toggle menu"
        >
          <Bars3Icon className="h-6 w-6 text-black" />
        </button>

        {/* Centered logo */}
        <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <Link to="/">
            <img
              src={logo}
              alt="Logo"
              className="h-8 md:h-16 lg:h-20 object-contain"
            />
          </Link>
        </div>

        {/* Always-visible icons */}
        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center space-x-4 md:space-x-6">
          <div className="relative">
            <button onClick={onSearchClick} className="p-1">
              <MagnifyingGlassIcon className="h-5 w-5 md:h-6 md:w-6 text-black" />
            </button>
          </div>
          <div className="relative">
            <ShoppingBagIcon className="h-5 w-5 md:h-6 md:w-6 text-black" />
            <span className="absolute -top-1 -right-2 h-4 w-4 text-xs flex items-center justify-center bg-black text-white rounded-full">
              0
            </span>
          </div>
          <Link to="/login">
            <UserIcon className="h-5 w-5 md:h-6 md:w-6 text-black" />
          </Link>
        </div>
      </div>

      {/* Desktop category bar */}
      <div className="bg-white border-b show-above-1119 sticky top-[5rem] z-30">
        <CategoryNav />
      </div>

      {/* Mobile overlay (fades) */}
      <div
        className={`
          fixed inset-0 bg-black bg-opacity-30 z-40
          transition-opacity duration-300
          ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}
        `}
        onClick={() => setOpen(false)}
      />

      {/* Mobile drawer (slides) */}
      <aside
        className={`
          fixed inset-x-0 top-[calc(5rem+1px)] bottom-0 bg-white z-50 overflow-auto
          transform transition-transform duration-300 ease-in-out
          ${open ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Drawer header with close button */}
        <div className="flex items-center h-16 border-b px-4">
          <button
            onClick={() => setOpen(false)}
            className="flex items-center space-x-2 p-2"
            aria-label="Close menu"
          >
            <XMarkIcon className="h-6 w-6 text-black" />
            <span className="text-base font-medium text-black">Close</span>
          </button>
        </div>

        {/* Vertical nav */}
        <CategoryNav orientation="vertical" />
      </aside>
    </header>
  )
}

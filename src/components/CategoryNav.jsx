// src/components/CategoryNav.jsx
import React from 'react';

const categories = [
  'All',
  'Cardigans & Jackets',
  'Bottom-Wear',
  'T-shirts & Button-ups',
  'Sweaters & Hoodies',
  'Bags',
  'Archives',
];

export default function CategoryNav() {
  return (
    <nav className="bg-white border-b">
      <div className="container mx-auto px-6">
        <ul className="flex justify-center space-x-10 py-4">
          {categories.map(cat => (
            <li key={cat}>
              <button className="text-black hover:text-black font-bold whitespace-nowrap">
                {cat}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}

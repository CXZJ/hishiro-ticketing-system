import React from 'react'

const categories = [
  'All',
  'Cardigans & Jackets',
  'Bottom-Wear',
  'T-shirts & Button-ups',
  'Sweaters & Hoodies',
  'Bags',
  'Archives',
]

/**
 * @param {'horizontal'|'vertical'} [orientation='horizontal']
 * @param {string} [className='']
 */
export default function CategoryNav({
  orientation = 'horizontal',
  className = '',
}) {
  const isVertical = orientation === 'vertical'

  return (
    <nav className={className}>
      <ul
        className={
          isVertical
            ? 'flex flex-col divide-y divide-gray-200'
            : 'flex justify-center space-x-8'
        }
      >
        {categories.map(cat => (
          <li
            key={cat}
            className={
              isVertical
                ? 'w-full py-4 text-center text-base'
                : 'text-sm'
            }
          >
            <button className="hover:underline">{cat}</button>
          </li>
        ))}
      </ul>
    </nav>
  )
}

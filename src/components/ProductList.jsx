import React from 'react';

const products = [
  { title: 'Queen Of Curses Knit Sweater', price: 'Rp 226.000', image: 'https://via.placeholder.com/400x300' },
  { title: 'Y2K Toshiro True Bankai Jacket', price: 'Rp 899.000', image: 'https://via.placeholder.com/400x300' },
  { title: 'Y2K Ghoul Workshirt', price: 'Rp 519.000', image: 'https://via.placeholder.com/400x300' },
];

const ProductList = () => (
  <section id="products" className="py-16 px-6 bg-white">
    <h3 className="text-3xl font-bold text-center mb-10">Products</h3>
    <div className="grid md:grid-cols-3 gap-6">
      {products.map((product, index) => (
        <div key={index} className="shadow hover:shadow-lg transition">
          <img src={product.image} alt={product.title} className="w-full h-64 object-cover" />
          <div className="p-4">
            <h4 className="text-xl font-semibold">{product.title}</h4>
            <p className="text-gray-600">{product.price}</p>
          </div>
        </div>
      ))}
    </div>
  </section>
);

export default ProductList;

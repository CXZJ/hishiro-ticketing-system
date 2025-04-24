import React from 'react';
import Header from './components/Header';
import CategoryNav from './components/CategoryNav';
import Slider from './components/Slider';
import ProductList from './components/ProductList';
import Footer from './components/Footer';

export default function App() {
  return (
    <>
      <Header />
      <CategoryNav />
      <main>
        <Slider/>
        <ProductList />
      </main>
      <Footer />
    </>
  );
}

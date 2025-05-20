import React from "react";
import { useParams, useLocation, Link, useSearchParams } from "react-router-dom";
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/navigation';
import { Autoplay } from 'swiper/modules';

const products = [
  // cardigans and jackets
  {
    title: "Hishiro's Signature Y2K Toshiro True Bankai Jacket",
    price: "Rp 899.000",
    originalPrice: "Rp  1.100.000",
    image: "/2.png",
    category: "cardigans-and-jackets",
    discount: "-18%"
  },
  {
    title: "Luffy Boxy Racing Knitted Jacket",
    price: "Rp 419.000",
    image: "/jacket 3.webp",
    category: "cardigans-and-jackets",
    soldOut: true
  },
  {
    title: "Zoro Boxy Racing Knitted Jacket",
    price: "Rp 419.000",
    image: "/jacket 2.webp",
    category: "cardigans-and-jackets",
  },
  // bottom-wear
  {
    title: "Fire Fist Ace Jorts",
    price: "Rp 369.000",
    originalPrice: "Rp 369.000",
    image: "/bottom.webp",
    category: "bottom-wear",
    soldOut: true
  },
  // T-shirts and button-ups
  {
    title: "Hishiro's Signature Dark Kon Button Up [Pre-Order]",
    price: "Rp 319.000",
    originalPrice: "Rp 349.000",
    image: "/1 shirt.webp",
    category: "t-shirts-and-button-ups",
    discount: "-9%",
    soldOut: true
  },
  {
    title: "Hishiro's Signature Honored One Button Up [Pre-Order]",
    price: "Rp 349.000",
    originalPrice: "Rp 289.000",
    image: "/2 shirt.webp",
    category: "t-shirts-and-button-ups",
    discount: "-17%",
    soldOut: true
  },
  // Sweater and hoodies
  {
    title: "Hishiro's Signature Queen Of Curses Knit Sweater (Yula)",
    price: "Rp 226.000",
    originalPrice: "Rp 359.000",
    image: "/1.png",
    category: "sweaters-and-hoodies",
    discount: "-28%",
  },
  // Totebag
  {
    title: "Hishiro's Signature Y2K Toshiro True Bankai Jacket",
    price: "Rp 79.000",
    originalPrice: "Rp 110.000",
    image: "/totebag.webp",
    category: "bags",
    discount: "-28%",
    soldOut: true
  }
];

const homepageSliderCards = [
  {
    title: "Limited Edition",
    image: "/4.webp"
  },
  {
    title: "True Bankai Jacket",
    image: "/5.webp"
  },
  {
    title: "80 Pcs Only",
    image: "/6.webp"
  },
  // Add more if you want!
];

export default function ProductList({ limit, heading, search }) {
  const { category } = useParams();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('q')?.toLowerCase() || '';
  const highlightedProduct = searchParams.get('product');
  
  let filteredProducts = products;

  // Apply category filter with special handling for "archives"
  if (category) {
    if (category === 'archives') {
      // For archives category, show only sold out products from all categories
      filteredProducts = products.filter(product => product.soldOut === true);
    } else {
      // For regular categories, show all products from that category (including sold-out)
      filteredProducts = products.filter(product => 
        product.category === category
      );
    }
  } else if (location.pathname === '/all') {
    // On the "All" page, show everything
    filteredProducts = products;
  }

  // Apply search filter
  if (searchQuery) {
    filteredProducts = filteredProducts.filter(product => 
      product.title.toLowerCase().includes(searchQuery)
    );
  }

  const displayedProducts = limit ? filteredProducts.slice(0, limit) : filteredProducts;

  // Sort products: available first, then discounted, then sold out (except for Archives)
  const sortedProducts = [...displayedProducts].sort((a, b) => {
    // In Archives, we want to prioritize newest items, but we don't have date info
    // So we'll use alphabetical order for simplicity
    if (category === 'archives') {
      return a.title.localeCompare(b.title);
    }
    
    // Helper function to get sort priority (0: available, 1: discounted, 2: sold out)
    const getPriority = (product) => {
      if (product.soldOut) return 2;
      if (product.discount) return 1;
      return 0;
    };

    return getPriority(a) - getPriority(b);
  });

  const showSlider = heading === 'OUT NOW';
  const enableLoop = homepageSliderCards.length > 1;

  let sliderProducts = homepageSliderCards;
  if (showSlider && homepageSliderCards.length > 0 && homepageSliderCards.length < 6) {
    const times = Math.ceil(6 / homepageSliderCards.length);
    sliderProducts = Array(times).fill(homepageSliderCards).flat().slice(0, 6);
  }

  // Function to check if this product should be highlighted (from search/URL)
  const isHighlighted = (title) => {
    return highlightedProduct && title === highlightedProduct;
  };

  return (
    <section
      id="products"
      className="py-8 px-6 bg-white"
      style={category || location.pathname === '/all' || search ? {
        backgroundImage: 'url(/src/assets/background-scaled.png)',
        backgroundRepeat: 'repeat',
        backgroundSize: '700px',
      } : {}}
    >
      {heading && (
        <h3 className="text-5xl font-bold text-center mb-6">
          {heading}
        </h3>
      )}
      {search && searchQuery && (
        <h3 className="text-2xl font-semibold text-center mb-6">
          Search results for "{searchQuery}"
        </h3>
      )}
      {showSlider ? (
        <div
          className="px-4 sm:px-8 md:px-16 lg:px-32"
          style={{
            backgroundImage: 'url(/src/assets/background-scaled.png)',
            backgroundRepeat: 'repeat',
            backgroundSize: '800px',
          }}
        >
          <Swiper
            modules={[Autoplay]}
            autoplay={{ delay: 5000, disableOnInteraction: false }}
            spaceBetween={30}
            loop={enableLoop}
            centeredSlides={true}
            breakpoints={{
              0: { slidesPerView: 1 },
              640: { slidesPerView: 2 },
              1024: { slidesPerView: 3 },
            }}
            className="w-full"
          >
            {sliderProducts.map((product, index) => (
              <SwiperSlide key={index}>
                <div className="relative w-full h-[400px] sm:h-[500px] md:h-[600px] flex items-center justify-center">
                  <img
                    src={product.image}
                    alt={product.title}
                    className="w-full h-full object-contain"
                    style={{ background: 'transparent' }}
                  />
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
          <div className="flex justify-center mt-8">
            <Link
              to="/all"
              className="bg-black text-white px-5 py-2 rounded hover:bg-gray-900 transition text-base font-semibold"
              style={{ zIndex: 10 }}
            >
              Shop Now
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
          {sortedProducts.map((product, index) => (
            <div 
              key={index} 
              className={`group bg-white relative overflow-hidden transition-all duration-300 hover:shadow-xl rounded-lg ${
                isHighlighted(product.title) ? 'ring-2 ring-blue-500 shadow-lg' : ''
              }`}
              id={isHighlighted(product.title) ? 'highlighted-product' : ''}
            >
              <div className="relative aspect-[3/4] overflow-hidden rounded-t-lg">
                <div className="w-full h-full transform transition-transform duration-300 group-hover:scale-105">
                  <img
                    src={product.image}
                    alt={product.title}
                    className={`w-full h-full object-cover ${product.soldOut ? 'opacity-80' : ''}`}
                    style={{objectPosition: "center"}}
                  />
                  {product.soldOut && (
                    <>
                      <div className="absolute inset-0 bg-black bg-opacity-40"></div>
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-[-15deg] transform-gpu">
                        <div className="bg-white/90 backdrop-blur-sm px-6 py-2 rounded-sm border-2 border-black shadow-lg">
                          <span className="text-xl font-bold tracking-wider">SOLD OUT</span>
                        </div>
                      </div>
                    </>
                  )}
                  {product.discount && (
                    <div className="absolute top-3 left-3 bg-black text-white px-3 py-1 text-sm font-semibold rounded-md">
                      {product.discount}
                    </div>
                  )}
                </div>
              </div>
              <div className="p-4">
                <h4 className="text-lg font-medium mb-2 line-clamp-2 min-h-[3.5rem]">{product.title}</h4>
                <div className="flex items-baseline gap-2">
                  <p className="text-lg font-semibold">{product.price}</p>
                  {product.originalPrice && (
                    <p className="text-sm text-gray-500 line-through">{product.originalPrice}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
          {search && searchQuery && sortedProducts.length === 0 && (
            <div className="col-span-full text-center py-10">
              <p className="text-xl text-gray-600">No products found matching "{searchQuery}"</p>
            </div>
          )}
          {category === 'archives' && sortedProducts.length === 0 && (
            <div className="col-span-full text-center py-10">
              <p className="text-xl text-gray-600">No archived products available</p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

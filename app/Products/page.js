"use client"
import React, { useState } from 'react';
import { FaChevronRight, FaFilter } from 'react-icons/fa'; 
// import Navbar from '.';
// import Menu from '../Menu/page';


const categories = [
  'All Products',
  'Jewelry',
  'Clothing',
  'Home Decor',
  'Accessories',
  'Footwear',
  'Bags & Purses',
];

const products = [
  { id: 1, name: 'Handmade Silver Earrings', category: 'Jewelry', price: 2999, imageUrl: 'https://images.pexels.com/photos/7588282/pexels-photo-7588282.jpeg?_gl=1*1wkbfim*_ga*OTkyNzg4NDcuMTc1NTA4MTk4Mw..*_ga_8JE65Q40S6*czE3NTg4MDA0ODkkbzEyJGcxJHQxNzU4ODAwNTI4JGoyMSRsMCRoMA..' },
  { id: 2, name: 'Embroidered Silk Saree', category: 'Clothing', price: 8500, imageUrl: 'https://images.pexels.com/photos/2784078/pexels-photo-2784078.jpeg?_gl=1*zlg5e2*_ga*OTkyNzg4NDcuMTc1NTA4MTk4Mw..*_ga_8JE65Q40S6*czE3NTg4MDA0ODkkbzEyJGcxJHQxNzU4ODAwNjQzJGo1OSRsMCRoMA..' },
  { id: 3, name: 'Traditional Kutch Work Cushion Cover', category: 'Home Decor', price: 1200, imageUrl: 'https://images.pexels.com/photos/2784078/pexels-photo-2784078.jpeg?_gl=1*zlg5e2*_ga*OTkyNzg4NDcuMTc1NTA4MTk4Mw..*_ga_8JE65Q40S6*czE3NTg4MDA0ODkkbzEyJGcxJHQxNzU4ODAwNjQzJGo1OSRsMCRoMA..' },
  { id: 4, name: 'Leather Juttis', category: 'Footwear', price: 3500, imageUrl: 'https://images.pexels.com/photos/2784078/pexels-photo-2784078.jpeg?_gl=1*zlg5e2*_ga*OTkyNzg4NDcuMTc1NTA4MTk4Mw..*_ga_8JE65Q40S6*czE3NTg4MDA0ODkkbzEyJGcxJHQxNzU4ODAwNjQzJGo1OSRsMCRoMA..' },
  { id: 5, name: 'Terracotta Hand-Painted Vase', category: 'Home Decor', price: 1800, imageUrl: 'https://images.pexels.com/photos/2784078/pexels-photo-2784078.jpeg?_gl=1*zlg5e2*_ga*OTkyNzg4NDcuMTc1NTA4MTk4Mw..*_ga_8JE65Q40S6*czE3NTg4MDA0ODkkbzEyJGcxJHQxNzU4ODAwNjQzJGo1OSRsMCRoMA..' },
  { id: 6, name: 'Beaded Clutch Bag', category: 'Bags & Purses', price: 2800, imageUrl: 'https://images.pexels.com/photos/2784078/pexels-photo-2784078.jpeg?_gl=1*zlg5e2*_ga*OTkyNzg4NDcuMTc1NTA4MTk4Mw..*_ga_8JE65Q40S6*czE3NTg4MDA0ODkkbzEyJGcxJHQxNzU4ODAwNjQzJGo1OSRsMCRoMA..' },
  { id: 7, name: 'Oxidized Silver Necklace', category: 'Jewelry', price: 4200, imageUrl: 'https://images.pexels.com/photos/2784078/pexels-photo-2784078.jpeg?_gl=1*zlg5e2*_ga*OTkyNzg4NDcuMTc1NTA4MTk4Mw..*_ga_8JE65Q40S6*czE3NTg4MDA0ODkkbzEyJGcxJHQxNzU4ODAwNjQzJGo1OSRsMCRoMA..' },
  { id: 8, name: 'Block Print Cotton Kurta', category: 'Clothing', price: 2100, imageUrl: 'https://images.pexels.com/photos/2784078/pexels-photo-2784078.jpeg?_gl=1*zlg5e2*_ga*OTkyNzg4NDcuMTc1NTA4MTk4Mw..*_ga_8JE65Q40S6*czE3NTg4MDA0ODkkbzEyJGcxJHQxNzU4ODAwNjQzJGo1OSRsMCRoMA..' },
];

function ProductListPage() {
    const [activeCategory, setActiveCategory] = useState('All Products');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    
    const filteredProducts = products.filter(product => 
        activeCategory === 'All Products' ? true : product.category === activeCategory
    );
    
    return (
        <>
        {/* <Navbar />
        <Menu /> */}
        
           <div className="min-h-screen bg-gray-50 flex">
        
      
      <div className="md:hidden fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-4 bg-purple-600 text-white rounded-full shadow-lg hover:bg-purple-700 transition-colors duration-300"
          aria-label="Open filter menu"
        >
          <FaFilter size={24} />
        </button>
      </div>

     
      <aside
        className={`fixed inset-y-0 left-0 z-40 bg-white transform ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } md:relative md:translate-x-0 transition-transform duration-300 ease-in-out md:flex md:flex-col md:w-64 border-r border-gray-200`}
      >
        <div className="flex items-center justify-between p-6 md:hidden">
          <h3 className="text-xl font-bold text-gray-800">Categories</h3>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="text-gray-500 hover:text-gray-700 focus:outline-none"
            aria-label="Close menu"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto pt-2 pb-4">
          <ul className="space-y-2 px-4">
            {categories.map(category => (
              <li key={category}>
                <button
                  onClick={() => {
                    setActiveCategory(category);
                    setIsMobileMenuOpen(false); // Close menu on selection
                  }}
                  className={`flex items-center justify-between w-full px-4 py-3 rounded-lg text-left transition-colors duration-200 
                    ${activeCategory === category 
                      ? 'bg-purple-100 text-purple-700 font-semibold' 
                      : 'text-gray-600 hover:bg-gray-100'
                    }`}
                >
                  <span>{category}</span>
                  <FaChevronRight size={14} className="text-gray-400" />
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-6 sm:mb-8">
          {activeCategory}
        </h1>
        <p className="text-gray-600 text-lg mb-8">
          Explore Maharaneez Latest collections
        </p>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
          {filteredProducts.map(product => (
            <div key={product.id} className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300 overflow-hidden">
              <div className="relative aspect-square">
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-4 sm:p-5">
                <h3 className="text-lg font-semibold text-gray-800 truncate">{product.name}</h3>
                <p className="mt-1 text-xl font-bold text-purple-600">
                  ${(product.price / 100).toFixed(2)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
        
        </>
     
  );
}

export default ProductListPage;
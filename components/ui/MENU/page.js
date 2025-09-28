"use client"
import { useState } from 'react';
import React from 'react'

const Menu = () => {
    const [menuOpen, setMenuOpen] = useState(false);
    
      function toggleMenu() {
        setMenuOpen(!menuOpen);
      }
  return (
    <div>
          <nav className="bg-[#885a89] shadow-md">
      <div className="container mx-auto flex items-center justify-between p-4">
        <div className="text-2xl font-bold text-pink-600">Queens Menu </div>

        {/* Hamburger button */}
        <button
          onClick={toggleMenu}
          className="md:hidden block focus:outline-none"
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 6h16M4 12h16M4 18h16"></path>
          </svg>
        </button>

        {/* Horizontal menu for md+ */}
        <ul className="hidden md:flex space-x-8 text-gray-700 font-medium">
          <li><a href="#" className="hover:text-pink-600 text-white font-bold">Home</a></li>
          <li><a href="#" className="hover:text-pink-600 text-white font-bold">Make Up</a></li>
          <li><a href="#" className="hover:text-pink-600 text-white font-bold" >Skincare</a></li>
          <li><a href="#" className="hover:text-pink-600 text-white font-bold">Gifts & Sets</a></li>
          <li><a href="#" className="hover:text-pink-600 text-white font-bold">Brands</a></li>
          <li><a href="#" className="hover:text-pink-600 text-white font-bold">Contact</a></li>
        </ul>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <ul className="md:hidden bg-white border-t border-gray-200">
          <li><a href="#" className="block px-4 py-3 hover:bg-pink-50">Home</a></li>
          <li><a href="#" className="block px-4 py-3 hover:bg-pink-50">Make Up</a></li>
          <li><a href="#" className="block px-4 py-3 hover:bg-pink-50">Skincare</a></li>
          <li><a href="#" className="block px-4 py-3 hover:bg-pink-50">Gifts & Sets</a></li>
          <li><a href="#" className="block px-4 py-3 hover:bg-pink-50">Brands</a></li>
          <li><a href="#" className="block px-4 py-3 hover:bg-pink-50">Contact</a></li>
        </ul>
      )}
    </nav>
    </div>
  )
}

export default Menu

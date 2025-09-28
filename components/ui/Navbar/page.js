"use Client"
import React from 'react'
import Link from 'next/link'
const Navbar = () => {
  return (
    <div>
     
      <header className="bg-[#DCE0D9] shadow-md">

    <div className="container mx-auto flex justify-between items-center py-4 px-6">
      {/* <h1 className="text-2xl font-bold text-pink-700">Maharaniz</h1> */}
      <Link href="/" className="text-2xl font-bold text-pink-700">Maharaniz   </Link>
      <nav className="hidden md:flex gap-6 text-gray-700 font-medium">
        <Link href="/Products " className="hover:text-pink-500">Women Make-Up</Link>
        {/* <a href="#" className="hover:text-pink-500">Women Make-Up</a> */}
        <a href="#" className="hover:text-pink-500">Women Skincare</a>
        <a href="#" className="hover:text-pink-500">Gifts & Sets</a>
        <a href="#" className="hover:text-pink-500">Our Brand</a>

        

      </nav>
      <div className="flex items-center gap-4">
        <button className="text-gray-600">🔍</button>
        <button className="text-gray-600">🛒</button>
      </div>

      <div className="sign gap-4 flex">
      <Link href="/Portal" className="text-black p-1 border-2 bg-[#BBA0CA] flex items-center justify-center rounded-md">
  Login
</Link>
        <button className='text-black p-1 border-2 bg-[#BBA0CA]'> <Link href="/Signup"> Signup </Link></button>
      </div>
    </div>

  </header>
    </div>
  )
}

export default Navbar

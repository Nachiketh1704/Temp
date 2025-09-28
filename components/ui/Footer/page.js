import React from 'react'

const Footer = () => {
 const currentyear = new Date().getFullYear();

  return (
    <div>
      <footer className="bg-red-800 text-gray-300 py-8">
    <div className="container mx-auto px-6 text-center">
      <p>© {currentyear}Maharaniz. All rights reserved.</p>
    </div>
  </footer>

    </div>
  )
}

export default Footer

// 'use client';
// import Link from 'next/link';
// import { Button } from '@/components/ui/button';
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// import { Building2, Users, ShieldCheck, TrendingUp, ArrowRight, CircleCheck as CheckCircle, Star } from 'lucide-react';

// export default function Home() {
//   return (
//     <div className="min-h-screen">
//       {/* Header */}
//       <header className="border-b bg-white/95 backdrop-blur-sm sticky top-0 z-50">
//         <div className="container mx-auto px-4 py-4">
//           <div className="flex items-center justify-between">
//             <div className="flex items-center gap-3">
//               <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
//                 <Building2 className="h-6 w-6 text-white" />
//               </div>
//               <div>
//                 <h1 className="text-xl font-bold text-gray-900">Maharaniz</h1>
//                 <p className="text-sm text-gray-600">Professional Platform</p>
//               </div>
//             </div>
//             <nav className="hidden md:flex items-center gap-4">
//               <Link 
//   href="/signup" 
//   className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors font-medium"
// >
//   Register
// </Link>

//             </nav>
//           </div>
//         </div>
//       </header>

//      {/* CTA Section - Moved to Top
// <section className="relative py-20 bg-blue-900">
//   <div className="container mx-auto px-4 text-center relative z-10">
//     <h3 className="text-3xl md:text-4xl font-bold text-white mb-6">
//       Ready to Transform Your Business?
//     </h3>
//     <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
//       Join thousands of successful vendors who have grown their business with VendorHub
//     </p>
//   </div>
// </section> */}


//       {/* Hero Section */}
// <section className="relative min-h-[90vh] flex items-center">
//   {/* Background Image */}
//   <div 
//     className="absolute inset-0 bg-cover bg-center bg-no-repeat"
//     style={{
//       backgroundImage: 'url(https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop)'
//     }}
//   >
//     <div className="absolute inset-0 bg-gradient-to-r from-blue-900/90 via-blue-800/80 to-transparent"></div>
//   </div>

//   <div className="container mx-auto px-4 py-16 relative z-10">
//     <div className="grid lg:grid-cols-2 gap-12 items-center">
//       {/* Left Content */}
//       <div className="text-left max-w-xl">
//         <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-4 leading-tight">
//           Ready to Transform Your Business?
//         </h1>
//         <p className="text-xl text-blue-100 mb-6 leading-relaxed">
//           Join thousands of successful vendors who have grown their business with VendorHub.
//         </p>
//         <p className="text-lg text-blue-200 mb-8">
//           Connect with thousands of businesses, streamline your operations, and grow your vendor services with our comprehensive platform.
//         </p>

//         {/* Stats */}
//         <div className="flex flex-wrap gap-6">
//           <div className="flex items-center gap-2 text-white">
//             <CheckCircle className="h-6 w-6 text-green-400" />
//             <span className="font-medium">10,000+ Active Vendors</span>
//           </div>
//           <div className="flex items-center gap-2 text-white">
//             <Star className="h-6 w-6 text-yellow-400" />
//             <span className="font-medium">4.9/5 Average Rating</span>
//           </div>
//         </div>
//       </div>
            
//           {/* Registration Options */}
// <div className="grid gap-6">
//   <Card className="group hover:shadow-2xl transition-all duration-300 border-2 hover:border-blue-200 bg-white/95 backdrop-blur-sm hover:scale-105">
//     <CardHeader className="text-center">
//       <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 group-hover:bg-blue-200 transition-colors">
//         <Users className="h-8 w-8 text-blue-600" />
//       </div>
//       <CardTitle className="text-2xl">Register Now</CardTitle>
//       <CardDescription className="text-base">
//         Register your business and start connecting with clients
//       </CardDescription>
//       {/* Highlight Free Registration */}
//       <div className="mt-3 inline-block rounded-full bg-green-100 px-4 py-1 text-sm font-semibold text-green-700 shadow-sm">
//         🎉 Free Vendor Registration
//       </div>
//     </CardHeader>
//     <CardContent className="text-center">
//       <Button
//         asChild
//         size="lg"
//         className="w-full group-hover:bg-blue-700 transition-colors"
//       >
//         <Link
//           href="/signup"
//           className="flex items-center justify-center gap-2"
//         >
//           Create Account <ArrowRight className="h-4 w-4" />
//         </Link>
//       </Button>
//     </CardContent>
//   </Card>



//               <Card className="group hover:shadow-2xl transition-all duration-300 border-2 hover:border-emerald-200 bg-white/95 backdrop-blur-sm hover:scale-105">
//               <CardHeader className="text-center">
//                 <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 group-hover:bg-emerald-200 transition-colors">
//                   <ShieldCheck className="h-8 w-8 text-emerald-600" />
//                 </div>
//                 <CardTitle className="text-2xl">Existing Vendor</CardTitle>
//                 <CardDescription className="text-base">
//                   Access your dashboard and manage your business
//                 </CardDescription>
//               </CardHeader>
//               <CardContent className="text-center">
//                 <Button asChild variant="outline" size="lg" className="w-full border-emerald-200 hover:bg-emerald-50 group-hover:border-emerald-300 transition-colors">
//                   <Link href="/login" className="flex items-center justify-center gap-2">
//                     Log In <ArrowRight className="h-4 w-4" />
//                   </Link>
//                 </Button>
//               </CardContent>
//             </Card>
//           </div>
//           </div>
//         </div>
//       </section>

//   {/* Trust Indicators */}
// <section className="bg-white py-12 border-b overflow-hidden">
//   <div className="container mx-auto px-4">
//     <div className="text-center mb-8">
//       <p className="text-gray-600 text-sm uppercase tracking-wide font-semibold">
//         Trusted by leading companies
//       </p>
//     </div>

//     {/* Infinite Marquee */}
//     <div className="overflow-hidden relative">
//       <div className="flex animate-marquee whitespace-nowrap">
//         {[
//           { name: 'TechCorp', img: 'https://upload.wikimedia.org/wikipedia/commons/4/44/Google-flutter-logo.svg' },
//           { name: 'GlobalTrade', img: 'https://upload.wikimedia.org/wikipedia/commons/0/08/Tesla_logo.png' },
//           { name: 'InnovateLtd', img: 'https://upload.wikimedia.org/wikipedia/commons/a/ab/Apple-logo.png' },
//           { name: 'FutureCo', img: 'https://upload.wikimedia.org/wikipedia/commons/5/51/Facebook_f_logo_%282019%29.svg' },
//           // duplicate set for seamless scroll
//           { name: 'TechCorp', img: 'https://upload.wikimedia.org/wikipedia/commons/4/44/Google-flutter-logo.svg' },
//           { name: 'GlobalTrade', img: 'https://upload.wikimedia.org/wikipedia/commons/0/08/Tesla_logo.png' },
//           { name: 'InnovateLtd', img: 'https://upload.wikimedia.org/wikipedia/commons/a/ab/Apple-logo.png' },
//           { name: 'FutureCo', img: 'https://upload.wikimedia.org/wikipedia/commons/5/51/Facebook_f_logo_%282019%29.svg' },
//         ].map((company, idx) => (
//           <div key={idx} className="flex items-center gap-3 min-w-[150px]">
//             <img 
//               src={company.img} 
//               alt={company.name} 
//               className="h-12 w-auto object-contain"
//             />
//             <span className="text-gray-500 font-semibold">{company.name}</span>
//           </div>
//         ))}
//       </div>
//     </div>
//   </div>

//   <style jsx>{`
//     @keyframes marquee {
//       0% { transform: translateX(0%); }
//       100% { transform: translateX(-50%); }
//     }
//     .animate-marquee {
//       display: flex;
//       gap: 4rem;
//       animation: marquee 20s linear infinite;
//     }
//   `}</style>
// </section>


//       {/* Features Section */}
//       <section className="relative py-20">
//         {/* Background Image */}
//         <div 
//           className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-10"
//           style={{
//             backgroundImage: 'url(https://images.pexels.com/photos/3184339/pexels-photo-3184339.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop)'
//           }}
//         ></div>
        
//         <div className="container mx-auto px-4">
//           <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">
//             Why Choose VendorHub?
//           </h3>
//           <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto relative z-10">
//             <Card className="text-center p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-2 bg-white">
//               <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
//                 <Building2 className="h-6 w-6 text-blue-600" />
//               </div>
//               <h4 className="text-xl font-semibold mb-4">Professional Network</h4>
//               <p className="text-gray-600 leading-relaxed">Connect with verified businesses and build lasting partnerships across industries</p>
//             </Card>
//             <Card className="text-center p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-2 bg-white">
//               <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
//                 <TrendingUp className="h-6 w-6 text-emerald-600" />
//               </div>
//               <h4 className="text-xl font-semibold mb-4">Grow Your Business</h4>
//               <p className="text-gray-600 leading-relaxed">Access powerful tools and insights to scale your vendor operations effectively</p>
//             </Card>
//             <Card className="text-center p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-2 bg-white">
//               <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-orange-100">
//                 <ShieldCheck className="h-6 w-6 text-orange-600" />
//               </div>
//               <h4 className="text-xl font-semibold mb-4">Secure & Trusted</h4>
//               <p className="text-gray-600 leading-relaxed">Enterprise-grade security with comprehensive vendor verification processes</p>
//             </Card>
//           </div>
//         </div>
//       </section>

//       {/* Footer */}
//       <footer className="bg-gray-900 text-white py-8">
//         <div className="container mx-auto px-4 text-center">
//           <div className="flex items-center justify-center gap-3 mb-4">
//             <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
//               <Building2 className="h-5 w-5 text-white" />
//             </div>
//             <span className="text-lg font-semibold">VendorHub</span>
//           </div>
//           <p className="text-gray-400">© 2025 VendorHub. All rights reserved.</p>
//         </div>
//       </footer>
//     </div>
//   );
// }



"use client"
import Image from "next/image";
import { useState } from "react";
import React from "react";   
import Navbar from "../components/ui/Navbar/page";
import Menu from "../components/ui/MENU/page";
import Footer from "../components/ui/Footer/page";
import Link from "next/link";


export default function Home() {
  
  return (
  
   <div className="font-sans bg-gray-50">


<Navbar/>
<Menu/>



  <section className="relative bg-pink-900 text-white">
   
    <img src="https://picsum.photos/1200/500?random=1" alt=""  className="w-full h-[500px] object-cover opacity-70"/>
  
    <div className="absolute inset-0 flex flex-col justify-center items-center text-center px-4">
      <h2 className="text-4xl md:text-5xl font-bold mb-4">Unlock Your Natural Glow</h2>
      <button className="bg-pink-600 shadow-lg px-6 py-3 rounded-md text-lg mt-4 hover:bg-pink-700">Shop Now</button>
    </div>
  </section>


  <section className="py-12 container mx-auto px-6 bg-white">
    <h3 className="text-2xl font-semibold text-center mb-8 text-black">Products' Categories</h3>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-white rounded-lg shadow hover:scale-105 transition p-6 text-center">

        <img src="https://picsum.photos/200/200?random=2" className="mx-auto mb-4" alt="" />
       
        <h4 className="font-bold text-black">Women Make Up</h4>
      </div>
      <div className="bg-white rounded-lg shadow hover:scale-105 transition p-6 text-center">
       
        <img src="https://picsum.photos/200/200?random=3" alt="" className="mx-auto mb-4" />
        <h4 className="font-bold text-black">Women Skincare</h4>
      </div>
      <div className="bg-white rounded-lg shadow hover:scale-105 transition p-6 text-center">
    
        <img src="https://picsum.photos/200/200?random=4"  className="mx-auto mb-4"  alt="" />
        <h4 className="font-bold text-black">Gifts & Sets</h4>
      </div>
    </div>
  </section>

  
  <section className="bg-pink-800 text-white py-10">
    <div className="container mx-auto flex flex-col md:flex-row items-center justify-between px-6">
      <div>
        <h3 className="text-2xl font-bold mb-3">NEW Virtual Skincare Analysis</h3>
        <p>Scan & Try Skincare Products That Suit Your Skin Best</p>
        <button className="bg-white text-pink-700 px-5 py-2 mt-4 rounded">Start a Free Quiz</button>
      </div>
      
      <img src="https://picsum.photos/200/200?random=5" alt="" className="mt-6 md:mt-0 md:ml-6 rounded shadow-md" />
    </div>
  </section>


  <div className="py-12 container mx-auto px-6 bg-white">
    <h3 className="text-2xl font-semibold text-center mb-8 text-black">Our Best Sellers</h3>
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
      <div className="bg-white rounded-lg shadow-xl hover:scale-105 transition p-4">

        <img src="https://picsum.photos/200/200?random=6" className="mx-auto" alt="" />
        <h4 className="mt-4 font-semibold text-black">Skincare Expert Tool</h4>
        <p className="text-pink-600 font-bold">$129.00</p>
      </div>
      <div className="bg-white rounded-lg shadow-xl  hover:scale-105 transition p-4">

        <img src="https://picsum.photos/200/200?random=7" alt=""  className="mx-auto" />

        <h4 className="mt-4 font-semibold text-black">Beauty Glow Stick</h4>
        <p className="text-pink-600 font-bold">$79.00</p>
      </div>
      <div className="bg-white rounded-lg shadow-xl hover:scale-105 transition p-4">

        <img src="https://picsum.photos/200/200?random=8" className="mx-auto" alt="" />
        <h4 className="mt-4 font-semibold text-black">Radiance Cream</h4>
        <p className="text-pink-600 font-bold">$110.00</p>
      </div>
      <div className="bg-white rounded-lg shadow-xl hover:scale-105 transition  p-4">
        
        <img src="https://picsum.photos/200/200?random=9" alt="" className="mx-auto" />
        <h4 className="mt-4 font-semibold text-black">Hydra Lip Balm</h4>
        <p className="text-pink-600 font-bold">$45.00</p>
      </div>
    </div>
  </div>
  <Footer/>

</div>  
   
  );

}
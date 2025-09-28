import { NextResponse } from 'next/server';
import connectDB from '../../../../../lib/mongodb';
import User from '../../../../../models/User';
import Product from '../../../../../models/Product';
import { withAuth } from '../../../../../lib/middleware';

// PUT - Add product to wishlist
async function addToWishlist(request, { params }) {
  try {
    await connectDB();
    
    const { productId } = params;
    const userId = request.user.id;

    const product = await Product.findById(productId);
    if (!product) {
      return NextResponse.json(
        { message: 'Product not found' },
        { status: 404 }
      );
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }
    
    if (user.preferences.wishlist.includes(productId)) {
      return NextResponse.json(
        { message: 'Product already in wishlist' },
        { status: 400 }
      );
    }
    
    user.preferences.wishlist.push(productId);
    await user.save();
    
    return NextResponse.json(
      { 
        message: 'Product added to wishlist', 
        wishlist: user.preferences.wishlist 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error adding to wishlist:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Remove product from wishlist
async function removeFromWishlist(request, { params }) {
  try {
    await connectDB();
    
    const { productId } = params;
    const userId = request.user.id;
    
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }
    
    const index = user.preferences.wishlist.indexOf(productId);
    if (index === -1) {
      return NextResponse.json(
        { message: 'Product not found in wishlist' },
        { status: 404 }
      );
    }
    
    user.preferences.wishlist.splice(index, 1);
    await user.save();
    
    return NextResponse.json(
      { 
        message: 'Product removed from wishlist', 
        wishlist: user.preferences.wishlist 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const PUT = withAuth(addToWishlist);
export const DELETE = withAuth(removeFromWishlist);
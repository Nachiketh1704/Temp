import { NextResponse } from 'next/server';
import connectDB from '../../../../lib/mongodb';
import User from '../../../../models/User';
import Product from '../../../../models/Product';
import { withAuth } from '../../../../lib/middleware';

// GET - Get all wishlist items
async function getWishlist(request) {
  try {
    await connectDB();
    
    const userId = request.user.id;
    const user = await User.findById(userId);
    
    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }
    
    const wishlistProducts = await Product.find({ 
      _id: { $in: user.preferences.wishlist } 
    });
    
    return NextResponse.json(
      { wishlist: wishlistProducts },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getWishlist);
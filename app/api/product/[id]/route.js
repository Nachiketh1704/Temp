import { NextResponse } from 'next/server';
import connectDB from '../../../../lib/mongodb';
import Product from '../../../../models/Product';
import { withAuth } from '../../../../lib/middleware';

// GET - Get single product
export async function GET(request, { params }) {
  try {
    await connectDB();
    
    const { id } = params;
    
    const product = await Product.findById(id)
      .populate('seller', 'fullName email phone');
    
    if (!product) {
      return NextResponse.json(
        { message: 'Product not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ product }, { status: 200 });
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update product (seller/admin only)
async function updateProduct(request, { params }) {
  try {
    await connectDB();
    
    const { id } = params;
    const updateData = await request.json();
    
    const product = await Product.findById(id);
    
    if (!product) {
      return NextResponse.json(
        { message: 'Product not found' },
        { status: 404 }
      );
    }
    
    // Check if user is the seller or admin
    if (product.seller.toString() !== request.user.id && 
        !['admin', 'superadmin'].includes(request.user.role)) {
      return NextResponse.json(
        { message: 'Access denied' },
        { status: 403 }
      );
    }
    
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: Date.now() },
      { new: true, runValidators: true }
    ).populate('seller', 'fullName email');
    
    return NextResponse.json(
      {
        message: 'Product updated successfully',
        product: updatedProduct
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete product (seller/admin only)
async function deleteProduct(request, { params }) {
  try {
    await connectDB();
    
    const { id } = params;
    
    const product = await Product.findById(id);
    
    if (!product) {
      return NextResponse.json(
        { message: 'Product not found' },
        { status: 404 }
      );
    }
    
    // Check if user is the seller or admin
    if (product.seller.toString() !== request.user.id && 
        !['admin', 'superadmin'].includes(request.user.role)) {
      return NextResponse.json(
        { message: 'Access denied' },
        { status: 403 }
      );
    }
    
    await Product.findByIdAndDelete(id);
    
    return NextResponse.json(
      { message: 'Product deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const PUT = withAuth(updateProduct, ['seller', 'admin', 'superadmin']);
export const DELETE = withAuth(deleteProduct, ['seller', 'admin', 'superadmin']);
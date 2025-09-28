import { NextResponse } from 'next/server';
import connectDB from '../../../lib/mongodb';
import Product from '../../../models/Product';
import { withAuth } from '../../../lib/middleware';

// GET - Get all products
export async function GET(request) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    
    let query = { isActive: true };
    
    if (category) {
      query.category = category;
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    const skip = (page - 1) * limit;
    
    const products = await Product.find(query)
      .populate('seller', 'fullName email')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
    
    const total = await Product.countDocuments(query);
    
    return NextResponse.json({
      products,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create new product (sellers only)
async function createProduct(request) {
  try {
    await connectDB();
    
    const {
      name,
      description,
      price,
      category,
      brand,
      images,
      stock
    } = await request.json();
    
    if (!name || !description || !price || !category || stock === undefined) {
      return NextResponse.json(
        { message: 'Name, description, price, category, and stock are required' },
        { status: 400 }
      );
    }
    
    const newProduct = new Product({
      name,
      description,
      price,
      category,
      brand: brand || '',
      images: images || [],
      stock,
      seller: request.user.id
    });
    
    await newProduct.save();
    
    return NextResponse.json(
      {
        message: 'Product created successfully',
        product: newProduct
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const POST = withAuth(createProduct, ['seller', 'admin', 'superadmin']);
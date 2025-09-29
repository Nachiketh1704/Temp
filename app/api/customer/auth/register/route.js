import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import prisma from '../../../../../lib/prisma';

export async function POST(request) {
  try {
    const { 
      companyName, 
      contactName, 
      email, 
      phone, 
      businessType, 
      description, 
      password, 
      confirmPassword 
    } = await request.json();

    // Validate required fields
    if (!companyName || !contactName || !email || !password || !confirmPassword) {
      return NextResponse.json(
        { message: "All required fields must be filled" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { message: "Please enter a valid email address" },
        { status: 400 }
      );
    }

    // Check password match
    if (password !== confirmPassword) {
      return NextResponse.json(
        { message: "Passwords do not match" },
        { status: 400 }
      );
    }

    // Check password strength
    if (password.length < 6) {
      return NextResponse.json(
        { message: "Password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "A user with this email already exists" },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Create user and vendor (without transaction for development)
    // Create user with VENDOR role first
    const newUser = await prisma.user.create({
      data: {
        name: contactName,
        email,
        password: hashedPassword,
        role: 'VENDOR',
      }
    });

    // Create vendor profile
    const newVendor = await prisma.vendor.create({
      data: {
        name: companyName,
        userId: newUser.id,
      }
    });

    const result = { user: newUser, vendor: newVendor };

    // Return success response without sensitive data
    return NextResponse.json(
      {
        message: "Vendor account created successfully",
        user: { 
          id: result.user.id, 
          name: result.user.name, 
          email: result.user.email,
          role: result.user.role
        }
      },
      { status: 201 }
    );

  } catch (error) {
    console.error("Error in vendor registration:", error);
    console.error("Error details:", {
      name: error.name,
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    
    // Handle Prisma unique constraint errors
    if (error.code === 'P2002') {
      return NextResponse.json(
        { message: "A user with this email already exists" },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { message: "Internal server error", error: error.message },
      { status: 500 }
    );
  }
}
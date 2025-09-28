import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectDB from '../../../../../lib/mongodb';
import User from '../../../../../models/User';

export async function POST(request) {
  try {
    await connectDB();
    
    const { fullName, email, password, cnfPassword, phone } = await request.json();

    if (!fullName || !email || !password || !cnfPassword || !phone) {
      return NextResponse.json(
        { message: "All fields are required" },
        { status: 400 }
      );
    }

    if (password !== cnfPassword) {
      return NextResponse.json(
        { message: "Passwords do not match" },
        { status: 400 }
      );
    }

    // Check for an existing user by email or phone.
    const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
    if (existingUser) {
      return NextResponse.json(
        { message: "A user with this email or phone number already exists." },
        { status: 409 }
      );
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create a new User instance. 
    const newUser = new User({
      fullName,
      email,
      phone,
      password: hashedPassword,
    });
    
    await newUser.save();

    return NextResponse.json(
      {
        message: "User registered successfully",
        user: { id: newUser._id, fullName: newUser.fullName, email: newUser.email }
      },
      { status: 201 }
    );

  } catch (error) {
    console.error("Error in customer registration:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
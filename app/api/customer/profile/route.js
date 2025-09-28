import { NextResponse } from 'next/server';
import connectDB from '../../../../lib/mongodb';
import User from '../../../../models/User';
import { withAuth } from '../../../../lib/middleware';
import bcrypt from 'bcryptjs';

// GET - Get customer profile
async function getProfile(request) {
  try {
    await connectDB();
    
    const userId = request.user.id;
    const user = await User.findById(userId).select('-password');

    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update customer profile
async function updateProfile(request) {
  try {
    await connectDB();
    
    const userId = request.user.id;
    const {
      fullName,
      phone,
      email,
      gender,
      dob,
      profileImage,
      addresses,
      preferences,
      password
    } = await request.json();

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    if (fullName) user.fullName = fullName;
    if (phone) user.phone = phone;
    if (email) user.email = email;
    if (gender) user.gender = gender;
    if (dob) user.dob = dob;
    if (profileImage) user.profileImage = profileImage;
    if (addresses) user.addresses = addresses;
    if (preferences) user.preferences = preferences;

    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    user.updatedAt = Date.now();
    await user.save();

    return NextResponse.json(
      {
        message: 'Profile updated successfully',
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          gender: user.gender,
          dob: user.dob,
          profileImage: user.profileImage,
          addresses: user.addresses,
          preferences: user.preferences
        }
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getProfile);
export const PUT = withAuth(updateProfile);
import { NextResponse } from "next/server";
import connectDB from "../../../lib/mongodb";
import Cart from "../../../models/Cart";
import Product from "../../../models/Product";
import { withAuth } from "../../../lib/middleware";

// GET - Get user's cart
async function getCart(request) {
  try {
    await connectDB();

    const userId = request.user.id;

    let cart = await Cart.findOne({ user: userId }).populate({
      path: "items.product",
      select: "name price images stock isActive",
    });

    if (!cart) {
      cart = new Cart({ user: userId, items: [], totalAmount: 0 });
      await cart.save();
    }

    return NextResponse.json({ cart }, { status: 200 });
  } catch (error) {
    console.error("Error fetching cart:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Add item
async function addToCart(request) {
  try {
    await connectDB();

    const { productId, quantity = 1 } = await request.json();
    const userId = request.user.id;

    if (!productId) {
      return NextResponse.json(
        { message: "Product ID is required" },
        { status: 400 }
      );
    }

    const product = await Product.findById(productId);
    if (!product) {
      return NextResponse.json(
        { message: "Product not found" },
        { status: 404 }
      );
    }

    if (!product.isActive) {
      return NextResponse.json(
        { message: "Product is not available" },
        { status: 400 }
      );
    }

    if (product.stock < quantity) {
      return NextResponse.json(
        { message: "Insufficient stock" },
        { status: 400 }
      );
    }

    let cart = await Cart.findOne({ user: userId });

    if (!cart) {
      cart = new Cart({ user: userId, items: [], totalAmount: 0 });
    }

    // Check if item already exists
    const existingItemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId
    );

    if (existingItemIndex > -1) {
      // Update quantity
      cart.items[existingItemIndex].quantity += quantity;
      cart.items[existingItemIndex].price = product.price;
    } else {
      // Add new item
      cart.items.push({
        product: productId,
        quantity,
        price: product.price,
      });
    }

    // Recalculate total
    cart.totalAmount = cart.items.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );

    cart.updatedAt = Date.now();
    await cart.save();

    // Populate and return updated cart
    await cart.populate({
      path: "items.product",
      select: "name price images stock isActive",
    });

    return NextResponse.json(
      {
        message: "Item added to cart successfully",
        cart,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error adding to cart:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getCart);
export const POST = withAuth(addToCart);

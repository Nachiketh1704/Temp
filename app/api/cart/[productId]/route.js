import { NextResponse } from "next/server";
import connectDB from "../../../../lib/mongodb";
import Cart from "../../../../models/Cart";
import { withAuth } from "../../../../lib/middleware";

// PUT - Update item quantity
async function updateCartItem(request, { params }) {
  try {
    await connectDB();

    const { productId } = params;
    const { quantity } = await request.json();
    const userId = request.user.id;

    if (!quantity || quantity < 1) {
      return NextResponse.json(
        { message: "Quantity must be at least 1" },
        { status: 400 }
      );
    }

    const cart = await Cart.findOne({ user: userId });

    if (!cart) {
      return NextResponse.json({ message: "Cart not found" }, { status: 404 });
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId
    );

    if (itemIndex === -1) {
      return NextResponse.json(
        { message: "Item not found in cart" },
        { status: 404 }
      );
    }

    cart.items[itemIndex].quantity = quantity;

    // Recalculate total
    cart.totalAmount = cart.items.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );

    cart.updatedAt = Date.now();
    await cart.save();

    await cart.populate({
      path: "items.product",
      select: "name price images stock isActive",
    });

    return NextResponse.json(
      {
        message: "Cart updated successfully",
        cart,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating cart:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Remove item
async function removeFromCart(request, { params }) {
  try {
    await connectDB();

    const { productId } = params;
    const userId = request.user.id;

    const cart = await Cart.findOne({ user: userId });

    if (!cart) {
      return NextResponse.json({ message: "Cart not found" }, { status: 404 });
    }

    cart.items = cart.items.filter(
      (item) => item.product.toString() !== productId
    );

    // Recalculate total
    cart.totalAmount = cart.items.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );

    cart.updatedAt = Date.now();
    await cart.save();

    await cart.populate({
      path: "items.product",
      select: "name price images stock isActive",
    });

    return NextResponse.json(
      {
        message: "Item removed from cart successfully",
        cart,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error removing from cart:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export const PUT = withAuth(updateCartItem);
export const DELETE = withAuth(removeFromCart);

import { NextResponse } from 'next/server';
import { getOrders, createOrder } from '@/lib/db';
import { verifyToken, unauthorizedResponse } from '@/lib/auth-middleware';

export async function GET(request) {
  // Vérifier le token JWT
  const authResult = verifyToken(request);
  
  if (authResult.error) {
    return unauthorizedResponse(authResult.error);
  }

  try {
    const orders = await getOrders(authResult.user.id, authResult.user.role);
    
    return NextResponse.json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    console.error('Error in GET /api/orders:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch orders',
        message: error.message
      },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  // Vérifier le token JWT
  const authResult = verifyToken(request);
  
  if (authResult.error) {
    return unauthorizedResponse(authResult.error);
  }

  try {
    const data = await request.json();
    
    // Validation
    if (!data.delivery_address || !data.items || data.items.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: delivery_address, items'
        },
        { status: 400 }
      );
    }
    
    // Si client, forcer user_id à son propre ID
    // Si admin/dispatcher, permettre de créer pour n'importe quel user
    const user_id = (authResult.user.role === 'client') 
      ? authResult.user.id 
      : (data.user_id || authResult.user.id);
    
    const order = await createOrder({
      ...data,
      user_id
    });
    
    return NextResponse.json({
      success: true,
      data: order
    }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/orders:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create order',
        message: error.message
      },
      { status: 500 }
    );
  }
}
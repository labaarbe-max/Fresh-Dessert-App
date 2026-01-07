import { NextResponse } from 'next/server';
import { getOrderById, updateOrder, deleteOrder } from '@/lib/db';
import { verifyToken, unauthorizedResponse, forbiddenResponse, verifyRole } from '@/lib/auth-middleware';

export async function GET(request, { params }) {
  // Vérifier le token JWT
  const authResult = verifyToken(request);
  
  if (authResult.error) {
    return unauthorizedResponse(authResult.error);
  }

  try {
    const { id } = await params;
    const order = await getOrderById(id, authResult.user.id, authResult.user.role);
    
    if (!order) {
      return NextResponse.json(
        {
          success: false,
          error: 'Order not found or access denied'
        },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Error in GET /api/orders/[id]:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch order',
        message: error.message
      },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  // Vérifier le token JWT
  const authResult = verifyToken(request);
  
  if (authResult.error) {
    return unauthorizedResponse(authResult.error);
  }

  try {
    const { id } = await params;
    const data = await request.json();
    
    // Vérifier que la commande existe et appartient à l'utilisateur (si client)
    const existingOrder = await getOrderById(id, authResult.user.id, authResult.user.role);
    
    if (!existingOrder) {
      return NextResponse.json(
        {
          success: false,
          error: 'Order not found or access denied'
        },
        { status: 404 }
      );
    }
    
    // Si client, vérifier que la commande est en pending
    if (authResult.user.role === 'client' && existingOrder.status !== 'pending') {
      return forbiddenResponse('Cannot modify order that is not pending');
    }
    
    const order = await updateOrder(id, data);
    
    return NextResponse.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Error in PUT /api/orders/[id]:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update order',
        message: error.message
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  // Vérifier le token JWT
  const authResult = verifyToken(request);
  
  if (authResult.error) {
    return unauthorizedResponse(authResult.error);
  }

  try {
    const { id } = await params;
    
    // Vérifier que la commande existe et appartient à l'utilisateur (si client)
    const existingOrder = await getOrderById(id, authResult.user.id, authResult.user.role);
    
    if (!existingOrder) {
      return NextResponse.json(
        {
          success: false,
          error: 'Order not found or access denied'
        },
        { status: 404 }
      );
    }
    
    // Si client, vérifier que la commande est en pending
    if (authResult.user.role === 'client' && existingOrder.status !== 'pending') {
      return forbiddenResponse('Cannot delete order that is not pending');
    }
    
    await deleteOrder(id);
    
    return NextResponse.json({
      success: true,
      message: 'Order deleted successfully'
    });
  } catch (error) {
    console.error('Error in DELETE /api/orders/[id]:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete order',
        message: error.message
      },
      { status: 500 }
    );
  }
}
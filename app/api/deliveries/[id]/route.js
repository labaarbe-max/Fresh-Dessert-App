import { NextResponse } from 'next/server';
import { getDeliveryById, updateDelivery, deleteDelivery } from '@/lib/db';
import { verifyToken, unauthorizedResponse, forbiddenResponse, verifyRole } from '@/lib/auth-middleware';

export async function GET(request, { params }) {
  // Vérifier le token JWT
  const authResult = verifyToken(request);
  
  if (authResult.error) {
    return unauthorizedResponse(authResult.error);
  }

  try {
    const { id } = await params;
    
    // Récupérer deliverer_id si l'utilisateur est un deliverer
    let delivererId = null;
    if (authResult.user.role === 'deliverer') {
      const pool = (await import('@/lib/db')).default;
      const [deliverers] = await pool.query(
        'SELECT id FROM deliverers WHERE user_id = ?',
        [authResult.user.id]
      );
      if (deliverers.length > 0) {
        delivererId = deliverers[0].id;
      }
    }
    
    const delivery = await getDeliveryById(id, delivererId, authResult.user.role);
    
    if (!delivery) {
      return NextResponse.json(
        {
          success: false,
          error: 'Delivery not found or access denied'
        },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: delivery
    });
  } catch (error) {
    console.error('Error in GET /api/deliveries/[id]:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch delivery',
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
    
    // Récupérer deliverer_id si l'utilisateur est un deliverer
    let delivererId = null;
    if (authResult.user.role === 'deliverer') {
      const pool = (await import('@/lib/db')).default;
      const [deliverers] = await pool.query(
        'SELECT id FROM deliverers WHERE user_id = ?',
        [authResult.user.id]
      );
      if (deliverers.length > 0) {
        delivererId = deliverers[0].id;
      }
    }
    
    // Vérifier que la tournée existe et appartient au deliverer (si deliverer)
    const existingDelivery = await getDeliveryById(id, delivererId, authResult.user.role);
    
    if (!existingDelivery) {
      return NextResponse.json(
        {
          success: false,
          error: 'Delivery not found or access denied'
        },
        { status: 404 }
      );
    }
    
    // Si deliverer, il peut seulement modifier le statut
    if (authResult.user.role === 'deliverer') {
      if (data.deliverer_id || data.delivery_date) {
        return forbiddenResponse('Deliverers can only update status');
      }
    }
    
    const delivery = await updateDelivery(id, data);
    
    return NextResponse.json({
      success: true,
      data: delivery
    });
  } catch (error) {
    console.error('Error in PUT /api/deliveries/[id]:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update delivery',
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

  // Seuls admin et dispatcher peuvent supprimer des tournées
  const roleCheck = verifyRole(authResult.user, ['admin', 'dispatcher']);
  if (roleCheck.error) {
    return forbiddenResponse(roleCheck.error);
  }

  try {
    const { id } = await params;
    
    // Vérifier que la tournée existe
    const existingDelivery = await getDeliveryById(id);
    
    if (!existingDelivery) {
      return NextResponse.json(
        {
          success: false,
          error: 'Delivery not found'
        },
        { status: 404 }
      );
    }
    
    await deleteDelivery(id);
    
    return NextResponse.json({
      success: true,
      message: 'Delivery deleted successfully'
    });
  } catch (error) {
    console.error('Error in DELETE /api/deliveries/[id]:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete delivery',
        message: error.message
      },
      { status: 500 }
    );
  }
}
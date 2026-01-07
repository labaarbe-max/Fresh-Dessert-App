import { NextResponse } from 'next/server';
import { getDeliveries, createDelivery } from '@/lib/db';
import { verifyToken, unauthorizedResponse, verifyRole, forbiddenResponse } from '@/lib/auth-middleware';

export async function GET(request) {
  // Vérifier le token JWT
  const authResult = verifyToken(request);
  
  if (authResult.error) {
    return unauthorizedResponse(authResult.error);
  }

  try {
    // Récupérer deliverer_id si l'utilisateur est un deliverer
    let delivererId = null;
    if (authResult.user.role === 'deliverer') {
      // Récupérer l'ID du deliverer depuis la table deliverers
      const { getUserByEmail } = await import('@/lib/db');
      const pool = (await import('@/lib/db')).default;
      const [deliverers] = await pool.query(
        'SELECT id FROM deliverers WHERE user_id = ?',
        [authResult.user.id]
      );
      if (deliverers.length > 0) {
        delivererId = deliverers[0].id;
      }
    }
    
    const deliveries = await getDeliveries(delivererId, authResult.user.role);
    
    return NextResponse.json({
      success: true,
      count: deliveries.length,
      data: deliveries
    });
  } catch (error) {
    console.error('Error in GET /api/deliveries:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch deliveries',
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

  // Seuls admin et dispatcher peuvent créer des tournées
  const roleCheck = verifyRole(authResult.user, ['admin', 'dispatcher']);
  if (roleCheck.error) {
    return forbiddenResponse(roleCheck.error);
  }

  try {
    const data = await request.json();
    
    // Validation
    if (!data.deliverer_id || !data.delivery_date) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: deliverer_id, delivery_date'
        },
        { status: 400 }
      );
    }
    
    const delivery = await createDelivery(data);
    
    return NextResponse.json({
      success: true,
      data: delivery
    }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/deliveries:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create delivery',
        message: error.message
      },
      { status: 500 }
    );
  }
}
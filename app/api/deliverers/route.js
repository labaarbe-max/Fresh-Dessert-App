import { NextResponse } from 'next/server';
import { getDeliverers } from '@/lib/db';
import { verifyToken, unauthorizedResponse, forbiddenResponse, verifyRole } from '@/lib/auth-middleware';

export async function GET(request) {
  // Vérifier le token JWT
  const authResult = verifyToken(request);
  
  if (authResult.error) {
    return unauthorizedResponse(authResult.error);
  }

  // Vérifier le rôle (seuls admin et dispatcher peuvent voir les livreurs)
  const roleCheck = verifyRole(authResult.user, ['admin', 'dispatcher']);
  if (roleCheck.error) {
    return forbiddenResponse(roleCheck.error);
  }

  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('activeOnly') === 'true';
    
    const deliverers = await getDeliverers(activeOnly);
    
    return NextResponse.json({
      success: true,
      count: deliverers.length,
      data: deliverers,
      requestedBy: {
        id: authResult.user.id,
        email: authResult.user.email,
        role: authResult.user.role
      }
    });
  } catch (error) {
    console.error('Error in GET /api/deliverers:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch deliverers',
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

  // Vérifier le rôle (seuls admin et dispatcher peuvent créer des livreurs)
  const roleCheck = verifyRole(authResult.user, ['admin', 'dispatcher']);
  if (roleCheck.error) {
    return forbiddenResponse(roleCheck.error);
  }

  try {
    const data = await request.json();
    
    // Validation des champs requis
    if (!data.user_id || !data.vehicle_type) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: user_id, vehicle_type'
        },
        { status: 400 }
      );
    }
    
    const deliverer = await createDeliverer(data);
    
    return NextResponse.json({
      success: true,
      data: deliverer
    }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/deliverers:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create deliverer',
        message: error.message
      },
      { status: 500 }
    );
  }
}
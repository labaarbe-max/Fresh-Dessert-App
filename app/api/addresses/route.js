import { NextResponse } from 'next/server';
import { getAddresses, createAddress } from '@/lib/db';
import { verifyToken, unauthorizedResponse } from '@/lib/auth-middleware';

export async function GET(request) {
  // Vérifier le token JWT
  const authResult = verifyToken(request);
  
  if (authResult.error) {
    return unauthorizedResponse(authResult.error);
  }

  try {
    // Récupérer les adresses de l'utilisateur connecté
    const addresses = await getAddresses(authResult.user.id);
    
    return NextResponse.json({
      success: true,
      count: addresses.length,
      data: addresses
    });
  } catch (error) {
    console.error('Error in GET /api/addresses:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch addresses',
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
    
    // Validation des champs requis
    if (!data.street_address || !data.city || !data.postal_code) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: street_address, city, postal_code'
        },
        { status: 400 }
      );
    }
    
    // Forcer le user_id à celui de l'utilisateur connecté
    const addressData = {
      ...data,
      user_id: authResult.user.id
    };
    
    const address = await createAddress(addressData);
    
    return NextResponse.json({
      success: true,
      data: address
    }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/addresses:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create address',
        message: error.message
      },
      { status: 500 }
    );
  }
}
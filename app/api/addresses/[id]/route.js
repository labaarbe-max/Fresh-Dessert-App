import { NextResponse } from 'next/server';
import { getAddressById, updateAddress, deleteAddress } from '@/lib/db';
import { verifyToken, unauthorizedResponse } from '@/lib/auth-middleware';

export async function GET(request, { params }) {
  // Vérifier le token JWT
  const authResult = verifyToken(request);
  
  if (authResult.error) {
    return unauthorizedResponse(authResult.error);
  }

  try {
    const { id } = await params;
    
    // Récupérer l'adresse (seulement si elle appartient à l'utilisateur)
    const address = await getAddressById(id, authResult.user.id);
    
    if (!address) {
      return NextResponse.json(
        {
          success: false,
          error: 'Address not found'
        },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: address
    });
  } catch (error) {
    console.error('Error in GET /api/addresses/[id]:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch address',
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
    
    // Vérifier que l'adresse existe et appartient à l'utilisateur
    const existingAddress = await getAddressById(id, authResult.user.id);
    
    if (!existingAddress) {
      return NextResponse.json(
        {
          success: false,
          error: 'Address not found'
        },
        { status: 404 }
      );
    }
    
    const address = await updateAddress(id, authResult.user.id, data);
    
    return NextResponse.json({
      success: true,
      data: address
    });
  } catch (error) {
    console.error('Error in PUT /api/addresses/[id]:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update address',
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
    
    // Vérifier que l'adresse existe et appartient à l'utilisateur
    const existingAddress = await getAddressById(id, authResult.user.id);
    
    if (!existingAddress) {
      return NextResponse.json(
        {
          success: false,
          error: 'Address not found'
        },
        { status: 404 }
      );
    }
    
    await deleteAddress(id, authResult.user.id);
    
    return NextResponse.json({
      success: true,
      message: 'Address deleted successfully'
    });
  } catch (error) {
    console.error('Error in DELETE /api/addresses/[id]:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete address',
        message: error.message
      },
      { status: 500 }
    );
  }
}
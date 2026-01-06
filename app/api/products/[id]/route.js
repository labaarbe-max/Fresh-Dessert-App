import { NextResponse } from 'next/server';
import { getProductById, updateProduct, deleteProduct } from '@/lib/db';
import { verifyToken, unauthorizedResponse, forbiddenResponse, verifyRole } from '@/lib/auth-middleware';

export async function GET(request, { params }) {
  // Vérifier le token JWT
  const authResult = verifyToken(request);
  
  if (authResult.error) {
    return unauthorizedResponse(authResult.error);
  }

  try {
    const { id } = await params;
    const product = await getProductById(id);
    
    if (!product) {
      return NextResponse.json(
        {
          success: false,
          error: 'Product not found'
        },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Error in GET /api/products/[id]:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch product',
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

  // Seuls admin et dispatcher peuvent modifier des produits
  const roleCheck = verifyRole(authResult.user, ['admin', 'dispatcher']);
  if (roleCheck.error) {
    return forbiddenResponse(roleCheck.error);
  }

  try {
    const { id } = await params;
    const data = await request.json();
    
    const existingProduct = await getProductById(id);
    if (!existingProduct) {
      return NextResponse.json(
        {
          success: false,
          error: 'Product not found'
        },
        { status: 404 }
      );
    }
    
    const product = await updateProduct(id, data);
    
    return NextResponse.json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Error in PUT /api/products/[id]:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update product',
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

  // Seuls admin et dispatcher peuvent supprimer des produits
  const roleCheck = verifyRole(authResult.user, ['admin', 'dispatcher']);
  if (roleCheck.error) {
    return forbiddenResponse(roleCheck.error);
  }

  try {
    const { id } = await params;
    
    const existingProduct = await getProductById(id);
    if (!existingProduct) {
      return NextResponse.json(
        {
          success: false,
          error: 'Product not found'
        },
        { status: 404 }
      );
    }
    
    await deleteProduct(id);
    
    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Error in DELETE /api/products/[id]:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete product',
        message: error.message
      },
      { status: 500 }
    );
  }
}
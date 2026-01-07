import { NextResponse } from 'next/server';
import { getDeliveryStocks } from '@/lib/db';
import { verifyToken, unauthorizedResponse, checkRole } from '@/lib/auth-middleware';

export async function GET(request, { params }) {
  // Vérifier le token JWT
  const authResult = verifyToken(request);
  
  if (authResult.error) {
    return unauthorizedResponse(authResult.error);
  }

  try {
    const { id } = await params;
    
    // Récupérer les stocks de la tournée
    const stocks = await getDeliveryStocks(id);
    
    return NextResponse.json({
      success: true,
      count: stocks.length,
      data: stocks
    });
  } catch (error) {
    console.error('Error in GET /api/stocks/delivery/[id]:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch delivery stocks',
        message: error.message
      },
      { status: 500 }
    );
  }
}
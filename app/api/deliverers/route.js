import { NextResponse } from 'next/server';
import { getDeliverers } from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('activeOnly') === 'true';
    
    const deliverers = await getDeliverers(activeOnly);
    
    return NextResponse.json({
      success: true,
      count: deliverers.length,
      data: deliverers
    });
  } catch (error) {
    console.error('Error in /api/deliverers:', error);
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
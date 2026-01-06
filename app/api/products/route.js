import { NextResponse } from 'next/server';
import { getProducts, createProduct } from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('activeOnly') === 'true';
    const category = searchParams.get('category');
    
    const products = await getProducts(activeOnly, category);
    
    return NextResponse.json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    console.error('Error in GET /api/products:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch products',
        message: error.message
      },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    
    if (!data.name || !data.category || !data.price) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: name, category, price'
        },
        { status: 400 }
      );
    }
    
    const product = await createProduct(data);
    
    return NextResponse.json({
      success: true,
      data: product
    }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/products:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create product',
        message: error.message
      },
      { status: 500 }
    );
  }
}
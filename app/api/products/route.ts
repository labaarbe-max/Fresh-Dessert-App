import { withAuth } from '@/lib/api-middleware';
import { createSuccessResponse, handleApiError } from '@/lib/error-handler';
import { getProducts, createProduct } from '@/lib/db';
import { validateProductData } from '@/lib/validation';
import type { CreateProductDTO } from '@/types';

export const GET = withAuth(async (request, user) => {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('activeOnly') === 'true';
    const category = searchParams.get('category');
    
    const products = await getProducts(activeOnly, category) as any[];
    
    return createSuccessResponse(
      products,
      { 
        count: products.length, 
        category, 
        activeOnly 
      },
      200
    );
  } catch (error) {
    return handleApiError(error, 'Get Products');
  }
}, ['admin', 'dispatcher', 'deliverer', 'client']);

export const POST = withAuth(async (request, user) => {
  try {
    const data = await request.json() as CreateProductDTO;
    
    // Validation centralisée
    const validation = validateProductData(data);
    if (validation.error) {
      return handleApiError(validation.error, 'Create Product');
    }
    
    const product = await createProduct(data);
    
    return createSuccessResponse(
      product,
      { message: 'Product created successfully' },
      201
    );
  } catch (error) {
    return handleApiError(error, 'Create Product');
  }
}, ['admin', 'dispatcher']);
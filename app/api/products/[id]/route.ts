import { withAuth } from '@/lib/api-middleware';
import { createSuccessResponse, handleApiError } from '@/lib/error-handler';
import { getProductById, updateProduct, deleteProduct } from '@/lib/db';
import { validateProductData } from '@/lib/validation';
import type { UpdateProductDTO } from '@/types';

export const GET = withAuth(async (request, user, { params }) => {
  try {
    const id = parseInt(params.id);
    const product = await getProductById(id);
    
    if (!product) {
      const error: any = new Error('Product not found');
      error.statusCode = 404;
      return handleApiError(error, 'Get Product');
    }
    
    return createSuccessResponse(product, null, 200);
  } catch (error) {
    return handleApiError(error, 'Get Product');
  }
}, ['admin', 'dispatcher', 'deliverer', 'client']);

export const PUT = withAuth(async (request, user, { params }) => {
  try {
    const id = parseInt(params.id);
    const data = await request.json() as UpdateProductDTO;
    
    // Validation centralisée
    const validation = validateProductData(data);
    if (validation.error) {
      return handleApiError(validation.error, 'Update Product');
    }
    
    // Vérifier que le produit existe
    const existingProduct = await getProductById(id);
    if (!existingProduct) {
      const error: any = new Error('Product not found');
      error.statusCode = 404;
      return handleApiError(error, 'Update Product');
    }
    
    const product = await updateProduct(id, data);
    
    return createSuccessResponse(
      product,
      { message: 'Product updated successfully' },
      200
    );
  } catch (error) {
    return handleApiError(error, 'Update Product');
  }
}, ['admin', 'dispatcher']);

export const DELETE = withAuth(async (request, user, { params }) => {
  try {
    const id = parseInt(params.id);
    
    // Vérifier que le produit existe
    const existingProduct = await getProductById(id);
    if (!existingProduct) {
      const error: any = new Error('Product not found');
      error.statusCode = 404;
      return handleApiError(error, 'Delete Product');
    }
    
    await deleteProduct(id);
    
    return createSuccessResponse(
      { id },
      { message: 'Product deleted successfully' },
      200
    );
  } catch (error) {
    return handleApiError(error, 'Delete Product');
  }
}, ['admin', 'dispatcher']);
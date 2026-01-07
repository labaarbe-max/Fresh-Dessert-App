import { withAuth } from '@/lib/api-middleware';
import { createSuccessResponse, handleApiError } from '@/lib/error-handler';
import { getProductById, updateProduct, deleteProduct } from '@/lib/db';
import { validateProductData } from '@/lib/validation';

export const GET = withAuth(async (request, user) => {
  try {
    const { id } = await params;
    const product = await getProductById(id);
    
    if (!product) {
      return handleApiError(new Error('Product not found'), 'Get Product');
    }
    
    return createSuccessResponse(product, null, 200);
  } catch (error) {
    return handleApiError(error, 'Get Product');
  }
}, ['admin', 'dispatcher', 'deliverer', 'client']);

export const PUT = withAuth(async (request, user) => {
  try {
    const { id } = await params;
    const data = await request.json();
    
    // Validation centralisée
    const validation = validateProductData(data);
    if (validation.error) {
      return handleApiError(validation.error, 'Update Product');
    }
    
    // Vérifier que le produit existe
    const existingProduct = await getProductById(id);
    if (!existingProduct) {
      return handleApiError(new Error('Product not found'), 'Update Product');
    }
    
    const product = await updateProduct(id, data);
    
    return createSuccessResponse(
      product, 
      'Product updated successfully', 
      200
    );
  } catch (error) {
    return handleApiError(error, 'Update Product');
  }
}, ['admin', 'dispatcher']);

export const DELETE = withAuth(async (request, user) => {
  try {
    const { id } = await params;
    
    // Vérifier que le produit existe
    const existingProduct = await getProductById(id);
    if (!existingProduct) {
      return handleApiError(new Error('Product not found'), 'Delete Product');
    }
    
    await deleteProduct(id);
    
    return createSuccessResponse(
      null, 
      'Product deleted successfully', 
      200
    );
  } catch (error) {
    return handleApiError(error, 'Delete Product');
  }
}, ['admin', 'dispatcher']);
import { withAuth } from '@/lib/api-middleware';
import { createSuccessResponse, handleApiError } from '@/lib/error-handler';
import { getStockById, updateDeliveryStock, deleteDeliveryStock } from '@/lib/db';
import { validateStockUpdate } from '@/lib/validation';
import type { UpdateStockDTO } from '@/types';

export const GET = withAuth(async (request, user, { params }) => {
  try {
    const id = parseInt(params.id);
    
    const stock = await getStockById(id);
    
    if (!stock) {
      const error: any = new Error('Stock not found');
      error.statusCode = 404;
      return handleApiError(error, 'Get Stock');
    }
    
    return createSuccessResponse(stock, {}, 200);
  } catch (error) {
    return handleApiError(error, 'Get Stock');
  }
}, ['admin', 'dispatcher', 'deliverer', 'client']);

export const PUT = withAuth(async (request, user, { params }) => {
  try {
    const id = parseInt(params.id);
    const data = await request.json() as UpdateStockDTO;
    
    const validation = validateStockUpdate(data);
    if (validation.error) {
      return handleApiError(validation.error, 'Update Stock');
    }
    
    // Vérifier que le stock existe
    const existingStock = await getStockById(id);
    if (!existingStock) {
      const error: any = new Error('Stock not found');
      error.statusCode = 404;
      return handleApiError(error, 'Update Stock');
    }
    
    const stock = await updateDeliveryStock(id, data);
    
    return createSuccessResponse(
      stock,
      { message: 'Stock updated successfully' },
      200
    );
  } catch (error) {
    return handleApiError(error, 'Update Stock');
  }
}, ['admin', 'dispatcher']);

export const DELETE = withAuth(async (request, user, { params }) => {
  try {
    const id = parseInt(params.id);
    
    // Vérifier que le stock existe
    const existingStock = await getStockById(id);
    if (!existingStock) {
      const error: any = new Error('Stock not found');
      error.statusCode = 404;
      return handleApiError(error, 'Delete Stock');
    }
    
    await deleteDeliveryStock(id);
    
    return createSuccessResponse(
      { id },
      { message: 'Stock deleted successfully' },
      200
    );
  } catch (error) {
    return handleApiError(error, 'Delete Stock');
  }
}, ['admin', 'dispatcher']);
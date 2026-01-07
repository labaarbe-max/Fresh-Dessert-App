import { withAuth } from '@/lib/api-middleware';
import { createSuccessResponse, handleApiError } from '@/lib/error-handler';
import { getStockById, updateDeliveryStock, deleteDeliveryStock } from '@/lib/db';

export const GET = withAuth(async (request, user) => {
  try {
    const { id } = await params;
    
    const stock = await getStockById(id);
    
    if (!stock) {
      return handleApiError(new Error('Stock not found'), 'Get Stock');
    }
    
    return createSuccessResponse(stock, null, 200);
  } catch (error) {
    return handleApiError(error, 'Get Stock');
  }
}, ['admin', 'dispatcher', 'deliverer', 'client']);

export const PUT = withAuth(async (request, user) => {
  try {
    const { id } = await params;
    const data = await request.json();
    
    // Vérifier que le stock existe
    const existingStock = await getStockById(id);
    if (!existingStock) {
      return handleApiError(new Error('Stock not found'), 'Update Stock');
    }
    
    const stock = await updateDeliveryStock(id, data);
    
    return createSuccessResponse(stock, 'Stock updated successfully', 200);
  } catch (error) {
    return handleApiError(error, 'Update Stock');
  }
}, ['admin', 'dispatcher']);

export const DELETE = withAuth(async (request, user) => {
  try {
    const { id } = await params;
    
    // Vérifier que le stock existe
    const existingStock = await getStockById(id);
    if (!existingStock) {
      return handleApiError(new Error('Stock not found'), 'Delete Stock');
    }
    
    await deleteDeliveryStock(id);
    
    return createSuccessResponse(null, 'Stock deleted successfully', 200);
  } catch (error) {
    return handleApiError(error, 'Delete Stock');
  }
}, ['admin', 'dispatcher']);
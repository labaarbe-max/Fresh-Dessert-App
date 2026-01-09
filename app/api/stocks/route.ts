import { withAuth } from '@/lib/api-middleware';
import { createSuccessResponse, handleApiError } from '@/lib/error-handler';
import { createDeliveryStock, bulkCreateDeliveryStocks } from '@/lib/db';
import { validateStockData, validateBulkStockData } from '@/lib/validation';
import type { CreateStockDTO, BulkStockDTO } from '@/types';

export const POST = withAuth(async (request, user) => {
  try {
    const data = await request.json();

    // Création en masse (bulk)
    if (data.stocks && Array.isArray(data.stocks)) {
      const bulkData = data as BulkStockDTO;
      
      const validation = validateBulkStockData(bulkData);
      if (validation.error) {
        return handleApiError(validation.error, 'Create Bulk Stocks');
      }

      const result = await bulkCreateDeliveryStocks(bulkData.delivery_id, bulkData.stocks);

      return createSuccessResponse(
        result,
        { 
          message: `${(result as any).insertedCount} stocks created successfully`
        },
        201
      );
    }

    // Création unitaire
    const stockData = data as CreateStockDTO;
    
    const validation = validateStockData(stockData);
    if (validation.error) {
      return handleApiError(validation.error, 'Create Stock');
    }

    const stock = await createDeliveryStock(stockData);

    return createSuccessResponse(
      stock,
      { message: 'Stock created successfully' },
      201
    );
  } catch (error) {
    return handleApiError(error, 'Create Stock');
  }
}, ['admin', 'dispatcher']);
import { withAuth } from '@/lib/api-middleware';
import { createSuccessResponse, handleApiError } from '@/lib/error-handler';
import { createDeliveryStock, bulkCreateDeliveryStocks } from '@/lib/db';
import { validateStockData, validateBulkStockData, stockSchema, bulkStockSchema } from '@/lib/validation';
import { z } from 'zod';

export const POST = withAuth(async (request, user) => {
  try {
    const data = await request.json();

    // Création en masse (bulk)
    if (data.stocks && Array.isArray(data.stocks)) {
      const validation = validateBulkStockData(data);
      if (validation.error) {
        return handleApiError(validation.error, 'Create Bulk Stocks');
      }
      const bulkData = validation.data as z.infer<typeof bulkStockSchema>;

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
    const validation = validateStockData(data);
    if (validation.error) {
      return handleApiError(validation.error, 'Create Stock');
    }
    const stockData = validation.data as z.infer<typeof stockSchema>;
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
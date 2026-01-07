import { withAuth } from '@/lib/api-middleware';
import { createSuccessResponse, handleApiError } from '@/lib/error-handler';
import { createDeliveryStock, bulkCreateDeliveryStocks } from '@/lib/db';

export const POST = withAuth(async (request, user) => {
  try {
    const data = await request.json();

    // Création en masse (bulk)
    if (data.stocks && Array.isArray(data.stocks)) {
      // Validation
      if (!data.delivery_id) {
        return handleApiError(new Error('Missing required field: delivery_id'), 'Create Bulk Stocks');
      }

      const result = await bulkCreateDeliveryStocks(data.delivery_id, data.stocks);

      return createSuccessResponse(
        result, 
        `${result.insertedCount} stocks created successfully`, 
        201
      );
    }

    // Création unitaire
    if (!data.delivery_id || !data.product_id || !data.initial_quantity) {
      return handleApiError(
        new Error('Missing required fields: delivery_id, product_id, initial_quantity'), 
        'Create Stock'
      );
    }

    const stock = await createDeliveryStock(data);

    return createSuccessResponse(stock, 'Stock created successfully', 201);
  } catch (error) {
    return handleApiError(error, 'Create Stock');
  }
}, ['admin', 'dispatcher']);
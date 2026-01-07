import { withAuth } from '@/lib/api-middleware';
import { createSuccessResponse, handleApiError } from '@/lib/error-handler';
import { StockService } from '@/lib/stock-service';

export const GET = withAuth(async (request, user) => {
  try {
    const { searchParams } = new URL(request.url);
    const deliveryId = searchParams.get('delivery_id');
    
    if (!deliveryId) {
      return handleApiError(new Error('delivery_id parameter is required'), 'Tour Stats');
    }
    
    const performance = await StockService.calculateTourPerformance(parseInt(deliveryId));
    const soldProducts = await StockService.getTourSoldProducts(parseInt(deliveryId));
    
    return createSuccessResponse({
      performance,
      sold_products: soldProducts
    }, null, 200);
  } catch (error) {
    return handleApiError(error, 'Tour Stats');
  }
}, ['admin', 'dispatcher']);
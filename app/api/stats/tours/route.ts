import { withAuth } from '@/lib/api-middleware';
import { createSuccessResponse, handleApiError } from '@/lib/error-handler';
import { StockService } from '@/lib/stock-service';

export const GET = withAuth(async (request, user) => {
  try {
    const { searchParams } = new URL(request.url);
    const deliveryId = searchParams.get('delivery_id');
    
    if (!deliveryId) {
      const error: any = new Error('delivery_id parameter is required');
      error.statusCode = 400;
      return handleApiError(error, 'Tour Stats');
    }
    
    const performance = await StockService.calculateTourPerformance(parseInt(deliveryId));
    const soldProducts = await StockService.getTourSoldProducts(parseInt(deliveryId));
    
    return createSuccessResponse(
      {
        performance,
        sold_products: soldProducts
      },
      { 
        delivery_id: parseInt(deliveryId),
        requested_by: user.role
      },
      200
    );
  } catch (error) {
    return handleApiError(error, 'Tour Stats');
  }
}, ['admin', 'dispatcher', 'deliverer']);
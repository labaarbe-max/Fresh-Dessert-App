import { withAuth } from '@/lib/api-middleware';
import { createSuccessResponse, handleApiError } from '@/lib/error-handler';
import { StockService } from '@/lib/stock-service';

export const GET = withAuth(async (request, user) => {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'month';
    
    const stats = await StockService.getGlobalStockStats(period);
    
    return createSuccessResponse(stats, null, 200);
  } catch (error) {
    return handleApiError(error, 'Stock Stats');
  }
}, ['admin', 'dispatcher']);
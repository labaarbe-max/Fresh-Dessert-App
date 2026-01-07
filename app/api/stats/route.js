import { withAuth } from '@/lib/api-middleware';
import { createSuccessResponse, handleApiError } from '@/lib/error-handler';
import { getDashboardStats, getRevenueStats, getTopProducts, getDelivererPerformanceStats } from '@/lib/db';
import { StockService } from '@/lib/stock-service';

export const GET = withAuth(async (request, user) => {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'dashboard';
    const period = searchParams.get('period') || 'month';
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || 10)));
    
    let data;
    
    switch (type) {
      case 'dashboard':
        data = await getDashboardStats();
        break;
      case 'revenue':
        data = await getRevenueStats(period, searchParams.get('start_date'), searchParams.get('end_date'));
        break;
      case 'products':
        data = await getTopProducts(limit, period);
        break;
      case 'deliverers':
        data = await getDelivererPerformanceStats(period);
        break;
      case 'stocks':
        data = await StockService.getGlobalStockStats(period);
        break;
      default:
        return handleApiError(new Error(`Invalid stats type: ${type}`), 'Stats');
    }
    
    return createSuccessResponse(data, { type, period }, 200);
  } catch (error) {
    return handleApiError(error, 'Stats');
  }
}, ['admin', 'dispatcher']);
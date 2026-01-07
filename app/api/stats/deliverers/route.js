import { withAuth } from '@/lib/api-middleware';
import { createSuccessResponse, handleApiError } from '@/lib/error-handler';
import { getDelivererPerformanceStats } from '@/lib/db';

export const GET = withAuth(async (request, user) => {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'month';
    
    const stats = await getDelivererPerformanceStats(period);
    
    return createSuccessResponse(stats, null, 200);
  } catch (error) {
    return handleApiError(error, 'Deliverer Stats');
  }
}, ['admin', 'dispatcher']);
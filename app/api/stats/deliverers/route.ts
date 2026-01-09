import { withAuth } from '@/lib/api-middleware';
import { createSuccessResponse, handleApiError } from '@/lib/error-handler';
import { getDelivererPerformanceStats } from '@/lib/db';
import { validateStatsParams } from '@/lib/validation';

export const GET = withAuth(async (request, user) => {
  try {
    const { searchParams } = new URL(request.url);
    const params = validateStatsParams({
      period: searchParams.get('period') || undefined,
      start_date: searchParams.get('start_date') || undefined,
      end_date: searchParams.get('end_date') || undefined
    });
    
    const stats = await getDelivererPerformanceStats(params.period);
    
    return createSuccessResponse(
      stats,
      { 
        period: params.period,
        requested_by: user.role
      },
      200
    );
  } catch (error) {
    return handleApiError(error, 'Get Deliverer Stats');
  }
}, ['admin', 'dispatcher']);
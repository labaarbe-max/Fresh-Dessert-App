import { withAuth } from '@/lib/api-middleware';
import { createSuccessResponse, handleApiError } from '@/lib/error-handler';
import { getRevenueStats } from '@/lib/db';

export const GET = withAuth(async (request, user) => {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'month';
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    
    const stats = await getRevenueStats(period, startDate, endDate);
    
    return createSuccessResponse(stats, null, 200);
  } catch (error) {
    return handleApiError(error, 'Revenue Stats');
  }
}, ['admin', 'dispatcher']);
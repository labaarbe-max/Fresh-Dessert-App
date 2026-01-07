import { withAuth } from '@/lib/api-middleware';
import { createSuccessResponse, handleApiError } from '@/lib/error-handler';
import { getTopProducts } from '@/lib/db';

export const GET = withAuth(async (request, user) => {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || 10)));
    const period = searchParams.get('period') || 'month';
    
    const stats = await getTopProducts(limit, period);
    
    return createSuccessResponse(stats, null, 200);
  } catch (error) {
    return handleApiError(error, 'Products Stats');
  }
}, ['admin', 'dispatcher']);
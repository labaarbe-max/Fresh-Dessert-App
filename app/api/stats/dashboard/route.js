import { withAuth } from '@/lib/api-middleware';
import { createSuccessResponse, handleApiError } from '@/lib/error-handler';
import { getDashboardStats } from '@/lib/db';

export const GET = withAuth(async (request, user) => {
  try {
    const stats = await getDashboardStats();
    
    return createSuccessResponse(stats, null, 200);
  } catch (error) {
    return handleApiError(error, 'Dashboard Stats');
  }
}, ['admin', 'dispatcher']);
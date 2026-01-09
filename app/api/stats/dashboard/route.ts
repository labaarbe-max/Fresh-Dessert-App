import { withAuth } from '@/lib/api-middleware';
import { createSuccessResponse, handleApiError } from '@/lib/error-handler';
import { getDashboardStats } from '@/lib/db';

export const GET = withAuth(async (request, user) => {
  try {
    const stats = await getDashboardStats();
    
    return createSuccessResponse(
      stats,
      { 
        requested_by: user.role,
        timestamp: new Date().toISOString()
      },
      200
    );
  } catch (error) {
    return handleApiError(error, 'Get Dashboard Stats');
  }
}, ['admin', 'dispatcher']);
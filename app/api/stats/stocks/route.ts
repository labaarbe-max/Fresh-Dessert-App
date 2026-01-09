import { withAuth } from '@/lib/api-middleware';
import { createSuccessResponse, handleApiError } from '@/lib/error-handler';
import { getStockStats } from '@/lib/db';

export const GET = withAuth(async (request, user) => {
  try {
    const { searchParams } = new URL(request.url);
    const deliveryId = searchParams.get('delivery_id');
    
    const stats = await getStockStats(deliveryId ? parseInt(deliveryId) : null);
    
    return createSuccessResponse(
      stats,
      { 
        delivery_id: deliveryId ? parseInt(deliveryId) : null,
        scope: deliveryId ? 'specific_delivery' : 'today_all_deliveries',
        requested_by: user.role,
        timestamp: new Date().toISOString()
      },
      200
    );
  } catch (error) {
    return handleApiError(error, 'Get Stock Stats');
  }
}, ['admin', 'dispatcher', 'deliverer']);
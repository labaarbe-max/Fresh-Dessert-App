import { withAuth } from '@/lib/api-middleware';
import { createSuccessResponse, handleApiError } from '@/lib/error-handler';
import { getDeliveryStocks } from '@/lib/db';

export const GET = withAuth(async (request, user) => {
  try {
    const { id } = await params;
    
    // Récupérer les stocks de la tournée
    const stocks = await getDeliveryStocks(id);
    
    return createSuccessResponse(
      stocks, 
      null, 
      200, 
      { 
        count: stocks.length,
        delivery_id: id,
        requested_by: {
          id: user.id,
          email: user.email,
          role: user.role
        }
      }
    );
  } catch (error) {
    return handleApiError(error, 'Get Delivery Stocks');
  }
}, ['admin', 'dispatcher', 'deliverer']);
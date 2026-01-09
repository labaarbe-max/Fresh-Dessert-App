import { withAuth } from '@/lib/api-middleware';
import { createSuccessResponse, handleApiError } from '@/lib/error-handler';
import { getDeliveryStocks } from '@/lib/db';

export const GET = withAuth(async (request, user, { params }) => {
  try {
    const id = parseInt(params.id);
    
    // Récupérer les stocks de la tournée
    const stocks = await getDeliveryStocks(id) as any[];
    
    return createSuccessResponse(
      stocks,
      { 
        count: stocks.length,
        delivery_id: id,
        requested_by: {
          id: user.id,
          email: user.email,
          role: user.role
        }
      },
      200
    );
  } catch (error) {
    return handleApiError(error, 'Get Delivery Stocks');
  }
}, ['admin', 'dispatcher', 'deliverer']);
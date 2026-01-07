import { withAuth } from '@/lib/api-middleware';
import { createSuccessResponse, handleApiError } from '@/lib/error-handler';
import { getDeliveries, createDelivery, getDelivererByUserId } from '@/lib/db';
import { validateDeliveryData } from '@/lib/validation';

export const GET = withAuth(async (request, user) => {
  try {
    // Logique métier : filtrer par deliverer si c'est un deliverer
    let delivererId = null;
    if (user.role === 'deliverer') {
      const deliverer = await getDelivererByUserId(user.id);
      if (deliverer) {
        delivererId = deliverer.id;
      }
    }
    
    const deliveries = await getDeliveries(delivererId, user.role);
    
    return createSuccessResponse(
      deliveries, 
      null, 
      200, 
      { 
        count: deliveries.length,
        user_role: user.role,
        filtered_by_deliverer: user.role === 'deliverer',
        deliverer_id: delivererId
      }
    );
  } catch (error) {
    return handleApiError(error, 'Get Deliveries');
  }
}, ['admin', 'dispatcher', 'deliverer', 'client']);

export const POST = withAuth(async (request, user) => {
  try {
    const data = await request.json();
    
    // Validation centralisée
    const validation = validateDeliveryData(data);
    if (validation.error) {
      return handleApiError(validation.error, 'Create Delivery');
    }
    
    const delivery = await createDelivery(data);
    
    return createSuccessResponse(
      delivery, 
      'Delivery created successfully', 
      201,
      { 
        created_by: user.role,
        delivery_date: delivery.delivery_date,
        assigned_deliverer: delivery.deliverer_id
      }
    );
  } catch (error) {
    return handleApiError(error, 'Create Delivery');
  }
}, ['admin', 'dispatcher']);
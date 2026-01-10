import { withAuth } from '@/lib/api-middleware';
import { createSuccessResponse, handleApiError } from '@/lib/error-handler';
import { getDeliveries, createDelivery, getDelivererByUserId } from '@/lib/db';
import { validateDeliveryData, deliverySchema } from '@/lib/validation';
import { z } from 'zod';

export const GET = withAuth(async (request, user) => {
  try {
    // Logique métier : filtrer par deliverer si c'est un deliverer
    let delivererId = null;
    if (user.role === 'deliverer') {
      const deliverer = await getDelivererByUserId(user.id);
      if (deliverer) {
        delivererId = (deliverer as any).id;
      }
    }

    const deliveries = await getDeliveries(delivererId, user.role) as any[];

    return createSuccessResponse(
      deliveries,
      {
        count: deliveries.length,
        user_role: user.role,
        filtered_by_deliverer: user.role === 'deliverer',
        deliverer_id: delivererId
      },
      200
    );
  } catch (error) {
    return handleApiError(error, 'Get Deliveries');
  }
}, ['admin', 'dispatcher', 'deliverer', 'client']);

export const POST = withAuth(async (request, user) => {
  try {
    const payload = await request.json();
    const validation = validateDeliveryData(payload);
    if (validation.error) {
      return handleApiError(validation.error, 'Create Delivery');
    }
    const data = validation.data as z.infer<typeof deliverySchema>;

    const delivery = await createDelivery(data);

    return createSuccessResponse(
      delivery,
      {
        message: 'Delivery created successfully',
        created_by: user.role,
        delivery_date: (delivery as any).delivery_date,
        assigned_deliverer: (delivery as any).deliverer_id
      },
      201
    );
  } catch (error) {
    return handleApiError(error, 'Create Delivery');
  }
}, ['admin', 'dispatcher']);
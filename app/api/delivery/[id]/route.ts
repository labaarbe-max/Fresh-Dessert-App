import { withAuth } from '@/lib/api-middleware';
import { createSuccessResponse, handleApiError } from '@/lib/error-handler';
import { getDeliveryById, updateDelivery, deleteDelivery, getDelivererByUserId } from '@/lib/db';
import { validateDeliveryUpdate, deliveryUpdateSchema } from '@/lib/validation';
import { z } from 'zod';

// Helper function pour récupérer le deliverer_id selon le rôle
async function getDelivererIdForUser(user: any) {
  if (user.role === 'deliverer') {
    const deliverer = await getDelivererByUserId(user.id);
    return deliverer ? (deliverer as any).id : null;
  }
  return null;
}

export const GET = withAuth(async (request, user, { params }) => {
  try {
    const id = parseInt(params.id);
    const delivererId = await getDelivererIdForUser(user);

    const delivery = await getDeliveryById(id, delivererId, user.role);

    if (!delivery) {
      const error: any = new Error('Delivery not found or access denied');
      error.statusCode = 404;
      return handleApiError(error, 'Get Delivery');
    }

    return createSuccessResponse(
      delivery,
      {
        user_role: user.role,
        access_level: user.role === 'deliverer' ? 'own_deliveries_only' : 'all_deliveries'
      },
      200
    );
  } catch (error) {
    return handleApiError(error, 'Get Delivery');
  }
}, ['admin', 'dispatcher', 'deliverer', 'client']);

export const PUT = withAuth(async (request, user, { params }) => {
  try {
    const id = parseInt(params.id);
    const payload = await request.json();
    const validation = validateDeliveryUpdate(payload);
    if (validation.error) {
      return handleApiError(validation.error, 'Update Delivery');
    }
    const data = validation.data as z.infer<typeof deliveryUpdateSchema>;

    const delivererId = await getDelivererIdForUser(user);

    // Vérifier que la livraison existe et permissions
    const existingDelivery = await getDeliveryById(id, delivererId, user.role);
    if (!existingDelivery) {
      const error: any = new Error('Delivery not found or access denied');
      error.statusCode = 404;
      return handleApiError(error, 'Update Delivery');
    }

    // Logique métier : deliverers ne peuvent modifier que le statut
    if (user.role === 'deliverer') {
      const forbiddenFields = ['deliverer_id', 'delivery_date'];
      const hasForbiddenFields = forbiddenFields.some(field => (data as any)[field] !== undefined);

      if (hasForbiddenFields) {
        const error: any = new Error('Deliverers can only update status');
        error.statusCode = 403;
        return handleApiError(error, 'Update Delivery');
      }
    }

    const delivery = await updateDelivery(id, data);

    return createSuccessResponse(
      delivery,
      {
        message: 'Delivery updated successfully',
        updated_by: user.role,
        previous_status: (existingDelivery as any).status,
        new_status: (delivery as any).status,
        restricted_fields: user.role === 'deliverer' ? ['deliverer_id', 'delivery_date'] : []
      },
      200
    );
  } catch (error) {
    return handleApiError(error, 'Update Delivery');
  }
}, ['admin', 'dispatcher', 'deliverer']);

export const DELETE = withAuth(async (request, user, { params }) => {
  try {
    const id = parseInt(params.id);

    // Vérifier que la livraison existe
    const existingDelivery = await getDeliveryById(id);
    if (!existingDelivery) {
      const error: any = new Error('Delivery not found');
      error.statusCode = 404;
      return handleApiError(error, 'Delete Delivery');
    }

    await deleteDelivery(id);

    return createSuccessResponse(
      { id },
      {
        message: 'Delivery deleted successfully',
        deleted_by: user.role,
        deleted_delivery_date: (existingDelivery as any).delivery_date
      },
      200
    );
  } catch (error) {
    return handleApiError(error, 'Delete Delivery');
  }
}, ['admin', 'dispatcher']);
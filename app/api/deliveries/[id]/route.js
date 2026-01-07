import { withAuth } from '@/lib/api-middleware';
import { createSuccessResponse, handleApiError } from '@/lib/error-handler';
import { getDeliveryById, updateDelivery, deleteDelivery, getDelivererByUserId } from '@/lib/db';
import { validateDeliveryUpdate } from '@/lib/validation';

// Helper function pour récupérer le deliverer_id selon le rôle
async function getDelivererIdForUser(user) {
  if (user.role === 'deliverer') {
    const deliverer = await getDelivererByUserId(user.id);
    return deliverer ? deliverer.id : null;
  }
  return null;
}

export const GET = withAuth(async (request, user) => {
  try {
    const { id } = await params;
    const delivererId = await getDelivererIdForUser(user);
    
    const delivery = await getDeliveryById(id, delivererId, user.role);
    
    if (!delivery) {
      return handleApiError(new Error('Delivery not found or access denied'), 'Get Delivery');
    }
    
    return createSuccessResponse(
      delivery, 
      null, 
      200, 
      { 
        user_role: user.role,
        access_level: user.role === 'deliverer' ? 'own_deliveries_only' : 'all_deliveries'
      }
    );
  } catch (error) {
    return handleApiError(error, 'Get Delivery');
  }
}, ['admin', 'dispatcher', 'deliverer', 'client']);

export const PUT = withAuth(async (request, user) => {
  try {
    const { id } = await params;
    const data = await request.json();
    
    // Validation centralisée
    const validation = validateDeliveryUpdate(data, user.role);
    if (validation.error) {
      return handleApiError(validation.error, 'Update Delivery');
    }
    
    const delivererId = await getDelivererIdForUser(user);
    
    // Vérifier que la livraison existe et permissions
    const existingDelivery = await getDeliveryById(id, delivererId, user.role);
    if (!existingDelivery) {
      return handleApiError(new Error('Delivery not found or access denied'), 'Update Delivery');
    }
    
    // Logique métier : deliverers ne peuvent modifier que le statut
    if (user.role === 'deliverer') {
      const forbiddenFields = ['deliverer_id', 'delivery_date'];
      const hasForbiddenFields = forbiddenFields.some(field => data[field] !== undefined);
      
      if (hasForbiddenFields) {
        return handleApiError(
          new Error('Deliverers can only update status'), 
          'Update Delivery'
        );
      }
    }
    
    const delivery = await updateDelivery(id, data);
    
    return createSuccessResponse(
      delivery, 
      'Delivery updated successfully', 
      200,
      { 
        updated_by: user.role,
        previous_status: existingDelivery.status,
        new_status: delivery.status,
        restricted_fields: user.role === 'deliverer' ? ['deliverer_id', 'delivery_date'] : []
      }
    );
  } catch (error) {
    return handleApiError(error, 'Update Delivery');
  }
}, ['admin', 'dispatcher', 'deliverer']);

export const DELETE = withAuth(async (request, user) => {
  try {
    const { id } = await params;
    
    // Vérifier que la livraison existe
    const existingDelivery = await getDeliveryById(id);
    if (!existingDelivery) {
      return handleApiError(new Error('Delivery not found'), 'Delete Delivery');
    }
    
    await deleteDelivery(id);
    
    return createSuccessResponse(
      null, 
      'Delivery deleted successfully', 
      200,
      { 
        deleted_by: user.role,
        deleted_delivery_date: existingDelivery.delivery_date
      }
    );
  } catch (error) {
    return handleApiError(error, 'Delete Delivery');
  }
}, ['admin', 'dispatcher']);
import { withAuth } from '@/lib/api-middleware';
import { createSuccessResponse, handleApiError } from '@/lib/error-handler';
import { getDelivererById, updateDeliverer, deleteDeliverer } from '@/lib/db';
import { validateDelivererUpdate } from '@/lib/validation';

export const GET = withAuth(async (request, user) => {
  try {
    const { id } = await params;
    
    const deliverer = await getDelivererById(id);
    
    if (!deliverer) {
      return handleApiError(new Error('Deliverer not found'), 'Get Deliverer', 404);
    }
    
    return createSuccessResponse(
      deliverer, 
      null, 
      200, 
      { 
        deliverer_id: id,
        requested_by: {
          id: user.id,
          email: user.email,
          role: user.role
        }
      }
    );
  } catch (error) {
    return handleApiError(error, 'Get Deliverer');
  }
}, ['admin', 'dispatcher', 'deliverer']);

export const PUT = withAuth(async (request, user) => {
  try {
    const { id } = await params;
    const data = await request.json();
    
    // Validation centralisée
    const validation = validateDelivererUpdate(data);
    if (validation.error) {
      return handleApiError(validation.error, 'Update Deliverer');
    }
    
    // Vérifier que le deliverer existe
    const existingDeliverer = await getDelivererById(id);
    if (!existingDeliverer) {
      return handleApiError(new Error('Deliverer not found'), 'Update Deliverer', 404);
    }
    
    const deliverer = await updateDeliverer(id, data);
    
    return createSuccessResponse(
      deliverer, 
      'Deliverer updated successfully', 
      200,
      { 
        updated_by: user.role,
        deliverer_id: id,
        updated_fields: Object.keys(data)
      }
    );
  } catch (error) {
    return handleApiError(error, 'Update Deliverer');
  }
}, ['admin', 'dispatcher']);

export const DELETE = withAuth(async (request, user) => {
  try {
    const { id } = await params;
    
    // Vérifier que le deliverer existe
    const existingDeliverer = await getDelivererById(id);
    if (!existingDeliverer) {
      return handleApiError(new Error('Deliverer not found'), 'Delete Deliverer', 404);
    }
    
    await deleteDeliverer(id);
    
    return createSuccessResponse(
      null, 
      'Deliverer deleted successfully', 
      200,
      { 
        deleted_by: user.role,
        deliverer_id: id,
        user_id: existingDeliverer.user_id
      }
    );
  } catch (error) {
    return handleApiError(error, 'Delete Deliverer');
  }
}, ['admin', 'dispatcher']);
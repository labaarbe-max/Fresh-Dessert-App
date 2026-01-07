import { withAuth } from '@/lib/api-middleware';
import { createSuccessResponse, handleApiError } from '@/lib/error-handler';
import { getDeliverers, createDeliverer } from '@/lib/db';
import { validateDelivererData } from '@/lib/validation';

export const GET = withAuth(async (request, user) => {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('activeOnly') === 'true';
    
    const deliverers = await getDeliverers(activeOnly);
    
    return createSuccessResponse(
      deliverers, 
      null, 
      200, 
      { 
        count: deliverers.length,
        active_only: activeOnly,
        requested_by: {
          id: user.id,
          email: user.email,
          role: user.role
        }
      }
    );
  } catch (error) {
    return handleApiError(error, 'Get Deliverers');
  }
}, ['admin', 'dispatcher']);

export const POST = withAuth(async (request, user) => {
  try {
    const data = await request.json();
    
    // Validation centralisée
    const validation = validateDelivererData(data);
    if (validation.error) {
      return handleApiError(validation.error, 'Create Deliverer');
    }
    
    const deliverer = await createDeliverer(data);
    
    return createSuccessResponse(
      deliverer, 
      'Deliverer created successfully', 
      201,
      { 
        created_by: user.role,
        vehicle_type: deliverer.vehicle_type,
        user_id: deliverer.user_id
      }
    );
  } catch (error) {
    return handleApiError(error, 'Create Deliverer');
  }
}, ['admin', 'dispatcher']);
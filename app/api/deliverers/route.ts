import { withAuth } from '@/lib/api-middleware';
import { createSuccessResponse, handleApiError } from '@/lib/error-handler';
import { getDeliverers, createDeliverer } from '@/lib/db';
import { validateDelivererData } from '@/lib/validation';
import type { CreateDelivererDTO } from '@/types';

export const GET = withAuth(async (request, user) => {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('activeOnly') === 'true';
    
    const deliverers = await getDeliverers(activeOnly) as any[];
    
    return createSuccessResponse(
      deliverers,
      { 
        count: deliverers.length,
        active_only: activeOnly,
        requested_by: {
          id: user.id,
          email: user.email,
          role: user.role
        }
      },
      200
    );
  } catch (error) {
    return handleApiError(error, 'Get Deliverers');
  }
}, ['admin', 'dispatcher']);

export const POST = withAuth(async (request, user) => {
  try {
    const data = await request.json() as CreateDelivererDTO;
    
    // Validation centralisée
    const validation = validateDelivererData(data);
    if (validation.error) {
      return handleApiError(validation.error, 'Create Deliverer');
    }
    
    const deliverer = await createDeliverer(data);
    
    return createSuccessResponse(
      deliverer,
      { 
        message: 'Deliverer created successfully',
        created_by: user.role,
        vehicle_type: (deliverer as any).vehicle_type,
        user_id: (deliverer as any).user_id
      },
      201
    );
  } catch (error) {
    return handleApiError(error, 'Create Deliverer');
  }
}, ['admin', 'dispatcher']);
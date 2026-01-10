import { withAuth } from '@/lib/api-middleware';
import { createSuccessResponse, handleApiError } from '@/lib/error-handler';
import { getDelivererById, updateDeliverer, deleteDeliverer } from '@/lib/db';
import { validateDelivererUpdate, delivererUpdateSchema } from '@/lib/validation';
import { z } from 'zod';

export const GET = withAuth(async (request, user, { params }) => {
  try {
    const id = parseInt(params.id);

    const deliverer = await getDelivererById(id);

    if (!deliverer) {
      const error: any = new Error('Deliverer not found');
      error.statusCode = 404;
      return handleApiError(error, 'Get Deliverer');
    }

    return createSuccessResponse(
      deliverer,
      {
        deliverer_id: id,
        requested_by: {
          id: user.id,
          email: user.email,
          role: user.role
        }
      },
      200
    );
  } catch (error) {
    return handleApiError(error, 'Get Deliverer');
  }
}, ['admin', 'dispatcher', 'deliverer']);

export const PUT = withAuth(async (request, user, { params }) => {
  try {
    const id = parseInt(params.id);
    const payload = await request.json();
    const validation = validateDelivererUpdate(payload);
    if (validation.error) {
      return handleApiError(validation.error, 'Update Deliverer');
    }
    const data = validation.data as z.infer<typeof delivererUpdateSchema>;

    // Vérifier que le deliverer existe
    const existingDeliverer = await getDelivererById(id);
    if (!existingDeliverer) {
      const error: any = new Error('Deliverer not found');
      error.statusCode = 404;
      return handleApiError(error, 'Update Deliverer');
    }

    const deliverer = await updateDeliverer(id, data);

    return createSuccessResponse(
      deliverer,
      {
        message: 'Deliverer updated successfully',
        updated_by: user.role,
        deliverer_id: id,
        updated_fields: Object.keys(data)
      },
      200
    );
  } catch (error) {
    return handleApiError(error, 'Update Deliverer');
  }
}, ['admin', 'dispatcher']);

export const DELETE = withAuth(async (request, user, { params }) => {
  try {
    const id = parseInt(params.id);

    // Vérifier que le deliverer existe
    const existingDeliverer = await getDelivererById(id);
    if (!existingDeliverer) {
      const error: any = new Error('Deliverer not found');
      error.statusCode = 404;
      return handleApiError(error, 'Delete Deliverer');
    }

    await deleteDeliverer(id);

    return createSuccessResponse(
      { id },
      {
        message: 'Deliverer deleted successfully',
        deleted_by: user.role,
        deliverer_id: id,
        user_id: (existingDeliverer as any).user_id
      },
      200
    );
  } catch (error) {
    return handleApiError(error, 'Delete Deliverer');
  }
}, ['admin', 'dispatcher']);
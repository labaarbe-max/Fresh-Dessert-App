import { withAuth } from '@/lib/api-middleware';
import { createSuccessResponse, handleApiError } from '@/lib/error-handler';
import { getOrderById, updateOrder, deleteOrder } from '@/lib/db';
import { validateOrderUpdate, orderUpdateSchema } from '@/lib/validation';
import { z } from 'zod';

export const GET = withAuth(async (request, user, { params }) => {
  try {
    const id = parseInt(params.id);
    const order = await getOrderById(id, user.id, user.role);

    if (!order) {
      const error: any = new Error('Order not found or access denied');
      error.statusCode = 404;
      return handleApiError(error, 'Get Order');
    }

    return createSuccessResponse(
      order,
      {
        user_role: user.role,
        access_level: user.role === 'client' ? 'own_orders_only' : 'all_orders'
      },
      200
    );
  } catch (error) {
    return handleApiError(error, 'Get Order');
  }
}, ['admin', 'dispatcher', 'deliverer', 'client']);

export const PUT = withAuth(async (request, user, { params }) => {
  try {
    const id = parseInt(params.id);
    const payload = await request.json();
    const validation = validateOrderUpdate(payload);
    if (validation.error) {
      return handleApiError(validation.error, 'Update Order');
    }
    const data = validation.data as z.infer<typeof orderUpdateSchema>;

    // Vérifier que la commande existe et permissions
    const existingOrder = await getOrderById(id, user.id, user.role);
    if (!existingOrder) {
      const error: any = new Error('Order not found or access denied');
      error.statusCode = 404;
      return handleApiError(error, 'Update Order');
    }

    // Logique métier : clients ne peuvent modifier que les commandes pending
    if (user.role === 'client' && (existingOrder as any).status !== 'pending') {
      const error: any = new Error('Cannot modify order that is not pending');
      error.statusCode = 403;
      return handleApiError(error, 'Update Order');
    }

    const order = await updateOrder(id, data);

    return createSuccessResponse(
      order,
      {
        message: 'Order updated successfully',
        updated_by: user.role,
        previous_status: (existingOrder as any).status,
        new_status: (order as any).status
      },
      200
    );
  } catch (error) {
    return handleApiError(error, 'Update Order');
  }
}, ['admin', 'dispatcher', 'deliverer', 'client']);

export const DELETE = withAuth(async (request, user, { params }) => {
  try {
    const id = parseInt(params.id);

    // Vérifier que la commande existe et permissions
    const existingOrder = await getOrderById(id, user.id, user.role);
    if (!existingOrder) {
      const error: any = new Error('Order not found or access denied');
      error.statusCode = 404;
      return handleApiError(error, 'Delete Order');
    }

    // Logique métier : clients ne peuvent supprimer que les commandes pending
    if (user.role === 'client' && (existingOrder as any).status !== 'pending') {
      const error: any = new Error('Cannot delete order that is not pending');
      error.statusCode = 403;
      return handleApiError(error, 'Delete Order');
    }

    await deleteOrder(id);

    return createSuccessResponse(
      { id },
      {
        message: 'Order deleted successfully',
        deleted_by: user.role,
        deleted_order_status: (existingOrder as any).status
      },
      200
    );
  } catch (error) {
    return handleApiError(error, 'Delete Order');
  }
}, ['admin', 'dispatcher', 'deliverer', 'client']);
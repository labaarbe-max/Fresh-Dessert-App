import { withAuth } from '@/lib/api-middleware';
import { createSuccessResponse, handleApiError } from '@/lib/error-handler';
import { getOrders, createOrder } from '@/lib/db';
import { validateOrderData, orderSchema } from '@/lib/validation';
import { z } from 'zod';

export const GET = withAuth(async (request, user) => {
  try {
    const orders = await getOrders(user.id, user.role) as any[];

    return createSuccessResponse(
      orders,
      {
        count: orders.length,
        user_role: user.role,
        filtered_by_user: user.role === 'client'
      },
      200
    );
  } catch (error) {
    return handleApiError(error, 'Get Orders');
  }
}, ['admin', 'dispatcher', 'deliverer', 'client']);

export const POST = withAuth(async (request, user) => {
  try {
    const payload = await request.json();
    const validation = validateOrderData(payload);
    if (validation.error) {
      return handleApiError(validation.error, 'Create Order');
    }
    const data = validation.data as z.infer<typeof orderSchema>;

    // Logique métier : user_id selon le rôle
    const user_id = user.role === 'client'
      ? user.id
      : (data.user_id || user.id);

    const order = await createOrder({
      ...data,
      user_id
    });

    return createSuccessResponse(
      order,
      {
        message: 'Order created successfully',
        created_by: user.role,
        user_id: user_id,
        stock_decremented: (order as any).stock_decremented
      },
      201
    );
  } catch (error) {
    return handleApiError(error, 'Create Order');
  }
}, ['admin', 'dispatcher', 'deliverer', 'client']);
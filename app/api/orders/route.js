import { withAuth } from '@/lib/api-middleware';
import { createSuccessResponse, handleApiError } from '@/lib/error-handler';
import { getOrders, createOrder } from '@/lib/db';
import { validateOrderData } from '@/lib/validation';

export const GET = withAuth(async (request, user) => {
  try {
    const orders = await getOrders(user.id, user.role);
    
    return createSuccessResponse(
      orders, 
      null, 
      200, 
      { 
        count: orders.length, 
        user_role: user.role,
        filtered_by_user: user.role === 'client'
      }
    );
  } catch (error) {
    return handleApiError(error, 'Get Orders');
  }
}, ['admin', 'dispatcher', 'deliverer', 'client']);

export const POST = withAuth(async (request, user) => {
  try {
    const data = await request.json();
    
    // Validation centralisée
    const validation = validateOrderData(data);
    if (validation.error) {
      return handleApiError(validation.error, 'Create Order');
    }
    
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
      'Order created successfully', 
      201,
      { 
        created_by: user.role,
        user_id: user_id,
        stock_decremented: order.stock_decremented
      }
    );
  } catch (error) {
    return handleApiError(error, 'Create Order');
  }
}, ['admin', 'dispatcher', 'deliverer', 'client']);
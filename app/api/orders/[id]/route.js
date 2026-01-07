import { withAuth } from '@/lib/api-middleware';
import { createSuccessResponse, handleApiError } from '@/lib/error-handler';
import { getOrderById, updateOrder, deleteOrder } from '@/lib/db';
import { validateOrderUpdate } from '@/lib/validation';

export const GET = withAuth(async (request, user) => {
  try {
    const { id } = await params;
    const order = await getOrderById(id, user.id, user.role);
    
    if (!order) {
      return handleApiError(new Error('Order not found or access denied'), 'Get Order');
    }
    
    return createSuccessResponse(
      order, 
      null, 
      200, 
      { 
        user_role: user.role,
        access_level: user.role === 'client' ? 'own_orders_only' : 'all_orders'
      }
    );
  } catch (error) {
    return handleApiError(error, 'Get Order');
  }
}, ['admin', 'dispatcher', 'deliverer', 'client']);

export const PUT = withAuth(async (request, user) => {
  try {
    const { id } = await params;
    const data = await request.json();
    
    // Validation centralisée
    const validation = validateOrderUpdate(data);
    if (validation.error) {
      return handleApiError(validation.error, 'Update Order');
    }
    
    // Vérifier que la commande existe et permissions
    const existingOrder = await getOrderById(id, user.id, user.role);
    if (!existingOrder) {
      return handleApiError(new Error('Order not found or access denied'), 'Update Order');
    }
    
    // Logique métier : clients ne peuvent modifier que les commandes pending
    if (user.role === 'client' && existingOrder.status !== 'pending') {
      return handleApiError(
        new Error('Cannot modify order that is not pending'), 
        'Update Order'
      );
    }
    
    const order = await updateOrder(id, data);
    
    return createSuccessResponse(
      order, 
      'Order updated successfully', 
      200,
      { 
        updated_by: user.role,
        previous_status: existingOrder.status,
        new_status: order.status
      }
    );
  } catch (error) {
    return handleApiError(error, 'Update Order');
  }
}, ['admin', 'dispatcher', 'deliverer', 'client']);

export const DELETE = withAuth(async (request, user) => {
  try {
    const { id } = await params;
    
    // Vérifier que la commande existe et permissions
    const existingOrder = await getOrderById(id, user.id, user.role);
    if (!existingOrder) {
      return handleApiError(new Error('Order not found or access denied'), 'Delete Order');
    }
    
    // Logique métier : clients ne peuvent supprimer que les commandes pending
    if (user.role === 'client' && existingOrder.status !== 'pending') {
      return handleApiError(
        new Error('Cannot delete order that is not pending'), 
        'Delete Order'
      );
    }
    
    await deleteOrder(id);
    
    return createSuccessResponse(
      null, 
      'Order deleted successfully', 
      200,
      { 
        deleted_by: user.role,
        deleted_order_status: existingOrder.status
      }
    );
  } catch (error) {
    return handleApiError(error, 'Delete Order');
  }
}, ['admin', 'dispatcher', 'deliverer', 'client']);
import { withAuth } from '@/lib/api-middleware';
import { createSuccessResponse, handleApiError } from '@/lib/error-handler';
import { getAddressById, updateAddress, deleteAddress } from '@/lib/db';
import { validateAddressData } from '@/lib/validation';

export const GET = withAuth(async (request, user) => {
  try {
    const { id } = await params;
    
    const address = await getAddressById(id, user.id);
    
    if (!address) {
      return handleApiError(new Error('Address not found'), 'Get Address');
    }
    
    return createSuccessResponse(
      address, 
      null, 
      200, 
      { 
        user_id: user.id,
        access_level: 'own_address_only'
      }
    );
  } catch (error) {
    return handleApiError(error, 'Get Address');
  }
}, ['admin', 'dispatcher', 'deliverer', 'client']);

export const PUT = withAuth(async (request, user) => {
  try {
    const { id } = await params;
    const data = await request.json();
    
    // Validation centralisée
    const validation = validateAddressData(data);
    if (validation.error) {
      return handleApiError(validation.error, 'Update Address');
    }
    
    // Vérifier que l'adresse existe et appartient à l'utilisateur
    const existingAddress = await getAddressById(id, user.id);
    if (!existingAddress) {
      return handleApiError(new Error('Address not found'), 'Update Address');
    }
    
    const address = await updateAddress(id, user.id, data);
    
    return createSuccessResponse(
      address, 
      'Address updated successfully', 
      200,
      { 
        updated_by_user: user.id,
        address_type: address.address_type || 'default'
      }
    );
  } catch (error) {
    return handleApiError(error, 'Update Address');
  }
}, ['admin', 'dispatcher', 'deliverer', 'client']);

export const DELETE = withAuth(async (request, user) => {
  try {
    const { id } = await params;
    
    // Vérifier que l'adresse existe et appartient à l'utilisateur
    const existingAddress = await getAddressById(id, user.id);
    if (!existingAddress) {
      return handleApiError(new Error('Address not found'), 'Delete Address');
    }
    
    await deleteAddress(id, user.id);
    
    return createSuccessResponse(
      null, 
      'Address deleted successfully', 
      200,
      { 
        deleted_by_user: user.id,
        deleted_address_type: existingAddress.address_type || 'default'
      }
    );
  } catch (error) {
    return handleApiError(error, 'Delete Address');
  }
}, ['admin', 'dispatcher', 'deliverer', 'client']);
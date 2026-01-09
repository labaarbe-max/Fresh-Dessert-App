import { withAuth } from '@/lib/api-middleware';
import { createSuccessResponse, handleApiError } from '@/lib/error-handler';
import { getAddressById, updateAddress, deleteAddress } from '@/lib/db';
import { validateAddressData } from '@/lib/validation';
import type { UpdateAddressDTO } from '@/types';

export const GET = withAuth(async (request, user, { params }) => {
  try {
    const id = parseInt(params.id);
    
    const address = await getAddressById(id, user.id);
    
    if (!address) {
      const error: any = new Error('Address not found');
      error.statusCode = 404;
      return handleApiError(error, 'Get Address');
    }
    
    return createSuccessResponse(
      address,
      { 
        user_id: user.id,
        access_level: 'own_address_only'
      },
      200
    );
  } catch (error) {
    return handleApiError(error, 'Get Address');
  }
}, ['admin', 'dispatcher', 'deliverer', 'client']);

export const PUT = withAuth(async (request, user, { params }) => {
  try {
    const id = parseInt(params.id);
    const data = await request.json() as UpdateAddressDTO;
    
    // Validation centralisée
    const validation = validateAddressData(data);
    if (validation.error) {
      return handleApiError(validation.error, 'Update Address');
    }
    
    // Vérifier que l'adresse existe et appartient à l'utilisateur
    const existingAddress = await getAddressById(id, user.id);
    if (!existingAddress) {
      const error: any = new Error('Address not found');
      error.statusCode = 404;
      return handleApiError(error, 'Update Address');
    }
    
    const address = await updateAddress(id, user.id, data);
    
    return createSuccessResponse(
      address,
      { 
        message: 'Address updated successfully',
        updated_by_user: user.id,
        address_type: (address as any).address_type || 'default'
      },
      200
    );
  } catch (error) {
    return handleApiError(error, 'Update Address');
  }
}, ['admin', 'dispatcher', 'deliverer', 'client']);

export const DELETE = withAuth(async (request, user, { params }) => {
  try {
    const id = parseInt(params.id);
    
    // Vérifier que l'adresse existe et appartient à l'utilisateur
    const existingAddress = await getAddressById(id, user.id);
    if (!existingAddress) {
      const error: any = new Error('Address not found');
      error.statusCode = 404;
      return handleApiError(error, 'Delete Address');
    }
    
    await deleteAddress(id, user.id);
    
    return createSuccessResponse(
      { id },
      { 
        message: 'Address deleted successfully',
        deleted_by_user: user.id,
        deleted_address_type: (existingAddress as any).address_type || 'default'
      },
      200
    );
  } catch (error) {
    return handleApiError(error, 'Delete Address');
  }
}, ['admin', 'dispatcher', 'deliverer', 'client']);
import { withAuth } from '@/lib/api-middleware';
import { createSuccessResponse, handleApiError } from '@/lib/error-handler';
import { getAddresses, createAddress } from '@/lib/db';
import { validateAddressData } from '@/lib/validation';
import type { CreateAddressDTO } from '@/types';

export const GET = withAuth(async (request, user) => {
  try {
    const addresses = await getAddresses(user.id) as any[];
    
    return createSuccessResponse(
      addresses,
      { 
        count: addresses.length,
        user_id: user.id,
        access_level: 'own_addresses_only'
      },
      200
    );
  } catch (error) {
    return handleApiError(error, 'Get Addresses');
  }
}, ['admin', 'dispatcher', 'deliverer', 'client']);

export const POST = withAuth(async (request, user) => {
  try {
    const data = await request.json() as CreateAddressDTO;
    
    const validation = validateAddressData(data);
    if (validation.error) {
      return handleApiError(validation.error, 'Create Address');
    }
    
    const addressData = {
      ...data,
      user_id: user.id
    };
    
    const address = await createAddress(addressData);
    
    return createSuccessResponse(
      address,
      { 
        message: 'Address created successfully',
        created_for_user: user.id,
        user_role: user.role,
        address_type: (data as any).address_type || 'default'
      },
      201
    );
  } catch (error) {
    return handleApiError(error, 'Create Address');
  }
}, ['admin', 'dispatcher', 'deliverer', 'client']);
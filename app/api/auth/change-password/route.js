import { withAuth } from '@/lib/api-middleware';
import { createSuccessResponse, handleApiError } from '@/lib/error-handler';
import { getUserByEmail, updateUserPassword } from '@/lib/db';
import { authRateLimiter, checkRateLimit } from '@/lib/rate-limit';
import { validatePasswordChange } from '@/lib/validation';
import bcrypt from 'bcryptjs';

export const POST = withAuth(async (request, user) => {
  try {
    // Vérifier le rate limit
    const rateLimitResult = await checkRateLimit(request, authRateLimiter);
    
    if (!rateLimitResult.success) {
      return handleApiError(
        new Error('Too many requests. Please try again later.'), 
        'Change Password',
        429,
        {
          retryAfter: Math.ceil((rateLimitResult.reset - Date.now()) / 1000),
          rateLimit: {
            limit: rateLimitResult.limit,
            remaining: rateLimitResult.remaining,
            reset: rateLimitResult.reset
          }
        }
      );
    }

    const { current_password, new_password } = await request.json();

    // Validation centralisée
    const validation = validatePasswordChange({ current_password, new_password });
    if (validation.error) {
      return handleApiError(validation.error, 'Change Password');
    }

    // Récupérer l'utilisateur depuis la base de données
    const dbUser = await getUserByEmail(user.email);

    if (!dbUser) {
      return handleApiError(new Error('User not found'), 'Change Password', 404);
    }

    // Vérifier l'ancien mot de passe
    const isPasswordValid = await bcrypt.compare(current_password, dbUser.password_hash);

    if (!isPasswordValid) {
      return handleApiError(new Error('Current password is incorrect'), 'Change Password', 401);
    }

    // Vérifier que le nouveau mot de passe est différent de l'ancien
    const isSamePassword = await bcrypt.compare(new_password, dbUser.password_hash);

    if (isSamePassword) {
      return handleApiError(new Error('New password must be different from current password'), 'Change Password');
    }

    // Mettre à jour le mot de passe
    await updateUserPassword(dbUser.id, new_password);

    return createSuccessResponse(
      null, 
      'Password changed successfully', 
      200,
      { 
        user_id: user.id,
        password_strength: 'strong',
        change_method: 'authenticated_request'
      }
    );

  } catch (error) {
    return handleApiError(error, 'Change Password');
  }
}, ['admin', 'dispatcher', 'deliverer', 'client']);
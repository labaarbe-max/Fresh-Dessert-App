import { withAuth } from '@/lib/api-middleware';
import { createSuccessResponse, handleApiError } from '@/lib/error-handler';
import { getUserByEmail, updateUserPassword } from '@/lib/db';
import { authRateLimiter, checkRateLimit } from '@/lib/rate-limit';
import { validatePasswordChange } from '@/lib/validation';
import type { PasswordChangeDTO } from '@/types';
import bcrypt from 'bcryptjs';

export const POST = withAuth(async (request, user) => {
  try {
    // Vérifier le rate limit
    const rateLimitResult = await checkRateLimit(request, authRateLimiter);
    
    if (!rateLimitResult.success) {
      const error: any = new Error('Too many requests. Please try again later.');
      error.statusCode = 429;
      return handleApiError(error, 'Change Password', {
        retryAfter: Math.ceil((rateLimitResult.reset - Date.now()) / 1000),
        rateLimit: {
          limit: rateLimitResult.limit,
          remaining: rateLimitResult.remaining,
          reset: rateLimitResult.reset
        }
      });
    }

    // ✅ APRÈS (bons noms)
const { currentPassword, newPassword } = await request.json() as PasswordChangeDTO;

// Validation centralisée - convertir pour la fonction de validation
const validation = validatePasswordChange({ 
  current_password: currentPassword, 
  new_password: newPassword 
});
    if (validation.error) {
      return handleApiError(validation.error, 'Change Password');
    }

    // Récupérer l'utilisateur depuis la base de données
    const dbUser = await getUserByEmail(user.email);

    if (!dbUser) {
      const error: any = new Error('User not found');
      error.statusCode = 404;
      return handleApiError(error, 'Change Password');
    }

    // Vérifier l'ancien mot de passe
    const isPasswordValid = await bcrypt.compare(currentPassword, dbUser.password_hash);

    if (!isPasswordValid) {
      const error: any = new Error('Current password is incorrect');
      error.statusCode = 401;
      return handleApiError(error, 'Change Password');
    }

    // Vérifier que le nouveau mot de passe est différent de l'ancien
    const isSamePassword = await bcrypt.compare(newPassword, dbUser.password_hash);

    if (isSamePassword) {
      const error: any = new Error('New password must be different from current password');
      error.statusCode = 400;
      return handleApiError(error, 'Change Password');
    }

    // Mettre à jour le mot de passe
    await updateUserPassword(dbUser.id, newPassword);

    return createSuccessResponse(
      null,
      {
        message: 'Password changed successfully',
        user_id: user.id,
        password_strength: 'strong',
        change_method: 'authenticated_request'
      },
      200
    );

  } catch (error) {
    return handleApiError(error, 'Change Password');
  }
}, ['admin', 'dispatcher', 'deliverer', 'client']);
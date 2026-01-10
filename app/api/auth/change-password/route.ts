import { withAuth } from '@/lib/api-middleware';
import { createSuccessResponse, handleApiError } from '@/lib/error-handler';
import { getUserByEmail, updateUserPassword } from '@/lib/db';
import { authRateLimiter, checkRateLimit } from '@/lib/rate-limit';
import { validatePasswordChange, passwordChangeSchema } from '@/lib/validation';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

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
    const payload = await request.json();
    const validation = validatePasswordChange(payload);
    if (validation.error) {
      return handleApiError(validation.error, 'Change Password');
    }
    if (!validation.data) {
      const error: any = new Error('Invalid validation data');
      error.statusCode = 400;
      return handleApiError(error, 'Change Password');
    }
    const data = validation.data as z.infer<typeof passwordChangeSchema>;
    const currentPassword = data.currentPassword;
    const newPassword = data.newPassword;

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
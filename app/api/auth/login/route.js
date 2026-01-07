import { createSuccessResponse, handleApiError } from '@/lib/error-handler';
import { getUserByEmail } from '@/lib/db';
import { authRateLimiter, checkRateLimit } from '@/lib/rate-limit';
import { validateLoginData } from '@/lib/validation';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export async function POST(request) {
  try {
    // Vérifier le rate limit
    const rateLimitResult = await checkRateLimit(request, authRateLimiter);
    
    if (!rateLimitResult.success) {
      return handleApiError(
        new Error('Too many requests. Please try again later.'), 
        'Login',
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

    const { email, password } = await request.json();

    // Validation centralisée
    const validation = validateLoginData({ email, password });
    if (validation.error) {
      return handleApiError(validation.error, 'Login');
    }

    // Récupérer l'utilisateur
    const user = await getUserByEmail(email);
    
    if (!user) {
      return handleApiError(new Error('Invalid credentials'), 'Login', 401);
    }

    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    
    if (!isPasswordValid) {
      return handleApiError(new Error('Invalid credentials'), 'Login', 401);
    }

    // Vérifier si l'utilisateur est actif
    if (!user.active) {
      return handleApiError(new Error('Account is inactive'), 'Login', 403);
    }

    // Créer le token JWT
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        first_name: user.first_name,
        last_name: user.last_name
      },
      process.env.NEXTAUTH_SECRET,
      { expiresIn: '30d' }
    );

    return createSuccessResponse(
      {
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          role: user.role
        },
        token
      }, 
      'Login successful', 
      200,
      { 
        token_expires_in: '30d',
        login_method: 'email_password',
        user_active: user.active
      }
    );

  } catch (error) {
    return handleApiError(error, 'Login');
  }
}
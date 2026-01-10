import { createSuccessResponse, handleApiError } from '@/lib/error-handler';
import { getUserByEmail } from '@/lib/db';
import { authRateLimiter, checkRateLimit } from '@/lib/rate-limit';
import { validateLoginData, loginSchema } from '@/lib/validation';
import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

export async function POST(request: NextRequest) {
  try {
    // Vérifier le rate limit
    const rateLimitResult = await checkRateLimit(request, authRateLimiter);

    if (!rateLimitResult.success) {
      const error: any = new Error('Too many requests. Please try again later.');
      error.statusCode = 429;
      return handleApiError(error, 'Login', {
        retryAfter: Math.ceil((rateLimitResult.reset - Date.now()) / 1000),
        rateLimit: {
          limit: rateLimitResult.limit,
          remaining: rateLimitResult.remaining,
          reset: rateLimitResult.reset
        }
      });
    }

    const payload = await request.json();
    const validation = validateLoginData(payload);
    if (validation.error) {
      return handleApiError(validation.error, 'Login');
    }
    const { email, password } = validation.data as z.infer<typeof loginSchema>;

    // Récupérer l'utilisateur
    const user = await getUserByEmail(email);

    if (!user) {
      const error: any = new Error('Invalid credentials');
      error.statusCode = 401;
      return handleApiError(error, 'Login');
    }

    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      const error: any = new Error('Invalid credentials');
      error.statusCode = 401;
      return handleApiError(error, 'Login');
    }

    // Vérifier si l'utilisateur est actif
    if (!user.active) {
      const error: any = new Error('Account is inactive');
      error.statusCode = 403;
      return handleApiError(error, 'Login');
    }

    // Créer le token JWT
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not defined');
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        first_name: user.first_name,
        last_name: user.last_name
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
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
      {
        message: 'Login successful. Token expires in 24 hours.',
        token_expires_in: '24h',
        login_method: 'email_password',
        user_active: user.active
      },
      200
    );

  } catch (error) {
    return handleApiError(error, 'Login');
  }
}
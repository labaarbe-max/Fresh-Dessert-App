import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getUserByEmail } from '@/lib/db';
import { verifyToken, unauthorizedResponse } from '@/lib/auth-middleware';
import { authRateLimiter, checkRateLimit } from '@/lib/rate-limit';

export async function POST(request) {
  // Vérifier le rate limit
  const rateLimitResult = await checkRateLimit(request, authRateLimiter);
  
  if (!rateLimitResult.success) {
    return NextResponse.json(
      {
        success: false,
        error: 'Too many requests. Please try again later.',
        retryAfter: Math.ceil((rateLimitResult.reset - Date.now()) / 1000)
      },
      { 
        status: 429,
        headers: {
          'X-RateLimit-Limit': rateLimitResult.limit.toString(),
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': rateLimitResult.reset.toString()
        }
      }
    );
  }

  // Vérifier le token JWT
  const authResult = verifyToken(request);
  
  if (authResult.error) {
    return unauthorizedResponse(authResult.error);
  }

  try {
    const { current_password, new_password } = await request.json();

    // Validation des champs
    if (!current_password || !new_password) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: current_password, new_password'
        },
        { status: 400 }
      );
    }

    // Validation du nouveau mot de passe (même règles que register)
    if (new_password.length < 12) {
      return NextResponse.json(
        {
          success: false,
          error: 'New password must be at least 12 characters long'
        },
        { status: 400 }
      );
    }

    const hasUpperCase = /[A-Z]/.test(new_password);
    const hasLowerCase = /[a-z]/.test(new_password);
    const hasNumber = /[0-9]/.test(new_password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(new_password);

    if (!hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecialChar) {
      return NextResponse.json(
        {
          success: false,
          error: 'New password must contain uppercase, lowercase, number, and special character'
        },
        { status: 400 }
      );
    }

    // Récupérer l'utilisateur depuis la base de données
    const user = await getUserByEmail(authResult.user.email);

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'User not found'
        },
        { status: 404 }
      );
    }

    // Vérifier l'ancien mot de passe
    const isPasswordValid = await bcrypt.compare(current_password, user.password_hash);

    if (!isPasswordValid) {
      return NextResponse.json(
        {
          success: false,
          error: 'Current password is incorrect'
        },
        { status: 401 }
      );
    }

    // Vérifier que le nouveau mot de passe est différent de l'ancien
    const isSamePassword = await bcrypt.compare(new_password, user.password_hash);

    if (isSamePassword) {
      return NextResponse.json(
        {
          success: false,
          error: 'New password must be different from current password'
        },
        { status: 400 }
      );
    }

    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(new_password, 10);

    // Mettre à jour le mot de passe dans la base de données
    const pool = (await import('@/lib/db')).default;
    await pool.query(
      'UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [hashedPassword, user.id]
    );

    return NextResponse.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Error in POST /api/auth/change-password:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to change password',
        message: error.message
      },
      { status: 500 }
    );
  }
}
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';
import { JWTPayload } from '../types/database.types';

interface AuthResult {
  user?: JWTPayload;
  error: string | null;
  status?: number;
}

interface RoleCheckResult {
  error: string | null;
  status?: number;
}

// Middleware pour vérifier le token JWT
export function verifyToken(request: Request): AuthResult {
  try {
    // Récupérer le token depuis le header Authorization
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        error: 'Missing or invalid authorization header',
        status: 401
      };
    }

    // Extraire le token
    const token = authHeader.substring(7); // Enlever "Bearer "

    // Vérifier et décoder le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;

    return {
      user: decoded,
      error: null
    };
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      return {
        error: 'Token expired',
        status: 401
      };
    }
    if (error.name === 'JsonWebTokenError') {
      return {
        error: 'Invalid token',
        status: 401
      };
    }
    return {
      error: 'Authentication failed',
      status: 401
    };
  }
}

// Middleware pour vérifier le rôle
export function verifyRole(user: JWTPayload, allowedRoles: string[]): RoleCheckResult {
  if (!allowedRoles.includes(user.role)) {
    return {
      error: `Access denied. Required role: ${allowedRoles.join(' or ')}`,
      status: 403
    };
  }
  return { error: null };
}

// Helper pour créer une réponse d'erreur
export function unauthorizedResponse(message: string = 'Unauthorized'): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: message
    },
    { status: 401 }
  );
}

export function forbiddenResponse(message: string = 'Forbidden'): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: message
    },
    { status: 403 }
  );
}

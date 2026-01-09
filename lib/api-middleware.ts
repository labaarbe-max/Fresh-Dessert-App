import { verifyToken, verifyRole, unauthorizedResponse, forbiddenResponse } from './auth-middleware';
import { checkRateLimit } from './rate-limit';
import { Ratelimit } from '@upstash/ratelimit';
import { JWTPayload } from '../types/database.types';
import { logError } from './error-handler';

interface MiddlewareOptions {
  rateLimit?: Ratelimit;
}

type RouteHandler = (request: Request, user: JWTPayload, ...args: any[]) => Promise<Response>;
type PublicHandler = (request: Request, ...args: any[]) => Promise<Response>;

/**
 * Middleware d'authentification universel
 */
export function withAuth(
  handler: RouteHandler,
  allowedRoles: string[] = [],
  options: MiddlewareOptions = {}
) {
  return async (request: Request, ...args: any[]): Promise<Response> => {
    try {
      // 1. Vérification du token JWT
      const authResult = verifyToken(request);
      if (authResult.error || !authResult.user) {
        return unauthorizedResponse(authResult.error || 'Authentication failed');
      }

      // 2. Vérification des rôles si spécifiés
      if (allowedRoles.length > 0) {
        const roleCheck = verifyRole(authResult.user, allowedRoles);
        if (roleCheck.error) {
          return forbiddenResponse(roleCheck.error);
        }
      }

      // 3. Rate limiting si activé
      if (options.rateLimit) {
        const rateLimitResult = await checkRateLimit(request, options.rateLimit);
        if (!rateLimitResult.success) {
          return new Response(
            JSON.stringify({
              success: false,
              error: 'Rate limit exceeded',
              reset: rateLimitResult.reset
            }),
            {
              status: 429,
              headers: {
                'X-RateLimit-Limit': String(rateLimitResult.limit),
                'X-RateLimit-Remaining': String(rateLimitResult.remaining),
                'X-RateLimit-Reset': String(rateLimitResult.reset)
              }
            }
          );
        }
      }

      // 4. Exécution du handler avec le user authentifié
      return await handler(request, authResult.user, ...args);

    } catch (error) {
      logError(error as Error, 'AuthMiddleware', { operation: 'withAuth' });
      return unauthorizedResponse('Authentication failed');
    }
  };
}

/**
 * Middleware pour les endpoints publics (sans auth)
 */
export function withPublic(
  handler: PublicHandler,
  options: MiddlewareOptions = {}
) {
  return async (request: Request, ...args: any[]): Promise<Response> => {
    try {
      // Rate limiting si activé
      if (options.rateLimit) {
        const rateLimitResult = await checkRateLimit(request, options.rateLimit);
        if (!rateLimitResult.success) {
          return new Response(
            JSON.stringify({
              success: false,
              error: 'Rate limit exceeded',
              reset: rateLimitResult.reset
            }),
            {
              status: 429,
              headers: {
                'X-RateLimit-Limit': String(rateLimitResult.limit),
                'X-RateLimit-Remaining': String(rateLimitResult.remaining),
                'X-RateLimit-Reset': String(rateLimitResult.reset)
              }
            }
          );
        }
      }

      return await handler(request, ...args);

    } catch (error) {
      logError(error as Error, 'PublicMiddleware', { operation: 'withPublic' });
      throw error;
    }
  };
}

/**
 * Helper pour extraire et valider les paramètres de route
 */
export async function extractParams(
  request: Request,
  expectedParams: string[] = []
): Promise<Record<string, number>> {
  const params = await (request as any).params || {};
  const result: Record<string, number> = {};

  for (const param of expectedParams) {
    const value = params[param];
    
    if (!value) {
      throw new Error(`Missing required parameter: ${param}`);
    }

    if (!Number.isInteger(Number(value)) || Number(value) <= 0) {
      throw new Error(`Invalid parameter ${param}: must be a positive integer`);
    }

    result[param] = Number(value);
  }

  return result;
}

interface SchemaRule {
  required: boolean;
  type?: string;
  validate?: (value: any) => boolean;
}

type Schema = Record<string, SchemaRule>;

/**
 * Helper pour parser et valider le body JSON
 */
export async function parseBody<T = any>(
  request: Request,
  schema: Schema | null = null
): Promise<T> {
  try {
    const body = await request.json();
    
    if (schema) {
      return validateSchema(body, schema) as T;
    }
    
    return body as T;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error('Invalid JSON in request body');
    }
    throw error;
  }
}

/**
 * Validation de schéma simple
 */
function validateSchema(data: any, schema: Schema): Record<string, any> {
  const errors: string[] = [];
  const result: Record<string, any> = {};

  for (const [key, rules] of Object.entries(schema)) {
    const value = data[key];

    // Champ requis
    if (rules.required && (value === undefined || value === null || value === '')) {
      errors.push(`${key} is required`);
      continue;
    }

    // Skip si non requis et vide
    if (!rules.required && (value === undefined || value === null || value === '')) {
      continue;
    }

    // Type validation
    if (rules.type && typeof value !== rules.type) {
      errors.push(`${key} must be of type ${rules.type}`);
      continue;
    }

    // Validation personnalisée
    if (rules.validate && !rules.validate(value)) {
      errors.push(`${key} is invalid`);
      continue;
    }

    result[key] = value;
  }

  if (errors.length > 0) {
    throw new Error(`Validation failed: ${errors.join(', ')}`);
  }

  return result;
}

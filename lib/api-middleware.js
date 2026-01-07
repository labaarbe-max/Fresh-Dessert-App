import { verifyToken, verifyRole, unauthorizedResponse, forbiddenResponse } from './auth-middleware';
import { checkRateLimit } from './rate-limit';

/**
 * Middleware d'authentification universel
 * @param {Function} handler - Le handler de l'endpoint
 * @param {Array} allowedRoles - Rôles autorisés (optionnel)
 * @param {Object} options - Options supplémentaires
 * @returns {Function} Handler wrapper avec auth
 */
export function withAuth(handler, allowedRoles = [], options = {}) {
  return async (request, ...args) => {
    try {
      // 1. Vérification du token JWT
      const authResult = verifyToken(request);
      if (authResult.error) {
        return unauthorizedResponse(authResult.error);
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
                'X-RateLimit-Limit': rateLimitResult.limit,
                'X-RateLimit-Remaining': rateLimitResult.remaining,
                'X-RateLimit-Reset': rateLimitResult.reset
              }
            }
          );
        }
      }

      // 4. Exécution du handler avec le user authentifié
      return await handler(request, authResult.user, ...args);

    } catch (error) {
      console.error('Auth middleware error:', error);
      return unauthorizedResponse('Authentication failed');
    }
  };
}

/**
 * Middleware pour les endpoints publics (sans auth)
 * @param {Function} handler - Le handler de l'endpoint
 * @param {Object} options - Options (rate limiting, etc.)
 * @returns {Function} Handler wrapper
 */
export function withPublic(handler, options = {}) {
  return async (request, ...args) => {
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
                'X-RateLimit-Limit': rateLimitResult.limit,
                'X-RateLimit-Remaining': rateLimitResult.remaining,
                'X-RateLimit-Reset': rateLimitResult.reset
              }
            }
          );
        }
      }

      return await handler(request, ...args);

    } catch (error) {
      console.error('Public middleware error:', error);
      throw error;
    }
  };
}

/**
 * Helper pour extraire et valider les paramètres de route
 * @param {Request} request - La requête
 * @param {Array} expectedParams - Paramètres attendus
 * @returns {Object} Paramètres validés
 */
export async function extractParams(request, expectedParams = []) {
  const params = await (request.params || {});
  const result = {};

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

/**
 * Helper pour parser et valider le body JSON
 * @param {Request} request - La requête
 * @param {Object} schema - Schéma de validation (optionnel)
 * @returns {Object} Body parsé et validé
 */
export async function parseBody(request, schema = null) {
  try {
    const body = await request.json();
    
    if (schema) {
      return validateSchema(body, schema);
    }
    
    return body;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error('Invalid JSON in request body');
    }
    throw error;
  }
}

/**
 * Validation de schéma simple
 * @param {Object} data - Données à valider
 * @param {Object} schema - Schéma de validation
 * @returns {Object} Données validées
 */
function validateSchema(data, schema) {
  const errors = [];
  const result = {};

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
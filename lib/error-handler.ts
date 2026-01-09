import { NextResponse } from 'next/server';

/**
 * Service de gestion des erreurs centralisé
 * 
 * Responsabilités :
 * - Gestion uniforme des erreurs API
 * - Logs structurés
 * - Réponses HTTP cohérentes
 * - Classification des erreurs
 */

// ==========================================
// TYPES D'ERREURS
// ==========================================

export class ValidationError extends Error {
  field: string | null;
  statusCode: number;

  constructor(message: string, field: string | null = null) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
    this.statusCode = 400;
  }
}

export class NotFoundError extends Error {
  statusCode: number;
  resource: string;
  id: number | string | null;

  constructor(resource: string, id: number | string | null = null) {
    const message = id ? `${resource} with id ${id} not found` : `${resource} not found`;
    super(message);
    this.name = 'NotFoundError';
    this.statusCode = 404;
    this.resource = resource;
    this.id = id;
  }
}

export class UnauthorizedError extends Error {
  statusCode: number;

  constructor(message: string = 'Unauthorized access') {
    super(message);
    this.name = 'UnauthorizedError';
    this.statusCode = 401;
  }
}

export class ForbiddenError extends Error {
  statusCode: number;

  constructor(message: string = 'Access forbidden') {
    super(message);
    this.name = 'ForbiddenError';
    this.statusCode = 403;
  }
}

export class ConflictError extends Error {
  statusCode: number;

  constructor(message: string) {
    super(message);
    this.name = 'ConflictError';
    this.statusCode = 409;
  }
}

export class DatabaseError extends Error {
  statusCode: number;
  originalError: any;

  constructor(message: string, originalError: any = null) {
    super(message);
    this.name = 'DatabaseError';
    this.statusCode = 500;
    this.originalError = originalError;
  }
}

export class StockError extends Error {
  statusCode: number;
  productId: number | null;
  deliveryId: number | null;

  constructor(message: string, productId: number | null = null, deliveryId: number | null = null) {
    super(message);
    this.name = 'StockError';
    this.statusCode = 400;
    this.productId = productId;
    this.deliveryId = deliveryId;
  }
}

// ==========================================
// HANDLER PRINCIPAL
// ==========================================

/**
 * Handler principal pour les erreurs API
 * @param {Error} error - L'erreur à traiter
 * @param {string} context - Contexte de l'erreur (endpoint/action)
 * @param {Object} metadata - Métadonnées supplémentaires
 * @returns {NextResponse} - Réponse HTTP standardisée
 */
export function handleApiError(error: any, context: string = 'API', metadata: any = {}) {
  // Log structuré de l'erreur
  logError(error, context, metadata);

  // Déterminer le statut HTTP
  const statusCode = error.statusCode || 500;

  // Construire la réponse
  const errorResponse: any = {
    success: false,
    error: getErrorMessage(error),
    context,
    timestamp: new Date().toISOString()
  };

  // Ajouter des détails spécifiques selon le type d'erreur
  if (error instanceof ValidationError && error.field) {
    errorResponse.field = error.field;
  }

  if (error instanceof NotFoundError) {
    errorResponse.resource = error.resource;
    if (error.id) errorResponse.id = error.id;
  }

  if (error instanceof StockError) {
    errorResponse.stock_details = {
      product_id: error.productId,
      delivery_id: error.deliveryId
    };
  }

  // En développement, inclure plus de détails
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = error.stack;
    errorResponse.name = error.name;
    
    if (error.originalError) {
      errorResponse.original_error = error.originalError.message;
    }
  }

  return NextResponse.json(errorResponse, { status: statusCode });
}

/**
 * Handler pour les erreurs de validation
 * @param {string[]} errors - Liste des erreurs de validation
 * @param {string} context - Contexte de l'erreur
 * @returns {NextResponse} - Réponse 400 avec les erreurs
 */
export function handleValidationErrors(errors: string[], context: string = 'Validation') {
  const error = new ValidationError(errors.join(', '));
  return handleApiError(error, context, { validation_errors: errors });
}

/**
 * Handler pour les erreurs de base de données
 * @param {Error} dbError - Erreur de base de données
 * @param {string} context - Contexte de l'opération
 * @returns {NextResponse} - Réponse 500
 */
export function handleDatabaseError(dbError: any, context: string = 'Database') {
  // Classifier les erreurs MySQL courantes
  let message = 'Database operation failed';
  
  if (dbError.code === 'ER_DUP_ENTRY') {
    message = 'Duplicate entry detected';
  } else if (dbError.code === 'ER_NO_REFERENCED_ROW_2') {
    message = 'Referenced record not found';
  } else if (dbError.code === 'ER_ROW_IS_REFERENCED_2') {
    message = 'Cannot delete: record is referenced';
  }

  const error = new DatabaseError(message, dbError);
  return handleApiError(error, context, { mysql_code: dbError.code });
}

// ==========================================
// LOGGING
// ==========================================

/**
 * Log structuré des erreurs
 * @param {Error} error - L'erreur
 * @param {string} context - Contexte
 * @param {Object} metadata - Métadonnées
 */
export function logError(error: any, context: string, metadata: any = {}) {
  const logData = {
    timestamp: new Date().toISOString(),
    level: 'ERROR',
    context,
    message: error.message,
    name: error.name,
    statusCode: error.statusCode,
    metadata
  };

  // En production, on pourrait envoyer à un service de logging
  if (process.env.NODE_ENV === 'production') {
    console.error(JSON.stringify(logData));
  } else {
    console.error(`[${context}] ${error.name}: ${error.message}`);
    if (metadata && Object.keys(metadata).length > 0) {
      console.error('Metadata:', metadata);
    }
  }
}

/**
 * Log des requêtes API (pour monitoring)
 * @param {Request} request - La requête
 * @param {Object} user - Utilisateur authentifié (si applicable)
 * @param {number} duration - Durée en ms
 * @param {number} statusCode - Statut de la réponse
 */
export function logApiRequest(request: any, user: any = null, duration: number = 0, statusCode: number = 200) {
  const logData = {
    timestamp: new Date().toISOString(),
    level: 'INFO',
    method: request.method,
    url: request.url,
    userAgent: request.headers.get('user-agent'),
    ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
    duration,
    statusCode,
    user: user ? {
      id: user.id,
      role: user.role,
      email: user.email
    } : null
  };

  if (process.env.NODE_ENV === 'production') {
    console.info(JSON.stringify(logData));
  } else {
    console.log(`[${request.method}] ${request.url} - ${statusCode} (${duration}ms)`);
    if (user) {
      console.log(`User: ${user.email} (${user.role})`);
    }
  }
}

// ==========================================
// HELPERS
// ==========================================

/**
 * Extrait le message d'erreur approprié
 * @param {Error} error - L'erreur
 * @returns {string} - Message d'erreur
 */
function getErrorMessage(error: any): string {
  // Messages spécifiques selon le type d'erreur
  switch (error.name) {
    case 'ValidationError':
      return `Validation failed: ${error.message}`;
    case 'NotFoundError':
      return error.message;
    case 'UnauthorizedError':
      return error.message;
    case 'ForbiddenError':
      return error.message;
    case 'ConflictError':
      return `Conflict: ${error.message}`;
    case 'StockError':
      return `Stock error: ${error.message}`;
    case 'DatabaseError':
      return process.env.NODE_ENV === 'production' 
        ? 'Database operation failed' 
        : `Database error: ${error.message}`;
    default:
      return process.env.NODE_ENV === 'production' 
        ? 'Internal server error' 
        : error.message;
  }
}

/**
 * Wrapper pour les handlers async avec gestion d'erreurs
 * @param {Function} handler - Le handler async
 * @param {string} context - Contexte pour les logs
 * @returns {Function} Handler wrapper
 */
export function withErrorHandling(handler: Function, context: string = 'API') {
  return async (...args) => {
    try {
      const startTime = Date.now();
      const result = await handler(...args);
      const duration = Date.now() - startTime;
      
      // Log de succès si disponible
      if (args[0] && typeof args[0] === 'object' && args[0].method) {
        logApiRequest(args[0], args[1] || null, duration);
      }
      
      return result;
    } catch (error) {
      return handleApiError(error, context);
    }
  };
}

/**
 * Crée une réponse de succès standardisée
 * @param {any} data - Données à retourner
 * @param {Object} meta - Métadonnées (pagination, etc.)
 * @param {number} status - Statut HTTP (défaut 200)
 * @returns {NextResponse} - Réponse standardisée
 */
export function createSuccessResponse(data: any, meta: any = null, status: number = 200) {
  const response: any = {
    success: true,
    data,
    timestamp: new Date().toISOString()
  };

  if (meta) {
    response.meta = meta;
  }

  return NextResponse.json(response, { status });
}

/**
 * Crée une réponse d'erreur rapide
 * @param {string} message - Message d'erreur
 * @param {number} status - Statut HTTP
 * @param {Object} details - Détails supplémentaires
 * @returns {NextResponse} - Réponse d'erreur
 */
export function createErrorResponse(message: string, status: number = 400, details: any = null) {
  const error: any = new Error(message);
  error.statusCode = status;
  
  if (details) {
    return handleApiError(error, 'API', details);
  }
  
  return handleApiError(error, 'API');
}
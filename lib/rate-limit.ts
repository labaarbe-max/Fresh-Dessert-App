import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Créer le client Redis
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Rate limiter pour les endpoints d'authentification
// 5 requêtes par minute par IP
export const authRateLimiter = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(5, '1 m'),
  analytics: true,
  prefix: 'ratelimit:auth',
});

// Rate limiter pour les endpoints API généraux
// 100 requêtes par minute par IP
export const apiRateLimiter = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(100, '1 m'),
  analytics: true,
  prefix: 'ratelimit:api',
});

// Types pour le rate limit
export interface RateLimitResult {
  success: boolean;
  limit: number;
  reset: number;
  remaining: number;
  ip: string;
}

// Helper pour vérifier le rate limit
export async function checkRateLimit(
  request: Request,
  limiter: Ratelimit
): Promise<RateLimitResult> {
  // Utiliser l'IP comme identifiant
  const ip = request.headers.get('x-forwarded-for') || 
             request.headers.get('x-real-ip') || 
             'unknown';
  
  const { success, limit, reset, remaining } = await limiter.limit(ip);
  
  return {
    success,
    limit,
    reset,
    remaining,
    ip
  };
}

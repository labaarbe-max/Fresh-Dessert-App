import { createSuccessResponse, handleApiError } from '@/lib/error-handler';
import { createUser, getUserByEmail } from '@/lib/db';
import { authRateLimiter, checkRateLimit } from '@/lib/rate-limit';
import { validateRegisterData } from '@/lib/validation';
import bcrypt from 'bcryptjs';

export async function POST(request) {
    try {
        // Vérifier le rate limit
        const rateLimitResult = await checkRateLimit(request, authRateLimiter);
        
        if (!rateLimitResult.success) {
            return handleApiError(
                new Error('Too many requests. Please try again later.'), 
                'Register',
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

        const { email, password, first_name, last_name, phone, role } = await request.json();

        // Validation centralisée
        const validation = validateRegisterData({ email, password, first_name, last_name, phone, role });
        if (validation.error) {
            return handleApiError(validation.error, 'Register');
        }

        // Vérifier si l'email existe déjà
        const existingUser = await getUserByEmail(email);
        if (existingUser) {
            return handleApiError(new Error('Email already exists'), 'Register', 409);
        }

        // Hasher le mot de passe
        const password_hash = await bcrypt.hash(password, 10);

        // Créer l'utilisateur
        const user = await createUser({
            email,
            password_hash,
            first_name,
            last_name,
            phone: phone || null,
            role
        });

        return createSuccessResponse(
            {
                id: user.id,
                email: user.email,
                first_name: user.first_name,
                last_name: user.last_name,
                role: user.role
            }, 
            'User created successfully', 
            201,
            { 
                user_role: user.role,
                registration_method: 'email_password',
                password_strength: 'strong'
            }
        );

    } catch (error) {
        return handleApiError(error, 'Register');
    }
}
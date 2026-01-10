import { createSuccessResponse, handleApiError } from '@/lib/error-handler';
import { createUser, getUserByEmail } from '@/lib/db';
import { authRateLimiter, checkRateLimit } from '@/lib/rate-limit';
import { validateRegisterData, registerSchema } from '@/lib/validation';
import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

export async function POST(request: NextRequest) {
    try {
        // Vérifier le rate limit
        const rateLimitResult = await checkRateLimit(request, authRateLimiter);

        if (!rateLimitResult.success) {
            const error: any = new Error('Too many requests. Please try again later.');
            error.statusCode = 429;
            return handleApiError(error, 'Register', {
                retryAfter: Math.ceil((rateLimitResult.reset - Date.now()) / 1000),
                rateLimit: {
                    limit: rateLimitResult.limit,
                    remaining: rateLimitResult.remaining,
                    reset: rateLimitResult.reset
                }
            });
        }
        // Validation centralisée avec zod
        const payload = await request.json();
        const validation = validateRegisterData(payload);
        if (validation.error) {
            return handleApiError(validation.error, 'Register');
        }
        const { email, password, first_name, last_name, phone, role } = validation.data as z.infer<typeof registerSchema>;

        // Vérifier si l'email existe déjà
        const existingUser = await getUserByEmail(email);
        if (existingUser) {
            const error: any = new Error('Email already exists');
            error.statusCode = 409;
            return handleApiError(error, 'Register');
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
            {
                message: 'User created successfully',
                user_role: user.role,
                registration_method: 'email_password',
                password_strength: 'strong'
            },
            201
        );

    } catch (error) {
        return handleApiError(error, 'Register');
    }
}
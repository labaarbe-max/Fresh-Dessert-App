import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { createUser, getUserByEmail } from '@/lib/db';
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

    try {
        const { email, password, first_name, last_name, phone, role } = await request.json();

        // Vérifier le format de l'email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { success: false, error: 'Invalid email format' },
                { status: 400 }
            );
        }
        console.log('Received data:', { email, password, first_name, last_name, phone, role });
        // Validation
        if (!email || !password || !first_name || !last_name || !role) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Missing required fields: email, password, first_name, last_name, role'
                },
                { status: 400 }
            );
        }

        // Vérifier la longueur et la complexité du mot de passe
        if (password.length < 12) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Password must be at least 12 characters'
                },
                { status: 400 }
            );
        }

        // Vérifier la complexité : au moins 1 lettre, 1 chiffre, 1 caractère spécial
        const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{12,}$/;
        if (!passwordRegex.test(password)) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Password must contain at least one letter, one number, and one special character (@$!%*#?&)'
                },
                { status: 400 }
            );
        }

        // Vérifier si l'email existe déjà
        const existingUser = await getUserByEmail(email);
        if (existingUser) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Email already exists'
                },
                { status: 409 }
            );
        }

        // Valider le rôle
        const validRoles = ['client', 'deliverer', 'dispatcher', 'admin'];
        if (!validRoles.includes(role)) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Invalid role. Must be one of: client, deliverer, dispatcher, admin'
                },
                { status: 400 }
            );
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

        return NextResponse.json({
            success: true,
            message: 'User created successfully',
            data: {
                id: user.id,
                email: user.email,
                first_name: user.first_name,
                last_name: user.last_name,
                role: user.role
            }
        }, { status: 201 });

    } catch (error) {
        console.error('Error in POST /api/auth/register:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to create user',
                message: error.message
            },
            { status: 500 }
        );
    }
}
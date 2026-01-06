import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getUserByEmail } from '@/lib/db';

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing email or password'
        },
        { status: 400 }
      );
    }

    // Récupérer l'utilisateur
    const user = await getUserByEmail(email);
    
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid credentials'
        },
        { status: 401 }
      );
    }

    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    
    if (!isPasswordValid) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid credentials'
        },
        { status: 401 }
      );
    }

    // Vérifier si l'utilisateur est actif
    if (!user.active) {
      return NextResponse.json(
        {
          success: false,
          error: 'Account is inactive'
        },
        { status: 403 }
      );
    }

    // Créer le token JWT
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        first_name: user.first_name,
        last_name: user.last_name
      },
      process.env.NEXTAUTH_SECRET,
      { expiresIn: '30d' }
    );

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          role: user.role
        },
        token
      }
    });

  } catch (error) {
    console.error('Error in POST /api/auth/login:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Login failed',
        message: error.message
      },
      { status: 500 }
    );
  }
}
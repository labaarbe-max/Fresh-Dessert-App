import { NextRequest } from 'next/server';
import { createSuccessResponse, handleApiError } from '@/lib/error-handler';

export async function GET(request: NextRequest) {
  try {
    return createSuccessResponse(
      {
        status: 'ok',
        service: 'Fresh Dessert API',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      }, 
      { 
        service_type: 'health_check',
        environment: process.env.NODE_ENV || 'development',
        version: '1.0.0'
      },
      200
    );
  } catch (error) {
    return handleApiError(error, 'Health Check');
  }
}
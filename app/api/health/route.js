import { createSuccessResponse, handleApiError } from '@/lib/error-handler';

export async function GET() {
  try {
    return createSuccessResponse(
      {
        status: 'ok',
        service: 'Fresh Dessert API',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      }, 
      'Service is healthy', 
      200,
      { 
        service_type: 'health_check',
        environment: process.env.NODE_ENV || 'development',
        version: '1.0.0'
      }
    );
  } catch (error) {
    return handleApiError(error, 'Health Check');
  }
}
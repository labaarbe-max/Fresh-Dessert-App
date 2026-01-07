import { withAuth } from '@/lib/api-middleware';
import { createSuccessResponse, handleApiError } from '@/lib/error-handler';
import { pool } from '@/lib/db';

export const GET = withAuth(async (request, user) => {
  try {
    const [cityStats] = await pool.query(`
      SELECT 
        a.city,
        a.postal_code,
        COUNT(DISTINCT o.id) as orders_count,
        SUM(o.total_price) as total_revenue,
        AVG(o.total_price) as avg_order_value,
        COUNT(DISTINCT o.user_id) as unique_customers,
        COUNT(DISTINCT a.id) as addresses_count,
        COUNT(DISTINCT d.id) as deliveries_count
      FROM addresses a
      LEFT JOIN orders o ON a.id = o.address_id AND o.status IN ('delivered', 'completed')
      LEFT JOIN deliveries d ON o.delivery_id = d.id
      GROUP BY a.city, a.postal_code
      ORDER BY total_revenue DESC
      LIMIT 20
    `);
    
    const [deliveryTypeStats] = await pool.query(`
      SELECT 
        CASE 
          WHEN a.delivery_address IS NOT NULL AND a.address_id IS NULL THEN 'one_time'
          WHEN a.address_id IS NOT NULL THEN 'registered_address'
          ELSE 'unknown'
        END as delivery_type,
        COUNT(DISTINCT o.id) as orders_count,
        SUM(o.total_price) as total_revenue,
        AVG(o.total_price) as avg_order_value
      FROM orders o
      LEFT JOIN addresses a ON o.address_id = a.id
      WHERE o.status IN ('delivered', 'completed')
      GROUP BY delivery_type
      ORDER BY orders_count DESC
    `);
    
    return createSuccessResponse({
      cities: cityStats,
      delivery_types: deliveryTypeStats
    }, null, 200);
  } catch (error) {
    return handleApiError(error, 'Geography Stats');
  }
}, ['admin', 'dispatcher']);
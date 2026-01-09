import { withAuth } from '@/lib/api-middleware';
import { createSuccessResponse, handleApiError } from '@/lib/error-handler';
import pool from '@/lib/db';

export const GET = withAuth(async (request, user) => {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'month';
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    
    let dateFilter = '';
    let dateFormat = '';
    
    switch (period) {
      case 'hour':
        dateFormat = '%Y-%m-%d %H:00:00';
        break;
      case 'day':
        dateFormat = '%Y-%m-%d';
        break;
      case 'week':
        dateFormat = '%Y-%u';
        break;
      case 'month':
        dateFormat = '%Y-%m';
        break;
      case 'year':
        dateFormat = '%Y';
        break;
      default:
        dateFormat = '%Y-%m';
    }
    
    if (startDate && endDate) {
      dateFilter = `AND DATE(o.created_at) BETWEEN '${startDate}' AND '${endDate}'`;
    }
    
    const [timelineData] = await pool.query(`
      SELECT 
        DATE_FORMAT(o.created_at, '${dateFormat}') as period,
        COUNT(DISTINCT o.id) as orders_count,
        SUM(o.total_price) as total_revenue,
        AVG(o.total_price) as avg_order_value,
        COUNT(DISTINCT o.user_id) as unique_customers,
        COUNT(DISTINCT d.id) as deliveries_count,
        COALESCE(SUM(ds.sold_quantity), 0) as items_sold
      FROM orders o
      LEFT JOIN deliveries d ON o.delivery_id = d.id
      LEFT JOIN delivery_stocks ds ON d.id = ds.delivery_id
      WHERE o.status IN ('delivered', 'completed') ${dateFilter}
      GROUP BY DATE_FORMAT(o.created_at, '${dateFormat}')
      ORDER BY period DESC
      LIMIT 50
    `) as any[];
    
    const [peakHours] = await pool.query(`
      SELECT 
        HOUR(o.created_at) as hour,
        COUNT(DISTINCT o.id) as orders_count,
        SUM(o.total_price) as total_revenue
      FROM orders o
      WHERE o.status IN ('delivered', 'completed')
        AND o.created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      GROUP BY HOUR(o.created_at)
      ORDER BY orders_count DESC
      LIMIT 24
    `) as any[];
    
    return createSuccessResponse(
      {
        timeline: timelineData,
        peak_hours: peakHours
      },
      { 
        period,
        requested_by: user.role
      },
      200
    );
  } catch (error) {
    return handleApiError(error, 'Timeline Stats');
  }
}, ['admin', 'dispatcher']);
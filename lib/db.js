import mysql from 'mysql2/promise';
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

export async function getDeliverers(activeOnly = false) {
  try {
    let query = `
      SELECT 
        d.id,
        d.user_id,
        u.email,
        u.first_name,
        u.last_name,
        u.phone,
        d.vehicle_type,
        d.license_plate,
        d.is_available,
        d.current_latitude,
        d.current_longitude,
        d.rating,
        d.total_deliveries,
        d.created_at,
        d.updated_at
      FROM deliverers d
      INNER JOIN users u ON d.user_id = u.id
      WHERE u.active = true
    `;
    
    if (activeOnly) {
      query += ' AND d.is_available = true';
    }
    
    query += ' ORDER BY u.first_name';
    
    const [rows] = await pool.query(query);
    return rows;
  } catch (error) {
    console.error('Error fetching deliverers:', error);
    throw error;
  }
}
export default pool;
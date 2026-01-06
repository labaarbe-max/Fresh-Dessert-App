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

export async function getProducts(activeOnly = false, category = null) {
  try {
    let query = 'SELECT * FROM products WHERE 1=1';
    const params = [];
    
    if (activeOnly) {
      query += ' AND active = ?';
      params.push(true);
    }
    
    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }
    
    query += ' ORDER BY name';
    
    const [rows] = await pool.query(query, params);
    return rows;
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
}

export async function getProductById(id) {
  try {
    const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [id]);
    return rows[0];
  } catch (error) {
    console.error('Error fetching product:', error);
    throw error;
  }
}

export async function createProduct(data) {
  try {
    const { name, description, category, price, allergens, image_url, emoji, active } = data;
    const [result] = await pool.query(
      'INSERT INTO products (name, description, category, price, allergens, image_url, emoji, active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [name, description, category, price, allergens, image_url, emoji, active ?? true]
    );
    return { id: result.insertId, ...data };
  } catch (error) {
    console.error('Error creating product:', error);
    throw error;
  }
}

export async function updateProduct(id, data) {
  try {
    const { name, description, category, price, allergens, image_url, emoji, active } = data;
    await pool.query(
      'UPDATE products SET name = ?, description = ?, category = ?, price = ?, allergens = ?, image_url = ?, emoji = ?, active = ? WHERE id = ?',
      [name, description, category, price, allergens, image_url, emoji, active, id]
    );
    return { id, ...data };
  } catch (error) {
    console.error('Error updating product:', error);
    throw error;
  }
}

export async function deleteProduct(id) {
  try {
    await pool.query('DELETE FROM products WHERE id = ?', [id]);
    return { id };
  } catch (error) {
    console.error('Error deleting product:', error);
    throw error;
  }
}

export default pool;
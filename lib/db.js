import mysql from 'mysql2/promise';
import { StockService } from './stock-service.js';
import { validateStatsParams } from './validation.js';

// Pour la base de données

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Pour les livreurs

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

export async function createDeliverer(delivererData) {
  try {
    const {
      user_id,
      vehicle_type,
      phone,
      status = 'active'
    } = delivererData;

    const [result] = await pool.query(
      `INSERT INTO deliverers 
      (user_id, vehicle_type, phone, status) 
      VALUES (?, ?, ?, ?)`,
      [user_id, vehicle_type, phone, status]
    );

    return { id: result.insertId, ...delivererData };
  } catch (error) {
    console.error('Error creating deliverer:', error);
    throw error;
  }
}

// Pour les produits

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

// Pour les users

export async function createUser(userData) {
  try {
    const { email, password_hash, first_name, last_name, phone, role } = userData;
    const [result] = await pool.query(
      'INSERT INTO users (email, password_hash, first_name, last_name, phone, role, email_verified) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [email, password_hash, first_name, last_name, phone, role, false]
    );
    return { id: result.insertId, email, first_name, last_name, role };
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}

export async function getUserByEmail(email) {
  try {
    const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    return users[0];
  } catch (error) {
    console.error('Error fetching user by email:', error);
    throw error;
  }
}

// Pour les commandes (orders)

export async function getOrders(userId = null, role = null) {
  try {
    let query = `
      SELECT 
        o.*,
        u.first_name, u.last_name, u.email,
        d.name as deliverer_name
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN deliverers d ON o.deliverer_id = d.id
    `;
    const params = [];
    
    // Si client, voir uniquement ses commandes
    if (role === 'client' && userId) {
      query += ' WHERE o.user_id = ?';
      params.push(userId);
    }
    
    query += ' ORDER BY o.created_at DESC';
    
    const [rows] = await pool.query(query, params);
    return rows;
  } catch (error) {
    console.error('Error fetching orders:', error);
    throw error;
  }
}

export async function getOrderById(orderId, userId = null, role = null) {
  try {
    let query = `
      SELECT 
        o.*,
        u.first_name, u.last_name, u.email,
        d.name as deliverer_name
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN deliverers d ON o.deliverer_id = d.id
      WHERE o.id = ?
    `;
    const params = [orderId];
    
    // Si client, vérifier que c'est sa commande
    if (role === 'client' && userId) {
      query += ' AND o.user_id = ?';
      params.push(userId);
    }
    
    const [rows] = await pool.query(query, params);
    
    if (rows.length === 0) {
      return null;
    }
    
    // Récupérer les items de la commande
    const [items] = await pool.query(`
      SELECT 
        oi.*,
        p.name as product_name,
        p.emoji
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
    `, [orderId]);
    
    return {
      ...rows[0],
      items
    };
  } catch (error) {
    console.error('Error fetching order:', error);
    throw error;
  }
}

export async function createOrder(orderData) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    
    const { user_id, delivery_address, delivery_date, notes, items, delivery_id } = orderData;
    
    // Si delivery_id est spécifié, décrémenter les stocks
    if (delivery_id) {
      // Valider et décrémenter les stocks
      const stockResult = await StockService.processOrderStocks(delivery_id, items);
      
      // Calculer le total basé sur les prix des produits
      let total_price = 0;
      for (const item of items) {
        const [product] = await connection.query('SELECT price FROM products WHERE id = ?', [item.product_id]);
        if (product.length === 0) {
          throw new Error(`Product ${item.product_id} not found`);
        }
        total_price += product[0].price * item.quantity;
      }
      
      // Créer la commande avec delivery_id
      const [orderResult] = await connection.query(
        'INSERT INTO orders (user_id, total_price, delivery_address, delivery_date, notes, delivery_id, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [user_id, total_price, delivery_address, delivery_date, notes, delivery_id, 'confirmed']
      );
      
      const orderId = orderResult.insertId;
      
      // Créer les items
      for (const item of items) {
        const [product] = await connection.query('SELECT price FROM products WHERE id = ?', [item.product_id]);
        const unit_price = product[0].price;
        const subtotal = unit_price * item.quantity;
        
        await connection.query(
          'INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal) VALUES (?, ?, ?, ?, ?)',
          [orderId, item.product_id, item.quantity, unit_price, subtotal]
        );
      }
      
      await connection.commit();
      
      return { 
        id: orderId, 
        total_price, 
        ...orderData,
        stock_decremented: stockResult.items,
        total_decremented: stockResult.totalDecremented
      };
      
    } else {
      // Logique originale sans décrémentation de stocks
      let total_price = 0;
      for (const item of items) {
        const [product] = await connection.query('SELECT price FROM products WHERE id = ?', [item.product_id]);
        if (product.length === 0) {
          throw new Error(`Product ${item.product_id} not found`);
        }
        total_price += product[0].price * item.quantity;
      }
      
      const [orderResult] = await connection.query(
        'INSERT INTO orders (user_id, total_price, delivery_address, delivery_date, notes) VALUES (?, ?, ?, ?, ?)',
        [user_id, total_price, delivery_address, delivery_date, notes]
      );
      
      const orderId = orderResult.insertId;
      
      for (const item of items) {
        const [product] = await connection.query('SELECT price FROM products WHERE id = ?', [item.product_id]);
        const unit_price = product[0].price;
        const subtotal = unit_price * item.quantity;
        
        await connection.query(
          'INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal) VALUES (?, ?, ?, ?, ?)',
          [orderId, item.product_id, item.quantity, unit_price, subtotal]
        );
      }
      
      await connection.commit();
      
      return { id: orderId, total_price, ...orderData };
    }
    
  } catch (error) {
    await connection.rollback();
    console.error('Error creating order:', error);
    throw error;
  } finally {
    connection.release();
  }
}

export async function updateOrder(orderId, updateData) {
  try {
    const { status, delivery_address, delivery_date, notes, deliverer_id } = updateData;
    
    await pool.query(
      'UPDATE orders SET status = ?, delivery_address = ?, delivery_date = ?, notes = ?, deliverer_id = ? WHERE id = ?',
      [status, delivery_address, delivery_date, notes, deliverer_id, orderId]
    );
    
    return { id: orderId, ...updateData };
  } catch (error) {
    console.error('Error updating order:', error);
    throw error;
  }
}

export async function deleteOrder(orderId) {
  try {
    await pool.query('DELETE FROM orders WHERE id = ?', [orderId]);
    return { id: orderId };
  } catch (error) {
    console.error('Error deleting order:', error);
    throw error;
  }
}

// Pour les tournées (deliveries)

export async function getDeliveries(delivererId = null, role = null) {
  try {
    let query = `
      SELECT 
        d.*,
        CONCAT(u.first_name, ' ', u.last_name) as deliverer_name,
        del.vehicle_type,
        COUNT(o.id) as order_count
      FROM deliveries d
      LEFT JOIN deliverers del ON d.deliverer_id = del.id
      LEFT JOIN users u ON del.user_id = u.id
      LEFT JOIN orders o ON d.id = o.delivery_id
    `;
    const params = [];
    
    // Si deliverer, voir uniquement ses tournées
    if (role === 'deliverer' && delivererId) {
      query += ' WHERE d.deliverer_id = ?';
      params.push(delivererId);
    }
    
    query += ' GROUP BY d.id ORDER BY d.delivery_date DESC, d.created_at DESC';
    
    const [rows] = await pool.query(query, params);
    return rows;
  } catch (error) {
    console.error('Error fetching deliveries:', error);
    throw error;
  }
}

export async function getDeliveryById(deliveryId, delivererId = null, role = null) {
  try {
    let query = `
      SELECT 
        d.*,
        CONCAT(u.first_name, ' ', u.last_name) as deliverer_name,
        del.vehicle_type,
        u.phone as deliverer_phone
      FROM deliveries d
      LEFT JOIN deliverers del ON d.deliverer_id = del.id
      LEFT JOIN users u ON del.user_id = u.id
      WHERE d.id = ?
    `;
    const params = [deliveryId];
    
    // Si deliverer, vérifier que c'est sa tournée
    if (role === 'deliverer' && delivererId) {
      query += ' AND d.deliverer_id = ?';
      params.push(delivererId);
    }
    
    const [rows] = await pool.query(query, params);
    
    if (rows.length === 0) {
      return null;
    }
    
    // Récupérer les commandes de la tournée
    const [orders] = await pool.query(`
      SELECT 
        o.*,
        u.first_name, u.last_name, u.email, u.phone
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE o.delivery_id = ?
      ORDER BY o.created_at
    `, [deliveryId]);
    
    return {
      ...rows[0],
      orders
    };
  } catch (error) {
    console.error('Error fetching delivery:', error);
    throw error;
  }
}

export async function createDelivery(deliveryData) {
  try {
    const { deliverer_id, delivery_date, notes, order_ids } = deliveryData;
    
    // Créer la tournée
    const [result] = await pool.query(
      'INSERT INTO deliveries (deliverer_id, delivery_date, notes) VALUES (?, ?, ?)',
      [deliverer_id, delivery_date, notes]
    );
    
    const deliveryId = result.insertId;
    
    // Assigner les commandes à la tournée si order_ids fourni
    if (order_ids && order_ids.length > 0) {
      for (const orderId of order_ids) {
        await pool.query(
          'UPDATE orders SET delivery_id = ?, deliverer_id = ?, status = ? WHERE id = ?',
          [deliveryId, deliverer_id, 'confirmed', orderId]
        );
      }
    }
    
    return { id: deliveryId, ...deliveryData };
  } catch (error) {
    console.error('Error creating delivery:', error);
    throw error;
  }
}

export async function updateDelivery(deliveryId, updateData) {
  try {
    const { status, delivery_date, notes, deliverer_id } = updateData;
    
    await pool.query(
      'UPDATE deliveries SET status = ?, delivery_date = ?, notes = ?, deliverer_id = ? WHERE id = ?',
      [status, delivery_date, notes, deliverer_id, deliveryId]
    );
    
    return { id: deliveryId, ...updateData };
  } catch (error) {
    console.error('Error updating delivery:', error);
    throw error;
  }
}

export async function deleteDelivery(deliveryId) {
  try {
    // Retirer l'assignation des commandes
    await pool.query('UPDATE orders SET delivery_id = NULL WHERE delivery_id = ?', [deliveryId]);
    
    // Supprimer la tournée
    await pool.query('DELETE FROM deliveries WHERE id = ?', [deliveryId]);
    
    return { id: deliveryId };
  } catch (error) {
    console.error('Error deleting delivery:', error);
    throw error;
  }
}

// Pour les adresses (addresses)

export async function getAddresses(userId) {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC',
      [userId]
    );
    return rows;
  } catch (error) {
    console.error('Error fetching addresses:', error);
    throw error;
  }
}

export async function getAddressById(addressId, userId) {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM addresses WHERE id = ? AND user_id = ?',
      [addressId, userId]
    );
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    console.error('Error fetching address:', error);
    throw error;
  }
}

export async function createAddress(addressData) {
  try {
    const {
      user_id,
      label,
      street_address,
      city,
      postal_code,
      floor,
      door_number,
      building_code,
      intercom,
      delivery_instructions,
      is_default
    } = addressData;

    // Si c'est l'adresse par défaut, retirer le flag des autres adresses
    if (is_default) {
      await pool.query(
        'UPDATE addresses SET is_default = FALSE WHERE user_id = ?',
        [user_id]
      );
    }

    const [result] = await pool.query(
      `INSERT INTO addresses 
      (user_id, label, street_address, city, postal_code, floor, door_number, building_code, intercom, delivery_instructions, is_default) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [user_id, label, street_address, city, postal_code, floor, door_number, building_code, intercom, delivery_instructions, is_default || false]
    );

    return { id: result.insertId, ...addressData };
  } catch (error) {
    console.error('Error creating address:', error);
    throw error;
  }
}

export async function updateAddress(addressId, userId, updateData) {
  try {
    const {
      label,
      street_address,
      city,
      postal_code,
      floor,
      door_number,
      building_code,
      intercom,
      delivery_instructions,
      is_default
    } = updateData;

    // Si c'est l'adresse par défaut, retirer le flag des autres adresses
    if (is_default) {
      await pool.query(
        'UPDATE addresses SET is_default = FALSE WHERE user_id = ?',
        [userId]
      );
    }

    await pool.query(
      `UPDATE addresses SET 
      label = ?, street_address = ?, city = ?, postal_code = ?, 
      floor = ?, door_number = ?, building_code = ?, intercom = ?, 
      delivery_instructions = ?, is_default = ?
      WHERE id = ? AND user_id = ?`,
      [label, street_address, city, postal_code, floor, door_number, building_code, intercom, delivery_instructions, is_default || false, addressId, userId]
    );

    return { id: addressId, ...updateData };
  } catch (error) {
    console.error('Error updating address:', error);
    throw error;
  }
}

export async function deleteAddress(addressId, userId) {
  try {
    await pool.query(
      'DELETE FROM addresses WHERE id = ? AND user_id = ?',
      [addressId, userId]
    );
    return { id: addressId };
  } catch (error) {
    console.error('Error deleting address:', error);
    throw error;
  }
}

// Pour les stocks (delivery_stocks)

export async function getDeliveryStocks(deliveryId) {
  try {
    const [rows] = await pool.query(
      `SELECT 
        ds.*,
        p.name as product_name,
        p.price as product_price,
        p.category as product_category
      FROM delivery_stocks ds
      LEFT JOIN products p ON ds.product_id = p.id
      WHERE ds.delivery_id = ?
      ORDER BY p.name`,
      [deliveryId]
    );
    return rows;
  } catch (error) {
    console.error('Error fetching delivery stocks:', error);
    throw error;
  }
}

export async function getStockById(stockId) {
  try {
    const [rows] = await pool.query(
      `SELECT 
        ds.*,
        p.name as product_name,
        p.price as product_price
      FROM delivery_stocks ds
      LEFT JOIN products p ON ds.product_id = p.id
      WHERE ds.id = ?`,
      [stockId]
    );
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    console.error('Error fetching stock:', error);
    throw error;
  }
}

export async function createDeliveryStock(stockData) {
  try {
    const {
      delivery_id,
      product_id,
      initial_quantity
    } = stockData;

    const [result] = await pool.query(
      `INSERT INTO delivery_stocks 
      (delivery_id, product_id, initial_quantity, current_quantity) 
      VALUES (?, ?, ?, ?)`,
      [delivery_id, product_id, initial_quantity, initial_quantity]
    );

    return { id: result.insertId, ...stockData, current_quantity: initial_quantity, sold_quantity: 0 };
  } catch (error) {
    console.error('Error creating delivery stock:', error);
    throw error;
  }
}

export async function updateDeliveryStock(stockId, updateData) {
  try {
    const {
      initial_quantity,
      current_quantity
    } = updateData;

    await pool.query(
      `UPDATE delivery_stocks SET 
      initial_quantity = ?, 
      current_quantity = ?
      WHERE id = ?`,
      [initial_quantity, current_quantity, stockId]
    );

    return { id: stockId, ...updateData };
  } catch (error) {
    console.error('Error updating delivery stock:', error);
    throw error;
  }
}

export async function decrementStock(deliveryId, productId, quantity) {
  try {
    await pool.query(
      `UPDATE delivery_stocks 
      SET current_quantity = current_quantity - ?,
          sold_quantity = sold_quantity + ?
      WHERE delivery_id = ? AND product_id = ? AND current_quantity >= ?`,
      [quantity, quantity, deliveryId, productId, quantity]
    );

    const [rows] = await pool.query(
      'SELECT * FROM delivery_stocks WHERE delivery_id = ? AND product_id = ?',
      [deliveryId, productId]
    );

    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    console.error('Error decrementing stock:', error);
    throw error;
  }
}

export async function deleteDeliveryStock(stockId) {
  try {
    await pool.query(
      'DELETE FROM delivery_stocks WHERE id = ?',
      [stockId]
    );
    return { id: stockId };
  } catch (error) {
    console.error('Error deleting delivery stock:', error);
    throw error;
  }
}

export async function bulkCreateDeliveryStocks(deliveryId, stocksArray) {
  try {
    const values = stocksArray.map(stock => [
      deliveryId,
      stock.product_id,
      stock.initial_quantity,
      stock.initial_quantity
    ]);

    const [result] = await pool.query(
      `INSERT INTO delivery_stocks 
      (delivery_id, product_id, initial_quantity, current_quantity) 
      VALUES ?`,
      [values]
    );

    return { insertedCount: result.affectedRows };
  } catch (error) {
    console.error('Error bulk creating delivery stocks:', error);
    throw error;
  }
}

// FONCTIONS DE STATISTIQUES INTÉGRÉES AVEC STOCKS

export async function getRevenueStats(period = 'month', startDate = null, endDate = null) {
  try {
    const { period: validatedPeriod, startDate: validatedStart, endDate: validatedEnd } = 
      validateStatsParams({ period, start_date: startDate, end_date: endDate });
    
    let dateFilter = '';
    let dateFormat = '';
    
    switch (validatedPeriod) {
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
    
    if (validatedStart && validatedEnd) {
      dateFilter = `AND DATE(o.created_at) BETWEEN '${validatedStart.split(' ')[0]}' AND '${validatedEnd.split(' ')[0]}'`;
    }
    
    const [revenueData] = await pool.query(`
      SELECT 
        DATE_FORMAT(o.created_at, '${dateFormat}') as period,
        COUNT(DISTINCT o.id) as orders_count,
        SUM(o.total_price) as total_revenue,
        AVG(o.total_price) as avg_order_value,
        SUM(oi.quantity) as items_sold
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.status IN ('delivered', 'completed') ${dateFilter}
      GROUP BY DATE_FORMAT(o.created_at, '${dateFormat}')
      ORDER BY period DESC
      LIMIT 12
    `);
    
    const [globalStats] = await pool.query(`
      SELECT 
        COUNT(DISTINCT o.id) as total_orders,
        SUM(o.total_price) as total_revenue,
        AVG(o.total_price) as avg_order_value,
        COUNT(DISTINCT o.user_id) as unique_customers,
        SUM(oi.quantity) as total_items_sold
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.status IN ('delivered', 'completed') ${dateFilter}
    `);
    
    return {
      periods: revenueData,
      global: globalStats[0] || {}
    };
  } catch (error) {
    console.error('Error fetching revenue stats:', error);
    throw error;
  }
}
export async function getTopProducts(limit = 10, period = 'month') {
  try {
    let dateFilter = '';
    switch (period) {
      case 'day':
        dateFilter = `AND DATE(o.created_at) = CURDATE()`;
        break;
      case 'week':
        dateFilter = `AND o.created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)`;
        break;
      case 'month':
        dateFilter = `AND o.created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)`;
        break;
      case 'year':
        dateFilter = `AND o.created_at >= DATE_SUB(CURDATE(), INTERVAL 1 YEAR)`;
        break;
    }
    
    const [topProducts] = await pool.query(`
      SELECT 
        p.id,
        p.name,
        p.category,
        p.price,
        SUM(oi.quantity) as total_sold,
        SUM(oi.quantity * oi.price) as total_revenue,
        COUNT(DISTINCT oi.order_id) as orders_count,
        AVG(oi.price) as avg_price
      FROM products p
      LEFT JOIN order_items oi ON p.id = oi.product_id
      LEFT JOIN orders o ON oi.order_id = o.id
      WHERE o.status IN ('delivered', 'completed') ${dateFilter}
      GROUP BY p.id, p.name, p.category, p.price
      ORDER BY total_sold DESC
      LIMIT ?
    `, [limit]);
    
    const [categoryStats] = await pool.query(`
      SELECT 
        p.category,
        COUNT(DISTINCT p.id) as products_count,
        SUM(oi.quantity) as total_sold,
        SUM(oi.quantity * oi.price) as total_revenue
      FROM products p
      LEFT JOIN order_items oi ON p.id = oi.product_id
      LEFT JOIN orders o ON oi.order_id = o.id
      WHERE o.status IN ('delivered', 'completed') ${dateFilter}
      GROUP BY p.category
      ORDER BY total_revenue DESC
    `);
    
    return {
      top_products: topProducts,
      categories: categoryStats
    };
  } catch (error) {
    console.error('Error fetching top products:', error);
    throw error;
  }
}
export async function getDelivererPerformanceStats(period = 'month') {
  try {
    let dateFilter = '';
    switch (period) {
      case 'day':
        dateFilter = `AND DATE(d.delivery_date) = CURDATE()`;
        break;
      case 'week':
        dateFilter = `AND d.delivery_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)`;
        break;
      case 'month':
        dateFilter = `AND d.delivery_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)`;
        break;
      case 'year':
        dateFilter = `AND d.delivery_date >= DATE_SUB(CURDATE(), INTERVAL 1 YEAR)`;
        break;
    }
    
    const [performanceData] = await pool.query(`
      SELECT 
        del.id as deliverer_id,
        CONCAT(u.first_name, ' ', u.last_name) as deliverer_name,
        del.vehicle_type,
        COUNT(DISTINCT d.id) as deliveries_count,
        COUNT(DISTINCT o.id) as orders_delivered,
        SUM(o.total_price) as total_revenue,
        AVG(o.total_price) as avg_order_value,
        COUNT(DISTINCT d.delivery_date) as working_days,
        ROUND(COUNT(DISTINCT o.id) / NULLIF(COUNT(DISTINCT d.delivery_date), 0), 2) as orders_per_day,
        
        -- Stats basées sur les stocks
        COALESCE(SUM(ds.initial_quantity), 0) as total_initial_stock,
        COALESCE(SUM(ds.sold_quantity), 0) as total_sold_stock,
        COALESCE(SUM(ds.sold_quantity * p.price), 0) as stock_revenue,
        CASE 
          WHEN COALESCE(SUM(ds.initial_quantity), 0) > 0 
          THEN ROUND((COALESCE(SUM(ds.sold_quantity), 0) / SUM(ds.initial_quantity)) * 100, 2)
          ELSE 0 
        END as stock_usage_percentage
      FROM deliverers del
      INNER JOIN users u ON del.user_id = u.id
      LEFT JOIN deliveries d ON del.id = d.deliverer_id
      LEFT JOIN orders o ON d.id = o.delivery_id AND o.status IN ('delivered', 'completed')
      LEFT JOIN delivery_stocks ds ON d.id = ds.delivery_id
      LEFT JOIN products p ON ds.product_id = p.id
      WHERE 1=1 ${dateFilter}
      GROUP BY del.id, u.first_name, u.last_name, del.vehicle_type
      ORDER BY total_revenue DESC
    `);
    
    const [globalStats] = await pool.query(`
      SELECT 
        COUNT(DISTINCT del.id) as active_deliverers,
        COUNT(DISTINCT d.id) as total_deliveries,
        COUNT(DISTINCT o.id) as total_orders_delivered,
        SUM(o.total_price) as total_revenue,
        ROUND(AVG(o.total_price), 2) as avg_order_value,
        COALESCE(SUM(ds.initial_quantity), 0) as total_initial_stock,
        COALESCE(SUM(ds.sold_quantity), 0) as total_sold_stock
      FROM deliverers del
      LEFT JOIN deliveries d ON del.id = d.deliverer_id
      LEFT JOIN orders o ON d.id = o.delivery_id AND o.status IN ('delivered', 'completed')
      LEFT JOIN delivery_stocks ds ON d.id = ds.delivery_id
      WHERE 1=1 ${dateFilter}
    `);
    
    return {
      deliverers: performanceData,
      global: globalStats[0] || {}
    };
  } catch (error) {
    console.error('Error fetching deliverer performance:', error);
    throw error;
  }
}
export async function getDashboardStats() {
  try {
    // Stats du jour
    const [todayStats] = await pool.query(`
      SELECT 
        COUNT(DISTINCT o.id) as today_orders,
        SUM(o.total_price) as today_revenue,
        COUNT(DISTINCT o.user_id) as today_customers,
        COALESCE(SUM(ds.sold_quantity), 0) as today_items_sold
      FROM orders o
      LEFT JOIN delivery_stocks ds ON o.delivery_id = ds.delivery_id
      WHERE DATE(o.created_at) = CURDATE()
        AND o.status IN ('delivered', 'completed')
    `);
    
    // Stats de la semaine
    const [weekStats] = await pool.query(`
      SELECT 
        COUNT(DISTINCT o.id) as week_orders,
        SUM(o.total_price) as week_revenue,
        COUNT(DISTINCT o.user_id) as week_customers,
        COALESCE(SUM(ds.sold_quantity), 0) as week_items_sold
      FROM orders o
      LEFT JOIN delivery_stocks ds ON o.delivery_id = ds.delivery_id
      WHERE o.created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        AND o.status IN ('delivered', 'completed')
    `);
    
    // Stats du mois
    const [monthStats] = await pool.query(`
      SELECT 
        COUNT(DISTINCT o.id) as month_orders,
        SUM(o.total_price) as month_revenue,
        COUNT(DISTINCT o.user_id) as month_customers,
        COALESCE(SUM(ds.sold_quantity), 0) as month_items_sold
      FROM orders o
      LEFT JOIN delivery_stocks ds ON o.delivery_id = ds.delivery_id
      WHERE o.created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        AND o.status IN ('delivered', 'completed')
    `);
    
    // Stats globales
    const [globalStats] = await pool.query(`
      SELECT 
        COUNT(DISTINCT o.id) as total_orders,
        SUM(o.total_price) as total_revenue,
        COUNT(DISTINCT o.user_id) as total_customers,
        COUNT(DISTINCT p.id) as total_products,
        COUNT(DISTINCT del.id) as total_deliverers,
        COALESCE(SUM(ds.initial_quantity), 0) as total_initial_stock,
        COALESCE(SUM(ds.sold_quantity), 0) as total_sold_stock
      FROM orders o
      CROSS JOIN products p
      CROSS JOIN deliverers del
      LEFT JOIN delivery_stocks ds ON 1=1
      WHERE o.status IN ('delivered', 'completed')
      LIMIT 1
    `);
    
    // Produits en stock aujourd'hui
    const [stockStats] = await pool.query(`
      SELECT 
        COUNT(DISTINCT ds.id) as total_stock_items,
        SUM(ds.current_quantity) as total_available_items,
        COUNT(DISTINCT ds.delivery_id) as active_deliveries_today
      FROM delivery_stocks ds
      INNER JOIN deliveries d ON ds.delivery_id = d.id
      WHERE DATE(d.delivery_date) = CURDATE()
    `);
    
    return {
      today: todayStats[0] || {},
      week: weekStats[0] || {},
      month: monthStats[0] || {},
      global: globalStats[0] || {},
      stocks: stockStats[0] || {}
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    throw error;
  }
}

/**
 * Récupère le deliverer associé à un utilisateur par son ID.
 * @param {number} userId - L'ID de l'utilisateur.
 * @returns {Promise<Object|null>} - Le deliverer correspondant ou null si non trouvé.
 */
export async function getDelivererByUserId(userId) {
  try {
    const [rows] = await pool.query(
      'SELECT id FROM deliverers WHERE user_id = ?',
      [userId]
    );
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    console.error('Error fetching deliverer by user ID:', error);
    throw error;
  }
}

export async function updateUserPassword(userId, newPassword) {
  try {
    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    await pool.query(
      'UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [hashedPassword, userId]
    );
    
    return { success: true };
  } catch (error) {
    console.error('Error updating user password:', error);
    throw error;
  }
}

export async function getDelivererById(delivererId) {
  try {
    const [rows] = await pool.query(
      `SELECT 
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
      WHERE d.id = ? AND u.active = true`,
      [delivererId]
    );
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    console.error('Error fetching deliverer by ID:', error);
    throw error;
  }
}

export async function updateDeliverer(delivererId, data) {
  try {
    const {
      vehicle_type,
      license_plate,
      is_available,
      current_latitude,
      current_longitude
    } = data;
    
    const [result] = await pool.query(
      `UPDATE deliverers 
       SET vehicle_type = ?, license_plate = ?, is_available = ?, 
           current_latitude = ?, current_longitude = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [vehicle_type, license_plate, is_available, current_latitude, current_longitude, delivererId]
    );
    
    if (result.affectedRows === 0) {
      throw new Error('Deliverer not found');
    }
    
    return await getDelivererById(delivererId);
  } catch (error) {
    console.error('Error updating deliverer:', error);
    throw error;
  }
}

export async function deleteDeliverer(delivererId) {
  try {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Désactiver l'utilisateur au lieu de supprimer
      await connection.query(
        'UPDATE users SET active = false, updated_at = CURRENT_TIMESTAMP WHERE id = (SELECT user_id FROM deliverers WHERE id = ?)',
        [delivererId]
      );
      
      await connection.query(
        'UPDATE deliverers SET is_available = false, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [delivererId]
      );
      
      await connection.commit();
      return { success: true };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error deleting deliverer:', error);
    throw error;
  }
}

export default pool;
import mysql from 'mysql2/promise';

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
    
    const { user_id, delivery_address, delivery_date, notes, items } = orderData;
    
    // Calculer le total
    let total_price = 0;
    for (const item of items) {
      const [product] = await connection.query('SELECT price FROM products WHERE id = ?', [item.product_id]);
      if (product.length === 0) {
        throw new Error(`Product ${item.product_id} not found`);
      }
      total_price += product[0].price * item.quantity;
    }
    
    // Créer la commande
    const [orderResult] = await connection.query(
      'INSERT INTO orders (user_id, total_price, delivery_address, delivery_date, notes) VALUES (?, ?, ?, ?, ?)',
      [user_id, total_price, delivery_address, delivery_date, notes]
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
    
    return { id: orderId, total_price, ...orderData };
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

export default pool;
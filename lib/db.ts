import * as mysql from 'mysql2/promise';
import { StockService } from './stock-service';
import { validateStatsParams } from './validation';
import { logError } from './error-handler';
import { 
  User, Product, Order, Delivery, Deliverer, Address, DeliveryStock, OrderItem,
  QueryResult, MutationResult, getFirstRow, getAllRows, getInsertId, getAffectedRows
} from '../types/database.types';

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
    
    const result = await pool.query(query) as QueryResult<Deliverer>;
    return getAllRows(result);
  } catch (error) {
    logError(error as Error, 'Database', { operation: 'getDeliverers' });
    throw error;
  }
}

export async function createDeliverer(delivererData: any) {
  try {
    const {
      user_id,
      vehicle_type,
      phone,
      status = 'active'
    } = delivererData;

    const result = await pool.query(
      `INSERT INTO deliverers 
      (user_id, vehicle_type, phone, status) 
      VALUES (?, ?, ?, ?)`,
      [user_id, vehicle_type, phone, status]
    ) as MutationResult;

    return { id: getInsertId(result), ...delivererData };
  } catch (error) {
    logError(error as Error, 'Database', { operation: 'createDeliverer' });
    throw error;
  }
}

// Pour les produits

export async function getProducts(activeOnly = false, category: string | null = null) {
  try {
    let query = 'SELECT * FROM products WHERE 1=1';
    const params: any[] = [];
    
    if (activeOnly) {
      query += ' AND active = ?';
      params.push(true);
    }
    
    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }
    
    query += ' ORDER BY name';
    
    const result = await pool.query(query, params) as QueryResult<Product>;
    return getAllRows(result);
  } catch (error) {
    logError(error as Error, 'Database', { operation: 'getProducts' });
    throw error;
  }
}

export async function getProductById(id: number) {
  try {
    const result = await pool.query('SELECT * FROM products WHERE id = ?', [id]) as QueryResult<Product>;
    return getFirstRow(result);
  } catch (error) {
    logError(error as Error, 'Database', { operation: 'getProductById', productId: id });
    throw error;
  }
}

export async function createProduct(data: any) {
  try {
    const { name, description, category, price, allergens, image_url, emoji, active } = data;
    const result = await pool.query(
      'INSERT INTO products (name, description, category, price, allergens, image_url, emoji, active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [name, description, category, price, allergens, image_url, emoji, active ?? true]
    ) as MutationResult;
    return { id: getInsertId(result), ...data };
  } catch (error) {
    logError(error as Error, 'Database', { operation: 'createProduct' });
    throw error;
  }
}

export async function updateProduct(id: number, data: any) {
  try {
    const { name, description, category, price, allergens, image_url, emoji, active } = data;
    await pool.query(
      'UPDATE products SET name = ?, description = ?, category = ?, price = ?, allergens = ?, image_url = ?, emoji = ?, active = ? WHERE id = ?',
      [name, description, category, price, allergens, image_url, emoji, active, id]
    );
    return { id, ...data };
  } catch (error) {
    logError(error as Error, 'Database', { operation: 'updateProduct', productId: id });
    throw error;
  }
}

export async function deleteProduct(id: number) {
  try {
    await pool.query('DELETE FROM products WHERE id = ?', [id]);
    return { id };
  } catch (error) {
    logError(error as Error, 'Database', { operation: 'deleteProduct', productId: id });
    throw error;
  }
}

// Pour les users

export async function createUser(userData: any) {
  try {
    const { email, password_hash, first_name, last_name, phone, role } = userData;
    const result = await pool.query(
      'INSERT INTO users (email, password_hash, first_name, last_name, phone, role, email_verified) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [email, password_hash, first_name, last_name, phone, role, false]
    ) as MutationResult;
    return { id: getInsertId(result), email, first_name, last_name, role };
  } catch (error) {
    logError(error as Error, 'Database', { operation: 'createUser' });
    throw error;
  }
}

export async function getUserByEmail(email: string) {
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = ?', [email]) as QueryResult<User>;
    return getFirstRow(result);
  } catch (error) {
    logError(error as Error, 'Database', { operation: 'getUserByEmail', email });
    throw error;
  }
}

// Pour les commandes (orders)

export async function getOrders(userId: number | null = null, role: string | null = null) {
  try {
    let query = `
      SELECT 
        o.*,
        u.first_name, u.last_name, u.email,
        d.name as deliverer_name
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN deliverers d ON o.deliverer_id = d.id
      WHERE 1=1
    `;
    
    const params: any[] = [];
    
    if (role === 'client' && userId) {
      query += ' AND o.user_id = ?';
      params.push(userId);
    }
    
    query += ' ORDER BY o.created_at DESC';
    
    const result = await pool.query(query, params) as QueryResult<Order>;
    return getAllRows(result);
  } catch (error) {
    logError(error as Error, 'Database', { operation: 'getOrders' });
    throw error;
  }
}

export async function getOrderById(orderId: number, userId: number | null = null, role: string | null = null) {
  try {
    let query = `
      SELECT 
        o.*,
        u.first_name, u.last_name, u.email, u.phone
      FROM orders o
      INNER JOIN users u ON o.user_id = u.id
      WHERE o.id = ?
    `;
    
    const params: any[] = [orderId];
    
    if (role === 'client' && userId) {
      query += ' AND o.user_id = ?';
      params.push(userId);
    }
    
    const result = await pool.query(query, params) as QueryResult<Order>;
    const order = getFirstRow(result);
    
    if (!order) {
      return null;
    }
    
    const itemsResult = await pool.query(`
      SELECT 
        oi.*,
        p.name as product_name,
        p.category,
        p.emoji
      FROM order_items oi
      INNER JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
    `, [orderId]) as QueryResult<OrderItem>;
    
    const items = getAllRows(itemsResult);
    
    return {
      ...order,
      items
    };
  } catch (error) {
    logError(error as Error, 'Database', { operation: 'getOrderById', orderId });
    throw error;
  }
}

export async function createOrder(orderData: any) {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { user_id, items, delivery_address, delivery_date, notes, delivery_id } = orderData;
    
    if (delivery_id) {
      let total_price = 0;
      for (const item of items) {
        const productResult = await connection.query('SELECT price FROM products WHERE id = ?', [item.product_id]) as QueryResult<Product>;
        const product = getFirstRow(productResult);
        if (!product) {
          throw new Error(`Product ${item.product_id} not found`);
        }
        total_price += product.price * item.quantity;
      }
      
      const orderResult = await connection.query(
        'INSERT INTO orders (user_id, total_price, delivery_address, delivery_date, notes, delivery_id, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [user_id, total_price, delivery_address, delivery_date, notes, delivery_id, 'confirmed']
      ) as MutationResult;
      
      const orderId = getInsertId(orderResult);
      
      for (const item of items) {
        const productResult = await connection.query('SELECT price FROM products WHERE id = ?', [item.product_id]) as QueryResult<Product>;
        const product = getFirstRow(productResult);
        await connection.query(
          'INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)',
          [orderId, item.product_id, item.quantity, product?.price]
        );
        
        await StockService.decrementStock(delivery_id, item.product_id, item.quantity);
      }
      
      await connection.commit();
      return { id: orderId, ...orderData };
    } else {
      let total_price = 0;
      for (const item of items) {
        const productResult = await connection.query('SELECT price FROM products WHERE id = ?', [item.product_id]) as QueryResult<Product>;
        const product = getFirstRow(productResult);
        if (!product) {
          throw new Error(`Product ${item.product_id} not found`);
        }
        total_price += product.price * item.quantity;
      }
      
      const orderResult = await connection.query(
        'INSERT INTO orders (user_id, total_price, delivery_address, delivery_date, notes) VALUES (?, ?, ?, ?, ?)',
        [user_id, total_price, delivery_address, delivery_date, notes]
      ) as MutationResult;
      
      const orderId = getInsertId(orderResult);
      
      for (const item of items) {
        const productResult = await connection.query('SELECT price FROM products WHERE id = ?', [item.product_id]) as QueryResult<Product>;
        const product = getFirstRow(productResult);
        await connection.query(
          'INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)',
          [orderId, item.product_id, item.quantity, product?.price]
        );
      }
      
      await connection.commit();
      return { id: orderId, ...orderData };
    }
    
  } catch (error) {
    await connection.rollback();
    logError(error as Error, 'Database', { operation: 'createOrder' });
    throw error;
  } finally {
    connection.release();
  }
}

export async function updateOrder(orderId: number, updateData: any) {
  try {
    const { status, delivery_address, delivery_date, notes, deliverer_id } = updateData;
    
    await pool.query(
      'UPDATE orders SET status = ?, delivery_address = ?, delivery_date = ?, notes = ?, deliverer_id = ? WHERE id = ?',
      [status, delivery_address, delivery_date, notes, deliverer_id, orderId]
    );
    
    return { id: orderId, ...updateData };
  } catch (error) {
    logError(error as Error, 'Database', { operation: 'updateOrder', orderId });
    throw error;
  }
}

export async function deleteOrder(orderId: number) {
  try {
    await pool.query('DELETE FROM orders WHERE id = ?', [orderId]);
    return { id: orderId };
  } catch (error) {
    logError(error as Error, 'Database', { operation: 'deleteOrder', orderId });
    throw error;
  }
}

// Pour les tournées (deliveries)

export async function getDeliveries(delivererId: number | null = null, role: string | null = null) {
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
      WHERE 1=1
    `;
    const params: any[] = [];
    
    if (role === 'deliverer' && delivererId) {
      query += ' AND d.deliverer_id = ?';
      params.push(delivererId);
    }
    
    query += ' GROUP BY d.id ORDER BY d.delivery_date DESC, d.created_at DESC';
    
    const result = await pool.query(query, params) as QueryResult<Delivery>;
    return getAllRows(result);
  } catch (error) {
    logError(error as Error, 'Database', { operation: 'getDeliveries' });
    throw error;
  }
}

export async function getDeliveryById(deliveryId: number, delivererId: number | null = null, role: string | null = null) {
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
    const params: any[] = [deliveryId];
    
    if (role === 'deliverer' && delivererId) {
      query += ' AND d.deliverer_id = ?';
      params.push(delivererId);
    }
    
    const result = await pool.query(query, params) as QueryResult<Delivery>;
    const delivery = getFirstRow(result);
    
    if (!delivery) {
      return null;
    }
    
    const ordersResult = await pool.query(`
      SELECT 
        o.*,
        u.first_name, u.last_name, u.email, u.phone
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE o.delivery_id = ?
      ORDER BY o.created_at
    `, [deliveryId]) as QueryResult<Order>;
    
    const orders = getAllRows(ordersResult);
    
    return {
      ...delivery,
      orders
    };
  } catch (error) {
    logError(error as Error, 'Database', { operation: 'getDeliveryById', deliveryId });
    throw error;
  }
}

export async function createDelivery(deliveryData: any) {
  try {
    const { deliverer_id, delivery_date, notes, order_ids } = deliveryData;
    
    const result = await pool.query(
      'INSERT INTO deliveries (deliverer_id, delivery_date, notes) VALUES (?, ?, ?)',
      [deliverer_id, delivery_date, notes]
    ) as MutationResult;
    
    const deliveryId = getInsertId(result);
    
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
    logError(error as Error, 'Database', { operation: 'createDelivery' });
    throw error;
  }
}

export async function updateDelivery(deliveryId: number, updateData: any) {
  try {
    const { status, delivery_date, notes, deliverer_id } = updateData;
    
    await pool.query(
      'UPDATE deliveries SET status = ?, delivery_date = ?, notes = ?, deliverer_id = ? WHERE id = ?',
      [status, delivery_date, notes, deliverer_id, deliveryId]
    );
    
    return { id: deliveryId, ...updateData };
  } catch (error) {
    logError(error as Error, 'Database', { operation: 'updateDelivery', deliveryId });
    throw error;
  }
}

export async function deleteDelivery(deliveryId: number) {
  try {
    await pool.query('UPDATE orders SET delivery_id = NULL WHERE delivery_id = ?', [deliveryId]);
    await pool.query('DELETE FROM deliveries WHERE id = ?', [deliveryId]);
    
    return { id: deliveryId };
  } catch (error) {
    logError(error as Error, 'Database', { operation: 'deleteDelivery', deliveryId });
    throw error;
  }
}

// Pour les adresses (addresses)

export async function getAddresses(userId: number) {
  try {
    const result = await pool.query(
      'SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC',
      [userId]
    ) as QueryResult<Address>;
    return getAllRows(result);
  } catch (error) {
    logError(error as Error, 'Database', { operation: 'getAddresses', userId });
    throw error;
  }
}

export async function getAddressById(addressId: number, userId: number) {
  try {
    const result = await pool.query(
      'SELECT * FROM addresses WHERE id = ? AND user_id = ?',
      [addressId, userId]
    ) as QueryResult<Address>;
    return getFirstRow(result);
  } catch (error) {
    logError(error as Error, 'Database', { operation: 'getAddressById', addressId, userId });
    throw error;
  }
}

export async function createAddress(addressData: any) {
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

    if (is_default) {
      await pool.query(
        'UPDATE addresses SET is_default = FALSE WHERE user_id = ?',
        [user_id]
      );
    }

    const result = await pool.query(
      `INSERT INTO addresses 
      (user_id, label, street_address, city, postal_code, floor, door_number, building_code, intercom, delivery_instructions, is_default) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [user_id, label, street_address, city, postal_code, floor, door_number, building_code, intercom, delivery_instructions, is_default || false]
    ) as MutationResult;

    return { id: getInsertId(result), ...addressData };
  } catch (error) {
    logError(error as Error, 'Database', { operation: 'createAddress' });
    throw error;
  }
}

export async function updateAddress(addressId: number, userId: number, updateData: any) {
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
    logError(error as Error, 'Database', { operation: 'updateAddress', addressId, userId });
    throw error;
  }
}

export async function deleteAddress(addressId: number, userId: number) {
  try {
    await pool.query(
      'DELETE FROM addresses WHERE id = ? AND user_id = ?',
      [addressId, userId]
    );
    return { id: addressId };
  } catch (error) {
    logError(error as Error, 'Database', { operation: 'deleteAddress', addressId, userId });
    throw error;
  }
}

// Pour les stocks (delivery_stocks)

export async function getDeliveryStocks(deliveryId: number) {
  try {
    const result = await pool.query(
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
    ) as QueryResult<DeliveryStock>;
    return getAllRows(result);
  } catch (error) {
    logError(error as Error, 'Database', { operation: 'getDeliveryStocks', deliveryId });
    throw error;
  }
}

export async function getStockById(stockId: number) {
  try {
    const result = await pool.query(
      `SELECT 
        ds.*,
        p.name as product_name,
        p.price as product_price
      FROM delivery_stocks ds
      LEFT JOIN products p ON ds.product_id = p.id
      WHERE ds.id = ?`,
      [stockId]
    ) as QueryResult<DeliveryStock>;
    return getFirstRow(result);
  } catch (error) {
    logError(error as Error, 'Database', { operation: 'getStockById', stockId });
    throw error;
  }
}

export async function createDeliveryStock(stockData: any) {
  try {
    const {
      delivery_id,
      product_id,
      initial_quantity
    } = stockData;

    const result = await pool.query(
      `INSERT INTO delivery_stocks 
      (delivery_id, product_id, initial_quantity, current_quantity) 
      VALUES (?, ?, ?, ?)`,
      [delivery_id, product_id, initial_quantity, initial_quantity]
    ) as MutationResult;

    return { id: getInsertId(result), ...stockData, current_quantity: initial_quantity, sold_quantity: 0 };
  } catch (error) {
    logError(error as Error, 'Database', { operation: 'createDeliveryStock' });
    throw error;
  }
}

export async function updateDeliveryStock(stockId: number, updateData: any) {
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
    logError(error as Error, 'Database', { operation: 'updateDeliveryStock', stockId });
    throw error;
  }
}

export async function decrementStock(deliveryId: number, productId: number, quantity: number) {
  try {
    await pool.query(
      `UPDATE delivery_stocks 
      SET current_quantity = current_quantity - ?,
          sold_quantity = sold_quantity + ?
      WHERE delivery_id = ? AND product_id = ? AND current_quantity >= ?`,
      [quantity, quantity, deliveryId, productId, quantity]
    );

    const result = await pool.query(
      'SELECT * FROM delivery_stocks WHERE delivery_id = ? AND product_id = ?',
      [deliveryId, productId]
    ) as QueryResult<DeliveryStock>;

    return getFirstRow(result);
  } catch (error) {
    logError(error as Error, 'Database', { operation: 'decrementStock', deliveryId, productId });
    throw error;
  }
}

export async function deleteDeliveryStock(stockId: number) {
  try {
    await pool.query(
      'DELETE FROM delivery_stocks WHERE id = ?',
      [stockId]
    );
    return { id: stockId };
  } catch (error) {
    logError(error as Error, 'Database', { operation: 'deleteDeliveryStock', stockId });
    throw error;
  }
}

export async function bulkCreateDeliveryStocks(deliveryId: number, stocksArray: any[]) {
  try {
    const values = stocksArray.map(stock => [
      deliveryId,
      stock.product_id,
      stock.initial_quantity,
      stock.initial_quantity
    ]);

    const result = await pool.query(
      `INSERT INTO delivery_stocks 
      (delivery_id, product_id, initial_quantity, current_quantity) 
      VALUES ?`,
      [values]
    ) as MutationResult;

    return { insertedCount: getAffectedRows(result) };
  } catch (error) {
    logError(error as Error, 'Database', { operation: 'bulkCreateDeliveryStocks', deliveryId });
    throw error;
  }
}

// FONCTIONS DE STATISTIQUES INTÉGRÉES AVEC STOCKS

export async function getRevenueStats(period = 'month', startDate: string | null = null, endDate: string | null = null) {
  try {
    const { period: validatedPeriod, start_date: validatedStart, end_date: validatedEnd } = 
      validateStatsParams({ period, start_date: startDate || undefined, end_date: endDate || undefined });
    
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
    `) as any[];
    
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
    `) as any[];
    
    return {
      periods: revenueData,
      global: globalStats[0] || {}
    };
  } catch (error) {
    logError(error as Error, 'Database', { operation: 'getRevenueStats' });
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
        SUM(oi.quantity * oi.unit_price) as total_revenue,
        COUNT(DISTINCT oi.order_id) as orders_count,
        AVG(oi.unit_price) as avg_price
      FROM products p
      LEFT JOIN order_items oi ON p.id = oi.product_id
      LEFT JOIN orders o ON oi.order_id = o.id
      WHERE o.status IN ('delivered', 'completed') ${dateFilter}
      GROUP BY p.id, p.name, p.category, p.price
      ORDER BY total_sold DESC
      LIMIT ?
    `, [limit]) as any[];
    
    const [categoryStats] = await pool.query(`
      SELECT 
        p.category,
        COUNT(DISTINCT p.id) as products_count,
        SUM(oi.quantity) as total_sold,
        SUM(oi.quantity * oi.unit_price) as total_revenue
      FROM products p
      LEFT JOIN order_items oi ON p.id = oi.product_id
      LEFT JOIN orders o ON oi.order_id = o.id
      WHERE o.status IN ('delivered', 'completed') ${dateFilter}
      GROUP BY p.category
      ORDER BY total_revenue DESC
    `) as any[];
    
    return {
      top_products: topProducts,
      categories: categoryStats
    };
  } catch (error) {
    logError(error as Error, 'Database', { operation: 'getTopProducts' });
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
    `) as any[];
    
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
    `) as any[];
    
    return {
      deliverers: performanceData,
      global: globalStats[0] || {}
    };
  } catch (error) {
    logError(error as Error, 'Database', { operation: 'getDelivererPerformanceStats' });
    throw error;
  }
}

export async function getDashboardStats() {
  try {
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
    `) as any[];
    
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
    `) as any[];
    
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
    `) as any[];
    
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
    `) as any[];
    
    const [stockStats] = await pool.query(`
      SELECT 
        COUNT(DISTINCT ds.id) as total_stock_items,
        SUM(ds.current_quantity) as total_available_items,
        COUNT(DISTINCT ds.delivery_id) as active_deliveries_today
      FROM delivery_stocks ds
      INNER JOIN deliveries d ON ds.delivery_id = d.id
      WHERE DATE(d.delivery_date) = CURDATE()
    `) as any[];
    
    return {
      today: todayStats[0] || {},
      week: weekStats[0] || {},
      month: monthStats[0] || {},
      global: globalStats[0] || {},
      stocks: stockStats[0] || {}
    };
  } catch (error) {
    logError(error as Error, 'Database', { operation: 'getDashboardStats' });
    throw error;
  }
}

export async function getStockStats(deliveryId: number | null = null) {
  try {
    let deliveryFilter = '';
    let deliveryParams: any[] = [];
    
    if (deliveryId) {
      deliveryFilter = 'AND ds.delivery_id = ?';
      deliveryParams = [deliveryId];
    } else {
      deliveryFilter = 'AND DATE(d.delivery_date) = CURDATE()';
    }
    
    const [globalStats] = await pool.query(`
      SELECT 
        COUNT(DISTINCT ds.id) as total_stock_items,
        SUM(ds.initial_quantity) as total_initial_quantity,
        SUM(ds.current_quantity) as total_current_quantity,
        SUM(ds.sold_quantity) as total_sold_quantity,
        SUM(ds.sold_quantity * p.price) as total_stock_revenue,
        COUNT(DISTINCT ds.delivery_id) as active_deliveries,
        COUNT(DISTINCT ds.product_id) as unique_products,
        ROUND(AVG((ds.sold_quantity / NULLIF(ds.initial_quantity, 0)) * 100), 2) as avg_sell_through_rate
      FROM delivery_stocks ds
      INNER JOIN deliveries d ON ds.delivery_id = d.id
      INNER JOIN products p ON ds.product_id = p.id
      WHERE 1=1 ${deliveryFilter}
    `, deliveryParams) as any[];
    
    const [productDetails] = await pool.query(`
      SELECT 
        p.id as product_id,
        p.name as product_name,
        p.category,
        p.price,
        p.emoji,
        SUM(ds.initial_quantity) as initial_quantity,
        SUM(ds.current_quantity) as current_quantity,
        SUM(ds.sold_quantity) as sold_quantity,
        SUM(ds.sold_quantity * p.price) as revenue,
        ROUND((SUM(ds.sold_quantity) / NULLIF(SUM(ds.initial_quantity), 0)) * 100, 2) as sell_through_rate,
        COUNT(DISTINCT ds.delivery_id) as deliveries_count
      FROM delivery_stocks ds
      INNER JOIN deliveries d ON ds.delivery_id = d.id
      INNER JOIN products p ON ds.product_id = p.id
      WHERE 1=1 ${deliveryFilter}
      GROUP BY p.id, p.name, p.category, p.price, p.emoji
      ORDER BY revenue DESC
    `, deliveryParams) as any[];
    
    const [lowStockProducts] = await pool.query(`
      SELECT 
        p.id as product_id,
        p.name as product_name,
        p.category,
        p.emoji,
        ds.delivery_id,
        CONCAT(u.first_name, ' ', u.last_name) as deliverer_name,
        ds.initial_quantity,
        ds.current_quantity,
        ds.sold_quantity,
        ROUND((ds.current_quantity / NULLIF(ds.initial_quantity, 0)) * 100, 2) as remaining_percentage
      FROM delivery_stocks ds
      INNER JOIN deliveries d ON ds.delivery_id = d.id
      INNER JOIN deliverers del ON d.deliverer_id = del.id
      INNER JOIN users u ON del.user_id = u.id
      INNER JOIN products p ON ds.product_id = p.id
      WHERE 1=1 ${deliveryFilter}
        AND (ds.current_quantity / NULLIF(ds.initial_quantity, 0)) < 0.1
      ORDER BY remaining_percentage ASC
    `, deliveryParams) as any[];
    
    const [topSellingProducts] = await pool.query(`
      SELECT 
        p.id as product_id,
        p.name as product_name,
        p.category,
        p.emoji,
        p.price,
        SUM(ds.sold_quantity) as total_sold,
        SUM(ds.sold_quantity * p.price) as total_revenue,
        COUNT(DISTINCT ds.delivery_id) as deliveries_count
      FROM delivery_stocks ds
      INNER JOIN deliveries d ON ds.delivery_id = d.id
      INNER JOIN products p ON ds.product_id = p.id
      WHERE 1=1 ${deliveryFilter}
      GROUP BY p.id, p.name, p.category, p.emoji, p.price
      ORDER BY total_sold DESC
      LIMIT 10
    `, deliveryParams) as any[];
    
    let deliveryStats: any[] = [];
    if (!deliveryId) {
      const [stats] = await pool.query(`
        SELECT 
          d.id as delivery_id,
          d.delivery_date,
          d.status as delivery_status,
          CONCAT(u.first_name, ' ', u.last_name) as deliverer_name,
          del.vehicle_type,
          COUNT(DISTINCT ds.id) as stock_items_count,
          SUM(ds.initial_quantity) as initial_quantity,
          SUM(ds.current_quantity) as current_quantity,
          SUM(ds.sold_quantity) as sold_quantity,
          SUM(ds.sold_quantity * p.price) as revenue,
          ROUND((SUM(ds.sold_quantity) / NULLIF(SUM(ds.initial_quantity), 0)) * 100, 2) as sell_through_rate
        FROM deliveries d
        INNER JOIN deliverers del ON d.deliverer_id = del.id
        INNER JOIN users u ON del.user_id = u.id
        LEFT JOIN delivery_stocks ds ON d.id = ds.delivery_id
        LEFT JOIN products p ON ds.product_id = p.id
        WHERE DATE(d.delivery_date) = CURDATE()
        GROUP BY d.id, d.delivery_date, d.status, u.first_name, u.last_name, del.vehicle_type
        ORDER BY revenue DESC
      `) as any[];
      deliveryStats = stats;
    }
    
    return {
      global: globalStats[0] || {},
      products: productDetails,
      low_stock: lowStockProducts,
      top_selling: topSellingProducts,
      deliveries: deliveryStats
    };
  } catch (error) {
    logError(error as Error, 'Database', { operation: 'getStockStats' });
    throw error;
  }
}

// FONCTIONS UTILITAIRES

export async function getDelivererByUserId(userId: number) {
  try {
    const result = await pool.query(
      'SELECT id FROM deliverers WHERE user_id = ?',
      [userId]
    ) as QueryResult<Deliverer>;
    return getFirstRow(result);
  } catch (error) {
    logError(error as Error, 'Database', { operation: 'getDelivererByUserId', userId });
    throw error;
  }
}

export async function updateUserPassword(userId: number, newPassword: string) {
  try {
    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    await pool.query(
      'UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [hashedPassword, userId]
    );
    
    return { success: true };
  } catch (error) {
    logError(error as Error, 'Database', { operation: 'updateUserPassword', userId });
    throw error;
  }
}

export async function getDelivererById(delivererId: number) {
  try {
    const result = await pool.query(
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
    ) as QueryResult<Deliverer>;
    return getFirstRow(result);
  } catch (error) {
    logError(error as Error, 'Database', { operation: 'getDelivererById', delivererId });
    throw error;
  }
}

export async function updateDeliverer(delivererId: number, data: any) {
  try {
    const {
      vehicle_type,
      license_plate,
      is_available,
      current_latitude,
      current_longitude
    } = data;
    
    const result = await pool.query(
      `UPDATE deliverers 
       SET vehicle_type = ?, license_plate = ?, is_available = ?, 
           current_latitude = ?, current_longitude = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [vehicle_type, license_plate, is_available, current_latitude, current_longitude, delivererId]
    ) as MutationResult;
    
    if (getAffectedRows(result) === 0) {
      throw new Error('Deliverer not found');
    }
    
    return await getDelivererById(delivererId);
  } catch (error) {
    logError(error as Error, 'Database', { operation: 'updateDeliverer', delivererId });
    throw error;
  }
}

export async function deleteDeliverer(delivererId: number) {
  try {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
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
    logError(error as Error, 'Database', { operation: 'deleteDeliverer', delivererId });
    throw error;
  }
}

export default pool;
/**
 * Types TypeScript pour les entités de la base de données
 */

import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';

// ==========================================
// USER & AUTH TYPES
// ==========================================

export interface User extends RowDataPacket {
  id: number;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  role: 'admin' | 'dispatcher' | 'deliverer' | 'client';
  email_verified: boolean;
  active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateUserData {
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role: 'admin' | 'dispatcher' | 'deliverer' | 'client';
}

export interface JWTPayload {
  id: number;
  email: string;
  role: string;
  first_name: string;
  last_name: string;
}

// ==========================================
// DELIVERER TYPES
// ==========================================

export interface Deliverer extends RowDataPacket {
  id: number;
  user_id: number;
  vehicle_type: string;
  license_plate: string | null;
  is_available: boolean;
  current_latitude: number | null;
  current_longitude: number | null;
  rating: number;
  total_deliveries: number;
  created_at: Date;
  updated_at: Date;
}

export interface CreateDelivererData {
  user_id: number;
  vehicle_type: string;
  phone: string;
  status?: string;
}

export interface UpdateDelivererData {
  vehicle_type?: string;
  license_plate?: string;
  is_available?: boolean;
  current_latitude?: number;
  current_longitude?: number;
}

// ==========================================
// PRODUCT TYPES
// ==========================================

export interface Product extends RowDataPacket {
  id: number;
  name: string;
  description: string | null;
  category: string;
  price: number;
  allergens: string | null;
  image_url: string | null;
  emoji: string | null;
  active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateProductData {
  name: string;
  description?: string;
  category: string;
  price: number;
  allergens?: string;
  image_url?: string;
  emoji?: string;
  active?: boolean;
}

export interface UpdateProductData extends Partial<CreateProductData> {}

// ==========================================
// ADDRESS TYPES
// ==========================================

export interface Address extends RowDataPacket {
  id: number;
  user_id: number;
  label: string;
  street_address: string;
  city: string;
  postal_code: string;
  floor: string | null;
  door_number: string | null;
  building_code: string | null;
  intercom: string | null;
  delivery_instructions: string | null;
  is_default: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateAddressData {
  user_id: number;
  label: string;
  street_address: string;
  city: string;
  postal_code: string;
  floor?: string;
  door_number?: string;
  building_code?: string;
  intercom?: string;
  delivery_instructions?: string;
  is_default?: boolean;
}

export interface UpdateAddressData extends Partial<Omit<CreateAddressData, 'user_id'>> {}

// ==========================================
// ORDER TYPES
// ==========================================

export interface Order extends RowDataPacket {
  id: number;
  user_id: number;
  total_price: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'in_delivery' | 'delivered' | 'cancelled';
  delivery_address: string;
  delivery_date: Date;
  notes: string | null;
  delivery_id: number | null;
  deliverer_id: number | null;
  created_at: Date;
  updated_at: Date;
}

export interface OrderItem extends RowDataPacket {
  id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  subtotal: number;
  created_at: Date;
}

export interface CreateOrderData {
  user_id: number;
  delivery_address: string;
  delivery_date: string;
  notes?: string;
  items: Array<{
    product_id: number;
    quantity: number;
  }>;
  delivery_id?: number;
}

export interface UpdateOrderData {
  status?: Order['status'];
  delivery_address?: string;
  delivery_date?: string;
  notes?: string;
  deliverer_id?: number;
}

// ==========================================
// DELIVERY TYPES
// ==========================================

export interface Delivery extends RowDataPacket {
  id: number;
  deliverer_id: number;
  delivery_date: Date;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateDeliveryData {
  deliverer_id: number;
  delivery_date: string;
  notes?: string;
  order_ids?: number[];
}

export interface UpdateDeliveryData {
  status?: Delivery['status'];
  delivery_date?: string;
  notes?: string;
  deliverer_id?: number;
}

// ==========================================
// STOCK TYPES
// ==========================================

export interface DeliveryStock extends RowDataPacket {
  id: number;
  delivery_id: number;
  product_id: number;
  initial_quantity: number;
  current_quantity: number;
  sold_quantity: number;
  created_at: Date;
  updated_at: Date;
}

export interface CreateStockData {
  delivery_id: number;
  product_id: number;
  initial_quantity: number;
}

export interface UpdateStockData {
  initial_quantity?: number;
  current_quantity?: number;
}

export interface BulkStockData {
  product_id: number;
  initial_quantity: number;
}

// ==========================================
// STATS TYPES
// ==========================================

export interface RevenueStats {
  periods: Array<{
    period: string;
    orders_count: number;
    total_revenue: number;
    avg_order_value: number;
    items_sold: number;
  }>;
  global: {
    total_orders: number;
    total_revenue: number;
    avg_order_value: number;
    unique_customers: number;
    total_items_sold: number;
  };
}

export interface TopProductsStats {
  top_products: Array<{
    id: number;
    name: string;
    category: string;
    price: number;
    total_sold: number;
    total_revenue: number;
    orders_count: number;
    avg_price: number;
  }>;
  categories: Array<{
    category: string;
    products_count: number;
    total_sold: number;
    total_revenue: number;
  }>;
}

export interface DelivererPerformanceStats {
  deliverers: Array<{
    deliverer_id: number;
    deliverer_name: string;
    vehicle_type: string;
    deliveries_count: number;
    orders_delivered: number;
    total_revenue: number;
    avg_order_value: number;
    working_days: number;
    orders_per_day: number;
    total_initial_stock: number;
    total_sold_stock: number;
    stock_revenue: number;
    stock_usage_percentage: number;
  }>;
  global: {
    active_deliverers: number;
    total_deliveries: number;
    total_orders_delivered: number;
    total_revenue: number;
    avg_order_value: number;
    total_initial_stock: number;
    total_sold_stock: number;
  };
}

export interface DashboardStats {
  today: {
    today_orders: number;
    today_revenue: number;
    today_customers: number;
    today_items_sold: number;
  };
  week: {
    week_orders: number;
    week_revenue: number;
    week_customers: number;
    week_items_sold: number;
  };
  month: {
    month_orders: number;
    month_revenue: number;
    month_customers: number;
    month_items_sold: number;
  };
  global: {
    total_orders: number;
    total_revenue: number;
    total_customers: number;
    total_products: number;
    total_deliverers: number;
    total_initial_stock: number;
    total_sold_stock: number;
  };
  stocks: {
    total_stock_items: number;
    total_available_items: number;
    active_deliveries_today: number;
  };
}

// ==========================================
// VALIDATION TYPES
// ==========================================

export interface ValidationResult<T = unknown> {
  valid?: boolean;
  error?: Error;
  data?: T;
}

export interface StatsParams {
  period: 'day' | 'week' | 'month' | 'year';
  start_date?: string;
  end_date?: string;
}

// ==========================================
// MYSQL2 HELPERS - Élimine @ts-expect-error
// ==========================================

import { FieldPacket } from 'mysql2/promise';

// Type pour les résultats de SELECT
export type QueryResult<T extends RowDataPacket> = [T[], FieldPacket[]];

// Type pour les résultats de INSERT/UPDATE/DELETE
export type MutationResult = [ResultSetHeader, FieldPacket[]];

// Helper pour extraire le premier row
export function getFirstRow<T extends RowDataPacket>(result: QueryResult<T>): T | undefined {
  return result[0][0];
}

// Helper pour extraire tous les rows
export function getAllRows<T extends RowDataPacket>(result: QueryResult<T>): T[] {
  return result[0];
}

// Helper pour extraire l'ID inséré
export function getInsertId(result: MutationResult): number {
  return result[0].insertId;
}

// Helper pour extraire le nombre de lignes affectées
export function getAffectedRows(result: MutationResult): number {
  return result[0].affectedRows;
}

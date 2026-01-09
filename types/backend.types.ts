/**
 * Types Backend - API Routes, Services, Middlewares
 * Utilisé pour la logique métier côté serveur
 */

import { NextRequest } from 'next/server';
import { User, Order, Product, Deliverer, DeliveryStock } from './database.types';

// ============================================================================
// API RESPONSES
// ============================================================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ApiError {
  success: false;
  error: string;
  statusCode?: number;
  details?: any;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============================================================================
// JWT & AUTHENTICATION
// ============================================================================

export interface JWTPayload {
  userId: number;
  email: string;
  role: 'admin' | 'dispatcher' | 'deliverer' | 'client';
  iat?: number;
  exp?: number;
}

export interface AuthResult {
  success: boolean;
  user?: JWTPayload;
  error?: string;
}

export interface RoleCheckResult {
  success: boolean;
  hasRole: boolean;
  error?: string;
}

export interface AuthenticatedRequest extends NextRequest {
  user: JWTPayload;
}

// ============================================================================
// MIDDLEWARE
// ============================================================================

export interface MiddlewareOptions {
  roles?: Array<'admin' | 'dispatcher' | 'deliverer' | 'client'>;
  rateLimit?: boolean;
  rateLimitKey?: string;
}

export type RouteHandler = (
  request: AuthenticatedRequest,
  context?: { params: any }
) => Promise<Response>;

export type PublicHandler = (
  request: NextRequest,
  context?: { params: any }
) => Promise<Response>;

// ============================================================================
// SERVICES
// ============================================================================

// Stock Service
export interface StockServiceResult {
  items: Array<{
    product_id: number;
    requested: number;
    decremented: number;
  }>;
  totalDecremented: number;
}

export interface StockValidationResult {
  valid: boolean;
  errors: string[];
  availableStocks?: DeliveryStock[];
}

// Rate Limit Service
export interface RateLimitResult {
  success: boolean;
  limit?: number;
  remaining?: number;
  reset?: number;
}

// Validation Service
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  data?: any;
}

export interface OrderValidationResult extends ValidationResult {
  data?: {
    user_id: number;
    items: Array<{ product_id: number; quantity: number }>;
    delivery_address: string;
    delivery_date: string;
    notes?: string;
    delivery_id?: number;
  };
}

// ============================================================================
// DATABASE OPERATIONS
// ============================================================================

export interface QueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
}

export interface CreateResult<T> {
  id: number;
  data: T;
}

export interface UpdateResult {
  affectedRows: number;
  success: boolean;
}

export interface DeleteResult {
  id: number;
  success: boolean;
}

// ============================================================================
// STATISTICS
// ============================================================================

export interface StatsParams {
  period?: 'day' | 'week' | 'month' | 'year';
  start_date?: string;
  end_date?: string;
}

export interface RevenueStatsResult {
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

export interface TopProductsResult {
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

export interface DelivererPerformanceResult {
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

export interface DashboardStatsResult {
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
  overview: {
    total_orders: number;
    total_revenue: number;
    total_customers: number;
    total_products: number;
    total_deliverers: number;
    total_initial_stock: number;
    total_sold_stock: number;
  };
  recent_orders: Order[];
  stock_alerts: Array<{
    total_stock_items: number;
    total_available_items: number;
    active_deliveries_today: number;
  }>;
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

export interface ErrorContext {
  operation: string;
  userId?: number;
  orderId?: number;
  productId?: number;
  [key: string]: any;
}

export interface LoggedError {
  message: string;
  stack?: string;
  context: ErrorContext;
  timestamp: Date;
  level: 'error' | 'warn' | 'info';
}

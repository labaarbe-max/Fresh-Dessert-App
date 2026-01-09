/**
 * Types Partagés - Enums, DTOs, Constantes
 * Utilisé à la fois côté client et serveur
 */

// ============================================================================
// ENUMS & CONSTANTS
// ============================================================================

export type UserRole = 'admin' | 'dispatcher' | 'deliverer' | 'client';

export type OrderStatus = 
  | 'pending' 
  | 'confirmed' 
  | 'preparing' 
  | 'ready' 
  | 'in_delivery' 
  | 'delivered' 
  | 'cancelled';

export type DeliveryStatus = 
  | 'scheduled' 
  | 'in_progress' 
  | 'completed' 
  | 'cancelled';

export type VehicleType = 
  | 'bike' 
  | 'scooter' 
  | 'car' 
  | 'van';

export type ProductCategory = 
  | 'dessert' 
  | 'pastry' 
  | 'cake' 
  | 'ice_cream' 
  | 'beverage';

export type PaymentStatus = 
  | 'pending' 
  | 'paid' 
  | 'failed' 
  | 'refunded';

export type StatsTimePeriod = 
  | 'day' 
  | 'week' 
  | 'month' 
  | 'year';

// ============================================================================
// DATA TRANSFER OBJECTS (DTOs)
// ============================================================================

// Auth DTOs
export interface LoginDTO {
  email: string;
  password: string;
}

export interface RegisterDTO {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone: string;
  role: UserRole;
}

export interface PasswordChangeDTO {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// Product DTOs
export interface CreateProductDTO {
  name: string;
  description: string;
  category: ProductCategory;
  price: number;
  allergens?: string;
  image_url?: string;
  emoji?: string;
  active?: boolean;
}

export interface UpdateProductDTO extends Partial<CreateProductDTO> {
  id: number;
}

// Order DTOs
export interface OrderItemDTO {
  product_id: number;
  quantity: number;
}

export interface CreateOrderDTO {
  user_id: number;
  items: OrderItemDTO[];
  delivery_address: string;
  delivery_date: string;
  notes?: string;
  delivery_id?: number;
}

export interface UpdateOrderDTO {
  status?: OrderStatus;
  delivery_address?: string;
  delivery_date?: string;
  notes?: string;
  deliverer_id?: number;
}

// Delivery DTOs
export interface CreateDeliveryDTO {
  deliverer_id: number;
  delivery_date: string;
  notes?: string;
  order_ids?: number[];
}

export interface UpdateDeliveryDTO {
  status?: DeliveryStatus;
  delivery_date?: string;
  notes?: string;
  deliverer_id?: number;
}

// Deliverer DTOs
export interface CreateDelivererDTO {
  user_id: number;
  vehicle_type: VehicleType;
  phone: string;
  status?: string;
}

export interface UpdateDelivererDTO {
  vehicle_type?: VehicleType;
  license_plate?: string;
  is_available?: boolean;
  current_latitude?: number;
  current_longitude?: number;
}

// Address DTOs
export interface CreateAddressDTO {
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

export interface UpdateAddressDTO extends Partial<CreateAddressDTO> {
  id: number;
}

// Stock DTOs
export interface CreateStockDTO {
  delivery_id: number;
  product_id: number;
  initial_quantity: number;
}

export interface UpdateStockDTO {
  initial_quantity?: number;
  current_quantity?: number;
}

export interface BulkStockDTO {
  delivery_id: number;
  stocks: Array<{
    product_id: number;
    initial_quantity: number;
  }>;
}

// ============================================================================
// QUERY PARAMETERS
// ============================================================================

export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface SortParams {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface FilterParams {
  search?: string;
  category?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface QueryParams extends PaginationParams, SortParams, FilterParams {}

// ============================================================================
// API REQUEST/RESPONSE FORMATS
// ============================================================================

export interface ApiRequest<T = any> {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  endpoint: string;
  body?: T;
  params?: Record<string, string | number>;
  headers?: Record<string, string>;
}

export interface ApiSuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
  meta?: {
    timestamp: string;
    requestId?: string;
  };
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  statusCode: number;
  details?: any;
  meta?: {
    timestamp: string;
    requestId?: string;
  };
}

export type ApiResponseType<T = any> = ApiSuccessResponse<T> | ApiErrorResponse;

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: any) => boolean | string;
}

export interface ValidationSchema {
  [field: string]: ValidationRule;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

// ============================================================================
// GEOLOCATION
// ============================================================================

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface Location extends Coordinates {
  address?: string;
  city?: string;
  postal_code?: string;
}

export interface Distance {
  value: number;
  unit: 'km' | 'miles';
}

// ============================================================================
// NOTIFICATIONS
// ============================================================================

export interface NotificationPayload {
  type: 'order_update' | 'delivery_update' | 'stock_alert' | 'system';
  title: string;
  message: string;
  data?: any;
  timestamp: Date;
}

export interface PushNotificationConfig {
  enabled: boolean;
  sound: boolean;
  vibration: boolean;
}

// ============================================================================
// FILE UPLOAD
// ============================================================================

export interface FileUploadConfig {
  maxSize: number; // in bytes
  allowedTypes: string[];
  multiple: boolean;
}

export interface UploadedFile {
  id: string;
  filename: string;
  url: string;
  size: number;
  type: string;
  uploadedAt: Date;
}

// ============================================================================
// SETTINGS
// ============================================================================

export interface AppSettings {
  theme: 'light' | 'dark' | 'auto';
  language: 'fr' | 'en';
  notifications: PushNotificationConfig;
  currency: 'EUR' | 'USD';
  dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY';
}

export interface UserPreferences extends AppSettings {
  userId: number;
  emailNotifications: boolean;
  smsNotifications: boolean;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type Maybe<T> = T | null | undefined;

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = 
  Pick<T, Exclude<keyof T, Keys>> & 
  {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>;
  }[Keys];

export type Timestamp = string | Date | number;

export type ID = number | string;

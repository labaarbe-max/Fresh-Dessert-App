/**
 * Service de validation centralisé
 * 
 * Responsabilités :
 * - Validation des données d'entrée
 * - Schémas de validation réutilisables
 * - Messages d'erreur standardisés
 */

import { ValidationResult, StatsParams } from '../types/database.types';

// ==========================================
// VALIDATEURS DE BASE
// ==========================================

/**
 * Valide un email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Valide un numéro de téléphone français
 */
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/;
  return phoneRegex.test(phone);
}

/**
 * Valide un prix positif
 */
export function isValidPrice(price: number): boolean {
  return typeof price === 'number' && price > 0 && Number.isFinite(price);
}

/**
 * Valide une quantité positive
 */
export function isValidQuantity(quantity: number): boolean {
  return Number.isInteger(quantity) && quantity > 0;
}

/**
 * Valide une date MySQL
 */
export function isValidMySQLDate(date: string): boolean {
  const dateRegex = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;
  if (!dateRegex.test(date)) return false;
  
  const parsed = new Date(date);
  return !isNaN(parsed.getTime());
}

/**
 * Valide un code postal français
 */
export function isValidPostalCode(postalCode: string): boolean {
  return /^\d{5}$/.test(postalCode);
}

// ==========================================
// TYPES POUR LES SCHÉMAS
// ==========================================

interface SchemaField {
  required: boolean;
  type?: string;
  validate?: (value: any) => boolean;
}

interface Schema {
  [key: string]: SchemaField;
}

// ==========================================
// SCHÉMAS DE VALIDATION
// ==========================================

export const schemas: { [key: string]: Schema } = {
  // Utilisateur
  user: {
    email: { required: true, validate: isValidEmail },
    password: { 
      required: true, 
      validate: (pwd: string) => pwd.length >= 8 
    },
    first_name: { required: true, type: 'string' },
    last_name: { required: true, type: 'string' },
    phone: { required: false, validate: isValidPhone },
    role: { 
      required: false, 
      validate: (role: string) => ['client', 'deliverer', 'dispatcher', 'admin'].includes(role) 
    }
  },

  // Produit
  product: {
    name: { required: true, type: 'string' },
    category: { required: true, type: 'string' },
    price: { required: true, validate: isValidPrice },
    emoji: { required: false, type: 'string' },
    description: { required: false, type: 'string' },
    is_available: { required: false, type: 'boolean' }
  },

  // Commande
  order: {
    delivery_address: { required: true, type: 'string' },
    delivery_date: { required: false, validate: isValidMySQLDate },
    notes: { required: false, type: 'string' },
    items: { 
      required: true, 
      validate: (items: any) => Array.isArray(items) && items.length > 0 
    }
  },

  // Item de commande
  orderItem: {
    product_id: { required: true, validate: isValidQuantity },
    quantity: { required: true, validate: isValidQuantity }
  },

  // Livreur
  deliverer: {
    user_id: { required: true, validate: isValidQuantity },
    vehicle_type: { 
      required: true, 
      validate: (type: string) => ['bike', 'scooter', 'car', 'van'].includes(type) 
    },
    license_plate: { required: false, type: 'string' },
    is_available: { required: false, type: 'boolean' }
  },

  // Tournée
  delivery: {
    deliverer_id: { required: true, validate: isValidQuantity },
    delivery_date: { required: true, validate: isValidMySQLDate },
    status: { 
      required: false, 
      validate: (status: string) => ['pending', 'in_progress', 'completed', 'cancelled'].includes(status) 
    }
  },

  // Stock
  stock: {
    delivery_id: { required: true, validate: isValidQuantity },
    product_id: { required: true, validate: isValidQuantity },
    initial_quantity: { required: true, validate: isValidQuantity },
    current_quantity: { required: true, validate: isValidQuantity },
    sold_quantity: { required: false, validate: isValidQuantity }
  },

  // Adresse
  address: {
    street: { required: true, type: 'string' },
    city: { required: true, type: 'string' },
    postal_code: { required: true, validate: isValidPostalCode },
    country: { required: false, type: 'string' },
    is_default: { required: false, type: 'boolean' }
  }
};

// ==========================================
// VALIDATEURS COMPLEXES
// ==========================================

interface OrderValidationResult {
  valid: boolean;
  errors: string[];
}
/**
 * Valide un item de commande
 */
export function validateOrderItem(item: { product_id: number; quantity: number }): string[] {
  const errors: string[] = [];

  if (!isValidQuantity(item.product_id)) {
    errors.push('product_id must be a positive integer');
  }

  if (!isValidQuantity(item.quantity)) {
    errors.push('quantity must be a positive integer');
  }

  if (item.quantity > 100) {
    errors.push('quantity cannot exceed 100');
  }

  return errors;
}

interface PaginationParams {
  page?: string | number;
  limit?: string | number;
}

interface PaginationResult {
  page: number;
  limit: number;
  offset: number;
}

/**
 * Valide les paramètres de pagination
 */
export function validatePagination(params: PaginationParams): PaginationResult {
  const page = Math.max(1, Number(params.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(params.limit) || 10));
  const offset = (page - 1) * limit;

  return { page, limit, offset };
}

interface StatsParamsInput {
  period?: string;
  start_date?: string;
  end_date?: string;
}

/**
 * Valide les paramètres de filtrage pour les stats
 */
export function validateStatsParams(params: StatsParamsInput): StatsParams {
  const validPeriods: Array<StatsParams['period']> = ['day', 'week', 'month', 'year'];
  const period = validPeriods.includes(params.period as any) ? params.period as StatsParams['period'] : 'month';

  let startDate: string | undefined = undefined;
  let endDate: string | undefined = undefined;

  if (params.start_date) {
    if (!isValidMySQLDate(params.start_date + ' 00:00:00')) {
      throw new Error('start_date must be in format YYYY-MM-DD');
    }
    startDate = params.start_date + ' 00:00:00';
  }

  if (params.end_date) {
    if (!isValidMySQLDate(params.end_date + ' 23:59:59')) {
      throw new Error('end_date must be in format YYYY-MM-DD');
    }
    endDate = params.end_date + ' 23:59:59';
  }

  if (startDate && endDate && startDate > endDate) {
    throw new Error('start_date must be before end_date');
  }

  return { period, start_date: startDate, end_date: endDate };
}

interface DelivererData {
  user_id?: number;
  vehicle_type?: string;
}

export function validateDelivererData(data: DelivererData): ValidationResult {
  if (!data.user_id || !data.vehicle_type) {
    return { error: new Error('Missing required fields: user_id, vehicle_type') };
  }
  
  const validVehicleTypes = ['bike', 'scooter', 'car', 'van'];
  if (!validVehicleTypes.includes(data.vehicle_type)) {
    return { error: new Error(`Invalid vehicle_type. Must be one of: ${validVehicleTypes.join(', ')}`) };
  }
  
  return { valid: true };
}

interface LoginData {
  email?: string;
  password?: string;
}

export function validateLoginData(data: LoginData): ValidationResult {
  if (!data.email || !data.password) {
    return { error: new Error('Missing email or password') };
  }
  
  // Validation email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(data.email)) {
    return { error: new Error('Invalid email format') };
  }
  
  // Validation mot de passe (longueur minimale et complexité)
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{12,}$/;
  if (!passwordRegex.test(data.password)) {
    return { error: new Error('Password must be at least 12 characters long and contain at least one letter, one number, and one special character (@$!%*#?&)') };
  }
  
  return { valid: true };
}

interface RegisterData {
  email?: string;
  password?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  role?: string;
}

export function validateRegisterData(data: RegisterData): ValidationResult {
  const { email, password, first_name, last_name, phone, role } = data;
  
  // Champs requis
  if (!email || !password || !first_name || !last_name || !role) {
    return { error: new Error('Missing required fields: email, password, first_name, last_name, role') };
  }
  
  // Validation email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { error: new Error('Invalid email format') };
  }
  
  // Validation mot de passe (12+ caractères, complexité)
  if (password.length < 12) {
    return { error: new Error('Password must be at least 12 characters') };
  }
  
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{12,}$/;
  if (!passwordRegex.test(password)) {
    return { error: new Error('Password must contain at least one letter, one number, and one special character (@$!%*#?&)') };
  }
  
  // Validation rôle
  const validRoles = ['client', 'deliverer', 'dispatcher', 'admin'];
  if (!validRoles.includes(role)) {
    return { error: new Error(`Invalid role. Must be one of: ${validRoles.join(', ')}`) };
  }
  
  // Validation téléphone (optionnel)
  if (phone && !/^[\+]?[0-9\s\-]{10,15}$/.test(phone)) {
    return { error: new Error('Invalid phone format') };
  }
  
  return { valid: true };
}

interface PasswordChangeData {
  current_password?: string;
  new_password?: string;
}

export function validatePasswordChange(data: PasswordChangeData): ValidationResult {
  const { current_password, new_password } = data;
  
  if (!current_password || !new_password) {
    return { error: new Error('Missing required fields: current_password, new_password') };
  }
  
  // Validation du nouveau mot de passe (même règles que register)
  if (new_password.length < 12) {
    return { error: new Error('New password must be at least 12 characters long') };
  }
  
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{12,}$/;
  if (!passwordRegex.test(new_password)) {
    return { error: new Error('New password must contain at least one letter, one number, and one special character (@$!%*#?&)') };
  }
  
  return { valid: true };
}

interface DelivererUpdateData {
  vehicle_type?: string;
  license_plate?: string;
  is_available?: boolean;
}

export function validateDelivererUpdate(data: DelivererUpdateData): ValidationResult {
  const { vehicle_type, license_plate, is_available } = data;
  
  if (vehicle_type) {
    const validVehicleTypes = ['bike', 'scooter', 'car', 'van'];
    if (!validVehicleTypes.includes(vehicle_type)) {
      return { error: new Error(`Invalid vehicle_type. Must be one of: ${validVehicleTypes.join(', ')}`) };
    }
  }
  
  if (license_plate && typeof license_plate !== 'string') {
    return { error: new Error('Invalid license_plate format') };
  }
  
  if (is_available !== undefined && typeof is_available !== 'boolean') {
    return { error: new Error('is_available must be a boolean') };
  }
  
  return { valid: true };
}

// ============================================================================
// PRODUCT VALIDATION
// ============================================================================

interface ProductData {
  name?: string;
  description?: string;
  category?: string;
  price?: number;
  allergens?: string;
  image_url?: string;
  emoji?: string;
  active?: boolean;
}

export function validateProductData(data: ProductData): ValidationResult {
  const { name, description, category, price } = data;
  
  // Champs requis
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return { error: new Error('Product name is required') };
  }
  
  if (name.length > 100) {
    return { error: new Error('Product name must be less than 100 characters') };
  }
  
  if (!description || typeof description !== 'string' || description.trim().length === 0) {
    return { error: new Error('Product description is required') };
  }
  
  if (description.length > 500) {
    return { error: new Error('Product description must be less than 500 characters') };
  }
  
  if (!category || typeof category !== 'string') {
    return { error: new Error('Product category is required') };
  }
  
  const validCategories = ['dessert', 'cake', 'pastry', 'ice_cream', 'beverage', 'other'];
  if (!validCategories.includes(category)) {
    return { error: new Error(`Invalid category. Must be one of: ${validCategories.join(', ')}`) };
  }
  
  if (price === undefined || price === null) {
    return { error: new Error('Product price is required') };
  }
  
  if (!isValidPrice(price)) {
    return { error: new Error('Product price must be a positive number') };
  }
  
  if (price > 10000) {
    return { error: new Error('Product price must be less than 10000') };
  }
  
  // Champs optionnels
  if (data.allergens && typeof data.allergens !== 'string') {
    return { error: new Error('Allergens must be a string') };
  }
  
  if (data.image_url && typeof data.image_url !== 'string') {
    return { error: new Error('Image URL must be a string') };
  }
  
  if (data.emoji && typeof data.emoji !== 'string') {
    return { error: new Error('Emoji must be a string') };
  }
  
  if (data.active !== undefined && typeof data.active !== 'boolean') {
    return { error: new Error('Active must be a boolean') };
  }
  
  return { valid: true };
}

// ORDER UPDATE VALIDATION

interface OrderUpdateData {
  status?: string;
  delivery_address?: string;
  delivery_date?: string;
  notes?: string;
  deliverer_id?: number;
}

export function validateOrderUpdate(data: OrderUpdateData): ValidationResult {
  // Au moins un champ doit être fourni
  if (!data.status && !data.delivery_address && !data.delivery_date && !data.notes && !data.deliverer_id) {
    return { error: new Error('At least one field must be provided for update') };
  }
  
  // Validation du statut si fourni
  if (data.status) {
    const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'in_delivery', 'delivered', 'cancelled'];
    if (!validStatuses.includes(data.status)) {
      return { error: new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`) };
    }
  }
  
  // Validation de l'adresse si fournie
  if (data.delivery_address !== undefined) {
    if (typeof data.delivery_address !== 'string' || data.delivery_address.trim().length === 0) {
      return { error: new Error('delivery_address must be a non-empty string') };
    }
    if (data.delivery_address.length > 500) {
      return { error: new Error('delivery_address must be less than 500 characters') };
    }
  }
  
  // Validation de la date si fournie
  if (data.delivery_date && !isValidMySQLDate(data.delivery_date)) {
    return { error: new Error('delivery_date must be in format YYYY-MM-DD HH:mm:ss') };
  }
  
  // Validation des notes si fournies
  if (data.notes !== undefined && data.notes !== null) {
    if (typeof data.notes !== 'string') {
      return { error: new Error('notes must be a string') };
    }
    if (data.notes.length > 1000) {
      return { error: new Error('notes must be less than 1000 characters') };
    }
  }
  
  // Validation du deliverer_id si fourni
  if (data.deliverer_id !== undefined && data.deliverer_id !== null) {
    if (!Number.isInteger(data.deliverer_id) || data.deliverer_id <= 0) {
      return { error: new Error('deliverer_id must be a positive integer') };
    }
  }
  
  return { valid: true };
}

// ORDER DATA VALIDATION

interface OrderData {
  user_id?: number;
  items?: any[];
  delivery_address?: string;
  delivery_date?: string;
  notes?: string;
  delivery_id?: number;
}

export function validateOrderData(data: any): ValidationResult {
  const { user_id, items, delivery_address, delivery_date } = data;
  
  // Champs requis
  if (!user_id || !Number.isInteger(user_id) || user_id <= 0) {
    return { error: new Error('user_id is required and must be a positive integer') };
  }
  
  if (!Array.isArray(items) || items.length === 0) {
    return { error: new Error('items must be a non-empty array') };
  }
  
  // Validation des items
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (!item.product_id || !Number.isInteger(item.product_id) || item.product_id <= 0) {
      return { error: new Error(`Item ${i + 1}: product_id must be a positive integer`) };
    }
    if (!item.quantity || !Number.isInteger(item.quantity) || item.quantity <= 0) {
      return { error: new Error(`Item ${i + 1}: quantity must be a positive integer`) };
    }
  }
  
  if (!delivery_address || typeof delivery_address !== 'string' || delivery_address.trim().length === 0) {
    return { error: new Error('delivery_address is required') };
  }
  
  if (delivery_address.length > 500) {
    return { error: new Error('delivery_address must be less than 500 characters') };
  }
  
  // Champs optionnels
  if (delivery_date && !isValidMySQLDate(delivery_date)) {
    return { error: new Error('delivery_date must be in format YYYY-MM-DD HH:mm:ss') };
  }
  
  if (data.notes !== undefined && data.notes !== null) {
    if (typeof data.notes !== 'string') {
      return { error: new Error('notes must be a string') };
    }
    if (data.notes.length > 1000) {
      return { error: new Error('notes must be less than 1000 characters') };
    }
  }
  
  if (data.delivery_id !== undefined && data.delivery_id !== null) {
    if (!Number.isInteger(data.delivery_id) || data.delivery_id <= 0) {
      return { error: new Error('delivery_id must be a positive integer') };
    }
  }
  
  return { valid: true };
}

// DELIVERY DATA VALIDATION

interface DeliveryData {
  deliverer_id?: number;
  delivery_date?: string;
  notes?: string;
  order_ids?: number[];
}
export function validateDeliveryData(data: DeliveryData): ValidationResult {
  const { deliverer_id, delivery_date } = data;
  
  // Champs requis
  if (!deliverer_id || !Number.isInteger(deliverer_id) || deliverer_id <= 0) {
    return { error: new Error('deliverer_id is required and must be a positive integer') };
  }
  
  if (!delivery_date || typeof delivery_date !== 'string' || delivery_date.trim().length === 0) {
    return { error: new Error('delivery_date is required') };
  }
  
  if (!isValidMySQLDate(delivery_date)) {
    return { error: new Error('delivery_date must be in format YYYY-MM-DD HH:mm:ss') };
  }
  
  // Champs optionnels
  if (data.notes !== undefined && data.notes !== null) {
    if (typeof data.notes !== 'string') {
      return { error: new Error('notes must be a string') };
    }
    if (data.notes.length > 1000) {
      return { error: new Error('notes must be less than 1000 characters') };
    }
  }
  
  if (data.order_ids !== undefined) {
    if (!Array.isArray(data.order_ids)) {
      return { error: new Error('order_ids must be an array') };
    }
    for (let i = 0; i < data.order_ids.length; i++) {
      if (!Number.isInteger(data.order_ids[i]) || data.order_ids[i] <= 0) {
        return { error: new Error(`order_ids[${i}] must be a positive integer`) };
      }
    }
  }
  
  return { valid: true };
}

// DELIVERY UPDATE VALIDATION

interface DeliveryUpdateData {
  status?: string;
  delivery_date?: string;
  notes?: string;
  deliverer_id?: number;
}
export function validateDeliveryUpdate(data: DeliveryUpdateData, userRole?: string): ValidationResult {
  // Au moins un champ doit être fourni
  if (!data.status && !data.delivery_date && !data.notes && !data.deliverer_id) {
    return { error: new Error('At least one field must be provided for update') };
  }
  
  // Validation du statut si fourni
  if (data.status) {
    const validStatuses = ['pending', 'in_progress', 'completed', 'cancelled'];
    if (!validStatuses.includes(data.status)) {
      return { error: new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`) };
    }
  }
  
  // Validation de la date si fournie
  if (data.delivery_date) {
    if (typeof data.delivery_date !== 'string' || data.delivery_date.trim().length === 0) {
      return { error: new Error('delivery_date must be a non-empty string') };
    }
    if (!isValidMySQLDate(data.delivery_date)) {
      return { error: new Error('delivery_date must be in format YYYY-MM-DD HH:mm:ss') };
    }
  }
  
  // Validation des notes si fournies
  if (data.notes !== undefined && data.notes !== null) {
    if (typeof data.notes !== 'string') {
      return { error: new Error('notes must be a string') };
    }
    if (data.notes.length > 1000) {
      return { error: new Error('notes must be less than 1000 characters') };
    }
  }
  
  // Validation du deliverer_id si fourni
  if (data.deliverer_id !== undefined && data.deliverer_id !== null) {
    if (!Number.isInteger(data.deliverer_id) || data.deliverer_id <= 0) {
      return { error: new Error('deliverer_id must be a positive integer') };
    }
  }
  
  return { valid: true };
}


// ADDRESS VALIDATION

interface AddressData {
  label?: string;
  street_address?: string;
  city?: string;
  postal_code?: string;
  floor?: string;
  door_number?: string;
  building_code?: string;
  intercom?: string;
  delivery_instructions?: string;
  is_default?: boolean;
}

export function validateAddressData(data: AddressData): ValidationResult {
  const { label, street_address, city, postal_code } = data;
  
  // Champs requis
  if (!label || typeof label !== 'string' || label.trim().length === 0) {
    return { error: new Error('label is required') };
  }
  
  if (label.length > 100) {
    return { error: new Error('label must be less than 100 characters') };
  }
  
  if (!street_address || typeof street_address !== 'string' || street_address.trim().length === 0) {
    return { error: new Error('street_address is required') };
  }
  
  if (street_address.length > 255) {
    return { error: new Error('street_address must be less than 255 characters') };
  }
  
  if (!city || typeof city !== 'string' || city.trim().length === 0) {
    return { error: new Error('city is required') };
  }
  
  if (city.length > 100) {
    return { error: new Error('city must be less than 100 characters') };
  }
  
  if (!postal_code || typeof postal_code !== 'string' || postal_code.trim().length === 0) {
    return { error: new Error('postal_code is required') };
  }
  
  if (!isValidPostalCode(postal_code)) {
    return { error: new Error('postal_code must be a valid 5-digit French postal code') };
  }
  
  // Champs optionnels
  if (data.floor !== undefined && data.floor !== null) {
    if (typeof data.floor !== 'string') {
      return { error: new Error('floor must be a string') };
    }
    if (data.floor.length > 20) {
      return { error: new Error('floor must be less than 20 characters') };
    }
  }
  
  if (data.door_number !== undefined && data.door_number !== null) {
    if (typeof data.door_number !== 'string') {
      return { error: new Error('door_number must be a string') };
    }
    if (data.door_number.length > 20) {
      return { error: new Error('door_number must be less than 20 characters') };
    }
  }
  
  if (data.building_code !== undefined && data.building_code !== null) {
    if (typeof data.building_code !== 'string') {
      return { error: new Error('building_code must be a string') };
    }
    if (data.building_code.length > 50) {
      return { error: new Error('building_code must be less than 50 characters') };
    }
  }
  
  if (data.intercom !== undefined && data.intercom !== null) {
    if (typeof data.intercom !== 'string') {
      return { error: new Error('intercom must be a string') };
    }
    if (data.intercom.length > 50) {
      return { error: new Error('intercom must be less than 50 characters') };
    }
  }
  
  if (data.delivery_instructions !== undefined && data.delivery_instructions !== null) {
    if (typeof data.delivery_instructions !== 'string') {
      return { error: new Error('delivery_instructions must be a string') };
    }
    if (data.delivery_instructions.length > 500) {
      return { error: new Error('delivery_instructions must be less than 500 characters') };
    }
  }
  
  if (data.is_default !== undefined && data.is_default !== null) {
    if (typeof data.is_default !== 'boolean') {
      return { error: new Error('is_default must be a boolean') };
    }
  }
  
  return { valid: true };
}

// ============================================================================
// STOCK VALIDATION
// ============================================================================

interface StockData {
  delivery_id?: number;
  product_id?: number;
  initial_quantity?: number;
}

export function validateStockData(data: StockData): ValidationResult {
  const { delivery_id, product_id, initial_quantity } = data;
  
  // Champs requis
  if (!delivery_id || !Number.isInteger(delivery_id) || delivery_id <= 0) {
    return { error: new Error('delivery_id is required and must be a positive integer') };
  }
  
  if (!product_id || !Number.isInteger(product_id) || product_id <= 0) {
    return { error: new Error('product_id is required and must be a positive integer') };
  }
  
  if (!initial_quantity || !Number.isInteger(initial_quantity) || initial_quantity <= 0) {
    return { error: new Error('initial_quantity is required and must be a positive integer') };
  }
  
  return { valid: true };
}

// ============================================================================
// STOCK UPDATE VALIDATION
// ============================================================================

interface StockUpdateData {
  initial_quantity?: number;
  current_quantity?: number;
}

export function validateStockUpdate(data: StockUpdateData): ValidationResult {
  // Au moins un champ doit être fourni
  if (data.initial_quantity === undefined && data.current_quantity === undefined) {
    return { error: new Error('At least one field must be provided for update') };
  }
  
  // Validation de initial_quantity si fourni
  if (data.initial_quantity !== undefined) {
    if (!Number.isInteger(data.initial_quantity) || data.initial_quantity < 0) {
      return { error: new Error('initial_quantity must be a non-negative integer') };
    }
  }
  
  // Validation de current_quantity si fourni
  if (data.current_quantity !== undefined) {
    if (!Number.isInteger(data.current_quantity) || data.current_quantity < 0) {
      return { error: new Error('current_quantity must be a non-negative integer') };
    }
  }
  
  return { valid: true };
}

// ============================================================================
// BULK STOCK VALIDATION
// ============================================================================

interface BulkStockData {
  delivery_id?: number;
  stocks?: Array<{
    product_id: number;
    initial_quantity: number;
  }>;
}

export function validateBulkStockData(data: BulkStockData): ValidationResult {
  const { delivery_id, stocks } = data;
  
  // Champs requis
  if (!delivery_id || !Number.isInteger(delivery_id) || delivery_id <= 0) {
    return { error: new Error('delivery_id is required and must be a positive integer') };
  }
  
  if (!Array.isArray(stocks) || stocks.length === 0) {
    return { error: new Error('stocks must be a non-empty array') };
  }
  
  // Validation de chaque stock
  for (let i = 0; i < stocks.length; i++) {
    const stock = stocks[i];
    
    if (!stock.product_id || !Number.isInteger(stock.product_id) || stock.product_id <= 0) {
      return { error: new Error(`Stock ${i + 1}: product_id must be a positive integer`) };
    }
    
    if (!stock.initial_quantity || !Number.isInteger(stock.initial_quantity) || stock.initial_quantity <= 0) {
      return { error: new Error(`Stock ${i + 1}: initial_quantity must be a positive integer`) };
    }
  }
  
  return { valid: true };
}
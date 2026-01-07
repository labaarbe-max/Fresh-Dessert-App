/**
 * Service de validation centralisé
 * 
 * Responsabilités :
 * - Validation des données d'entrée
 * - Schémas de validation réutilisables
 * - Messages d'erreur standardisés
 */

// ==========================================
// VALIDATEURS DE BASE
// ==========================================

/**
 * Valide un email
 * @param {string} email - Email à valider
 * @returns {boolean} - True si valide
 */
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Valide un numéro de téléphone français
 * @param {string} phone - Téléphone à valider
 * @returns {boolean} - True si valide
 */
export function isValidPhone(phone) {
  const phoneRegex = /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/;
  return phoneRegex.test(phone);
}

/**
 * Valide un prix positif
 * @param {number} price - Prix à valider
 * @returns {boolean} - True si valide
 */
export function isValidPrice(price) {
  return typeof price === 'number' && price > 0 && Number.isFinite(price);
}

/**
 * Valide une quantité positive
 * @param {number} quantity - Quantité à valider
 * @returns {boolean} - True si valide
 */
export function isValidQuantity(quantity) {
  return Number.isInteger(quantity) && quantity > 0;
}

/**
 * Valide une date MySQL
 * @param {string} date - Date au format YYYY-MM-DD HH:mm:ss
 * @returns {boolean} - True si valide
 */
export function isValidMySQLDate(date) {
  const dateRegex = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;
  if (!dateRegex.test(date)) return false;
  
  const parsed = new Date(date);
  return !isNaN(parsed.getTime());
}

/**
 * Valide un code postal français
 * @param {string} postalCode - Code postal à valider
 * @returns {boolean} - True si valide
 */
export function isValidPostalCode(postalCode) {
  return /^\d{5}$/.test(postalCode);
}

// ==========================================
// SCHÉMAS DE VALIDATION
// ==========================================

export const schemas = {
  // Utilisateur
  user: {
    email: { required: true, validate: isValidEmail },
    password: { 
      required: true, 
      validate: (pwd) => pwd.length >= 8 
    },
    first_name: { required: true, type: 'string' },
    last_name: { required: true, type: 'string' },
    phone: { required: false, validate: isValidPhone },
    role: { 
      required: false, 
      validate: (role) => ['client', 'deliverer', 'dispatcher', 'admin'].includes(role) 
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
      validate: (items) => Array.isArray(items) && items.length > 0 
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
      validate: (type) => ['bike', 'scooter', 'car', 'van'].includes(type) 
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
      validate: (status) => ['pending', 'in_progress', 'completed', 'cancelled'].includes(status) 
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

/**
 * Valide une commande complète avec ses items
 * @param {Object} orderData - Données de la commande
 * @returns {Object} - { valid: boolean, errors: string[] }
 */
export function validateOrder(orderData) {
  const errors = [];

  // Validation de la commande
  if (!orderData.delivery_address || orderData.delivery_address.trim().length === 0) {
    errors.push('delivery_address is required');
  }

  // Validation des items
  if (!Array.isArray(orderData.items) || orderData.items.length === 0) {
    errors.push('items must be a non-empty array');
  } else {
    orderData.items.forEach((item, index) => {
      const itemErrors = validateOrderItem(item);
      if (itemErrors.length > 0) {
        errors.push(`Item ${index + 1}: ${itemErrors.join(', ')}`);
      }
    });
  }

  // Validation de la date si présente
  if (orderData.delivery_date && !isValidMySQLDate(orderData.delivery_date)) {
    errors.push('delivery_date must be in format YYYY-MM-DD HH:mm:ss');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Valide un item de commande
 * @param {Object} item - Item à valider
 * @returns {string[]} - Liste des erreurs
 */
export function validateOrderItem(item) {
  const errors = [];

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

/**
 * Valide une création de stock en masse
 * @param {Array} stocks - Tableau de stocks à créer
 * @returns {Object} - { valid: boolean, errors: string[] }
 */
export function validateBulkStocks(stocks) {
  const errors = [];

  if (!Array.isArray(stocks) || stocks.length === 0) {
    errors.push('stocks must be a non-empty array');
    return { valid: false, errors };
  }

  const productIds = new Set();

  stocks.forEach((stock, index) => {
    const stockErrors = validateStock(stock);
    if (stockErrors.length > 0) {
      errors.push(`Stock ${index + 1}: ${stockErrors.join(', ')}`);
    }

    // Vérifier les doublons de produits
    if (stock.product_id) {
      if (productIds.has(stock.product_id)) {
        errors.push(`Duplicate product_id ${stock.product_id} in stock ${index + 1}`);
      }
      productIds.add(stock.product_id);
    }
  });

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Valide un stock individuel
 * @param {Object} stock - Stock à valider
 * @returns {string[]} - Liste des erreurs
 */
export function validateStock(stock) {
  const errors = [];

  if (!isValidQuantity(stock.delivery_id)) {
    errors.push('delivery_id must be a positive integer');
  }

  if (!isValidQuantity(stock.product_id)) {
    errors.push('product_id must be a positive integer');
  }

  if (!isValidQuantity(stock.initial_quantity)) {
    errors.push('initial_quantity must be a positive integer');
  }

  if (!isValidQuantity(stock.current_quantity)) {
    errors.push('current_quantity must be a positive integer');
  }

  if (stock.current_quantity > stock.initial_quantity) {
    errors.push('current_quantity cannot be greater than initial_quantity');
  }

  if (stock.sold_quantity !== undefined && !isValidQuantity(stock.sold_quantity)) {
    errors.push('sold_quantity must be a positive integer');
  }

  return errors;
}

/**
 * Valide les paramètres de pagination
 * @param {Object} params - Paramètres à valider
 * @returns {Object} - Paramètres validés avec valeurs par défaut
 */
export function validatePagination(params) {
  const page = Math.max(1, Number(params.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(params.limit) || 10));
  const offset = (page - 1) * limit;

  return { page, limit, offset };
}

/**
 * Valide les paramètres de filtrage pour les stats
 * @param {Object} params - Paramètres à valider
 * @returns {Object} - Paramètres validés
 */
export function validateStatsParams(params) {
  const validPeriods = ['day', 'week', 'month', 'year', 'all'];
  const period = validPeriods.includes(params.period) ? params.period : 'month';

  let startDate = null;
  let endDate = null;

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

  return { period, startDate, endDate };
}
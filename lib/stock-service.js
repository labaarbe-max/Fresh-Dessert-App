import pool from './db.js';

/**
 * Service de gestion des stocks - Logique métier
 * 
 * Responsabilités :
 * - Validation des stocks
 * - Décrémentation atomique
 * - Calculs de performance
 * - Transactions complexes
 */

export class StockService {
  
  // ==========================================
  // 1. VALIDATION ET VÉRIFICATION
  // ==========================================
  
  /**
   * Valide les paramètres d'entrée
   * @param {number} deliveryId - ID de la tournée
   * @param {number} productId - ID du produit  
   * @param {number} quantity - Quantité
   * @throws {Error} Si les paramètres sont invalides
   */
  static validateStockParams(deliveryId, productId, quantity) {
    if (!deliveryId || !Number.isInteger(deliveryId) || deliveryId <= 0) {
      throw new Error('Invalid delivery ID: must be a positive integer');
    }
    
    if (!productId || !Number.isInteger(productId) || productId <= 0) {
      throw new Error('Invalid product ID: must be a positive integer');
    }
    
    if (!quantity || !Number.isInteger(quantity) || quantity <= 0) {
      throw new Error('Invalid quantity: must be a positive integer');
    }
  }

  /**
   * Vérifie si un stock existe pour une tournée et un produit
   * @param {number} deliveryId - ID de la tournée
   * @param {number} productId - ID du produit
   * @returns {Promise<boolean>} - True si le stock existe
   */
  static async checkStockExists(deliveryId, productId) {
    try {
      this.validateStockParams(deliveryId, productId, 1);
      
      const [rows] = await pool.query(
        `SELECT id FROM delivery_stocks 
         WHERE delivery_id = ? AND product_id = ?`,
        [deliveryId, productId]
      );
      
      return rows.length > 0;
    } catch (error) {
      console.error('Error checking stock existence:', error);
      throw error;
    }
  }

  /**
   * Vérifie la disponibilité du stock
   * @param {number} deliveryId - ID de la tournée
   * @param {number} productId - ID du produit
   * @param {number} quantity - Quantité requise
   * @returns {Promise<{available: boolean, currentStock: number}>}
   */
  static async checkStockAvailability(deliveryId, productId, quantity) {
    try {
      this.validateStockParams(deliveryId, productId, quantity);
      
      const [rows] = await pool.query(
        `SELECT current_quantity 
         FROM delivery_stocks 
         WHERE delivery_id = ? AND product_id = ?`,
        [deliveryId, productId]
      );
      
      if (rows.length === 0) {
        throw new Error(`No stock found for delivery ${deliveryId} and product ${productId}`);
      }
      
      const currentStock = rows[0].current_quantity;
      const available = currentStock >= quantity;
      
      return { available, currentStock };
    } catch (error) {
      console.error('Error checking stock availability:', error);
      throw error;
    }
  }

  // ==========================================
  // 2. DÉCRÉMENTATION ATOMIQUE
  // ==========================================
  
  /**
   * Décrémente le stock de manière atomique
   * @param {number} deliveryId - ID de la tournée
   * @param {number} productId - ID du produit
   * @param {number} quantity - Quantité à décrémenter
   * @returns {Promise<{success: boolean, decremented: number, remainingStock: number}>}
   * @throws {Error} Si stock insuffisant ou erreur technique
   */
  static async decrementStock(deliveryId, productId, quantity) {
    try {
      // 1. Validation des paramètres
      this.validateStockParams(deliveryId, productId, quantity);
      
      // 2. Vérification de disponibilité
      const availability = await this.checkStockAvailability(deliveryId, productId, quantity);
      if (!availability.available) {
        throw new Error(
          `Insufficient stock: need ${quantity}, available ${availability.currentStock} ` +
          `for delivery ${deliveryId}, product ${productId}`
        );
      }
      
      // 3. Décrémentation atomique avec condition SQL
      const [result] = await pool.query(
        `UPDATE delivery_stocks 
         SET current_quantity = current_quantity - ?,
             sold_quantity = sold_quantity + ?,
             updated_at = CURRENT_TIMESTAMP
         WHERE delivery_id = ? AND product_id = ?
         AND current_quantity >= ?`,
        [quantity, quantity, deliveryId, productId, quantity]
      );
      
      // 4. Vérification que l'UPDATE a fonctionné
      if (result.affectedRows === 0) {
        throw new Error(
          `Failed to decrement stock - concurrent modification or insufficient stock ` +
          `for delivery ${deliveryId}, product ${productId}`
        );
      }
      
      // 5. Récupération du stock restant
      const [updatedStock] = await pool.query(
        `SELECT current_quantity, sold_quantity 
         FROM delivery_stocks 
         WHERE delivery_id = ? AND product_id = ?`,
        [deliveryId, productId]
      );
      
      return {
        success: true,
        decremented: quantity,
        remainingStock: updatedStock[0].current_quantity,
        soldQuantity: updatedStock[0].sold_quantity
      };
      
    } catch (error) {
      console.error('Error decrementing stock:', error);
      throw error;
    }
  }
}
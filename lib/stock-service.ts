import { Pool, RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import pool from './db';
import { logError } from './error-handler';

/**
 * Service de gestion des stocks - Logique métier
 * 
 * Responsabilités :
 * - Validation des stocks
 * - Décrémentation atomique
 * - Calculs de performance
 * - Transactions complexes
 */

interface StockRow extends RowDataPacket {
  id?: number;
  current_quantity: number;
  sold_quantity?: number;
}

interface StockAvailability {
  available: boolean;
  currentStock: number;
}

interface DecrementResult {
  success: boolean;
  decremented: number;
  remainingStock: number;
  soldQuantity: number;
}

interface ProcessOrderItem {
  product_id: number;
  quantity: number;
}

interface ProcessOrderResult {
  items: Array<{
    product_id: number;
    quantity: number;
    decremented: number;
    remainingStock: number;
  }>;
  totalDecremented: number;
}

export class StockService {
  
  // ==========================================
  // 1. VALIDATION ET VÉRIFICATION
  // ==========================================
  
  /**
   * Valide les paramètres d'entrée
   * @param deliveryId - ID de la tournée
   * @param productId - ID du produit  
   * @param quantity - Quantité
   * @throws {Error} Si les paramètres sont invalides
   */
  static validateStockParams(deliveryId: number, productId: number, quantity: number): void {
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
   * @param deliveryId - ID de la tournée
   * @param productId - ID du produit
   * @returns True si le stock existe
   */
  static async checkStockExists(deliveryId: number, productId: number): Promise<boolean> {
    try {
      this.validateStockParams(deliveryId, productId, 1);
      
      const [rows] = await pool.query<StockRow[]>(
        `SELECT id FROM delivery_stocks 
         WHERE delivery_id = ? AND product_id = ?`,
        [deliveryId, productId]
      );
      
      return rows.length > 0;
    } catch (error) {
      logError(error as Error, 'StockService', { operation: 'checkStockExists', deliveryId, productId });
      throw error;
    }
  }

  /**
   * Vérifie la disponibilité du stock
   * @param deliveryId - ID de la tournée
   * @param productId - ID du produit
   * @param quantity - Quantité requise
   * @returns Disponibilité et stock actuel
   */
  static async checkStockAvailability(
    deliveryId: number,
    productId: number,
    quantity: number
  ): Promise<StockAvailability> {
    try {
      this.validateStockParams(deliveryId, productId, quantity);
      
      const [rows] = await pool.query<StockRow[]>(
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
      logError(error as Error, 'StockService', { operation: 'checkStockAvailability', deliveryId, productId, quantity });
      throw error;
    }
  }

  // ==========================================
  // 2. DÉCRÉMENTATION ATOMIQUE
  // ==========================================
  
  /**
   * Décrémente le stock de manière atomique
   * @param deliveryId - ID de la tournée
   * @param productId - ID du produit
   * @param quantity - Quantité à décrémenter
   * @returns Résultat de la décrémentation
   * @throws {Error} Si stock insuffisant ou erreur technique
   */
  static async decrementStock(
    deliveryId: number,
    productId: number,
    quantity: number
  ): Promise<DecrementResult> {
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
      const [result] = await pool.query<ResultSetHeader>(
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
      const [updatedStock] = await pool.query<StockRow[]>(
        `SELECT current_quantity, sold_quantity 
         FROM delivery_stocks 
         WHERE delivery_id = ? AND product_id = ?`,
        [deliveryId, productId]
      );
      
      return {
        success: true,
        decremented: quantity,
        remainingStock: updatedStock[0].current_quantity,
        soldQuantity: updatedStock[0].sold_quantity || 0
      };
      
    } catch (error) {
      logError(error as Error, 'StockService', { operation: 'decrementStock', deliveryId, productId, quantity });
      throw error;
    }
  }

  // ==========================================
  // 3. TRAITEMENT DE COMMANDES
  // ==========================================
  
  /**
   * Traite les stocks pour une commande complète
   * @param deliveryId - ID de la tournée
   * @param items - Items de la commande
   * @returns Résultat du traitement
   */
  static async processOrderStocks(
    deliveryId: number,
    items: ProcessOrderItem[]
  ): Promise<ProcessOrderResult> {
    const results: ProcessOrderResult['items'] = [];
    let totalDecremented = 0;

    try {
      for (const item of items) {
        const result = await this.decrementStock(
          deliveryId,
          item.product_id,
          item.quantity
        );

        results.push({
          product_id: item.product_id,
          quantity: item.quantity,
          decremented: result.decremented,
          remainingStock: result.remainingStock
        });

        totalDecremented += result.decremented;
      }

      return {
        items: results,
        totalDecremented
      };
    } catch (error) {
      logError(error as Error, 'StockService', { operation: 'processOrderStocks', deliveryId, itemsCount: items.length });
      throw error;
    }
  }
  // ==========================================
  // 4. STATISTIQUES DE TOURNÉE
  // ==========================================
  
  /**
   * Calcule les performances d'une tournée
   * @param deliveryId - ID de la tournée
   * @returns Statistiques de performance
   */
  static async calculateTourPerformance(deliveryId: number): Promise<any> {
    try {
      if (!deliveryId || !Number.isInteger(deliveryId) || deliveryId <= 0) {
        throw new Error('Invalid delivery ID');
      }

      const [performance] = await pool.query<RowDataPacket[]>(
        `SELECT 
          d.id as delivery_id,
          d.delivery_date,
          d.status,
          CONCAT(u.first_name, ' ', u.last_name) as deliverer_name,
          del.vehicle_type,
          COUNT(DISTINCT ds.id) as total_products,
          SUM(ds.initial_quantity) as initial_quantity,
          SUM(ds.current_quantity) as current_quantity,
          SUM(ds.sold_quantity) as sold_quantity,
          SUM(ds.sold_quantity * p.price) as revenue,
          ROUND((SUM(ds.sold_quantity) / NULLIF(SUM(ds.initial_quantity), 0)) * 100, 2) as sell_through_rate,
          COUNT(DISTINCT o.id) as orders_count
        FROM deliveries d
        INNER JOIN deliverers del ON d.deliverer_id = del.id
        INNER JOIN users u ON del.user_id = u.id
        LEFT JOIN delivery_stocks ds ON d.id = ds.delivery_id
        LEFT JOIN products p ON ds.product_id = p.id
        LEFT JOIN orders o ON d.id = o.delivery_id
        WHERE d.id = ?
        GROUP BY d.id, d.delivery_date, d.status, u.first_name, u.last_name, del.vehicle_type`,
        [deliveryId]
      );

      return performance[0] || null;
    } catch (error) {
      logError(error as Error, 'StockService', { operation: 'calculateTourPerformance', deliveryId });
      throw error;
    }
  }

  /**
   * Récupère les produits vendus d'une tournée
   * @param deliveryId - ID de la tournée
   * @returns Liste des produits vendus
   */
  static async getTourSoldProducts(deliveryId: number): Promise<any[]> {
    try {
      if (!deliveryId || !Number.isInteger(deliveryId) || deliveryId <= 0) {
        throw new Error('Invalid delivery ID');
      }

      const [products] = await pool.query<RowDataPacket[]>(
        `SELECT 
          p.id as product_id,
          p.name as product_name,
          p.category,
          p.emoji,
          p.price,
          ds.initial_quantity,
          ds.current_quantity,
          ds.sold_quantity,
          ds.sold_quantity * p.price as revenue,
          ROUND((ds.sold_quantity / NULLIF(ds.initial_quantity, 0)) * 100, 2) as sell_through_rate
        FROM delivery_stocks ds
        INNER JOIN products p ON ds.product_id = p.id
        WHERE ds.delivery_id = ?
        ORDER BY ds.sold_quantity DESC`,
        [deliveryId]
      );

      return products;
    } catch (error) {
      logError(error as Error, 'StockService', { operation: 'getTourSoldProducts', deliveryId });
      throw error;
    }
  }
}

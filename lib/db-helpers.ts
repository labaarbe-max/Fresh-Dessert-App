import { Pool, RowDataPacket, ResultSetHeader } from 'mysql2/promise';

/**
 * Helpers génériques pour les opérations de base de données
 * Évite la duplication de code dans db.js
 */

/**
 * Récupère un enregistrement par ID
 * @param pool - Pool de connexion MySQL
 * @param table - Nom de la table
 * @param id - ID de l'enregistrement
 * @param conditions - Conditions supplémentaires (ex: { user_id: 123 })
 * @returns L'enregistrement ou null
 */
export async function getById<T = any>(
  pool: Pool,
  table: string,
  id: number,
  conditions: Record<string, any> = {}
): Promise<T | null> {
  try {
    let query = `SELECT * FROM ${table} WHERE id = ?`;
    const params: any[] = [id];

    // Ajouter conditions supplémentaires
    Object.entries(conditions).forEach(([key, value]) => {
      query += ` AND ${key} = ?`;
      params.push(value);
    });

    const [rows] = await pool.query<RowDataPacket[]>(query, params);
    return rows.length > 0 ? (rows[0] as T) : null;
  } catch (error) {
    console.error(`Error fetching ${table} by id:`, error);
    throw error;
  }
}

/**
 * Récupère tous les enregistrements d'une table
 * @param pool - Pool de connexion MySQL
 * @param table - Nom de la table
 * @param conditions - Conditions WHERE (ex: { active: true })
 * @param orderBy - Clause ORDER BY (ex: 'created_at DESC')
 * @param limit - Limite de résultats
 * @param offset - Offset pour pagination
 * @returns Liste des enregistrements
 */
export async function getAll<T = any>(
  pool: Pool,
  table: string,
  conditions: Record<string, any> = {},
  orderBy: string = 'id DESC',
  limit?: number,
  offset?: number
): Promise<T[]> {
  try {
    let query = `SELECT * FROM ${table}`;
    const params: any[] = [];

    // Ajouter conditions WHERE
    if (Object.keys(conditions).length > 0) {
      const whereClauses = Object.entries(conditions).map(([key, value]) => {
        params.push(value);
        return `${key} = ?`;
      });
      query += ` WHERE ${whereClauses.join(' AND ')}`;
    }

    // Ajouter ORDER BY
    if (orderBy) {
      query += ` ORDER BY ${orderBy}`;
    }

    // Ajouter LIMIT et OFFSET
    if (limit !== undefined) {
      query += ` LIMIT ?`;
      params.push(limit);
    }
    if (offset !== undefined) {
      query += ` OFFSET ?`;
      params.push(offset);
    }

    const [rows] = await pool.query<RowDataPacket[]>(query, params);
    return rows as T[];
  } catch (error) {
    console.error(`Error fetching all from ${table}:`, error);
    throw error;
  }
}

/**
 * Met à jour un enregistrement par ID
 * @param pool - Pool de connexion MySQL
 * @param table - Nom de la table
 * @param id - ID de l'enregistrement
 * @param data - Données à mettre à jour
 * @param conditions - Conditions supplémentaires (ex: { user_id: 123 })
 * @returns Nombre de lignes affectées
 */
export async function updateById(
  pool: Pool,
  table: string,
  id: number,
  data: Record<string, any>,
  conditions: Record<string, any> = {}
): Promise<number> {
  try {
    const fields = Object.keys(data);
    const values = Object.values(data);

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    let query = `UPDATE ${table} SET ${fields.map(f => `${f} = ?`).join(', ')} WHERE id = ?`;
    const params = [...values, id];

    // Ajouter conditions supplémentaires
    Object.entries(conditions).forEach(([key, value]) => {
      query += ` AND ${key} = ?`;
      params.push(value);
    });

    const [result] = await pool.query<ResultSetHeader>(query, params);
    return result.affectedRows;
  } catch (error) {
    console.error(`Error updating ${table}:`, error);
    throw error;
  }
}

/**
 * Supprime un enregistrement par ID
 * @param pool - Pool de connexion MySQL
 * @param table - Nom de la table
 * @param id - ID de l'enregistrement
 * @param conditions - Conditions supplémentaires (ex: { user_id: 123 })
 * @returns Nombre de lignes supprimées
 */
export async function deleteById(
  pool: Pool,
  table: string,
  id: number,
  conditions: Record<string, any> = {}
): Promise<number> {
  try {
    let query = `DELETE FROM ${table} WHERE id = ?`;
    const params: any[] = [id];

    // Ajouter conditions supplémentaires
    Object.entries(conditions).forEach(([key, value]) => {
      query += ` AND ${key} = ?`;
      params.push(value);
    });

    const [result] = await pool.query<ResultSetHeader>(query, params);
    return result.affectedRows;
  } catch (error) {
    console.error(`Error deleting from ${table}:`, error);
    throw error;
  }
}

/**
 * Compte le nombre d'enregistrements
 * @param pool - Pool de connexion MySQL
 * @param table - Nom de la table
 * @param conditions - Conditions WHERE
 * @returns Nombre d'enregistrements
 */
export async function count(
  pool: Pool,
  table: string,
  conditions: Record<string, any> = {}
): Promise<number> {
  try {
    let query = `SELECT COUNT(*) as total FROM ${table}`;
    const params: any[] = [];

    // Ajouter conditions WHERE
    if (Object.keys(conditions).length > 0) {
      const whereClauses = Object.entries(conditions).map(([key, value]) => {
        params.push(value);
        return `${key} = ?`;
      });
      query += ` WHERE ${whereClauses.join(' AND ')}`;
    }

    const [rows] = await pool.query<RowDataPacket[]>(query, params);
    return rows[0].total;
  } catch (error) {
    console.error(`Error counting ${table}:`, error);
    throw error;
  }
}

/**
 * Vérifie si un enregistrement existe
 * @param pool - Pool de connexion MySQL
 * @param table - Nom de la table
 * @param conditions - Conditions WHERE
 * @returns true si existe, false sinon
 */
export async function exists(
  pool: Pool,
  table: string,
  conditions: Record<string, any>
): Promise<boolean> {
  const total = await count(pool, table, conditions);
  return total > 0;
}

/**
 * Insère un enregistrement et retourne l'ID
 * @param pool - Pool de connexion MySQL
 * @param table - Nom de la table
 * @param data - Données à insérer
 * @returns ID de l'enregistrement créé
 */
export async function insert(
  pool: Pool,
  table: string,
  data: Record<string, any>
): Promise<number> {
  try {
    const fields = Object.keys(data);
    const values = Object.values(data);
    const placeholders = fields.map(() => '?').join(', ');

    const query = `INSERT INTO ${table} (${fields.join(', ')}) VALUES (${placeholders})`;
    const [result] = await pool.query<ResultSetHeader>(query, values);
    
    return result.insertId;
  } catch (error) {
    console.error(`Error inserting into ${table}:`, error);
    throw error;
  }
}

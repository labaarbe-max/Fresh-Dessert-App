-- ================================================
-- SQL Performance Optimizations
-- ================================================
-- This file contains composite indexes and optimizations
-- to improve query performance based on actual usage patterns
-- Version: 1.0
-- ================================================

-- ================================================
-- Composite Indexes for Common Query Patterns
-- ================================================

-- Users table - optimize login and user lookups
-- Used by: getUserByEmail (lib/db.ts:174)
CREATE INDEX IF NOT EXISTS idx_users_email_active ON users(email, active);

-- Deliverers table - optimize active deliverer lookups
-- Used by: getDeliverers (lib/db.ts:22) - WHERE u.active = true AND d.is_available = true
CREATE INDEX IF NOT EXISTS idx_deliverers_available ON deliverers(is_available, user_id);

-- Products table - optimize product filtering
-- Used by: getProducts (lib/db.ts:85) - WHERE active = ? AND category = ?
CREATE INDEX IF NOT EXISTS idx_products_active_category ON products(active, category);

-- Orders table - optimize client order lookups
-- Used by: getOrders (lib/db.ts:186) - WHERE user_id = ? ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_orders_user_created ON orders(user_id, created_at DESC);

-- Orders table - optimize status filtering
-- Used by: getOrders (lib/db.ts:186) - ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_orders_status_created ON orders(status, created_at DESC);

-- Orders table - optimize delivery lookups
-- Used by: getDeliveryById (lib/db.ts:402) - WHERE delivery_id = ?
CREATE INDEX IF NOT EXISTS idx_orders_delivery_created ON orders(delivery_id, created_at);

-- Addresses table - optimize user address lookups
-- Used by: getAddressById (lib/db.ts:521) - WHERE id = ? AND user_id = ?
CREATE INDEX IF NOT EXISTS idx_addresses_user_default ON addresses(user_id, is_default);

-- Addresses table - optimize default address lookups
-- Used by: createAddress/updateAddress (lib/db.ts:551, 588) - WHERE user_id = ?
CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON addresses(user_id);

-- Delivery stocks table - optimize delivery stock lookups
-- Used by: getDeliveryStocks (lib/db.ts:624) - WHERE delivery_id = ?
CREATE INDEX IF NOT EXISTS idx_delivery_stocks_delivery_product ON delivery_stocks(delivery_id, product_id);

-- ================================================
-- Performance Tuning Recommendations
-- ================================================

-- 1. Connection Pool Configuration (already in lib/db.ts:10-18)
--    - connectionLimit: 10 - Good for small to medium applications
--    - Consider increasing to 20-30 for high traffic

-- 2. Query Optimization Notes:
--    - Use EXPLAIN ANALYZE on slow queries
--    - Consider adding query caching for frequently accessed data
--    - Implement pagination for large result sets

-- 3. Index Maintenance:
--    - Run ANALYZE TABLE periodically to update statistics
--    - Monitor index usage with SHOW INDEX FROM table_name
--    - Remove unused indexes to reduce write overhead

-- ================================================
-- Monitoring Queries
-- ================================================

-- Check index usage
-- SELECT 
--   TABLE_NAME,
--   INDEX_NAME,
--   SEQ_IN_INDEX,
--   COLUMN_NAME,
--   CARDINALITY
-- FROM information_schema.STATISTICS
-- WHERE TABLE_SCHEMA = DATABASE()
-- ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX;

-- Check slow queries
-- SHOW VARIABLES LIKE 'slow_query_log';
-- SHOW VARIABLES LIKE 'long_query_time';

-- ================================================
-- End of Performance Optimizations
-- ================================================
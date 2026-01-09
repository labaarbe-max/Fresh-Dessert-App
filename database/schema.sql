-- ================================================
-- Fresh Dessert App - Complete Database Schema
-- ================================================
-- All tables in English for consistency
-- Version: 2.0 - Updated 2026-01-08
-- ================================================

SET FOREIGN_KEY_CHECKS = 0;

-- Drop existing tables in correct order
DROP TABLE IF EXISTS delivery_stocks;
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS deliveries;
DROP TABLE IF EXISTS addresses;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS deliverers;
DROP TABLE IF EXISTS users;

SET FOREIGN_KEY_CHECKS = 1;

-- ================================================
-- Table 1: users - All users (clients, deliverers, dispatchers, admins)
-- ================================================
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  role ENUM('client', 'deliverer', 'dispatcher', 'admin') NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  email_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_role (role),
  INDEX idx_active (active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- Table 2: deliverers - Deliverer-specific information
-- ================================================
CREATE TABLE deliverers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT UNIQUE NOT NULL,
  vehicle_type ENUM('bike', 'scooter', 'car') DEFAULT 'bike',
  license_plate VARCHAR(20),
  is_available BOOLEAN DEFAULT FALSE,
  current_latitude DECIMAL(10, 8),
  current_longitude DECIMAL(11, 8),
  rating DECIMAL(3, 2) DEFAULT 5.00,
  total_deliveries INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user (user_id),
  INDEX idx_available (is_available)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- Table 3: products - Product catalog
-- ================================================
CREATE TABLE products (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(200) UNIQUE NOT NULL,
  description TEXT,
  category ENUM('tiramisu', 'waffle', 'pastry', 'drink', 'candy') NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  allergens VARCHAR(255),
  image_url VARCHAR(500),
  emoji VARCHAR(10),
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_category (category),
  INDEX idx_active (active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- Table 4: addresses - Customer delivery addresses
-- ================================================
CREATE TABLE addresses (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  label VARCHAR(100),
  street_address VARCHAR(255) NOT NULL,
  city VARCHAR(100) NOT NULL,
  postal_code VARCHAR(20) NOT NULL,
  floor VARCHAR(50),
  door_number VARCHAR(50),
  building_code VARCHAR(50),
  intercom VARCHAR(50),
  delivery_instructions TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user (user_id),
  INDEX idx_default (is_default)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- Table 5: deliveries - Delivery tours/rounds
-- ================================================
CREATE TABLE deliveries (
  id INT PRIMARY KEY AUTO_INCREMENT,
  deliverer_id INT NOT NULL,
  delivery_date DATE NOT NULL,
  status ENUM('pending', 'in_progress', 'completed', 'cancelled') DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (deliverer_id) REFERENCES deliverers(id) ON DELETE RESTRICT,
  INDEX idx_deliverer (deliverer_id),
  INDEX idx_date (delivery_date),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- Table 6: orders - Customer orders
-- ================================================
CREATE TABLE orders (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  deliverer_id INT,
  delivery_id INT,
  total_price DECIMAL(10, 2) NOT NULL,
  delivery_address TEXT NOT NULL,
  delivery_date DATE,
  notes TEXT,
  status ENUM('pending', 'confirmed', 'in_delivery', 'delivered', 'completed', 'cancelled') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
  FOREIGN KEY (deliverer_id) REFERENCES deliverers(id) ON DELETE SET NULL,
  FOREIGN KEY (delivery_id) REFERENCES deliveries(id) ON DELETE SET NULL,
  INDEX idx_user (user_id),
  INDEX idx_deliverer (deliverer_id),
  INDEX idx_delivery (delivery_id),
  INDEX idx_status (status),
  INDEX idx_date (delivery_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- Table 7: order_items - Items in each order
-- ================================================
CREATE TABLE order_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  unit_price DECIMAL(10, 2) NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
  INDEX idx_order (order_id),
  INDEX idx_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- Table 8: delivery_stocks - Stock assigned to each delivery
-- ================================================
CREATE TABLE delivery_stocks (
  id INT PRIMARY KEY AUTO_INCREMENT,
  delivery_id INT NOT NULL,
  product_id INT NOT NULL,
  initial_quantity INT NOT NULL,
  current_quantity INT NOT NULL,
  sold_quantity INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (delivery_id) REFERENCES deliveries(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
  UNIQUE KEY unique_delivery_product (delivery_id, product_id),
  INDEX idx_delivery (delivery_id),
  INDEX idx_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- Seed Data
-- ================================================

-- Insert admin user
INSERT INTO users (email, password_hash, first_name, last_name, phone, role, email_verified, active) VALUES
('admin@freshdessert.com', '$2b$10$placeholder_hash_change_in_production', 'Admin', 'FreshDessert', '+33600000000', 'admin', TRUE, TRUE);

-- Insert deliverers
INSERT INTO users (email, password_hash, first_name, last_name, phone, role, email_verified, active) VALUES
('nassim@freshdessert.com', '$2b$10$placeholder_hash', 'Nassim', 'Deliverer', '+33612345001', 'deliverer', TRUE, TRUE),
('abdelrahman@freshdessert.com', '$2b$10$placeholder_hash', 'AbdelRahman', 'Deliverer', '+33612345002', 'deliverer', TRUE, TRUE),
('abdelkarim@freshdessert.com', '$2b$10$placeholder_hash', 'AbdelKarim', 'Deliverer', '+33612345003', 'deliverer', TRUE, TRUE),
('mounir@freshdessert.com', '$2b$10$placeholder_hash', 'Mounir', 'Deliverer', '+33612345004', 'deliverer', TRUE, TRUE),
('wissem@freshdessert.com', '$2b$10$placeholder_hash', 'Wissem', 'Deliverer', '+33612345005', 'deliverer', TRUE, TRUE);

INSERT INTO deliverers (user_id, vehicle_type, is_available, rating) VALUES
(2, 'car', TRUE, 4.8),
(3, 'scooter', TRUE, 4.9),
(4, 'car', TRUE, 4.7),
(5, 'scooter', TRUE, 4.6),
(6, 'bike', TRUE, 4.8);

-- Insert sample products (Tiramisus)
INSERT INTO products (name, description, category, price, emoji, active) VALUES
('Tiramisu Kinder Bueno White', 'Délicieux tiramisu au Kinder Bueno White', 'tiramisu', 8.50, '⭐', TRUE),
('Tiramisu Nutella', 'Tiramisu crémeux au Nutella', 'tiramisu', 8.00, '🍫', TRUE),
('Tiramisu Oreo', 'Tiramisu aux biscuits Oreo', 'tiramisu', 8.50, '🍪', TRUE),
('Tiramisu Spéculoos', 'Tiramisu au spéculoos belge', 'tiramisu', 8.50, '🍪', TRUE),
('Tiramisu Kinder Bueno', 'Tiramisu classique au Kinder Bueno', 'tiramisu', 8.50, '🍫', TRUE),
('Tiramisu Raffaello', 'Tiramisu à la noix de coco Raffaello', 'tiramisu', 9.00, '🥥', TRUE),
('Tiramisu Ferrero Rocher', 'Tiramisu luxueux au Ferrero Rocher', 'tiramisu', 9.50, '✨', TRUE),
('Tiramisu Pistache', 'Tiramisu à la pistache', 'tiramisu', 9.00, '🌰', TRUE);

-- Insert sample products (Waffles)
INSERT INTO products (name, description, category, price, emoji, active) VALUES
('Gaufre Nutella', 'Gaufre chaude au Nutella', 'waffle', 6.00, '🧇', TRUE),
('Gaufre Spéculoos', 'Gaufre au spéculoos', 'waffle', 6.00, '🧇', TRUE),
('Gaufre Kinder', 'Gaufre au Kinder', 'waffle', 6.50, '🧇', TRUE);

-- Insert sample products (Pastries)
INSERT INTO products (name, description, category, price, emoji, active) VALUES
('Cookie Chocolat', 'Cookie aux pépites de chocolat', 'pastry', 3.00, '🍪', TRUE),
('Donut Glacé', 'Donut avec glaçage coloré', 'pastry', 3.50, '🍩', TRUE),
('Macaron Assortiment', 'Assortiment de 6 macarons', 'pastry', 12.00, '🌈', TRUE);

-- Insert sample products (Drinks)
INSERT INTO products (name, description, category, price, emoji, active) VALUES
('Coca-Cola 33cl', 'Coca-Cola canette', 'drink', 2.50, '🥤', TRUE),
('Oasis Tropical 33cl', 'Oasis Tropical canette', 'drink', 2.50, '🥤', TRUE),
('Ice Tea Pêche 33cl', 'Ice Tea saveur pêche', 'drink', 2.50, '🥤', TRUE),
('Eau Minérale 50cl', 'Eau minérale naturelle', 'drink', 1.50, '💧', TRUE);

-- Insert sample products (Candies)
INSERT INTO products (name, description, category, price, emoji, active) VALUES
('Kinder Bueno', 'Barre Kinder Bueno', 'candy', 2.00, '🍫', TRUE),
('M&Ms Peanut', 'Sachet M&Ms cacahuète', 'candy', 2.50, '🍬', TRUE),
('Twix', 'Barre Twix', 'candy', 2.00, '🍫', TRUE);

-- ================================================
-- End of schema
-- ================================================

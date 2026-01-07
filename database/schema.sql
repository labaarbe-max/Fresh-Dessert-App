-- ================================================
-- Fresh Dessert App - Feature: API Stocks
-- ================================================
-- Branch: feature/api-stocks
-- Tables: users + deliverers + products + deliveries + addresses + orders + order_items + delivery_stocks
-- ================================================

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS delivery_stocks;
DROP TABLE IF EXISTS addresses;
DROP TABLE IF EXISTS deliveries;
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS deliverers;
DROP TABLE IF EXISTS users;
SET FOREIGN_KEY_CHECKS = 1;

-- ================================================
-- Table 1: users - Base pour tous les utilisateurs
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
-- Table 2: deliverers - Informations livreurs
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
-- Données
-- ================================================

-- Créer quelques livreurs
INSERT INTO users (email, password_hash, first_name, last_name, phone, role, email_verified) VALUES
('nassim@freshdessert.com', '$2b$10$placeholder', 'Nassim', 'Livreur', '+33612345001', 'deliverer', TRUE),
('abdelrahman@freshdessert.com', '$2b$10$placeholder', 'AbdelRahman', 'Livreur', '+33612345003', 'deliverer', TRUE);

INSERT INTO deliverers (user_id, vehicle_type, is_available) VALUES
(1, 'car', TRUE),
(2, 'car', TRUE);

-- ================================================
-- Table 3: products - Catalogue produits
-- ================================================
CREATE TABLE products (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(200) UNIQUE NOT NULL,
  description TEXT,
  category ENUM('tiramisu', 'waffle', 'pastry', 'drink', 'candy') NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  allergens VARCHAR(500),
  image_url VARCHAR(500),
  emoji VARCHAR(10),
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_category (category),
  INDEX idx_active (active),
  INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- Produits - Tiramisus
-- ================================================

INSERT INTO products (name, description, category, price, allergens, emoji, active) VALUES
-- Tiramisus
('Caramel Spéculoos', 'Mascarpone, œufs, crème, sucre, biscuit cuillère, spéculoos, coulis spéculoos, coulis caramel', 'tiramisu', 7.50, 'Lait, Œufs, Gluten, Soja (traces)', '⭐', TRUE),
('Nutella Spéculoos', 'Mascarpone, œufs, crème, sucre, biscuit cuillère, spéculoos, coulis Nutella, coulis spéculoos', 'tiramisu', 7.50, 'Lait, Œufs, Gluten, Fruits à coque (noisette), Soja', '⭐', TRUE),
('Oréo Nutella', 'Mascarpone, œufs, crème, sucre, biscuit cuillère, Oréo, coulis Nutella', 'tiramisu', 7.50, 'Lait, Œufs, Gluten, Fruits à coque (noisette), Soja', '⭐', TRUE),
('Daim Caramel', 'Mascarpone, œufs, crème, sucre, biscuit cuillère, Daim, coulis caramel', 'tiramisu', 7.50, 'Lait, Œufs, Gluten, Fruits à coque (amande), Soja', '⭐', TRUE),
('M&Ms Caramel Beurre Salé Beurre de Cacahuète', 'Mascarpone, œufs, crème, sucre, biscuit cuillère, M&M''s, coulis caramel, beurre de cacahuète', 'tiramisu', 7.50, 'Lait, Œufs, Gluten, Arachides, Fruits à coque, Soja', '⭐', TRUE),
('Brownie Caramel Beurre Salé', 'Mascarpone, œufs, crème, sucre, biscuit cuillère, brownie, cacao, coulis caramel', 'tiramisu', 7.50, 'Lait, Œufs, Gluten, Soja', '⭐', TRUE),
('Mangue Passion Coco', 'Mascarpone, œufs, crème, sucre, biscuit cuillère, coulis mangue, coulis passion, mangue, coco râpée, citron vert', 'tiramisu', 7.50, 'Lait, Œufs, Gluten, Sulfites (possibles)', '⭐', TRUE),
('Fruits Rouges Chocolat Blanc', 'Mascarpone, œufs, crème, sucre, biscuit cuillère, fruits rouges, coulis fruits rouges, chocolat blanc', 'tiramisu', 8.00, 'Lait, Œufs, Gluten, Soja', '⭐', TRUE),
('Kinder Bueno White', 'Mascarpone, œufs, crème, sucre, biscuit cuillère, Kinder Bueno White, coulis Nutella, coulis Bueno White', 'tiramisu', 8.50, 'Lait, Œufs, Gluten, Fruits à coque, Soja', '⭐', TRUE),
('Kinder Bueno', 'Mascarpone, œufs, crème, sucre, biscuit cuillère, Kinder Bueno, coulis Nutella, coulis Bueno', 'tiramisu', 8.50, 'Lait, Œufs, Gluten, Fruits à coque, Soja', '⭐', TRUE),
('Kinder Schokobon', 'Mascarpone, œufs, crème, sucre, biscuit cuillère, Schokobon, coulis Nutella', 'tiramisu', 8.50, 'Lait, Œufs, Gluten, Fruits à coque, Soja', '⭐', TRUE);

-- ================================================
-- Table 6: deliveries - Tournées de livraison
-- ================================================
CREATE TABLE deliveries (
  id INT PRIMARY KEY AUTO_INCREMENT,
  deliverer_id INT NOT NULL,
  delivery_date DATE NOT NULL,
  status ENUM('planned', 'in_progress', 'completed', 'cancelled') NOT NULL DEFAULT 'planned',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (deliverer_id) REFERENCES deliverers(id) ON DELETE CASCADE,
  INDEX idx_deliverer_id (deliverer_id),
  INDEX idx_delivery_date (delivery_date),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- Table 4: delivery_stocks - Stocks par tournée
-- ================================================
CREATE TABLE delivery_stocks (
  id INT PRIMARY KEY AUTO_INCREMENT,
  delivery_id INT NOT NULL,
  product_id INT NOT NULL,
  initial_quantity INT NOT NULL DEFAULT 0,
  current_quantity INT NOT NULL DEFAULT 0,
  sold_quantity INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (delivery_id) REFERENCES deliveries(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE KEY unique_delivery_product (delivery_id, product_id),
  INDEX idx_delivery (delivery_id),
  INDEX idx_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- Table 4: addresses - Adresses de livraison
-- ================================================
CREATE TABLE addresses (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  label VARCHAR(50),
  street_address VARCHAR(255) NOT NULL,
  city VARCHAR(100) NOT NULL,
  postal_code VARCHAR(10) NOT NULL,
  floor VARCHAR(20),
  door_number VARCHAR(20),
  building_code VARCHAR(50),
  intercom VARCHAR(50),
  delivery_instructions TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user (user_id),
  INDEX idx_default (user_id, is_default)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- Table 4: orders - Commandes
-- ================================================
CREATE TABLE orders (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  status ENUM('pending', 'confirmed', 'preparing', 'ready', 'delivering', 'delivered', 'cancelled') NOT NULL DEFAULT 'pending',
  total_price DECIMAL(10, 2) NOT NULL,
  address_id INT,
  delivery_address TEXT NOT NULL,
  delivery_date DATETIME,
  notes TEXT,
  deliverer_id INT,
  delivery_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (deliverer_id) REFERENCES deliverers(id) ON DELETE SET NULL,
  FOREIGN KEY (delivery_id) REFERENCES deliveries(id) ON DELETE SET NULL,
  FOREIGN KEY (address_id) REFERENCES addresses(id) ON DELETE SET NULL,
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_deliverer_id (deliverer_id),
  INDEX idx_delivery_date (delivery_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- Table 5: order_items - Lignes de commande
-- ================================================
CREATE TABLE order_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  unit_price DECIMAL(10, 2) NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
  INDEX idx_order_id (order_id),
  INDEX idx_product_id (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

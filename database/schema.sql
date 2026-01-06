-- ================================================
-- Fresh Dessert App - Feature: API Products
-- ================================================
-- Branch: feature/api-products
-- Tables: users + deliverers + products
-- ================================================
SET FOREIGN_KEY_CHECKS = 0;
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

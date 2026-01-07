-- ================================================
-- Fresh Dessert App - Feature: API Deliverers
-- ================================================
-- Branch: feature/api-deliverers
-- Tables: users + deliverers
-- ================================================
SET FOREIGN_KEY_CHECKS = 0;
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

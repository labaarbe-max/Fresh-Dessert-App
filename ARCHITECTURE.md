# 🏗️ Fresh Dessert App - Architecture Technique Complète

> **Document créé le :** 2026-01-05  
> **Statut :** Architecture validée - Prêt pour développement

---

## 📋 Table des matières

1. [Vue d'ensemble du système](#vue-densemble-du-système)
2. [Architecture technique](#architecture-technique)
3. [Stack technologique](#stack-technologique)
4. [Schéma de base de données](#schéma-de-base-de-données)
5. [Endpoints API](#endpoints-api)
6. [Plan de développement par phases](#plan-de-développement-par-phases)
7. [Sécurité et bonnes pratiques](#sécurité-et-bonnes-pratiques)
8. [Hébergement et déploiement](#hébergement-et-déploiement)

---

## 🎯 Vue d'ensemble du système

### Les 4 composants principaux

```
┌─────────────────────────────────────────────────────────────┐
│                    FRESH DESSERT ECOSYSTEM                  │
└─────────────────────────────────────────────────────────────┘

┌──────────────────┐      ┌──────────────────┐      ┌──────────────────┐
│  App Mobile      │      │  Back-office     │      │  App Mobile      │
│  CLIENT          │◄────►│  WEB             │◄────►│  LIVREUR         │
│  (React Native)  │      │  (Next.js)       │      │  (React Native)  │
└──────────────────┘      └──────────────────┘      └──────────────────┘
         │                         │                          │
         │                         │                          │
         └─────────────────────────┼──────────────────────────┘
                                   │
                                   ▼
                    ┌──────────────────────────────┐
                    │     API BACKEND              │
                    │     (Next.js API Routes)     │
                    │                              │
                    │  • Authentication            │
                    │  • Orders Management         │
                    │  • Stock Management          │
                    │  • Real-time Updates         │
                    │  • Notifications             │
                    └──────────────────────────────┘
                                   │
                                   ▼
                    ┌──────────────────────────────┐
                    │     DATABASE                 │
                    │     (MySQL)                  │
                    └──────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  SERVICES EXTERNES                                           │
│  • Stripe (Paiement)                                         │
│  • Firebase (Notifications Push)                             │
│  • Google Maps (Géolocalisation)                             │
│  • Extension Chrome (Import UberEats)                        │
└──────────────────────────────────────────────────────────────┘
```

---

## 🏛️ Architecture technique

### Architecture en 3 couches (Three-Tier Architecture)

```
┌─────────────────────────────────────────────────────────────┐
│  PRESENTATION LAYER (Frontend)                              │
│  • App Mobile Client (React Native + Expo)                 │
│  • App Mobile Livreur (React Native + Expo)                │
│  • Back-office Web (Next.js Pages)                         │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  APPLICATION LAYER (Backend API)                            │
│  • Next.js API Routes                                       │
│  • Business Logic                                           │
│  • Authentication (NextAuth.js)                             │
│  • Real-time (WebSockets / Server-Sent Events)              │
│  • File Upload (Images produits)                            │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  DATA LAYER (Base de données)                               │
│  • MySQL Database                                           │
│  • Redis (Cache & Sessions - optionnel Phase 2)            │
└─────────────────────────────────────────────────────────────┘
```

### Pourquoi cette architecture ?

✅ **Séparation des responsabilités** : Chaque couche a un rôle précis  
✅ **Scalabilité** : Facile d'ajouter des serveurs si besoin  
✅ **Maintenabilité** : Code organisé et facile à maintenir  
✅ **Sécurité** : La base de données n'est jamais exposée directement  

---

## 🛠️ Stack technologique

### Backend (API)

| Technologie | Version | Rôle |
|------------|---------|------|
| **Next.js** | 14+ | Framework full-stack (API + Web) |
| **Node.js** | 18+ | Runtime JavaScript |
| **MySQL** | 8.0+ | Base de données relationnelle |
| **mysql2** | Latest | Driver MySQL pour Node.js |
| **NextAuth.js** | 4+ | Authentification (email, Google, Facebook) |
| **Zod** | Latest | Validation des données |
| **bcrypt** | Latest | Hash des mots de passe |
| **jsonwebtoken** | Latest | Tokens JWT pour auth mobile |

### Frontend Mobile (Client + Livreur)

| Technologie | Version | Rôle |
|------------|---------|------|
| **React Native** | Latest | Framework mobile cross-platform |
| **Expo** | Latest | Toolchain React Native (simplifie le dev) |
| **React Navigation** | 6+ | Navigation entre écrans |
| **Axios** | Latest | Appels HTTP vers l'API |
| **React Query** | 5+ | Gestion du cache et des requêtes |
| **React Native Maps** | Latest | Cartes et géolocalisation |
| **Expo Notifications** | Latest | Notifications push |

### Frontend Web (Back-office)

| Technologie | Version | Rôle |
|------------|---------|------|
| **Next.js** | 14+ | Framework React (même projet que l'API) |
| **React** | 18+ | Library UI |
| **Tailwind CSS** | 3+ | Styling |
| **shadcn/ui** | Latest | Composants UI modernes |
| **Recharts** | Latest | Graphiques et statistiques |

### Services externes

| Service | Rôle | Phase |
|---------|------|-------|
| **Stripe** | Paiement en ligne | Phase 3 |
| **Firebase Cloud Messaging** | Notifications push | Phase 2 |
| **Google Maps API** | Géolocalisation et itinéraires | Phase 2 |
| **Cloudinary / AWS S3** | Stockage images produits | Phase 1 |

---

## 🗄️ Schéma de base de données

### Tables principales (Phase 1 - MVP)

#### 1. `users` - Tous les utilisateurs du système

```sql
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
  INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### 2. `deliverers` - Informations spécifiques aux livreurs

```sql
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
  INDEX idx_available (is_available)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### 3. `clients` - Informations spécifiques aux clients

```sql
CREATE TABLE clients (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT UNIQUE NOT NULL,
  loyalty_points INT DEFAULT 0,
  total_orders INT DEFAULT 0,
  preferred_payment_method ENUM('card', 'cash', 'app') DEFAULT 'app',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### 4. `addresses` - Adresses de livraison

```sql
CREATE TABLE addresses (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  label VARCHAR(50),
  street_address VARCHAR(255) NOT NULL,
  city VARCHAR(100) NOT NULL,
  postal_code VARCHAR(10) NOT NULL,
  department VARCHAR(10),
  additional_info TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### 5. `products` - Catalogue de produits

```sql
CREATE TABLE products (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(200) UNIQUE NOT NULL,
  description TEXT,
  category ENUM('tiramisu', 'waffle', 'pastry', 'drink', 'candy') NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  image_url VARCHAR(500),
  emoji VARCHAR(10),
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_category (category),
  INDEX idx_active (active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### 6. `tours` - Tournées de livraison

```sql
CREATE TABLE tours (
  id INT PRIMARY KEY AUTO_INCREMENT,
  date DATE NOT NULL,
  status ENUM('preparing', 'in_progress', 'completed') DEFAULT 'preparing',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_date (date),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### 7. `tour_deliverers` - Association tournée-livreur

```sql
CREATE TABLE tour_deliverers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  tour_id INT NOT NULL,
  deliverer_id INT NOT NULL,
  sector VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tour_id) REFERENCES tours(id) ON DELETE CASCADE,
  FOREIGN KEY (deliverer_id) REFERENCES deliverers(id) ON DELETE CASCADE,
  UNIQUE KEY unique_tour_deliverer (tour_id, deliverer_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### 8. `stocks` - Stocks par livreur/tournée

```sql
CREATE TABLE stocks (
  id INT PRIMARY KEY AUTO_INCREMENT,
  tour_deliverer_id INT NOT NULL,
  product_id INT NOT NULL,
  initial_quantity INT NOT NULL,
  current_quantity INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (tour_deliverer_id) REFERENCES tour_deliverers(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE KEY unique_stock (tour_deliverer_id, product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### 9. `orders` - Commandes

```sql
CREATE TABLE orders (
  id INT PRIMARY KEY AUTO_INCREMENT,
  order_number VARCHAR(50) UNIQUE NOT NULL,
  client_id INT NOT NULL,
  deliverer_id INT,
  address_id INT NOT NULL,
  tour_id INT,
  source ENUM('app', 'ubereats', 'phone') NOT NULL,
  status ENUM('pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled') DEFAULT 'pending',
  payment_method ENUM('card', 'cash', 'app') NOT NULL,
  payment_status ENUM('pending', 'paid', 'refunded') DEFAULT 'pending',
  subtotal DECIMAL(10, 2) NOT NULL,
  delivery_fee DECIMAL(10, 2) DEFAULT 0,
  discount DECIMAL(10, 2) DEFAULT 0,
  total DECIMAL(10, 2) NOT NULL,
  delivery_instructions TEXT,
  estimated_delivery_time DATETIME,
  delivered_at DATETIME,
  cancelled_at DATETIME,
  cancellation_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
  FOREIGN KEY (deliverer_id) REFERENCES deliverers(id) ON DELETE SET NULL,
  FOREIGN KEY (address_id) REFERENCES addresses(id) ON DELETE RESTRICT,
  FOREIGN KEY (tour_id) REFERENCES tours(id) ON DELETE SET NULL,
  INDEX idx_client (client_id),
  INDEX idx_deliverer (deliverer_id),
  INDEX idx_status (status),
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### 10. `order_items` - Produits dans les commandes

```sql
CREATE TABLE order_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  unit_price DECIMAL(10, 2) NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### 11. `stock_movements` - Historique des mouvements de stock

```sql
CREATE TABLE stock_movements (
  id INT PRIMARY KEY AUTO_INCREMENT,
  stock_id INT NOT NULL,
  order_id INT,
  movement_type ENUM('initialization', 'delivery', 'adjustment', 'transfer') NOT NULL,
  quantity INT NOT NULL,
  quantity_before INT NOT NULL,
  quantity_after INT NOT NULL,
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (stock_id) REFERENCES stocks(id) ON DELETE CASCADE,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Tables Phase 2 (Fonctionnalités avancées)

#### 12. `notifications` - Notifications push

```sql
CREATE TABLE notifications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type ENUM('order', 'delivery', 'stock', 'system') NOT NULL,
  read_at DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_read (user_id, read_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### 13. `ratings` - Notes et avis

```sql
CREATE TABLE ratings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  order_id INT NOT NULL,
  rater_id INT NOT NULL,
  rated_type ENUM('deliverer', 'product') NOT NULL,
  rated_id INT NOT NULL,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (rater_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_rating (order_id, rated_type, rated_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### 14. `promo_codes` - Codes promo

```sql
CREATE TABLE promo_codes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(50) UNIQUE NOT NULL,
  description VARCHAR(255),
  discount_type ENUM('percentage', 'fixed') NOT NULL,
  discount_value DECIMAL(10, 2) NOT NULL,
  min_order_amount DECIMAL(10, 2),
  max_uses INT,
  current_uses INT DEFAULT 0,
  valid_from DATETIME NOT NULL,
  valid_until DATETIME NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_code (code),
  INDEX idx_active (active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 🔌 Endpoints API

### 🔐 Authentication

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Inscription (client) | No |
| POST | `/api/auth/login` | Connexion | No |
| POST | `/api/auth/logout` | Déconnexion | Yes |
| GET | `/api/auth/me` | Profil utilisateur connecté | Yes |
| PUT | `/api/auth/me` | Modifier profil | Yes |
| POST | `/api/auth/forgot-password` | Mot de passe oublié | No |
| POST | `/api/auth/reset-password` | Réinitialiser mot de passe | No |

### 👥 Users

| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| GET | `/api/users` | Liste des utilisateurs | Yes | Admin |
| GET | `/api/users/:id` | Détails utilisateur | Yes | Admin |
| PUT | `/api/users/:id` | Modifier utilisateur | Yes | Admin |
| DELETE | `/api/users/:id` | Supprimer utilisateur | Yes | Admin |

### 🚚 Deliverers

| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| GET | `/api/deliverers` | Liste des livreurs | Yes | Dispatcher/Admin |
| GET | `/api/deliverers/:id` | Détails livreur | Yes | All |
| POST | `/api/deliverers` | Créer livreur | Yes | Admin |
| PUT | `/api/deliverers/:id` | Modifier livreur | Yes | Admin/Self |
| PUT | `/api/deliverers/:id/location` | Mettre à jour position | Yes | Deliverer |
| PUT | `/api/deliverers/:id/availability` | Changer disponibilité | Yes | Deliverer |
| GET | `/api/deliverers/:id/stats` | Statistiques livreur | Yes | Deliverer/Admin |

### 🍰 Products

| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| GET | `/api/products` | Liste des produits | No | - |
| GET | `/api/products/:id` | Détails produit | No | - |
| POST | `/api/products` | Créer produit | Yes | Admin |
| PUT | `/api/products/:id` | Modifier produit | Yes | Admin |
| DELETE | `/api/products/:id` | Supprimer produit | Yes | Admin |
| GET | `/api/products/category/:category` | Produits par catégorie | No | - |

### 📦 Orders

| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| GET | `/api/orders` | Liste des commandes | Yes | All |
| GET | `/api/orders/:id` | Détails commande | Yes | All |
| POST | `/api/orders` | Créer commande | Yes | Client |
| PUT | `/api/orders/:id/status` | Changer statut | Yes | Deliverer/Dispatcher |
| PUT | `/api/orders/:id/assign` | Assigner à livreur | Yes | Dispatcher |
| POST | `/api/orders/:id/cancel` | Annuler commande | Yes | Client/Dispatcher |
| POST | `/api/orders/:id/adjust` | Ajuster commande (rupture stock) | Yes | Deliverer |
| GET | `/api/orders/deliverer/:id` | Commandes d'un livreur | Yes | Deliverer/Dispatcher |
| GET | `/api/orders/client/:id` | Commandes d'un client | Yes | Client/Admin |

### 🚛 Tours

| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| GET | `/api/tours` | Liste des tournées | Yes | Dispatcher/Admin |
| GET | `/api/tours/:id` | Détails tournée | Yes | All |
| POST | `/api/tours` | Créer tournée | Yes | Dispatcher |
| PUT | `/api/tours/:id` | Modifier tournée | Yes | Dispatcher |
| DELETE | `/api/tours/:id` | Supprimer tournée | Yes | Admin |
| PUT | `/api/tours/:id/status` | Changer statut | Yes | Dispatcher |
| POST | `/api/tours/:id/deliverers` | Assigner livreur | Yes | Dispatcher |
| DELETE | `/api/tours/deliverers/:id` | Retirer livreur | Yes | Dispatcher |

### 📊 Stocks

| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| GET | `/api/stocks` | Stocks globaux | Yes | Dispatcher/Admin |
| GET | `/api/stocks/deliverer/:id` | Stocks d'un livreur | Yes | Deliverer/Dispatcher |
| POST | `/api/stocks` | Initialiser stocks | Yes | Dispatcher |
| PUT | `/api/stocks/:id` | Ajuster stock | Yes | Dispatcher/Deliverer |
| GET | `/api/stocks/available` | Produits disponibles (tous livreurs) | No | - |
| POST | `/api/stocks/transfer` | Transférer stock entre livreurs | Yes | Dispatcher |

### 🔔 Notifications (Phase 2)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/notifications` | Mes notifications | Yes |
| PUT | `/api/notifications/:id/read` | Marquer comme lu | Yes |
| PUT | `/api/notifications/read-all` | Tout marquer comme lu | Yes |

### ⭐ Ratings (Phase 2)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/ratings` | Créer une note | Yes |
| GET | `/api/ratings/deliverer/:id` | Notes d'un livreur | No |
| GET | `/api/ratings/product/:id` | Notes d'un produit | No |

### 🎁 Promo Codes (Phase 2)

| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| GET | `/api/promo-codes` | Liste codes promo | Yes | Admin |
| POST | `/api/promo-codes` | Créer code promo | Yes | Admin |
| POST | `/api/promo-codes/validate` | Valider un code | Yes | Client |

### 📈 Statistics (Phase 2)

| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| GET | `/api/stats/dashboard` | Stats globales | Yes | Admin |
| GET | `/api/stats/deliverer/:id` | Stats livreur | Yes | Deliverer/Admin |
| GET | `/api/stats/products` | Produits les plus vendus | Yes | Admin |

---

## 📅 Plan de développement par phases

### 🎯 Phase 1 : Backend API + Back-office Web (3-4 mois)

**Objectif :** Remplacer Trello et gérer les commandes UberEats efficacement

#### Semaines 1-2 : Setup & Infrastructure
- [x] Projet Next.js créé
- [x] Base de données MySQL créée
- [ ] Toutes les tables créées (schema.sql complet)
- [ ] Fichier .env.local configuré
- [ ] Authentification NextAuth.js configurée

#### Semaines 3-4 : Authentification & Users
- [ ] Endpoints auth (register, login, logout)
- [ ] Système de rôles (client, deliverer, dispatcher, admin)
- [ ] Hash des mots de passe (bcrypt)
- [ ] JWT pour les apps mobiles

#### Semaines 5-6 : Gestion des produits
- [ ] CRUD produits complet
- [ ] Upload d'images (Cloudinary)
- [ ] Catégories de produits
- [ ] Interface back-office pour gérer les produits

#### Semaines 7-8 : Gestion des livreurs
- [ ] CRUD livreurs
- [ ] Profils livreurs détaillés
- [ ] Interface back-office pour gérer les livreurs

#### Semaines 9-10 : Gestion des tournées
- [ ] CRUD tournées
- [ ] Assignation livreurs aux tournées
- [ ] Gestion des stocks par livreur
- [ ] Interface back-office pour créer/gérer les tournées

#### Semaines 11-12 : Gestion des commandes
- [ ] CRUD commandes
- [ ] Workflow complet des statuts
- [ ] Assignation automatique des livreurs
- [ ] Gestion des ruptures de stock (notification livreur)
- [ ] Interface back-office pour suivre les commandes

#### Semaines 13-14 : Intégration UberEats
- [ ] Adapter l'extension Chrome au nouveau système
- [ ] Import automatique des commandes UberEats
- [ ] Mapping des produits UberEats → Produits internes

#### Semaines 15-16 : Tests & Déploiement
- [ ] Tests de tous les endpoints
- [ ] Documentation API complète
- [ ] Déploiement sur Vercel
- [ ] Base de données sur PlanetScale (ou AWS RDS)

**Livrable Phase 1 :**
✅ Back-office web fonctionnel pour gérer tout le business  
✅ API complète prête pour les apps mobiles  
✅ Extension Chrome UberEats intégrée  
✅ Remplacement complet de Trello  

---

### 🚀 Phase 2 : App Mobile Livreur (2-3 mois)

**Objectif :** Les livreurs peuvent gérer leurs livraisons depuis leur téléphone

#### Semaines 1-2 : Setup React Native
- [ ] Projet React Native + Expo créé
- [ ] Navigation configurée (React Navigation)
- [ ] Connexion à l'API (Axios + React Query)
- [ ] Authentification mobile (JWT)

#### Semaines 3-4 : Interface livreur
- [ ] Écran de connexion
- [ ] Dashboard livreur (commandes du jour)
- [ ] Détails d'une commande
- [ ] Changement de statut commande

#### Semaines 5-6 : Géolocalisation
- [ ] Carte avec position du livreur
- [ ] Itinéraire vers le client (Google Maps)
- [ ] Mise à jour position en temps réel

#### Semaines 7-8 : Gestion des stocks
- [ ] Voir son stock actuel
- [ ] Ajuster le stock
- [ ] Notification rupture de stock
- [ ] Bouton "Ajuster commande"

#### Semaines 9-10 : Notifications push
- [ ] Firebase Cloud Messaging configuré
- [ ] Notifications nouvelles commandes
- [ ] Notifications changements de statut

#### Semaines 11-12 : Tests & Déploiement
- [ ] Tests sur iOS et Android
- [ ] Publication sur App Store et Google Play

**Livrable Phase 2 :**
✅ App mobile livreur complète  
✅ Géolocalisation en temps réel  
✅ Notifications push  
✅ Gestion des stocks mobile  

---

### 📱 Phase 3 : App Mobile Client (3-4 mois)

**Objectif :** Les clients peuvent commander directement depuis l'app

#### Semaines 1-2 : Setup & Design
- [ ] Projet React Native + Expo créé
- [ ] Design UI/UX moderne
- [ ] Navigation configurée

#### Semaines 3-4 : Authentification
- [ ] Inscription / Connexion
- [ ] Connexion Google / Facebook
- [ ] Profil utilisateur

#### Semaines 5-6 : Catalogue produits
- [ ] Liste des produits disponibles
- [ ] Filtres par catégorie
- [ ] Recherche de produits
- [ ] Détails produit avec notes

#### Semaines 7-8 : Panier & Commande
- [ ] Panier d'achat
- [ ] Gestion des adresses
- [ ] Validation de commande
- [ ] Choix mode de paiement

#### Semaines 9-10 : Paiement
- [ ] Intégration Stripe
- [ ] Paiement par carte
- [ ] Paiement en espèces (à la livraison)

#### Semaines 11-12 : Suivi commande
- [ ] Suivi en temps réel
- [ ] Carte avec position du livreur
- [ ] Notifications de statut
- [ ] Historique des commandes

#### Semaines 13-14 : Fonctionnalités avancées
- [ ] Programme de fidélité
- [ ] Codes promo
- [ ] Notes et avis
- [ ] Favoris

#### Semaines 15-16 : Tests & Déploiement
- [ ] Tests complets
- [ ] Publication stores

**Livrable Phase 3 :**
✅ App mobile client complète  
✅ Paiement en ligne sécurisé  
✅ Toutes les fonctionnalités avancées  
✅ Système complet opérationnel  

---

## 🔒 Sécurité et bonnes pratiques

### Authentification & Autorisation

```javascript
// Middleware de protection des routes
export async function authMiddleware(request) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    request.user = decoded;
    return null; // Continue
  } catch (error) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
}

// Vérification des rôles
export function requireRole(allowedRoles) {
  return (request) => {
    if (!allowedRoles.includes(request.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return null;
  };
}
```

### Validation des données

```javascript
import { z } from 'zod';

// Schéma de validation pour création de commande
const createOrderSchema = z.object({
  items: z.array(z.object({
    productId: z.number().positive(),
    quantity: z.number().min(1).max(50)
  })).min(1),
  addressId: z.number().positive(),
  paymentMethod: z.enum(['card', 'cash', 'app']),
  deliveryInstructions: z.string().max(500).optional()
});

// Utilisation
export async function POST(request) {
  const body = await request.json();
  
  // Validation
  const result = createOrderSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: result.error },
      { status: 400 }
    );
  }
  
  // Traitement...
}
```

### Protection contre les attaques

✅ **SQL Injection** : Utilisation de requêtes préparées (mysql2)  
✅ **XSS** : Sanitization des inputs  
✅ **CSRF** : Tokens CSRF pour les formulaires web  
✅ **Rate Limiting** : Limiter les requêtes par IP  
✅ **HTTPS** : Obligatoire en production  
✅ **Secrets** : Variables d'environnement (.env.local)  

---

## ☁️ Hébergement et déploiement

### Recommandations pour débutant

#### Backend API + Back-office Web

**Option 1 : Vercel (RECOMMANDÉ) ✅**
- ✅ Gratuit pour commencer
- ✅ Déploiement automatique depuis GitHub
- ✅ HTTPS automatique
- ✅ Très simple à configurer
- ✅ Parfait pour Next.js
- ⚠️ Limite : 100GB de bande passante/mois (largement suffisant au début)

**Configuration :**
```bash
# 1. Installer Vercel CLI
npm install -g vercel

# 2. Déployer
vercel

# 3. Configurer les variables d'environnement sur vercel.com
```

#### Base de données MySQL

**Option 1 : PlanetScale (RECOMMANDÉ) ✅**
- ✅ Gratuit jusqu'à 5GB
- ✅ MySQL compatible
- ✅ Backups automatiques
- ✅ Scaling automatique
- ✅ Interface web simple

**Option 2 : AWS RDS (Plus avancé)**
- Plus de contrôle
- Plus complexe à configurer
- Payant dès le début

#### Stockage d'images

**Cloudinary (RECOMMANDÉ) ✅**
- ✅ Gratuit jusqu'à 25GB
- ✅ Optimisation automatique des images
- ✅ CDN intégré
- ✅ Très simple à utiliser

### Architecture de production

```
┌─────────────────────────────────────────────────────────────┐
│  CLIENTS (Apps mobiles + Web)                               │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  VERCEL (Next.js API + Back-office)                         │
│  • Auto-scaling                                             │
│  • CDN global                                               │
│  • HTTPS automatique                                        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  PLANETSCALE (MySQL Database)                               │
│  • Backups automatiques                                     │
│  • Scaling horizontal                                       │
└─────────────────────────────────────────────────────────────┘
```

### Coûts estimés

**Phase 1 (MVP) :**
- Vercel : Gratuit
- PlanetScale : Gratuit
- Cloudinary : Gratuit
- **Total : 0€/mois** 🎉

**Phase 2-3 (Production avec utilisateurs) :**
- Vercel Pro : ~20€/mois
- PlanetScale Scaler : ~29€/mois
- Cloudinary : ~0-50€/mois selon usage
- Firebase (notifications) : ~0-20€/mois
- **Total : ~50-120€/mois**

---

## 📚 Ressources & Documentation

### Documentation officielle
- [Next.js](https://nextjs.org/docs)
- [React Native](https://reactnative.dev/docs/getting-started)
- [Expo](https://docs.expo.dev/)
- [MySQL](https://dev.mysql.com/doc/)

### Tutoriels recommandés
- [Next.js Tutorial](https://nextjs.org/learn)
- [React Native Tutorial](https://reactnative.dev/docs/tutorial)
- [Stripe Integration](https://stripe.com/docs/payments)

---

## ✅ Checklist de démarrage

### Avant de commencer Phase 1

- [x] Projet Next.js créé
- [x] Base de données MySQL créée
- [x] Utilisateur MySQL créé
- [ ] Toutes les tables créées (exécuter schema.sql complet)
- [ ] Variables d'environnement configurées
- [ ] Git repository configuré
- [ ] README.md du projet créé

### Prochaines étapes immédiates

1. **Créer le fichier schema.sql complet** avec toutes les tables
2. **Exécuter le script SQL** pour créer les tables
3. **Créer l'endpoint `/api/deliverers`** (on a déjà commencé)
4. **Tester l'endpoint** avec des données réelles
5. **Commit et push** sur GitHub

---

**Document créé le :** 2026-01-05  
**Dernière mise à jour :** 2026-01-05  
**Statut :** ✅ Prêt pour développement

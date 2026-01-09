# 📚 Backend API Documentation - Fresh Dessert App

> Documentation complète de l'API Next.js basée sur le code réel de l'application

---

## 🎯 Vue d'ensemble

**Stack technique :**
- Next.js 16.1.1 (App Router)
- API Routes (Node.js)
- MySQL 8.0+ (via mysql2/promise)
- JWT Authentication
- Upstash Redis (Rate Limiting)

**Base de données :** `fresh_dessert_app_db`

---

## 📊 Schéma de base de données

### Tables principales (8 tables - tout en anglais)

#### 1. `users` - Tous les utilisateurs
```sql
id INT PRIMARY KEY AUTO_INCREMENT
email VARCHAR(255) UNIQUE NOT NULL
password_hash VARCHAR(255) NOT NULL
first_name VARCHAR(100) NOT NULL
last_name VARCHAR(100) NOT NULL
phone VARCHAR(20)
role ENUM('client', 'deliverer', 'dispatcher', 'admin')
active BOOLEAN DEFAULT TRUE
email_verified BOOLEAN DEFAULT FALSE
created_at TIMESTAMP
updated_at TIMESTAMP
```

#### 2. `deliverers` - Informations livreurs
```sql
id INT PRIMARY KEY AUTO_INCREMENT
user_id INT UNIQUE (FK → users.id)
vehicle_type ENUM('bike', 'scooter', 'car')
license_plate VARCHAR(20)
is_available BOOLEAN DEFAULT FALSE
current_latitude DECIMAL(10, 8)
current_longitude DECIMAL(11, 8)
rating DECIMAL(3, 2) DEFAULT 5.00
total_deliveries INT DEFAULT 0
created_at TIMESTAMP
updated_at TIMESTAMP
```

#### 3. `products` - Catalogue produits
```sql
id INT PRIMARY KEY AUTO_INCREMENT
name VARCHAR(200) UNIQUE NOT NULL
description TEXT
category ENUM('tiramisu', 'waffle', 'pastry', 'drink', 'candy')
price DECIMAL(10, 2) NOT NULL
allergens VARCHAR(255)
image_url VARCHAR(500)
emoji VARCHAR(10)
active BOOLEAN DEFAULT TRUE
created_at TIMESTAMP
updated_at TIMESTAMP
```

**Catégories :** `tiramisu`, `waffle`, `pastry`, `drink`, `candy`

#### 4. `addresses` - Adresses de livraison
```sql
id INT PRIMARY KEY AUTO_INCREMENT
user_id INT (FK → users.id)
label VARCHAR(100)
street_address VARCHAR(255) NOT NULL
city VARCHAR(100) NOT NULL
postal_code VARCHAR(20) NOT NULL
floor VARCHAR(50)
door_number VARCHAR(50)
building_code VARCHAR(50)
intercom VARCHAR(50)
delivery_instructions TEXT
is_default BOOLEAN DEFAULT FALSE
created_at TIMESTAMP
updated_at TIMESTAMP
```

#### 5. `deliveries` - Tournées de livraison
```sql
id INT PRIMARY KEY AUTO_INCREMENT
deliverer_id INT (FK → deliverers.id)
delivery_date DATE NOT NULL
status ENUM('pending', 'in_progress', 'completed', 'cancelled')
notes TEXT
created_at TIMESTAMP
updated_at TIMESTAMP
```

#### 6. `orders` - Commandes clients
```sql
id INT PRIMARY KEY AUTO_INCREMENT
user_id INT (FK → users.id)
deliverer_id INT (FK → deliverers.id)
delivery_id INT (FK → deliveries.id)
total_price DECIMAL(10, 2) NOT NULL
delivery_address TEXT NOT NULL
delivery_date DATE
notes TEXT
status ENUM('pending', 'confirmed', 'in_delivery', 'delivered', 'completed', 'cancelled')
created_at TIMESTAMP
updated_at TIMESTAMP
```

#### 7. `order_items` - Articles des commandes
```sql
id INT PRIMARY KEY AUTO_INCREMENT
order_id INT (FK → orders.id)
product_id INT (FK → products.id)
quantity INT NOT NULL DEFAULT 1
unit_price DECIMAL(10, 2) NOT NULL
subtotal DECIMAL(10, 2) NOT NULL
created_at TIMESTAMP
```

#### 8. `delivery_stocks` - Stocks par tournée
```sql
id INT PRIMARY KEY AUTO_INCREMENT
delivery_id INT (FK → deliveries.id)
product_id INT (FK → products.id)
initial_quantity INT NOT NULL
current_quantity INT NOT NULL
sold_quantity INT DEFAULT 0
created_at TIMESTAMP
updated_at TIMESTAMP
UNIQUE (delivery_id, product_id)
```

---

## 🔌 API Endpoints (26 routes)

### 🔐 Authentication

- `POST /api/auth/register` - Créer un compte
- `POST /api/auth/login` - Se connecter
- `POST /api/auth/change-password` - Changer le mot de passe

### 👥 Deliverers

- `GET /api/deliverers` - Liste des livreurs
- `GET /api/deliverers/:id` - Détails d'un livreur
- `POST /api/deliverers` - Créer un livreur
- `PUT /api/deliverers/:id` - Modifier un livreur
- `DELETE /api/deliverers/:id` - Désactiver un livreur

### 🍰 Products

- `GET /api/products` - Liste des produits
- `GET /api/products/:id` - Détails d'un produit
- `POST /api/products` - Créer un produit
- `PUT /api/products/:id` - Modifier un produit
- `DELETE /api/products/:id` - Supprimer un produit

### 📦 Orders

- `GET /api/orders` - Liste des commandes
- `GET /api/orders/:id` - Détails d'une commande
- `POST /api/orders` - Créer une commande
- `PUT /api/orders/:id` - Modifier une commande
- `DELETE /api/orders/:id` - Supprimer une commande

### 🚚 Deliveries

- `GET /api/deliveries` - Liste des tournées
- `GET /api/deliveries/:id` - Détails d'une tournée
- `POST /api/deliveries` - Créer une tournée
- `PUT /api/deliveries/:id` - Modifier une tournée
- `DELETE /api/deliveries/:id` - Supprimer une tournée

### 📍 Addresses

- `GET /api/addresses` - Liste des adresses
- `GET /api/addresses/:id` - Détails d'une adresse
- `POST /api/addresses` - Créer une adresse
- `PUT /api/addresses/:id` - Modifier une adresse
- `DELETE /api/addresses/:id` - Supprimer une adresse

### 📦 Stocks

- `GET /api/stocks/delivery/:id` - Stocks d'une tournée
- `POST /api/stocks` - Créer des stocks
- `PUT /api/stocks/:id` - Modifier un stock
- `DELETE /api/stocks/:id` - Supprimer un stock

### 📊 Statistics

- `GET /api/stats/dashboard` - Stats du dashboard
- `GET /api/stats/revenue` - Stats de revenus
- `GET /api/stats/products` - Top produits
- `GET /api/stats/deliverers` - Performance livreurs
- `GET /api/stats/geography` - Stats géographiques
- `GET /api/stats/timeline` - Timeline
- `GET /api/stats/tours` - Stats tournées
- `GET /api/stats/stocks` - Stats stocks

### 🏥 Health

- `GET /api/health` - État du serveur

---

## 🔐 Authentification & Sécurité

### JWT Tokens
- **Expiration** : 24 heures
- **Algorithme** : HS256
- **Secret** : Variable d'environnement `JWT_SECRET`

### Headers requis
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Rate Limiting
- **Limite** : 100 requêtes / minute par IP
- **Service** : Upstash Redis
- **Response** : 429 Too Many Requests

### Permissions par rôle

| Endpoint | Admin | Dispatcher | Deliverer | Client |
|----------|-------|------------|-----------|--------|
| `/api/deliverers` | ✅ CRUD | ✅ CRUD | ❌ | ❌ |
| `/api/products` | ✅ CRUD | ✅ CRUD | ✅ R | ✅ R |
| `/api/orders` | ✅ CRUD | ✅ CRUD | ✅ R | ✅ R (own) |
| `/api/deliveries` | ✅ CRUD | ✅ CRUD | ✅ R (own) | ❌ |
| `/api/stocks` | ✅ CRUD | ✅ CRUD | ✅ R | ❌ |
| `/api/addresses` | ✅ CRUD | ✅ R | ❌ | ✅ CRUD (own) |
| `/api/stats` | ✅ | ✅ | ❌ | ❌ |

---

## 🛠️ Variables d'environnement

```env
# Database
DB_HOST=localhost
DB_USER=fresh_dessert_app
DB_PASSWORD=your_password
DB_NAME=fresh_dessert_app_db

# Authentication
JWT_SECRET=your_jwt_secret_min_32_characters
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000

# Redis (Rate Limiting)
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token

# Server
PORT=3000
NODE_ENV=development
```

---

## 📝 Format des réponses

**Succès :**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... },
  "metadata": { ... }
}
```

**Erreur :**
```json
{
  "success": false,
  "error": "Error message",
  "details": "Detailed error information",
  "timestamp": "2024-01-08T12:00:00.000Z"
}
```

### Codes HTTP
- `200` - OK
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Too Many Requests
- `500` - Internal Server Error

---

**Documentation basée sur le code réel - Version 2.0 - 2026-01-08** 🚀

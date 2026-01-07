# 📚 Backend API Documentation - Fresh Dessert App

> Documentation complète de l'API backend Next.js 16.1.1 avec architecture centralisée

---

## 🎯 Vue d'ensemble

**Stack technique :**
- **Next.js 16.1.1** - App Router avec API routes
- **MySQL** - Base de données via mysql2/promise
- **JWT** - Authentification avec tokens
- **Rate Limiting** - Protection Upstash Redis
- **TypeScript** - Typage strict

**Port :** 3000 (développement) / Production (Vercel)  
**Base de données :** `fresh_dessert_app`

---

## 🏗️ Architecture Centralisée

### **📁 Services lib (7 fichiers)**
```
lib/
├── api-middleware.js     # Middleware universel withAuth
├── auth-middleware.js    # JWT, rôles, réponses HTTP
├── error-handler.js      # Gestion erreurs centralisée
├── validation.js         # 17 validateurs réutilisables
├── db.js                # 40 fonctions DB optimisées
├── rate-limit.js         # Rate limiting Upstash Redis
└── stock-service.js      # Logique métier stocks
```

### **🔐 Patterns standardisés**
- **`withAuth`** - Middleware authentification + rôles
- **`createSuccessResponse`** - Format réponse uniforme
- **`handleApiError`** - Gestion erreurs centralisée
- **`validate*`** - Validation centralisée par type

---

## 📊 Schéma de base de données

### Tables principales

#### 1. `users` - Utilisateurs globaux
```sql
id INT PRIMARY KEY AUTO_INCREMENT
email VARCHAR(255) UNIQUE NOT NULL
password_hash VARCHAR(255) NOT NULL
first_name VARCHAR(100) NOT NULL
last_name VARCHAR(100) NOT NULL
phone VARCHAR(20)
role ENUM('client', 'deliverer', 'dispatcher', 'admin') NOT NULL
active BOOLEAN DEFAULT TRUE
email_verified BOOLEAN DEFAULT FALSE
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
```

#### 2. `deliverers` - Livreurs
```sql
id INT PRIMARY KEY AUTO_INCREMENT
user_id INT (FK → users.id)
vehicle_type ENUM('bike', 'scooter', 'car', 'van')
license_plate VARCHAR(20)
is_available BOOLEAN DEFAULT TRUE
current_latitude DECIMAL(10, 8)
current_longitude DECIMAL(11, 8)
rating DECIMAL(3, 2) DEFAULT 5.0
total_deliveries INT DEFAULT 0
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
```

#### 3. `products` - Produits
```sql
id INT PRIMARY KEY AUTO_INCREMENT
name VARCHAR(255) NOT NULL
description TEXT
price DECIMAL(10, 2) NOT NULL
category VARCHAR(100)
image_url VARCHAR(500)
available BOOLEAN DEFAULT TRUE
preparation_time INT DEFAULT 15 -- minutes
allergens JSON
nutrition_info JSON
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
```

#### 4. `orders` - Commandes
```sql
id INT PRIMARY KEY AUTO_INCREMENT
user_id INT (FK → users.id)
status ENUM('pending', 'confirmed', 'preparing', 'ready', 'delivering', 'delivered', 'cancelled') DEFAULT 'pending'
total_amount DECIMAL(10, 2) NOT NULL
delivery_address TEXT
delivery_instructions TEXT
estimated_delivery TIMESTAMP
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
```

#### 5. `order_items` - Articles commande
```sql
id INT PRIMARY KEY AUTO_INCREMENT
order_id INT (FK → orders.id)
product_id INT (FK → products.id)
quantity INT NOT NULL
unit_price DECIMAL(10, 2) NOT NULL
customizations JSON
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

#### 6. `deliveries` - Livraisons
```sql
id INT PRIMARY KEY AUTO_INCREMENT
order_id INT (FK → orders.id)
deliverer_id INT (FK → deliverers.id)
status ENUM('assigned', 'preparing', 'picked_up', 'in_transit', 'delivered', 'cancelled') DEFAULT 'assigned'
pickup_address TEXT
delivery_address TEXT
estimated_pickup TIMESTAMP
estimated_delivery TIMESTAMP
actual_pickup TIMESTAMP
actual_delivery TIMESTAMP
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
```

#### 7. `stocks` - Stocks
```sql
id INT PRIMARY KEY AUTO_INCREMENT
product_id INT (FK → products.id)
quantity INT NOT NULL DEFAULT 0
reserved_quantity INT NOT NULL DEFAULT 0
available_quantity INT GENERATED ALWAYS AS (quantity - reserved_quantity) STORED
last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
```

#### 8. `delivery_stocks` - Stocks par tournée
```sql
id INT PRIMARY KEY AUTO_INCREMENT
delivery_id INT (FK → deliveries.id)
product_id INT (FK → products.id)
quantity_reserved INT NOT NULL
quantity_used INT DEFAULT 0
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
```

#### 9. `addresses` - Adresses clients
```sql
id INT PRIMARY KEY AUTO_INCREMENT
user_id INT (FK → users.id)
type ENUM('home', 'work', 'other') DEFAULT 'home'
street VARCHAR(255) NOT NULL
city VARCHAR(100) NOT NULL
postal_code VARCHAR(20) NOT NULL
country VARCHAR(100) DEFAULT 'France'
latitude DECIMAL(10, 8)
longitude DECIMAL(11, 8)
is_default BOOLEAN DEFAULT FALSE
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
---

## 🔐 Authentification & Sécurité

### **JWT Tokens**
```javascript
// Structure token JWT
{
  "id": 123,
  "email": "user@example.com",
  "role": "client",
  "first_name": "John",
  "last_name": "Doe",
  "iat": 1640995200,
  "exp": 1641081600 // 30 jours
}
```

### **Rôles & Permissions**
- **Admin** - Accès complet à toutes les ressources
- **Dispatcher** - Gestion commandes, livraisons, livreurs
- **Deliverer** - Gestion propres livraisons uniquement
- **Client** - Gestion propres commandes et adresses

### **Rate Limiting**
- **Endpoints auth** - 5 requêtes/minute par IP
- **Endpoints API** - 100 requêtes/minute par IP
- **Provider** - Upstash Redis

---

## 📋 Endpoints API (26 endpoints)

### **🔐 Authentication (3 endpoints)**

#### **POST /api/auth/login**
**Description** - Connexion utilisateur
**Rôles** - Public (rate limité)
**Body** :
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```
**Réponse** :
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 123,
      "email": "user@example.com",
      "role": "client",
      "first_name": "John",
      "last_name": "Doe"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "Login successful",
  "metadata": {
    "login_time": "2025-01-07T20:00:00Z",
    "expires_in": 2592000
  }
}
```

#### **POST /api/auth/register**
**Description** - Inscription nouvel utilisateur
**Rôles** - Public (rate limité)
**Body** :
```json
{
  "email": "newuser@example.com",
  "password": "SecurePassword123!",
  "first_name": "Jane",
  "last_name": "Doe",
  "phone": "+33612345678",
  "role": "client"
}
```

#### **POST /api/auth/change-password**
**Description** - Changement mot de passe
**Rôles** - Authentifié
**Headers** : `Authorization: Bearer <token>`
**Body** :
```json
{
  "current_password": "oldpassword123",
  "new_password": "NewSecurePassword123!"
}
```

---

### **📦 Products (2 endpoints)**

#### **GET /api/products**
**Description** - Liste tous les produits
**Rôles** - Authentifié
**Query params** :
- `category` - Filtrer par catégorie
- `available` - `true/false` (défaut: true)
- `limit` - Nombre de résultats (défaut: 50)
- `offset` - Pagination (défaut: 0)

**Réponse** :
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Tiramisu Classique",
      "description": "Dessert italien traditionnel",
      "price": 8.50,
      "category": "desserts_italiens",
      "image_url": "https://example.com/tiramisu.jpg",
      "available": true,
      "preparation_time": 15,
      "allergens": ["gluten", "lactose"]
    }
  ],
  "count": 25,
  "metadata": {
    "total": 25,
    "page": 1,
    "per_page": 50
  }
}
```

#### **GET /api/products/[id]**
**Description** - Détails d'un produit
**Rôles** - Authentifié
**Réponse** :
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Tiramisu Classique",
    "description": "Dessert italien traditionnel avec mascarpone et café",
    "price": 8.50,
    "category": "desserts_italiens",
    "image_url": "https://example.com/tiramisu.jpg",
    "available": true,
    "preparation_time": 15,
    "allergens": ["gluten", "lactose"],
    "nutrition_info": {
      "calories": 350,
      "protein": 6,
      "carbs": 28,
      "fat": 24
    }
  }
}
```

---

### **🛒 Orders (2 endpoints)**

#### **GET /api/orders**
**Description** - Liste des commandes
**Rôles** - Authentifié
**Query params** :
- `status` - Filtrer par statut
- `user_id` - Admin/dispatcher uniquement
- `limit` - Pagination
- `offset` - Pagination

#### **POST /api/orders**
**Description** - Créer nouvelle commande
**Rôles** - Authentifié (client, dispatcher, admin)
**Body** :
```json
{
  "items": [
    {
      "product_id": 1,
      "quantity": 2,
      "customizations": {
        "extra_cream": true,
        "size": "large"
      }
    }
  ],
  "delivery_address": "123 Rue de la Paix, 75001 Paris",
  "delivery_instructions": "Sonner à l'interphone 3B",
  "estimated_delivery": "2025-01-07T21:00:00Z"
}
```

#### **GET /api/orders/[id]**
**Description** - Détails commande
**Rôles** - Authentifié (accès limité par rôle/user)

#### **PUT /api/orders/[id]**
**Description** - Mettre à jour commande
**Rôles** - Authentifié (permissions par rôle)

#### **DELETE /api/orders/[id]**
**Description** - Annuler commande
**Rôles** - Authentifié (permissions par rôle)

---

### **🚚 Deliveries (2 endpoints)**

#### **GET /api/deliveries**
**Description** - Liste livraisons
**Rôles** - Authentifié
**Query params** :
- `status` - Filtrer par statut
- `deliverer_id` - Filtrer par livreur
- `date` - Filtrer par date

#### **POST /api/deliveries**
**Description** - Créer livraison
**Rôles** - Authentifié (dispatcher, admin)

#### **GET /api/deliveries/[id]**
**Description** - Détails livraison
**Rôles** - Authentifié

#### **PUT /api/deliveries/[id]**
**Description** - Mettre à jour livraison
**Rôles** - Authentifié (livreur peut mettre à jour statut)

#### **DELETE /api/deliveries/[id]**
**Description** - Annuler livraison
**Rôles** - Authentifié (dispatcher, admin)

---

### **👥 Deliverers (2 endpoints)**

#### **GET /api/deliverers**
**Description** - Liste livreurs
**Rôles** - Authentifié (admin, dispatcher)
**Query params** :
- `active_only` - `true/false` (défaut: false)

#### **POST /api/deliverers**
**Description** - Créer livreur
**Rôles** - Authentifié (admin, dispatcher)
**Body** :
```json
{
  "user_id": 123,
  "vehicle_type": "bike",
  "license_plate": "ABC-123",
  "is_available": true
}
```

#### **GET /api/deliverers/[id]**
**Description** - Détails livreur
**Rôles** - Authentifié (admin, dispatcher, livreur lui-même)

#### **PUT /api/deliverers/[id]**
**Description** - Mettre à jour livreur
**Rôles** - Authentifié (admin, dispatcher, livreur lui-même limité)

#### **DELETE /api/deliverers/[id]**
**Description** - Supprimer livreur (désactiver)
**Rôles** - Authentifié (admin, dispatcher)

---

### **📍 Addresses (2 endpoints)**

#### **GET /api/addresses**
**Description** - Adresses utilisateur
**Rôles** - Authentifié (propres adresses)

#### **POST /api/addresses**
**Description** - Ajouter adresse
**Rôles** - Authentifié
**Body** :
```json
{
  "type": "home",
  "street": "123 Rue de la Paix",
  "city": "Paris",
  "postal_code": "75001",
  "country": "France",
  "is_default": true
}
```

#### **GET /api/addresses/[id]**
**Description** - Détails adresse
**Rôles** - Authentifié (propre adresse)

#### **PUT /api/addresses/[id]**
**Description** - Mettre à jour adresse
**Rôles** - Authentifié (propre adresse)

#### **DELETE /api/addresses/[id]**
**Description** - Supprimer adresse
**Rôles** - Authentifié (propre adresse)

---

### **📦 Stocks (3 endpoints)**

#### **GET /api/stocks**
**Description** - État des stocks
**Rôles** - Authentifié (admin, dispatcher)
**Query params** :
- `product_id` - Filtrer par produit
- `low_stock` - `true/false` (stock < 10)

#### **POST /api/stocks**
**Description** - Mettre à jour stock
**Rôles** - Authentifié (admin, dispatcher)
**Body** :
```json
{
  "product_id": 1,
  "quantity": 50,
  "operation": "set" // "set", "add", "subtract"
}
```

#### **GET /api/stocks/[id]**
**Description** - Détails stock produit
**Rôles** - Authentifié (admin, dispatcher)

#### **PUT /api/stocks/[id]**
**Description** - Mettre à jour stock produit
**Rôles** - Authentifié (admin, dispatcher)

#### **GET /api/stocks/delivery/[id]**
**Description** - Stocks réservés pour livraison
**Rôles** - Authentifié (admin, dispatcher, livreur concerné)

---

### **📊 Stats (8 endpoints)**

#### **GET /api/stats/dashboard**
**Description** - KPIs dashboard
**Rôles** - Authentifié (admin, dispatcher)

#### **GET /api/stats/deliverers**
**Description** - Performance livreurs
**Rôles** - Authentifié (admin, dispatcher)

#### **GET /api/stats/revenue**
**Description** - Chiffre d'affaires
**Rôles** - Authentifié (admin)
**Query params** :
- `period` - `day`, `week`, `month`, `year`
- `start_date` - Date début
- `end_date` - Date fin

#### **GET /api/stats/products**
**Description** - Statistiques produits
**Rôles** - Authentifié (admin, dispatcher)

#### **GET /api/stats/geography**
**Description** - Statistiques géographiques
**Rôles** - Authentifié (admin, dispatcher)

#### **GET /api/stats/stocks**
**Description** - Statistiques stocks
**Rôles** - Authentifié (admin, dispatcher)

#### **GET /api/stats/timeline**
**Description** - Évolution temporelle
**Rôles** - Authentifié (admin, dispatcher)

#### **GET /api/stats/tours**
**Description** - Statistiques tournées
**Rôles** - Authentifié (admin, dispatcher)

---

### **💚 Health (1 endpoint)**

#### **GET /api/health**
**Description** - Health check service
**Rôles** - Public
**Réponse** :
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2025-01-07T20:00:00Z",
    "version": "2.0.0",
    "uptime": 86400,
    "database": "connected",
    "memory_usage": "45MB",
    "active_connections": 12
  }
}
```

---

## 🔄 Format des Réponses

### **Succès**
```json
{
  "success": true,
  "data": { /* données */ },
  "message": "Opération réussie",
  "metadata": {
    "timestamp": "2025-01-07T20:00:00Z",
    "request_id": "req_123456789",
    "execution_time": "150ms"
  }
}
```

### **Erreur**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Données invalides",
    "details": {
      "field": "email",
      "issue": "Format email invalide"
    }
  },
  "metadata": {
    "timestamp": "2025-01-07T20:00:00Z",
    "request_id": "req_123456789"
  }
}
```

---

## 🛡️ Gestion des Erreurs

### **Codes d'erreur**
- **400** - ValidationError (données invalides)
- **401** - Unauthorized (non authentifié)
- **403** - Forbidden (permissions insuffisantes)
- **404** - NotFound (ressource inexistante)
- **409** - Conflict (conflit de données)
- **429** - TooManyRequests (rate limit)
- **500** - InternalError (erreur serveur)

### **Validation**
- **Email** - Format RFC 5322
- **Mot de passe** - 12+ caractères, 1 lettre, 1 chiffre, 1 spécial
- **Téléphone** - Format international (+33...)
- **Adresse** - Validation format postal

---

## 📊 Performance & Monitoring

### **Métriques**
- **Temps de réponse** - <200ms (95th percentile)
- **Taux d'erreur** - <1%
- **Disponibilité** - >99.9%
- **Concurrents** - 1000+ requêtes/minute

### **Monitoring**
- **Health checks** - `/api/health`
- **Logging structuré** - JSON format
- **Error tracking** - Sentry integration
- **Performance** - New Relic/DataDog

---

## 🔧 Development

### **Environment Variables**
```bash
# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=password
DB_NAME=fresh_dessert_app

# JWT
NEXTAUTH_SECRET=your-secret-key

# Rate Limiting
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...

# External Services
STRIPE_SECRET_KEY=sk_...
GOOGLE_MAPS_API_KEY=AIza...
SENDGRID_API_KEY=SG...
```

### **Scripts**
```bash
npm run dev          # Développement
npm run build        # Build production
npm run start        # Production
npm run test         # Tests unitaires
npm run lint         # ESLint
npm run type-check   # TypeScript checking
```

---

## 📋 Testing

### **Tests unitaires**
```bash
# Tests services lib
npm test lib/

# Tests API endpoints
npm test app/api/

# Couverture code
npm run test:coverage
```

### **Tests intégration**
```bash
# Tests base de données
npm run test:integration

# Tests authentification
npm run test:auth

# Tests validation
npm run test:validation
```

---

## 🚀 Deployment

### **Production**
- **Platform** - Vercel (recommandé)
- **Database** - MySQL managed service
- **Redis** - Upstash Redis
- **Monitoring** - Vercel Analytics + Sentry

### **Environment**
- **Development** - Local + Vercel dev
- **Staging** - Vercel preview
- **Production** - Vercel production

---

## 📚 Documentation Complémentaire

- **[CHANGELOG.md](./CHANGELOG.md)** - Historique des versions
- **[FRONTEND_ARCHITECTURE.md](./FRONTEND_ARCHITECTURE.md)** - Architecture frontend
- **[USER_ROLES.md](./USER_ROLES.md)** - Rôles et permissions
- **[BUSINESS_WORKFLOWS.md](./BUSINESS_WORKFLOWS.md)** - Workflows métier
- **[INTEGRATIONS.md](./INTEGRATIONS.md)** - Services externes
- **[MOBILE_APPS.md](./MOBILE_APPS.md)** - Spécifications mobiles

---

## 🎯 Roadmap Future

### **Version 2.1.0** (Prévue)
- **Tests unitaires** - Couverture complète
- **Documentation OpenAPI** - Swagger UI
- **Monitoring avancé** - Metrics détaillés

### **Version 3.0.0** (Prévue)
- **Real-time** - WebSockets tracking
- **Analytics ML** - Prédictions intelligentes
- **Multi-tenant** - Support multi-restaurants

---

*Documentation maintenue automatiquement avec chaque mise à jour de l'API.*

---

## 🔐 Variables d'environnement

```env
# Base de données
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=ubereats_extractor

# OpenAI
OPENAI_API_KEY=sk-...

# Trello
TRELLO_API_KEY=your_trello_api_key
TRELLO_TOKEN=your_trello_token
TRELLO_BOARD_ID=your_board_id

# Serveur
PORT=3000
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
```

---

## 📝 Notes importantes

### Session ID
- Généré automatiquement si absent : `manual_${Date.now()}_${Math.random().toString(36).substr(2,9)}`
- Format recommandé : `session_YYYYMMDD_HHMMSS_random`

### Statuts des tournées
1. **`en_preparation`** - Tournée créée, livreurs assignés, stocks définis
2. **`en_cours`** - Tournée démarrée, livraisons en cours
3. **`terminee`** - Tournée terminée

### Webhooks Trello
- URL à configurer : `https://your-domain.com/api/webhook/trello`
- Gère automatiquement les déplacements de cartes entre listes
- Met à jour le `livreur_id` des commandes selon la liste Trello

### Extension Chrome
- Envoie les commandes à `/api/send-to-trello`
- Utilise `sessionId` pour lier extraction et envoi
- Fonctionne indépendamment du frontend
- **Ne nécessite aucune modification pour Next.js**

---

## 🛠️ Stack Next.js recommandée

```
Next.js 14 (App Router)
├── Frontend: React + Tailwind CSS + shadcn/ui
├── Backend: Next.js API Routes
├── Database: MySQL + Prisma ORM (optionnel)
├── Validation: Zod
├── State Management: React Query (TanStack Query)
├── Forms: React Hook Form
└── Deploy: Vercel (gratuit)
```

### Pourquoi Prisma ?

**Avant (mysql2) :**
```javascript
const [rows] = await pool.query(
  'SELECT * FROM livreurs WHERE actif = ?',
  [true]
);
```

**Après (Prisma) :**
```javascript
const livreurs = await prisma.livreur.findMany({
  where: { actif: true }
});
```

**Avantages :**
- Type-safety avec TypeScript
- Migrations automatiques
- Relations automatiques
- Moins de bugs SQL

---

## ✅ Ce qui fonctionne actuellement

- ✅ **Extraction GPT-4 Vision** - Commandes UberEats
- ✅ **Envoi automatique à Trello** - Création de cartes
- ✅ **Webhooks Trello** - Mise à jour automatique
- ✅ **Gestion complète des tournées** - CRUD complet
- ✅ **Gestion des stocks** - Initialisation et suivi
- ✅ **Historique des commandes** - Avec pagination
- ✅ **Extension Chrome** - Fonctionnelle et indépendante
- ✅ **Base de données** - Propre et refactorisée

---

## 🎯 Plan de migration recommandé

### Phase 1 : Setup (1 jour)
1. Créer un nouveau projet Next.js
2. Configurer Prisma avec le schéma existant
3. Configurer les variables d'environnement
4. Tester la connexion à la base de données

### Phase 2 : API Routes (2-3 jours)
1. Migrer les endpoints un par un
2. Tester chaque endpoint avec Postman/Thunder Client
3. Garder le backend Express en parallèle pour comparaison

### Phase 3 : Frontend (3-5 jours)
1. Créer le layout de base avec shadcn/ui
2. Page Dashboard
3. Page Tournées
4. Page Commandes
5. Intégration avec React Query

### Phase 4 : Tests et déploiement (1-2 jours)
1. Tests end-to-end
2. Vérifier que l'extension Chrome fonctionne toujours
3. Déployer sur Vercel
4. Configurer les webhooks Trello sur la nouvelle URL

---

**Backend prêt pour migration Next.js ! 🚀**

*Toute la logique métier est documentée ici. Tu peux maintenant recréer l'application en Next.js avec une base solide.*

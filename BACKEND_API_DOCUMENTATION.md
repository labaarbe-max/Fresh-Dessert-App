# 📚 Backend API Documentation - Fresh Dessert

> Documentation complète du backend Node.js/Express pour migration vers Next.js

---

## 🎯 Vue d'ensemble

**Stack actuelle :**
- Node.js + Express
- MySQL (via mysql2/promise)
- OpenAI GPT-4 Vision (extraction)
- Trello API (webhooks + création de cartes)

**Port :** 3000  
**Base de données :** `ubereats_extractor`

---

## 📊 Schéma de base de données

### Tables principales

#### 1. `livreurs` - Livreurs/Dispatch
```sql
id INT PRIMARY KEY AUTO_INCREMENT
nom VARCHAR(100) UNIQUE NOT NULL
trello_list_id VARCHAR(100) NOT NULL
actif BOOLEAN DEFAULT TRUE
created_at TIMESTAMP
updated_at TIMESTAMP
```

**Livreurs pré-chargés :** Nassim, AbdelKarim, Dispatch, AbdelRahman, Mounir, Wissem

#### 2. `commandes` - Historique des commandes
```sql
id INT PRIMARY KEY AUTO_INCREMENT
session_id VARCHAR(100) NOT NULL
livreur_id INT (FK → livreurs.id)
client_nom VARCHAR(200)
client_code VARCHAR(50)
nouveau_client BOOLEAN
departement VARCHAR(10)
adresse_complete TEXT
complement_adresse TEXT
instructions TEXT
type_livraison VARCHAR(100)
telephone VARCHAR(50)
code_uber VARCHAR(50)
type_numero VARCHAR(20)
temps_livraison VARCHAR(50)
articles VARCHAR(50)
couverts VARCHAR(10)
sous_total VARCHAR(20)
frais_livraison VARCHAR(20)
offre_speciale VARCHAR(20)
total VARCHAR(20)
data_json JSON
trello_card_id VARCHAR(100)
trello_card_url TEXT
created_at TIMESTAMP
```

#### 3. `produits` - Catalogue produits
```sql
id INT PRIMARY KEY AUTO_INCREMENT
nom VARCHAR(200) UNIQUE NOT NULL
categorie ENUM('tiramisu', 'gaufre', 'patisserie', 'boisson', 'confiserie')
emoji VARCHAR(10)
actif BOOLEAN DEFAULT TRUE
created_at TIMESTAMP
updated_at TIMESTAMP
```

**50 produits pré-chargés :**
- 12 Tiramisus (Kinder Bueno, Nutella, Oreo, etc.)
- 3 Gaufres
- 10 Pâtisseries (Cookies, Donuts, Macarons, etc.)
- 12 Boissons (Chill, Oasis, Coca, etc.)
- 7 Confiseries (Kinder, M&M's, Twix, etc.)

#### 4. `tournees` - Tournées de livraison
```sql
id INT PRIMARY KEY AUTO_INCREMENT
date_tournee DATE NOT NULL
statut ENUM('en_preparation', 'en_cours', 'terminee')
created_at TIMESTAMP
updated_at TIMESTAMP
```

#### 5. `tournee_livreurs` - Association tournée-livreur
```sql
id INT PRIMARY KEY AUTO_INCREMENT
tournee_id INT (FK → tournees.id)
livreur_id INT (FK → livreurs.id)
secteur VARCHAR(100)
created_at TIMESTAMP
UNIQUE (tournee_id, livreur_id)
```

#### 6. `tournee_stocks` - Stocks par livreur/tournée
```sql
id INT PRIMARY KEY AUTO_INCREMENT
tournee_livreur_id INT (FK → tournee_livreurs.id)
produit_id INT (FK → produits.id)
quantite_initiale INT
quantite_actuelle INT
created_at TIMESTAMP
updated_at TIMESTAMP
UNIQUE (tournee_livreur_id, produit_id)
```

#### 7. `stock_mouvements` - Historique des mouvements
```sql
id INT PRIMARY KEY AUTO_INCREMENT
tournee_stock_id INT (FK → tournee_stocks.id)
commande_id INT (FK → commandes.id)
type_mouvement ENUM('initialisation', 'livraison', 'ajustement')
quantite INT
quantite_avant INT
quantite_apres INT
commentaire TEXT
created_at TIMESTAMP
```

#### 8. `commande_produits` - Produits dans les commandes
```sql
id INT PRIMARY KEY AUTO_INCREMENT
commande_id INT (FK → commandes.id)
produit_id INT (FK → produits.id)
quantite INT DEFAULT 1
created_at TIMESTAMP
```

---

## 🔌 Endpoints API

### 🖼️ Extraction (GPT-4 Vision)

#### `POST /api/extract`
Extraction complète d'une commande UberEats

**Request :**
```json
{
  "image": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
}
```

**Response :**
```json
{
  "client": {
    "nom": "John Doe",
    "code": "JD123",
    "nouveauClient": false
  },
  "livraison": {
    "departement": "75",
    "adresseComplete": "123 Rue de Paris, 75001 Paris",
    "complementAdresse": "Bâtiment A, 2ème étage",
    "instructions": "Sonner à l'interphone",
    "typeLivraison": "Livraison standard",
    "telephone": "0612345678",
    "codeUber": "ABC123",
    "typeNumero": "mobile",
    "tempsLivraison": "30-40 min"
  },
  "commande": {
    "articles": "3 articles",
    "couverts": "2"
  },
  "montants": {
    "sousTotal": "25.50€",
    "fraisLivraison": "2.50€",
    "offreSpeciale": "-3.00€",
    "total": "25.00€"
  },
  "meta": {
    "confidence": 0.95,
    "duration": 1234,
    "timestamp": "2024-01-04T00:00:00.000Z"
  }
}
```

#### `POST /api/extract-commande`
Extraction étape 1 : Informations commande

#### `POST /api/extract-adresse`
Extraction étape 2 : Adresse de livraison

---

### 👥 Livreurs

#### `GET /api/livreurs`
Récupérer tous les livreurs actifs

**Response :**
```json
{
  "success": true,
  "livreurs": [
    {
      "id": 1,
      "nom": "Nassim",
      "trello_list_id": "6933aa997706312a9be6c9e6",
      "actif": true,
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### `GET /api/livreurs/:id`
Récupérer un livreur par ID

#### `POST /api/livreurs`
Créer un nouveau livreur

**Request :**
```json
{
  "nom": "Nouveau Livreur",
  "trelloListId": "trello_list_id_123"
}
```

#### `PUT /api/livreurs/:id`
Mettre à jour un livreur

#### `DELETE /api/livreurs/:id`
Désactiver un livreur (soft delete)

---

### 📦 Trello

#### `POST /api/send-to-trello`
Envoyer une commande à Trello

**Request :**
```json
{
  "commandeData": {
    "client": { "nom": "John Doe", "code": "JD123" },
    "livraison": { 
      "adresseComplete": "123 Rue de Paris",
      "telephone": "0612345678",
      "departement": "75"
    },
    "commande": { "articles": "3 articles" },
    "montants": { "total": "25.00€" }
  },
  "livreurId": 1,
  "sessionId": "session_123"
}
```

**Response :**
```json
{
  "success": true,
  "cardId": "trello_card_id_abc123",
  "cardUrl": "https://trello.com/c/abc123",
  "commandeId": 42
}
```

#### `POST /api/webhook/trello`
Recevoir les webhooks Trello

**Actions gérées :**
- Déplacement de carte → Mise à jour du livreur assigné
- Archivage de carte → Marquage commande comme archivée

---

### 🍰 Produits

#### `GET /api/produits`
Récupérer tous les produits

**Response :**
```json
{
  "success": true,
  "produits": [
    {
      "id": 1,
      "nom": "Tiramisu Kinder Bueno White",
      "categorie": "tiramisu",
      "emoji": "⭐",
      "actif": true
    }
  ]
}
```

#### `GET /api/produits/categorie/:categorie`
Récupérer les produits par catégorie

**Catégories :** `tiramisu`, `gaufre`, `patisserie`, `boisson`, `confiserie`

---

### 🚚 Tournées

#### `POST /api/tournees`
Créer une nouvelle tournée

**Request :**
```json
{
  "dateTournee": "2024-01-04"
}
```

**Response :**
```json
{
  "success": true,
  "tourneeId": 1
}
```

#### `GET /api/tournees`
Récupérer toutes les tournées avec leurs livreurs

**Response :**
```json
{
  "success": true,
  "tournees": [
    {
      "id": 1,
      "date_tournee": "2024-01-04",
      "statut": "en_cours",
      "livreurs": [
        {
          "tournee_livreur_id": 1,
          "livreur_id": 1,
          "livreur_nom": "Nassim",
          "secteur": "75, 93"
        }
      ]
    }
  ]
}
```

#### `GET /api/tournees/:id`
Récupérer une tournée par ID avec détails complets

#### `PUT /api/tournees/:id/statut`
Mettre à jour le statut d'une tournée

**Request :**
```json
{
  "statut": "en_cours"
}
```

**Statuts :** `en_preparation`, `en_cours`, `terminee`

#### `PUT /api/tournees/:id`
Modifier une tournée

#### `DELETE /api/tournees/:id`
Supprimer une tournée

---

### 👤 Assignation Livreurs

#### `POST /api/tournees/:id/livreurs`
Assigner un livreur à une tournée

**Request :**
```json
{
  "livreurId": 1,
  "secteur": "75, 93"
}
```

**Response :**
```json
{
  "success": true,
  "tourneeLivreurId": 1
}
```

#### `DELETE /api/tournees/livreurs/:id`
Retirer un livreur d'une tournée

**Params :** `id` = `tournee_livreur_id`

---

### 📦 Stocks

#### `POST /api/tournees/livreurs/:id/stocks`
Initialiser les stocks pour un livreur

**Params :** `id` = `tournee_livreur_id`

**Request :**
```json
{
  "stocks": [
    { "produitId": 1, "quantite": 10 },
    { "produitId": 2, "quantite": 5 }
  ]
}
```

#### `GET /api/tournees/livreurs/:id/stocks`
Récupérer les stocks d'un livreur

**Response :**
```json
{
  "success": true,
  "stocks": [
    {
      "id": 1,
      "produit_id": 1,
      "produit_nom": "Tiramisu Kinder Bueno White",
      "quantite_initiale": 10,
      "quantite_actuelle": 8
    }
  ]
}
```

#### `PUT /api/tournees/livreurs/:id/stocks`
Modifier les stocks d'un livreur

**Request :**
```json
{
  "stocks": [
    { "produitId": 1, "quantite": 15 }
  ]
}
```

---

### 📋 Commandes

#### `POST /api/commandes`
Créer une nouvelle commande (depuis extension Chrome)

**Request :**
```json
{
  "nomClient": "John Doe",
  "adresse": "123 Rue de Paris",
  "telephone": "0612345678",
  "departement": "75",
  "total": "25.00€",
  "sessionId": "session_123",
  "tourneeId": 1
}
```

#### `GET /api/commandes`
Récupérer l'historique des commandes

**Query params :**
- `limit` (default: 50)
- `offset` (default: 0)

**Response :**
```json
{
  "success": true,
  "commandes": [
    {
      "id": 1,
      "client_nom": "John Doe",
      "adresse_complete": "123 Rue de Paris",
      "total": "25.00€",
      "livreur_nom": "Nassim",
      "created_at": "2024-01-04T00:00:00.000Z"
    }
  ]
}
```

#### `GET /api/commandes/:id`
Récupérer une commande par ID

#### `PUT /api/commandes/:id/livreur`
Assigner une commande à un livreur

**Request :**
```json
{
  "livreurId": 1
}
```

#### `PUT /api/commandes/:id/statut`
Changer le statut d'une commande

**Request :**
```json
{
  "statut": "livree"
}
```

#### `GET /api/tournees/:id/commandes`
Récupérer les commandes d'une tournée

#### `GET /api/livreurs/:id/commandes`
Récupérer les commandes d'un livreur

**Query params :**
- `tourneeId` (optionnel)

---

### 📊 Statistiques

#### `GET /api/stock-movements`
Récupérer l'historique des mouvements de stock

**Query params :**
- `limit` (default: 50)

#### `GET /api/stats`
Récupérer les statistiques globales

**Response :**
```json
{
  "success": true,
  "stats": {
    "totalCommandes": 150,
    "commandesAujourdhui": 12,
    "livreurActifs": 6,
    "tourneesEnCours": 1
  }
}
```

---

### 🏥 Health Check

#### `GET /api/health`
Vérifier l'état du serveur

**Response :**
```json
{
  "status": "ok",
  "service": "UberEats Extractor API",
  "timestamp": "2024-01-04T00:00:00.000Z",
  "uptime": 12345
}
```

---

## 🚀 Migration vers Next.js

### Structure recommandée

```
app/
├── api/
│   ├── extract/route.js
│   ├── extract-commande/route.js
│   ├── extract-adresse/route.js
│   ├── livreurs/
│   │   ├── route.js
│   │   └── [id]/
│   │       ├── route.js
│   │       └── commandes/route.js
│   ├── tournees/
│   │   ├── route.js
│   │   └── [id]/
│   │       ├── route.js
│   │       ├── statut/route.js
│   │       ├── livreurs/route.js
│   │       └── commandes/route.js
│   ├── commandes/
│   │   ├── route.js
│   │   └── [id]/
│   │       ├── route.js
│   │       ├── livreur/route.js
│   │       └── statut/route.js
│   ├── produits/
│   │   ├── route.js
│   │   └── categorie/[categorie]/route.js
│   ├── send-to-trello/route.js
│   ├── webhook/
│   │   └── trello/route.js
│   ├── stock-movements/route.js
│   ├── stats/route.js
│   └── health/route.js
├── dashboard/page.js
├── tournees/
│   ├── page.js
│   └── [id]/page.js
├── commandes/page.js
└── layout.js
```

### Exemple de conversion

**Avant (Express) :**
```javascript
app.get('/api/livreurs', async (req, res) => {
  try {
    const livreurs = await db.getLivreurs(true);
    res.json({ success: true, livreurs });
  } catch (error) {
    console.error('[API] Erreur getLivreurs:', error.message);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});
```

**Après (Next.js) :**
```javascript
// app/api/livreurs/route.js
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const livreurs = await db.getLivreurs(true);
    return NextResponse.json({ success: true, livreurs });
  } catch (error) {
    console.error('[API] Erreur getLivreurs:', error.message);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
```

### Exemple avec paramètres dynamiques

**Avant (Express) :**
```javascript
app.get('/api/tournees/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const tournee = await db.getTourneeById(parseInt(id));
    
    if (!tournee) {
      return res.status(404).json({ 
        success: false, 
        error: 'Tournée non trouvée' 
      });
    }
    
    res.json({ success: true, tournee });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});
```

**Après (Next.js) :**
```javascript
// app/api/tournees/[id]/route.js
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request, { params }) {
  try {
    const { id } = params;
    const tournee = await db.getTourneeById(parseInt(id));
    
    if (!tournee) {
      return NextResponse.json(
        { success: false, error: 'Tournée non trouvée' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, tournee });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
```

### Exemple avec POST

**Avant (Express) :**
```javascript
app.post('/api/tournees', async (req, res) => {
  try {
    const { dateTournee } = req.body;
    
    if (!dateTournee) {
      return res.status(400).json({ 
        success: false, 
        error: 'Date de tournée requise' 
      });
    }
    
    const tourneeId = await db.createTournee(dateTournee);
    res.json({ success: true, tourneeId });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});
```

**Après (Next.js) :**
```javascript
// app/api/tournees/route.js
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request) {
  try {
    const { dateTournee } = await request.json();
    
    if (!dateTournee) {
      return NextResponse.json(
        { success: false, error: 'Date de tournée requise' },
        { status: 400 }
      );
    }
    
    const tourneeId = await db.createTournee(dateTournee);
    return NextResponse.json({ success: true, tourneeId });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
```

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
